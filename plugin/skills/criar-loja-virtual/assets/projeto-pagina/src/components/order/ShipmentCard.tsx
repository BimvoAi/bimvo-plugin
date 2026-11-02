import { useState } from 'preact/hooks';
import {
  safeTrackingUrl,
  shipmentStatusKey,
  type Locale,
  type PublicShipment,
  type Translate,
} from '@bigbang/page-kit/checkout';
import { Button } from '../checkout/ui';

/**
 * Envio do item físico no acompanhamento e no obrigado: estado, transportadora, código de rastreio
 * (copiável) e o link "Rastrear entrega" quando a transportadora tem página de rastreio.
 */
export function ShipmentCard({
  shipment,
  locale,
  t,
}: {
  shipment: PublicShipment;
  locale: Locale;
  t: Translate;
}) {
  const [copied, setCopied] = useState(false);
  const trackingUrl = safeTrackingUrl(shipment.trackingUrl);
  const date = (iso: string) => new Date(iso).toLocaleDateString(locale);
  return (
    <div class="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-semibold">{t('shipment.title')}</h2>
        <span class="rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-800">
          {t(shipmentStatusKey(shipment.status))}
        </span>
      </div>
      {shipment.carrier && (
        <p class="text-sm text-neutral-600">
          {t('shipment.carrier', { carrier: shipment.carrier })}
        </p>
      )}
      {shipment.trackingCode && (
        <div class="space-y-1">
          <p class="text-sm text-neutral-500">{t('shipment.trackingCode')}</p>
          <div class="flex flex-wrap items-center gap-2">
            <code class="rounded-lg bg-neutral-100 px-3 py-2 font-mono text-sm break-all">
              {shipment.trackingCode}
            </code>
            <Button
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard
                  ?.writeText(shipment.trackingCode ?? '')
                  .catch(() => undefined);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }}
            >
              {copied ? t('shipment.copied') : t('shipment.copy')}
            </Button>
          </div>
        </div>
      )}
      {(shipment.shippedAt || shipment.deliveredAt) && (
        <ul class="space-y-0.5 text-sm text-neutral-500">
          {shipment.shippedAt && (
            <li>
              {t('shipment.shippedAt', { date: date(shipment.shippedAt) })}
            </li>
          )}
          {shipment.deliveredAt && (
            <li>
              {t('shipment.deliveredAt', { date: date(shipment.deliveredAt) })}
            </li>
          )}
        </ul>
      )}
      {trackingUrl && (
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-5 py-3 font-semibold text-white transition hover:bg-neutral-800"
        >
          {t('shipment.track')}
        </a>
      )}
    </div>
  );
}
