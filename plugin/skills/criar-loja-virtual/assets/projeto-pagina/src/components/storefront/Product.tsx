import { useEffect, useState } from 'preact/hooks';
import { href } from '@bigbang/page-kit/router';
import { trackPixel, viewContentEventId } from '@bigbang/page-kit/pixels';
import { ProductPhoto } from './ProductPhoto';
import { loadProduct, StorefrontApiError } from '@bigbang/page-kit/storefront';
import { MAX_LINE_QUANTITY } from '@bigbang/page-kit/storefront';
import type {
  StorefrontProduct,
  StorefrontVariant,
} from '@bigbang/page-kit/storefront';
import type { Shop } from './shop';
import { Loading, NotFound, Retry } from './states';

type Loaded =
  | { status: 'loading' }
  | { status: 'ready'; product: StorefrontProduct }
  | { status: 'missing' }
  | { status: 'error' };

/** Página do produto: imagens, descrição, preço, variantes e disponibilidade, lidos agora. */
export function Product({
  shop,
  productKey,
}: {
  shop: Shop;
  productKey: string;
}) {
  const { config, view, t } = shop;
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoaded({ status: 'loading' });
    loadProduct(config, productKey, view.locale, view.currency)
      .then(({ product }) => {
        if (cancelled) return;
        setLoaded({ status: 'ready', product });
        document.title = `${product.name} · ${view.name}`;
        // Depois de carregar: o link pode trazer o slug, e o pixel precisa do id do produto.
        trackPixel('view_content', {
          contentIds: [product.productId],
          eventId: viewContentEventId(product.productId),
          currency: product.currency,
          value: product.price ?? undefined,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoaded(
          error instanceof StorefrontApiError && error.status === 404
            ? { status: 'missing' }
            : { status: 'error' },
        );
      });
    return () => {
      cancelled = true;
    };
  }, [config, productKey, view.locale, view.currency, view.name, attempt]);

  if (loaded.status === 'loading') return <Loading t={t} />;
  if (loaded.status === 'missing') return <NotFound t={t} />;
  if (loaded.status === 'error') {
    return <Retry t={t} onRetry={() => setAttempt((n) => n + 1)} />;
  }
  return (
    <ProductDetail
      key={loaded.product.productId}
      shop={shop}
      product={loaded.product}
    />
  );
}

function ProductDetail({
  shop,
  product,
}: {
  shop: Shop;
  product: StorefrontProduct;
}) {
  const { t, money, cart } = shop;
  const firstAvailable = product.variants.find((v) => v.purchasable) ?? null;
  const [variant, setVariant] = useState<StorefrontVariant | null>(
    firstAvailable,
  );
  const [image, setImage] = useState(product.imageUrls[0] ?? null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const needsVariant = product.variants.length > 0;
  const sellable = needsVariant ? variant : product;
  const price = sellable?.price ?? null;
  const compareAt = sellable?.compareAtPrice ?? null;
  const stockLeft = sellable?.stock ?? null;
  const canBuy =
    sellable !== null &&
    price !== null &&
    sellable.purchasable &&
    (stockLeft === null || stockLeft >= quantity);

  function add() {
    if (!canBuy) return;
    cart.add({
      productId: product.productId,
      variantId: variant?.variantId ?? null,
      quantity,
    });
    setAdded(true);
  }

  return (
    <article class="grid gap-8 md:grid-cols-2">
      <div class="space-y-3">
        <ProductPhoto
          src={image}
          alt={image ? product.name : ''}
          className="aspect-square w-full rounded-2xl object-cover"
        />
        {product.imageUrls.length > 1 ? (
          <ul class="flex gap-2 overflow-x-auto">
            {product.imageUrls.map((url) => (
              <li key={url}>
                <button
                  type="button"
                  aria-pressed={url === image}
                  onClick={() => setImage(url)}
                  class={`block size-16 overflow-hidden rounded-lg border ${url === image ? 'border-neutral-900' : 'border-transparent'}`}
                >
                  <img
                    src={url}
                    alt=""
                    loading="lazy"
                    class="size-full object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div class="space-y-5">
        {product.categorySlug && product.categoryName ? (
          <a
            class="text-sm text-neutral-600 underline"
            href={href(
              `/categoria/${encodeURIComponent(product.categorySlug)}`,
            )}
          >
            {product.categoryName}
          </a>
        ) : null}
        <h1 class="text-3xl font-bold tracking-tight">{product.name}</h1>
        <p class="flex items-baseline gap-3 text-2xl">
          {price === null ? (
            <span class="text-base text-neutral-500">{t('unavailable')}</span>
          ) : (
            <>
              <span class="font-semibold">{money(price)}</span>
              {compareAt !== null ? (
                <s class="text-lg text-neutral-500">{money(compareAt)}</s>
              ) : null}
            </>
          )}
        </p>
        {needsVariant ? (
          <fieldset class="space-y-2">
            <legend class="text-sm font-medium">{t('chooseOption')}</legend>
            <div class="flex flex-wrap gap-2">
              {product.variants.map((item) => (
                <button
                  key={item.variantId}
                  type="button"
                  disabled={!item.purchasable || item.price === null}
                  aria-pressed={item.variantId === variant?.variantId}
                  onClick={() => {
                    setVariant(item);
                    setAdded(false);
                  }}
                  class={`rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
                    item.variantId === variant?.variantId
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-300'
                  }`}
                >
                  {item.options.length > 0
                    ? item.options.map((option) => option.value).join(' / ')
                    : item.label}
                  {item.purchasable ? '' : ` · ${t('soldOut')}`}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}
        <label class="block text-sm">
          <span class="font-medium">{t('quantity')}</span>
          <input
            type="number"
            min={1}
            max={Math.min(MAX_LINE_QUANTITY, stockLeft ?? MAX_LINE_QUANTITY)}
            value={quantity}
            onInput={(event) => {
              setQuantity(
                Math.max(
                  1,
                  Math.min(
                    MAX_LINE_QUANTITY,
                    Number(event.currentTarget.value) || 1,
                  ),
                ),
              );
              setAdded(false);
            }}
            class="mt-1 block w-24 rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>
        <button
          type="button"
          disabled={!canBuy}
          onClick={add}
          class="w-full rounded-xl bg-neutral-900 px-5 py-3 font-medium text-white disabled:opacity-40"
        >
          {sellable && !sellable.purchasable ? t('soldOut') : t('add')}
        </button>
        {added ? (
          <p class="text-sm" role="status">
            {t('added')}{' '}
            <a class="font-medium underline" href={href('/carrinho')}>
              {t('cart')}
            </a>
          </p>
        ) : null}
        {product.description ? (
          <p class="whitespace-pre-line text-neutral-700">
            {product.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}
