import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  CheckoutApiError,
  createCheckoutClient,
  createDemoClient,
  formatMoney,
  isPreview,
  translator,
  type OrderView,
} from '@bigbang/page-kit/checkout';
import type { PageConfig } from '@bigbang/page-kit/page';
import { trackPaidOrder } from '@bigbang/page-kit/pixels';
import { KitSlot } from '@bigbang/page-kit/slots';
import { href, orderHref } from '@bigbang/page-kit/router';
import { AccessNotice, Alert, Button, Spinner } from '../checkout/ui';
import { OrderStatus } from './OrderStatus';
import { ShipmentCard } from './ShipmentCard';

/**
 * Página de obrigado padrão, em `/obrigado/<orderId>#t=<orderToken>`: o checkout leva o comprador
 * para cá depois do pagamento aprovado quando a loja não tem página de obrigado externa.
 * Pedido ainda não pago cai no acompanhamento. Personalize textos e classes à vontade.
 */
export function ThankYou({
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
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!orderToken) return;
    let cancelled = false;
    client
      .getOrder(orderId, orderToken)
      .then((next) => {
        if (cancelled) return;
        setOrder(next);
        setError(null);
        // Os produtos do pedido decidem os pixels por produto (sem eles, valem só os da loja toda).
        trackPaidOrder(next, next.productIds ?? []);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof CheckoutApiError ? e.message : t('page.unavailable'),
        );
      });
    return () => {
      cancelled = true;
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
  if (order.status !== 'paid') {
    return (
      <OrderStatus config={config} orderId={orderId} orderToken={orderToken} />
    );
  }

  const money = (amount: number) =>
    formatMoney(amount, order.currency, config.locale);
  const method = t(`method.${order.paymentMethod}`);
  return (
    <section class="mx-auto max-w-xl space-y-6 text-center">
      <div class="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          class="size-8"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </div>
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">{t('thanks.title')}</h1>
        <p class="text-neutral-700">
          {t('thanks.detail', { number: order.number })}
        </p>
        <p class="text-sm text-neutral-500">{t('thanks.email')}</p>
      </div>
      {order.access && (
        <AccessNotice
          url={order.access.url}
          title={t('thanks.accessTitle')}
          detail={t('thanks.accessDetail')}
          button={t('thanks.accessButton')}
        />
      )}
      <div class="rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-sm">
        <h2 class="mb-3 font-semibold">{t('thanks.items')}</h2>
        <ul class="divide-y divide-neutral-100">
          {order.items.map((item, index) => (
            <li key={index} class="flex justify-between gap-4 py-2 text-sm">
              <span>
                {item.quantity > 1 ? `${item.quantity}× ` : ''}
                {item.name}
              </span>
              <span class="tabular-nums">{money(item.total)}</span>
            </li>
          ))}
        </ul>
        <div class="mt-3 flex justify-between border-t border-neutral-200 pt-3 font-semibold">
          <span>{t('summary.total')}</span>
          <span class="tabular-nums">{money(order.total)}</span>
        </div>
        <p class="mt-1 text-sm text-neutral-500">
          {order.installments && order.installments > 1
            ? t('thanks.installments', { method, count: order.installments })
            : t('thanks.paidWith', { method })}
        </p>
      </div>
      {order.shipment && (
        <ShipmentCard shipment={order.shipment} locale={config.locale} t={t} />
      )}
      <KitSlot
        place="order.details"
        order={order}
        locale={config.locale}
        t={t}
      />
      <div class="flex flex-col items-center gap-3 text-sm">
        <a class="font-medium underline" href={orderHref(orderId, orderToken)}>
          {t('order.track')}
        </a>
        {config.kind === 'ecommerce' && (
          <a class="text-neutral-600 underline" href={href('/')}>
            {t('page.backHome')}
          </a>
        )}
      </div>
    </section>
  );
}
