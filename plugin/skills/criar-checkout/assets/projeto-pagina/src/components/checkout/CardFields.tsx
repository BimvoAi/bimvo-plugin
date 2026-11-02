import type { CardField, Translate } from '@bigbang/page-kit/checkout';
import { cardBrand, type FieldProps } from '@bigbang/page-kit/forms';
import { Field } from './ui';

export type CardFieldName = CardField;

/**
 * Campos do cartão, com máscara e validação. O kit gera o token do cartão no processador e, quando
 * a loja usa 3DS, abre sozinho a confirmação do banco: a página só desenha os campos.
 */
export function CardFields({
  field,
  errors,
  t,
}: {
  field: (name: CardFieldName) => FieldProps;
  errors: Partial<Record<CardFieldName, string>>;
  t: Translate;
}) {
  const number = field('cardNumber');
  const brand = cardBrand(number.value);

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
