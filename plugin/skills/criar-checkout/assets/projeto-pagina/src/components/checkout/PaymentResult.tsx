import { useEffect, useState } from 'preact/hooks';
import {
  formatMoney,
  type CheckoutEvents,
  type Locale,
  type OrderView,
  type Translate,
} from '@bigbang/page-kit/checkout';
import { AccessNotice, Alert, Button } from './ui';

/** O que acontece depois de gerar o pedido: PIX, boleto, autenticação, análise, aprovado ou recusado. */
export function PaymentResult({
  order,
  locale,
  busy,
  t,
  events,
  onRetry,
  onAcceptUpsell,
  onDeclineUpsell,
}: {
  order: OrderView;
  locale: Locale;
  busy: boolean;
  t: Translate;
  events: CheckoutEvents;
  onRetry: () => void;
  onAcceptUpsell: () => void;
  onDeclineUpsell: () => void;
}) {
  const payment = order.payment;
  const money = (amount: number) => formatMoney(amount, order.currency, locale);

  if (order.status === 'paid') {
    return (
      <div class="space-y-4">
        <Alert tone="success">
          <p class="text-base font-semibold">{t('order.paid')}</p>
          <p>{t('order.paidDetail', { number: order.number })}</p>
        </Alert>
        {order.access && (
          <AccessNotice
            url={order.access.url}
            title={t('thanks.accessTitle')}
            detail={t('thanks.accessDetail')}
            button={t('thanks.accessButton')}
          />
        )}
        {order.upsellOffer && (
          <Upsell
            order={order}
            money={money}
            busy={busy}
            t={t}
            events={events}
            onAccept={onAcceptUpsell}
            onDecline={onDeclineUpsell}
          />
        )}
      </div>
    );
  }

  if (order.status === 'in_analysis' || payment?.status === 'in_analysis') {
    return (
      <Alert tone="info">
        <p class="font-semibold">{t('order.inAnalysis')}</p>
        <p>{t('order.inAnalysisDetail')}</p>
      </Alert>
    );
  }

  const failed =
    order.status === 'refused' ||
    order.status === 'charge_failed' ||
    payment?.status === 'refused' ||
    payment?.status === 'failed';
  if (failed) {
    return (
      <div class="space-y-4">
        <Alert>
          <p class="font-semibold">{t('order.refused')}</p>
          {payment?.refusal?.message && <p>{payment.refusal.message}</p>}
        </Alert>
        <Button onClick={onRetry}>{t('order.tryAgain')}</Button>
      </div>
    );
  }

  if (payment?.status === 'requires_action' && payment.action) {
    return (
      <div class="space-y-3">
        <p class="text-sm text-neutral-700">{t('card.authenticating')}</p>
        <iframe
          src={payment.action.url}
          title={t('card.authenticating')}
          class="h-[520px] w-full rounded-xl border border-neutral-200"
          sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-popups"
        />
      </div>
    );
  }

  if (payment?.pix)
    return (
      <Pix
        order={order}
        money={money}
        t={t}
        events={events}
        onRetry={onRetry}
      />
    );

  if (payment?.boleto) {
    const boleto = payment.boleto;
    return (
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">{t('boleto.title')}</h3>
        <p class="text-sm text-neutral-700">
          {t('boleto.instructions', {
            date: new Date(boleto.dueAt).toLocaleDateString(locale),
          })}
        </p>
        <code class="block rounded-lg bg-neutral-100 p-3 text-sm break-all">
          {boleto.digitableLine}
        </code>
        <div class="flex flex-wrap gap-2">
          <CopyButton
            text={boleto.digitableLine}
            label={t('boleto.copy')}
            done={t('pix.copied')}
          />
          <a
            href={boleto.url}
            target="_blank"
            rel="noopener"
            onClick={() => events.track({ type: 'boleto_opened' })}
            class="inline-flex items-center rounded-xl border border-neutral-300 px-5 py-3 font-semibold hover:bg-neutral-50"
          >
            {t('boleto.open')}
          </a>
        </div>
      </div>
    );
  }

  if (order.status === 'expired' || payment?.status === 'expired') {
    return (
      <div class="space-y-4">
        <Alert tone="info">{t('pix.expired')}</Alert>
        <Button onClick={onRetry}>{t('order.otherMethod')}</Button>
      </div>
    );
  }

  return <p class="text-sm text-neutral-600">{t('pix.waiting')}</p>;
}

function Pix({
  order,
  money,
  t,
  events,
  onRetry,
}: {
  order: OrderView;
  money: (amount: number) => string;
  t: Translate;
  events: CheckoutEvents;
  onRetry: () => void;
}) {
  const pix = order.payment!.pix!;
  const remaining = useCountdown(pix.expiresAt);
  if (remaining <= 0) {
    return (
      <div class="space-y-4">
        <Alert tone="info">{t('pix.expired')}</Alert>
        <Button onClick={onRetry}>{t('pix.newCode')}</Button>
      </div>
    );
  }
  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, '0');
  return (
    <div class="space-y-4 text-center">
      <h3 class="text-lg font-semibold">{t('pix.title')}</h3>
      <p class="text-2xl font-bold tabular-nums">{money(order.total)}</p>
      <img
        src={pix.qrCodeImage}
        alt="QR code PIX"
        width={220}
        height={220}
        class="mx-auto rounded-lg border border-neutral-200"
      />
      <p class="text-sm text-neutral-700">{t('pix.instructions')}</p>
      <code class="block rounded-lg bg-neutral-100 p-3 text-left text-xs break-all">
        {pix.qrCode}
      </code>
      <CopyButton
        text={pix.qrCode}
        label={t('pix.copy')}
        done={t('pix.copied')}
        onCopy={() => events.track({ type: 'pix_code_copied' })}
        primary
      />
      <p class="text-sm text-neutral-500">
        {t('pix.expires', { time: `${minutes}:${seconds}` })}
      </p>
      <p class="flex items-center justify-center gap-2 text-sm text-neutral-600">
        <span class="size-2 animate-pulse rounded-full bg-amber-500" />
        {t('pix.waiting')}
      </p>
    </div>
  );
}

function Upsell({
  order,
  money,
  busy,
  t,
  events,
  onAccept,
  onDecline,
}: {
  order: OrderView;
  money: (amount: number) => string;
  busy: boolean;
  t: Translate;
  events: CheckoutEvents;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const offer = order.upsellOffer!;
  useEffect(() => {
    events.trackOnce(`upsell:${offer.offerId}`, {
      type: 'upsell_offer_shown',
      offerId: offer.offerId,
    });
  }, [offer.offerId]);
  return (
    <div class="space-y-3 rounded-2xl border-2 border-amber-400 bg-amber-50 p-5">
      <p class="text-sm font-semibold tracking-wide text-amber-800 uppercase">
        {t('upsell.title')}
      </p>
      <p class="text-xl font-bold">{offer.productName}</p>
      <p>
        {offer.regularPrice > offer.specialPrice && (
          <s class="mr-2 text-neutral-500">{money(offer.regularPrice)}</s>
        )}
        <strong class="text-2xl">{money(offer.specialPrice)}</strong>
      </p>
      <div class="flex flex-col gap-2 sm:flex-row">
        <Button onClick={onAccept} loading={busy}>
          {t('upsell.accept', { price: money(offer.specialPrice) })}
        </Button>
        <Button variant="secondary" onClick={onDecline} disabled={busy}>
          {t('upsell.decline')}
        </Button>
      </div>
    </div>
  );
}

function CopyButton({
  text,
  label,
  done,
  onCopy,
  primary,
}: {
  text: string;
  label: string;
  done: string;
  onCopy?: () => void;
  primary?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant={primary ? 'primary' : 'secondary'}
      class={primary ? 'w-full' : ''}
      onClick={async () => {
        await navigator.clipboard?.writeText(text).catch(() => undefined);
        setCopied(true);
        onCopy?.();
        setTimeout(() => setCopied(false), 2500);
      }}
    >
      {copied ? done : label}
    </Button>
  );
}

function useCountdown(until: string): number {
  const target = new Date(until).getTime();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [target]);
  return Math.max(0, Math.round((target - now) / 1000));
}
