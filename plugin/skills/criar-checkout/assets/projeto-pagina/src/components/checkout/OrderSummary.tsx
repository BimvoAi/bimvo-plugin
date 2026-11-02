import type {
  CheckoutForm,
  CheckoutView,
  Translate,
} from '@bigbang/page-kit/checkout';
import { KitSlot } from '@bigbang/page-kit/slots';
import { Button } from './ui';

/**
 * Itens, order bumps, cupom e totais. Valores sempre os que o big-bang devolve; as regras (bump,
 * cupom, ajuste do meio) vêm de `useCheckoutForm`.
 */
export function OrderSummary({
  form,
  checkout,
  total,
  busy,
  t,
}: {
  form: CheckoutForm;
  checkout: CheckoutView;
  /** Total do meio de pagamento escolhido. */
  total: number;
  busy: boolean;
  t: Translate;
}) {
  const { money, bumps, coupon, readOnly } = form;
  const method = form.payment.method;
  const applied = coupon.applied;
  const rejected = coupon.rejected;
  const methodAdjustment = form.payment.methodAdjustment;

  return (
    <aside class="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
      <h2 class="text-lg font-semibold">{t('section.summary')}</h2>

      <ul class="space-y-2">
        {checkout.items.map((item) => (
          <li
            key={`${item.source}-${item.productId}`}
            class="flex items-center justify-between gap-4 text-sm"
          >
            <span class="flex min-w-0 items-center gap-3">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt=""
                  width={48}
                  height={48}
                  loading="lazy"
                  class="size-12 shrink-0 rounded-lg border border-neutral-200 bg-white object-cover"
                />
              )}
              <span>
                {item.quantity > 1 && (
                  <span class="text-neutral-500">{item.quantity}× </span>
                )}
                {item.name}
              </span>
            </span>
            <span class="tabular-nums">{money(item.total)}</span>
          </li>
        ))}
      </ul>

      {!readOnly &&
        bumps.items.map((bump) => (
          <label
            key={bump.orderBumpId}
            class="flex cursor-pointer gap-3 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-3 text-sm"
          >
            <input
              type="checkbox"
              class="mt-1 size-4 accent-neutral-900"
              checked={bump.selected}
              disabled={busy}
              onChange={(e) =>
                bumps.toggle(
                  bump.orderBumpId,
                  (e.currentTarget as HTMLInputElement).checked,
                )
              }
            />
            <span>
              <span class="block font-semibold">{bump.title}</span>
              {bump.description && (
                <span class="block text-neutral-600">{bump.description}</span>
              )}
              <span class="mt-1 block">
                {bump.regularPrice > bump.specialPrice && (
                  <s class="mr-2 text-neutral-400">
                    {money(bump.regularPrice)}
                  </s>
                )}
                <strong>{money(bump.specialPrice)}</strong>
              </span>
            </span>
          </label>
        ))}

      {!readOnly && (
        <form class="flex gap-2" onSubmit={coupon.apply}>
          {applied ? (
            <div class="flex w-full items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <span>{t('coupon.applied', { code: applied.code })}</span>
              <button
                type="button"
                class="font-medium underline"
                disabled={busy}
                onClick={coupon.remove}
              >
                {t('coupon.remove')}
              </button>
            </div>
          ) : (
            <>
              <input
                aria-label={t('field.coupon')}
                placeholder={t('field.coupon')}
                value={coupon.code}
                maxLength={30}
                onInput={(e) =>
                  coupon.setCode((e.currentTarget as HTMLInputElement).value)
                }
                class="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm uppercase outline-none focus:border-neutral-900"
              />
              <Button
                type="submit"
                variant="secondary"
                class="!px-4 !py-2 text-sm"
                disabled={busy || !coupon.code.trim()}
              >
                {t('coupon.apply')}
              </Button>
            </>
          )}
        </form>
      )}
      {!readOnly && rejected?.message && (
        <p class="text-sm text-red-600">{rejected.message}</p>
      )}

      <dl class="space-y-1 border-t border-neutral-200 pt-3 text-sm">
        <Row
          label={t('summary.subtotal')}
          value={money(checkout.totals.subtotal)}
        />
        {checkout.totals.discount > 0 && (
          <Row
            label={t('summary.discount')}
            value={`− ${money(checkout.totals.discount)}`}
            accent
          />
        )}
        {checkout.requiresShipping && (
          <Row
            label={t('summary.shipping')}
            value={
              checkout.selectedShippingMethodId
                ? checkout.totals.shipping
                  ? money(checkout.totals.shipping)
                  : t('summary.free')
                : '—'
            }
          />
        )}
        {methodAdjustment < 0 && method && (
          <Row
            label={t('summary.methodDiscount', {
              method: t(`method.${method}`),
            })}
            value={`− ${money(-methodAdjustment)}`}
            accent
          />
        )}
        <div class="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold">
          <dt>{t('summary.total')}</dt>
          <dd class="tabular-nums">{money(total)}</dd>
        </div>
      </dl>
      <KitSlot place="checkout.summary" checkout={checkout} t={t} />
    </aside>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div class={`flex justify-between ${accent ? 'text-emerald-700' : ''}`}>
      <dt>{label}</dt>
      <dd class="tabular-nums">{value}</dd>
    </div>
  );
}
