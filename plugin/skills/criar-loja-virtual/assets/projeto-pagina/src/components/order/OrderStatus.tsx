import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  CheckoutApiError,
  CheckoutEvents,
  createCheckoutClient,
  createDemoClient,
  isPreview,
  payAgainHref,
  translator,
  type OrderView,
} from '@bigbang/page-kit/checkout';
import type { PageConfig } from '@bigbang/page-kit/page';
import { trackPaidOrder } from '@bigbang/page-kit/pixels';
import { KitSlot } from '@bigbang/page-kit/slots';
import { href } from '@bigbang/page-kit/router';
import { PaymentResult } from '../checkout/PaymentResult';
import { Alert, Button, Section, Spinner } from '../checkout/ui';
import { ShipmentCard } from './ShipmentCard';

const POLL_MS = 4000;
const PENDING = new Set<OrderView['status']>([
  'awaiting_payment',
  'in_analysis',
]);

/**
 * Acompanhamento do pedido pelo link `/pedido/<orderId>#t=<orderToken>`: estado, PIX (ou o
 * boleto de um pedido antigo) enquanto aguarda, atualizado a cada 4 s. Upsell e nova tentativa
 * ficam no checkout: "tentar de novo" abre o checkout da sessão, que paga de novo o mesmo pedido
 * (`payAgainHref`).
 */
export function OrderStatus({
  config,
  orderId,
  orderToken,
}: {
  config: PageConfig;
  orderId: string;
  orderToken: string | null;
}) {
  const t = useMemo(() => translator(config.locale), [config.locale]);
  const client = useMemo(
    () =>
      isPreview()
        ? createDemoClient(config)
        : createCheckoutClient(config.apiUrl),
    [config],
  );
  const events = useMemo(() => new CheckoutEvents(client), [client]);
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Os produtos do pedido decidem os pixels por produto (sem eles, API antiga, valem só os da loja toda).
    if (order) trackPaidOrder(order, order.productIds ?? []);
  }, [order?.orderId, order?.status]);

  useEffect(() => {
    if (!orderToken) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const next = await client.getOrder(orderId, orderToken);
        if (cancelled) return;
        setOrder(next);
        setError(null);
        if (PENDING.has(next.status)) timer = setTimeout(load, POLL_MS);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof CheckoutApiError ? e.message : t('page.unavailable'),
        );
      }
    };
    void load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [client, orderId, orderToken, attempt, t]);

  if (!orderToken) return <Alert>{t('order.linkInvalid')}</Alert>;
  if (error && !order) {
    return (
      <div class="space-y-4">
        <Alert>{error}</Alert>
        <Button onClick={() => setAttempt((n) => n + 1)}>
          {t('page.retry')}
        </Button>
      </div>
    );
  }
  if (!order) {
    return (
      <p class="flex items-center gap-2 text-neutral-600">
        <Spinner /> {t('loading')}
      </p>
    );
  }
  return (
    <Section title={t('order.title', { number: order.number })}>
      <PaymentResult
        order={{ ...order, upsellOffer: null }}
        locale={config.locale}
        busy={false}
        t={t}
        events={events}
        onRetry={() =>
          location.assign(payAgainHref(order, orderToken, config.kind))
        }
        onAcceptUpsell={() => undefined}
        onDeclineUpsell={() => undefined}
      />
      {order.shipment && (
        <ShipmentCard shipment={order.shipment} locale={config.locale} t={t} />
      )}
      <KitSlot
        place="order.details"
        order={order}
        locale={config.locale}
        t={t}
      />
      <a class="text-sm underline" href={href('/')}>
        {t('page.backHome')}
      </a>
    </Section>
  );
}
