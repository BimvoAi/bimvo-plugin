import { useEffect, useState } from 'preact/hooks';
import type {
  CardField,
  CardTokenizer,
  SecureFieldContainers,
  SecureFieldsState,
  Translate,
} from '@bigbang/page-kit/checkout';
import { cardBrand, type FieldProps } from '@bigbang/page-kit/forms';
import { Field } from './ui';

export type CardFieldName = CardField;

const CONTAINERS: SecureFieldContainers = {
  cardNumber: 'bb-card-number',
  expirationDate: 'bb-card-expiry',
  securityCode: 'bb-card-cvv',
};

/**
 * Campos do cartão. Com o Mercado Pago, número, validade e CVV são iframes do próprio adquirente
 * (a página nunca vê esses dados); com o Pagar.me, a Cloudfy Payments e na prévia, são campos com
 * máscara e validação. Na Cloudfy Payments com 3DS, o kit abre sozinho a confirmação do banco.
 */
export function CardFields({
  tokenizer,
  field,
  errors,
  t,
  onSecureChange,
  onFilled,
}: {
  tokenizer: CardTokenizer;
  field: (name: CardFieldName) => FieldProps;
  errors: Partial<Record<CardFieldName, string>>;
  t: Translate;
  onSecureChange: (state: SecureFieldsState & { ready: boolean }) => void;
  onFilled: () => void;
}) {
  const [secure, setSecure] = useState<SecureFieldsState>({
    invalid: {},
    brand: null,
  });
  const [mountError, setMountError] = useState<string | null>(null);

  useEffect(() => {
    if (tokenizer.mode !== 'secure-fields' || !tokenizer.mount) return;
    let alive = true;
    tokenizer
      .mount(CONTAINERS, (state) => {
        if (!alive) return;
        setSecure(state);
        onSecureChange({ ...state, ready: true });
        if (state.brand && !Object.values(state.invalid).some(Boolean))
          onFilled();
      })
      .then(
        () =>
          alive && onSecureChange({ invalid: {}, brand: null, ready: true }),
      )
      .catch(() => alive && setMountError(t('error.cardNumber')));
    return () => {
      alive = false;
      tokenizer.destroy?.();
    };
  }, [tokenizer]);

  const number = field('cardNumber');
  const brand =
    tokenizer.mode === 'inputs' ? cardBrand(number.value) : secure.brand;

  if (tokenizer.mode === 'secure-fields') {
    const box = (invalid?: boolean) =>
      `h-11 rounded-lg border bg-white px-3 py-2.5 ${invalid ? 'border-red-500' : 'border-neutral-300'}`;
    return (
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2">
          <span class="mb-1 block text-sm font-medium text-neutral-700">
            {t('field.cardNumber')}{' '}
            {brand && <span class="text-neutral-500 uppercase">· {brand}</span>}
          </span>
          <div
            id={CONTAINERS.cardNumber}
            class={box(secure.invalid.cardNumber)}
          />
          {secure.invalid.cardNumber && (
            <p class="mt-1 text-sm text-red-600">{t('error.cardNumber')}</p>
          )}
        </div>
        <Field
          class="col-span-2"
          label={t('field.cardholder')}
          field={field('cardholder')}
          error={errors.cardholder}
          autoComplete="cc-name"
        />
        <div>
          <span class="mb-1 block text-sm font-medium text-neutral-700">
            {t('field.expiry')}
          </span>
          <div
            id={CONTAINERS.expirationDate}
            class={box(secure.invalid.expirationDate)}
          />
          {secure.invalid.expirationDate && (
            <p class="mt-1 text-sm text-red-600">{t('error.expiry')}</p>
          )}
        </div>
        <div>
          <span class="mb-1 block text-sm font-medium text-neutral-700">
            {t('field.cvv')}
          </span>
          <div
            id={CONTAINERS.securityCode}
            class={box(secure.invalid.securityCode)}
          />
          {secure.invalid.securityCode && (
            <p class="mt-1 text-sm text-red-600">{t('error.cvv')}</p>
          )}
        </div>
        {mountError && (
          <p class="col-span-2 text-sm text-red-600">{mountError}</p>
        )}
      </div>
    );
  }

  return (
    <div class="grid grid-cols-2 gap-3">
      <Field
        class="col-span-2"
        label={
          brand
            ? `${t('field.cardNumber')} · ${brand.toUpperCase()}`
            : t('field.cardNumber')
        }
        field={number}
        error={errors.cardNumber}
        inputMode="numeric"
        autoComplete="cc-number"
        placeholder="0000 0000 0000 0000"
      />
      <Field
        class="col-span-2"
        label={t('field.cardholder')}
        field={field('cardholder')}
        error={errors.cardholder}
        autoComplete="cc-name"
      />
      <Field
        label={t('field.expiry')}
        field={field('expiry')}
        error={errors.expiry}
        inputMode="numeric"
        autoComplete="cc-exp"
        placeholder="MM/AA"
      />
      <Field
        label={t('field.cvv')}
        field={field('cvv')}
        error={errors.cvv}
        inputMode="numeric"
        autoComplete="cc-csc"
        placeholder="123"
      />
    </div>
  );
}
