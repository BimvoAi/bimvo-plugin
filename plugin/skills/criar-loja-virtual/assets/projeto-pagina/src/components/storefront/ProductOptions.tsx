import type {
  OptionDisplay,
  StorefrontProduct,
  StorefrontVariant,
} from '@bigbang/page-kit/storefront';
import type { Shop } from './shop';

/** Opções das variantes na ordem em que aparecem (Cor, Tamanho…), com os valores. */
export function variantOptions(
  product: StorefrontProduct,
): { name: string; values: string[] }[] {
  const options: { name: string; values: string[] }[] = [];
  for (const variant of product.variants) {
    for (const option of variant.options) {
      let entry = options.find((item) => item.name === option.name);
      if (!entry) {
        entry = { name: option.name, values: [] };
        options.push(entry);
      }
      if (!entry.values.includes(option.value)) entry.values.push(option.value);
    }
  }
  return options;
}

/** Variante com exatamente os valores escolhidos. */
export function findVariant(
  product: StorefrontProduct,
  selected: Record<string, string>,
): StorefrontVariant | null {
  return (
    product.variants.find((variant) =>
      variant.options.every((option) => selected[option.name] === option.value),
    ) ?? null
  );
}

export function selectionOf(
  variant: StorefrontVariant | null,
): Record<string, string> {
  return Object.fromEntries(
    (variant?.options ?? []).map((option) => [option.name, option.value]),
  );
}

/**
 * Escolha da variante pelas opções, desenhada como a loja configurou (`optionDisplay`): botões,
 * lista ou amostras de cor/foto. Valor sem variante à venda com as outras escolhas fica riscado.
 * Produto com variantes sem opções (só rótulo) mostra um botão por variante.
 */
export function ProductOptions({
  shop,
  product,
  variant,
  onChange,
}: {
  shop: Shop;
  product: StorefrontProduct;
  variant: StorefrontVariant | null;
  onChange: (variant: StorefrontVariant | null) => void;
}) {
  const { t } = shop;
  const options = variantOptions(product);

  if (options.length === 0) {
    return (
      <fieldset class="space-y-2">
        <legend class="text-sm font-medium">{t('chooseOption')}</legend>
        <div class="flex flex-wrap gap-2">
          {product.variants.map((item) => (
            <OptionButton
              key={item.variantId}
              label={item.label}
              selected={item.variantId === variant?.variantId}
              available={item.purchasable && item.price !== null}
              onClick={() => onChange(item)}
            />
          ))}
        </div>
      </fieldset>
    );
  }

  const selected = selectionOf(variant);
  const choose = (name: string, value: string) => {
    const next = { ...selected, [name]: value };
    // Combinação que não existe: fica com a primeira variante à venda que tem o valor escolhido.
    const exact = findVariant(product, next);
    const fallback =
      product.variants.find(
        (item) =>
          item.purchasable &&
          item.options.some(
            (option) => option.name === name && option.value === value,
          ),
      ) ??
      product.variants.find((item) =>
        item.options.some(
          (option) => option.name === name && option.value === value,
        ),
      ) ??
      null;
    onChange(exact ?? fallback);
  };
  const available = (name: string, value: string) =>
    product.variants.some(
      (item) =>
        item.purchasable &&
        item.price !== null &&
        item.options.every((option) =>
          option.name === name
            ? option.value === value
            : selected[option.name] === undefined ||
              selected[option.name] === option.value,
        ),
    );

  return (
    <div class="space-y-4">
      {options.map((option) => {
        const display = product.optionDisplay?.find(
          (item) => item.name === option.name,
        );
        const current = selected[option.name];
        return (
          <fieldset key={option.name} class="space-y-2">
            <legend class="text-sm">
              <span class="font-medium">{option.name}</span>
              {current ? <span class="text-muted">: {current}</span> : null}
            </legend>
            {display?.style === 'select' ? (
              <select
                value={current ?? ''}
                onChange={(event) =>
                  choose(option.name, event.currentTarget.value)
                }
                class="w-full max-w-xs rounded-theme border border-neutral-300 bg-transparent px-3 py-2"
              >
                {current ? null : <option value="">{t('select')}</option>}
                {option.values.map((value) => (
                  <option key={value} value={value}>
                    {value}
                    {available(option.name, value) ? '' : ` · ${t('soldOut')}`}
                  </option>
                ))}
              </select>
            ) : (
              <div class="flex flex-wrap gap-2">
                {option.values.map((value) =>
                  display?.style === 'swatch' ? (
                    <Swatch
                      key={value}
                      display={display}
                      value={value}
                      selected={current === value}
                      available={available(option.name, value)}
                      onClick={() => choose(option.name, value)}
                    />
                  ) : (
                    <OptionButton
                      key={value}
                      label={value}
                      selected={current === value}
                      available={available(option.name, value)}
                      onClick={() => choose(option.name, value)}
                    />
                  ),
                )}
              </div>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}

function OptionButton({
  label,
  selected,
  available,
  onClick,
}: {
  label: string;
  selected: boolean;
  available: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      class={`min-w-11 rounded-theme border px-3 py-1.5 text-sm transition ${
        selected
          ? 'border-primary bg-primary text-primary-fg'
          : 'border-neutral-300 hover:border-neutral-900'
      } ${available ? '' : 'text-muted line-through opacity-60'}`}
    >
      {label}
    </button>
  );
}

function Swatch({
  display,
  value,
  selected,
  available,
  onClick,
}: {
  display: OptionDisplay;
  value: string;
  selected: boolean;
  available: boolean;
  onClick: () => void;
}) {
  const swatch = display.swatches[value];
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={value}
      title={value}
      onClick={onClick}
      class={`relative size-10 overflow-hidden rounded-full border-2 p-0.5 transition ${
        selected
          ? 'border-primary'
          : 'border-transparent hover:border-neutral-300'
      } ${available ? '' : 'opacity-40'}`}
    >
      {swatch?.imageUrl ? (
        <img
          src={swatch.imageUrl}
          alt=""
          class="size-full rounded-full object-cover"
        />
      ) : (
        <span
          class="block size-full rounded-full border border-neutral-200"
          style={{ background: swatch?.color ?? '#e5e5e5' }}
        />
      )}
      {available ? null : (
        <span class="absolute inset-0 m-auto h-px w-full rotate-45 bg-neutral-500" />
      )}
    </button>
  );
}
