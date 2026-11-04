import { useEffect, useMemo } from 'preact/hooks';
import {
  translator,
  useCheckout,
  useCheckoutForm,
  type BuyerCartItem,
  type CheckoutConfig,
  type CheckoutView,
  type Translate,
} from '@bigbang/page-kit/checkout';
import { orderHref } from '@bigbang/page-kit/router';
import { KitSlot } from '@bigbang/page-kit/slots';
import { StoreUnavailable } from '../StoreUnavailable';
import { CardFields } from './CardFields';
import { OrderSummary } from './OrderSummary';
import { PaymentResult } from './PaymentResult';
import { paymentMark } from './paymentMark';
import { PixLogo } from './PixLogo';
import { Alert, Button, Field, Section, Spinner } from './ui';
import { useProductChoice } from './useProductChoice';

/**
 * Checkout completo ligado à API do big-bang: dados do comprador (com máscara e validação),
 * endereço de entrega só com produto físico e endereço de cobrança só no meio que exige,
 * cupom, order bump, PIX, cartão (token no adquirente e, na Cloudfy Payments, 3DS do banco,
 * abertos pelo kit), boleto, acompanhamento do pagamento, nova tentativa e upsell. Eventos do funil vão sozinhos.
 * Toda regra vem do kit (`useCheckoutForm`); este arquivo só desenha. Mudar o visual é seguro;
 * reescrever a regra aqui congela a página e ela deixa de receber correções.
 */
export function Checkout({
  config,
  items,
  onOrder,
}: {
  config: CheckoutConfig;
  /** Itens já escolhidos (carrinho da loja virtual); sem eles, valem o endereço ou o carrinho fixo. */
  items?: BuyerCartItem[];
  /** Chamado uma vez quando o pedido é gerado. */
  onOrder?: (orderId: string) => void;
}) {
  const choice = useProductChoice(config);
  const t = useMemo(() => translator(config.locale), [config.locale]);

  if (!choice.ready) return <Alert tone="info">{t('notConfigured')}</Alert>;
  if (items) {
    return <CheckoutSession config={config} items={items} onOrder={onOrder} />;
  }

  const itemsKey =
    choice.items
      ?.map((item) => `${item.productId}x${item.quantity}`)
      .join(',') ?? '';

  return (
    <div class="space-y-6">
      {choice.invalid && <Alert>{t('product.invalid')}</Alert>}
      {choice.missing && <Alert>{t('product.missing')}</Alert>}
      {choice.items && (
        <CheckoutSession
          key={itemsKey}
          config={config}
          items={choice.items}
          onOrder={onOrder}
        />
      )}
    </div>
  );
}

function CheckoutSession({
  config,
  items,
  onOrder,
}: {
  config: CheckoutConfig;
  items: BuyerCartItem[];
  onOrder?: (orderId: string) => void;
}) {
  const c = useCheckout(config, items);
  const orderId = c.order?.orderId;
  useEffect(() => {
    if (orderId) onOrder?.(orderId);
  }, [orderId]);
  const t = useMemo(
    () => translator(c.checkout?.locale ?? config.locale),
    [c.checkout?.locale, config.locale],
  );

  if (!c.configured) return <Alert tone="info">{t('notConfigured')}</Alert>;
  if (c.loading)
    return (
      <p class="flex items-center gap-2 text-neutral-600">
        <Spinner /> {t('loading')}
      </p>
    );
  if (c.storeUnavailable) return <StoreUnavailable locale={config.locale} />;
  if (!c.checkout) return <Alert>{c.error ?? t('loading')}</Alert>;
  return <CheckoutForm c={c} checkout={c.checkout} t={t} />;
}

const COUNTRIES = [
  'BR',
  'AR',
  'CL',
  'CO',
  'MX',
  'PE',
  'UY',
  'US',
  'PT',
  'ES',
  'GB',
];

function CheckoutForm({
  c,
  checkout,
  t,
}: {
  c: ReturnType<typeof useCheckout>;
  checkout: CheckoutView;
  t: Translate;
}) {
  const form = useCheckoutForm(c, checkout, t);
  const { buyer, payment, card, shipping, money } = form;
  const { form: fields, needsDocument, addressMode, needsAddress, br } = buyer;
  const method = payment.method;

  return (
    <div class="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div class="space-y-6">
        {c.demo && <Alert tone="info">{t('demo')}</Alert>}

        {form.showResult ? (
          <Section title={t('section.payment')}>
            <PaymentResult
              order={c.order!}
              locale={checkout.locale}
              busy={c.busy}
              t={t}
              events={c.events}
              onRetry={c.startRetry}
              onAcceptUpsell={() => void form.upsell.accept()}
              onDeclineUpsell={() => void form.upsell.decline()}
            />
            {c.orderToken && !c.demo && (
              <p class="text-sm text-neutral-600">
                <a
                  class="font-medium underline"
                  href={orderHref(c.order!.orderId, c.orderToken)}
                >
                  {t('order.track')}
                </a>{' '}
                · {t('order.trackHint')}
              </p>
            )}
            {form.upsell.needsCard && card.tokenizer && (
              <CardFields
                tokenizer={card.tokenizer}
                field={card.field}
                errors={card.errors}
                t={t}
                onSecureChange={card.onSecureChange}
                onFilled={() => undefined}
              />
            )}
            {c.error && <Alert>{c.error}</Alert>}
            <KitSlot
              place="order.result"
              order={c.order!}
              locale={checkout.locale}
              t={t}
            />
          </Section>
        ) : (
          <form class="space-y-6" noValidate onSubmit={payment.submit}>
            <Section title={t('section.buyer')}>
              <Field
                label={t('field.name')}
                field={fields.field('name')}
                error={fields.errors.name}
                autoComplete="name"
              />
              <div class="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t('field.email')}
                  field={fields.field('email')}
                  error={fields.errors.email}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                />
                <Field
                  label={t('field.phone')}
                  field={fields.field('phone')}
                  error={fields.errors.phone}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={br ? '(11) 98888-7777' : '+1 555 123 4567'}
                />
              </div>
              {(needsDocument || br) && (
                <Field
                  label={t('field.document')}
                  field={fields.field('document')}
                  error={fields.errors.document}
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                />
              )}
            </Section>

            {needsAddress && (
              <Section
                title={t(
                  addressMode === 'billing'
                    ? 'section.billing'
                    : 'section.address',
                )}
              >
                {addressMode === 'billing' && (
                  <p class="text-sm text-neutral-600">
                    {t('address.billingHint')}
                  </p>
                )}
                <div class="grid gap-4 sm:grid-cols-3">
                  {!br && (
                    <div>
                      <label
                        for="f-country"
                        class="mb-1 block text-sm font-medium text-neutral-700"
                      >
                        {t('field.country')}
                      </label>
                      <select
                        id="f-country"
                        value={fields.values.country}
                        onChange={(e) =>
                          fields.setValue(
                            'country',
                            (e.currentTarget as HTMLSelectElement).value,
                          )
                        }
                        class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5"
                      >
                        <option value="" />
                        {COUNTRIES.map((code) => (
                          <option key={code} value={code}>
                            {code}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <Field
                    label={t('field.postalCode')}
                    field={fields.field('postalCode')}
                    error={fields.errors.postalCode}
                    inputMode={
                      fields.values.country === 'BR' ? 'numeric' : 'text'
                    }
                    autoComplete="postal-code"
                  />
                </div>
                <div class="grid gap-4 sm:grid-cols-[1fr_140px]">
                  <Field
                    label={t('field.street')}
                    field={fields.field('street')}
                    error={fields.errors.street}
                    autoComplete="address-line1"
                  />
                  <Field
                    label={t('field.number')}
                    field={fields.field('number')}
                    error={fields.errors.number}
                  />
                </div>
                <div class="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={t('field.complement')}
                    field={fields.field('complement')}
                    autoComplete="address-line2"
                  />
                  <Field
                    label={t('field.district')}
                    field={fields.field('district')}
                  />
                </div>
                <div class="grid gap-4 sm:grid-cols-[1fr_120px]">
                  <Field
                    label={t('field.city')}
                    field={fields.field('city')}
                    error={fields.errors.city}
                    autoComplete="address-level2"
                  />
                  <Field
                    label={t('field.region')}
                    field={fields.field('region')}
                    error={fields.errors.region}
                    autoComplete="address-level1"
                    maxLength={br ? 2 : 60}
                  />
                </div>
              </Section>
            )}

            {shipping.required && (
              <Section title={t('section.shipping')}>
                {shipping.quoting ? (
                  <p
                    class="flex items-center gap-2 text-sm text-neutral-600"
                    role="status"
                  >
                    <Spinner /> {t('shipping.calculating')}
                  </p>
                ) : shipping.options.length === 0 ? (
                  <p class="text-sm text-neutral-600">
                    {t('shipping.enterPostalCode')}
                  </p>
                ) : (
                  <div class="space-y-2">
                    {shipping.options.map((option) => (
                      <label
                        key={option.shippingMethodId}
                        class="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-neutral-200 p-3 has-[:checked]:border-neutral-900"
                      >
                        <span class="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            class="accent-neutral-900"
                            checked={
                              shipping.selectedId === option.shippingMethodId
                            }
                            disabled={c.busy}
                            onChange={() =>
                              shipping.select(option.shippingMethodId)
                            }
                          />
                          <span>
                            <span class="block font-medium">{option.name}</span>
                            <span class="block text-sm text-neutral-500">
                              {shipping.detail(option)}
                            </span>
                          </span>
                        </span>
                        <span class="font-medium tabular-nums">
                          {option.price
                            ? money(option.price)
                            : t('summary.free')}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </Section>
            )}

            <Section title={t('section.payment')}>
              <div role="radiogroup" class="grid grid-cols-3 gap-2">
                {payment.methods.map((m) => (
                  <button
                    key={m.method}
                    type="button"
                    role="radio"
                    aria-checked={method === m.method}
                    onClick={() => payment.select(m.method)}
                    class="group flex flex-col items-center rounded-xl border px-3 py-3 text-sm font-semibold transition aria-checked:border-neutral-900 aria-checked:bg-neutral-900 aria-checked:text-white border-neutral-300 hover:border-neutral-500"
                  >
                    {m.method === 'pix' ? (
                      <PixLogo />
                    ) : paymentMark(m.method) ? (
                      <img
                        src={paymentMark(m.method) ?? ''}
                        alt=""
                        class="mb-1 h-6 w-6"
                      />
                    ) : null}
                    {t(`method.${m.method}`)}
                    {m.adjustment < 0 && (
                      <span class="block text-xs font-normal opacity-80">
                        − {money(-m.adjustment)}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {method === 'credit_card' && card.tokenizer && (
                <>
                  <CardFields
                    tokenizer={card.tokenizer}
                    field={card.field}
                    errors={card.errors}
                    t={t}
                    onSecureChange={card.onSecureChange}
                    onFilled={card.onFilled}
                  />
                  {payment.installmentPlans.length > 0 && (
                    <div>
                      <label
                        for="f-installments"
                        class="mb-1 block text-sm font-medium text-neutral-700"
                      >
                        {t('field.installments')}
                      </label>
                      <select
                        id="f-installments"
                        value={payment.installments}
                        onChange={(e) =>
                          payment.selectInstallments(
                            Number(
                              (e.currentTarget as HTMLSelectElement).value,
                            ),
                          )
                        }
                        class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5"
                      >
                        {payment.installmentPlans.map((plan) => (
                          <option key={plan.count} value={plan.count}>
                            {t('installments.option', {
                              count: plan.count,
                              amount: money(plan.installmentAmount),
                            })}
                            {plan.interestFree
                              ? ` ${t('installments.interestFree')}`
                              : ` (${t('installments.total', { total: money(plan.total) })})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {c.error && <Alert>{c.error}</Alert>}

              <KitSlot place="checkout.beforePay" checkout={checkout} t={t} />

              {/* Spinner só deste clique. busy (cupom, bump, frete, quantidade) não entra. */}
              <Button
                type="submit"
                class="w-full text-lg"
                loading={payment.paying}
                disabled={!method}
              >
                {payment.paying
                  ? t('pay.processing')
                  : method === 'pix'
                    ? t('pay.pixButton', { total: money(payment.total) })
                    : method === 'boleto'
                      ? t('pay.boletoButton', { total: money(payment.total) })
                      : t('pay.button', { total: money(payment.total) })}
              </Button>
              {method === 'credit_card' && (
                <p class="text-center text-xs text-neutral-500">
                  {t('pay.secure')}
                </p>
              )}
            </Section>
          </form>
        )}
      </div>

      <div class="lg:sticky lg:top-6 lg:self-start">
        <OrderSummary
          form={form}
          checkout={checkout}
          total={form.showResult ? c.order!.total : payment.total}
          busy={c.busy}
          t={t}
        />
      </div>
    </div>
  );
}
