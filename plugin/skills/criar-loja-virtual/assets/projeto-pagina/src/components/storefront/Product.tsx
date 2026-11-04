import { useEffect, useState } from 'preact/hooks';
import { ChevronRight, Minus, Plus } from 'lucide-preact';
import { href, navigate } from '@bigbang/page-kit/router';
import { trackPixel, viewContentEventId } from '@bigbang/page-kit/pixels';
import { KitSlot } from '@bigbang/page-kit/slots';
import {
  customizationProblem,
  priceWithCustomization,
  discountPercent,
  loadProduct,
  MAX_LINE_QUANTITY,
  openCartDrawer,
  productListKey,
  requestStockAlert,
  StorefrontApiError,
  useRecentlyViewed,
  type ProductBlockType,
  type StorefrontProduct,
  type StorefrontVariant,
} from '@bigbang/page-kit/storefront';
import { RecentlyViewed } from './HomeSections';
import { Stars, TrustBadges, WishlistButton } from './parts';
import {
  AttributesBlock,
  InstallmentsBlock,
  PixBlock,
  PromotionBlock,
  RelatedBlock,
  ShippingEstimateBlock,
  SizeGuideBlock,
} from './ProductBlocks';
import { ProductOptions } from './ProductOptions';
import { ProductPhoto } from './ProductPhoto';
import { Reviews } from './Reviews';
import { features, type Shop } from './shop';
import { Loading, NotFound, Retry } from './states';

type Loaded =
  | { status: 'loading' }
  | { status: 'ready'; product: StorefrontProduct }
  | { status: 'missing' }
  | { status: 'error' };

type CustomError = NonNullable<ReturnType<typeof customizationProblem>>;

/** Blocos quando a API não manda a configuração da vitrine (anterior à 046). */
const DEFAULT_BLOCKS: ProductBlockType[] = [
  'installments',
  'pix-price',
  'promotions',
  'shipping-estimate',
  'trust-badges',
  'attributes',
  'size-guide',
  'description',
  'related',
  'recently-viewed',
];
/** Junto do preço. */
const PRICE_BLOCKS: ProductBlockType[] = [
  'installments',
  'pix-price',
  'promotions',
];
/** Largura toda, depois da ficha do produto. */
const WIDE_BLOCKS: ProductBlockType[] = [
  'reviews',
  'related',
  'recently-viewed',
];

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
  const recent = useRecentlyViewed(view.storeId);

  useEffect(() => {
    let cancelled = false;
    setLoaded({ status: 'loading' });
    loadProduct(config, productKey, view.locale, view.currency)
      .then(({ product }) => {
        if (cancelled) return;
        setLoaded({ status: 'ready', product });
        document.title = `${product.seo?.title ?? product.name} · ${view.name}`;
        if (features(view).recentlyViewed) recent.add(productListKey(product));
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
  const { t, money, cart, view } = shop;
  const enabled = features(view);
  const blocks =
    view.storefront?.product.blocks.map((block) => block.type) ??
    DEFAULT_BLOCKS;
  const firstAvailable =
    product.variants.find((v) => v.purchasable) ?? product.variants[0] ?? null;
  const [variant, setVariant] = useState<StorefrontVariant | null>(
    firstAvailable,
  );
  const [image, setImage] = useState(
    variantImage(product, firstAvailable) ?? product.imageUrls[0] ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [customError, setCustomError] = useState<CustomError | null>(null);
  const [added, setAdded] = useState(false);

  const needsVariant = product.variants.length > 0;
  const sellable = needsVariant ? variant : product;
  const basePrice = sellable?.price ?? null;
  const price = priceWithCustomization(basePrice, product.customFields, custom);
  const compareAt = sellable?.compareAtPrice ?? null;
  const off = discountPercent(basePrice, compareAt);
  const stockLeft = sellable?.stock ?? null;
  const canBuy =
    sellable !== null &&
    basePrice !== null &&
    sellable.purchasable &&
    (stockLeft === null || stockLeft >= quantity);
  const soldOut =
    sellable !== null && basePrice !== null && !sellable.purchasable;
  const rating = enabled.reviews ? product.rating : null;

  function chooseVariant(next: StorefrontVariant | null) {
    setVariant(next);
    setAdded(false);
    const photo = variantImage(product, next);
    if (photo) setImage(photo);
  }

  function add(then: 'drawer' | 'checkout') {
    if (!canBuy) return;
    const problem = customizationProblem(product.customFields, custom);
    if (problem) {
      setCustomError(problem);
      document
        .getElementById(`custom-${problem.key}`)
        ?.focus({ preventScroll: false });
      return;
    }
    setCustomError(null);
    cart.add({
      productId: product.productId,
      variantId: variant?.variantId ?? null,
      quantity,
      customization: custom,
    });
    setAdded(true);
    if (then === 'checkout') navigate(href('/checkout'));
    else openCartDrawer();
  }

  const priceBlocks = blocks.filter((type) => PRICE_BLOCKS.includes(type));
  const columnBlocks = blocks.filter(
    (type) => !PRICE_BLOCKS.includes(type) && !WIDE_BLOCKS.includes(type),
  );
  const wideBlocks = blocks.filter((type) => WIDE_BLOCKS.includes(type));
  const category = product.categorySlug
    ? view.categories.find((item) => item.slug === product.categorySlug)
    : undefined;
  const parent = category?.parentSlug
    ? view.categories.find((item) => item.slug === category.parentSlug)
    : undefined;

  return (
    <div class="space-y-14 pb-24 md:pb-0">
      <nav aria-label="breadcrumb" class="text-sm text-muted">
        <ol class="flex flex-wrap items-center gap-1">
          <li>
            <a class="hover:underline" href={href('/')}>
              {t('home')}
            </a>
          </li>
          {[parent, category]
            .filter((item) => item !== undefined)
            .map((item) => (
              <li key={item.slug} class="flex items-center gap-1">
                <ChevronRight class="size-3.5" aria-hidden="true" />
                <a
                  class="hover:underline"
                  href={href(`/categoria/${encodeURIComponent(item.slug)}`)}
                >
                  {item.name}
                </a>
              </li>
            ))}
          <li class="flex items-center gap-1 text-ink">
            <ChevronRight class="size-3.5" aria-hidden="true" />
            <span aria-current="page">{product.name}</span>
          </li>
        </ol>
      </nav>

      <article class="grid gap-8 md:grid-cols-2 lg:gap-12">
        <div class="space-y-3 md:sticky md:top-24 md:self-start">
          <div class="relative">
            <ProductPhoto
              src={image}
              alt={image ? product.name : ''}
              className="aspect-square w-full rounded-theme bg-neutral-100 object-cover"
            />
            {off !== null ? (
              <span class="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-sm font-semibold text-primary-fg">
                {t('off', { percent: off })}
              </span>
            ) : null}
          </div>
          {product.imageUrls.length > 1 ? (
            <ul class="bb-scroll-x flex gap-2 overflow-x-auto">
              {product.imageUrls.map((url) => (
                <li key={url} class="shrink-0">
                  <button
                    type="button"
                    aria-pressed={url === image}
                    onClick={() => setImage(url)}
                    class={`block size-16 overflow-hidden rounded-theme border-2 sm:size-20 ${url === image ? 'border-primary' : 'border-transparent'}`}
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
          <div class="flex items-start justify-between gap-3">
            <h1 class="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              {product.name}
            </h1>
            <WishlistButton
              shop={shop}
              product={product}
              class="shrink-0 border border-neutral-200"
            />
          </div>
          {rating && rating.count > 0 ? (
            <a href="#avaliacoes" class="flex items-center gap-2 text-sm">
              <Stars
                rating={rating.average}
                label={t('stars', { rating: rating.average })}
              />
              <span class="text-muted underline">
                {t('reviewsCount', { count: rating.count })}
              </span>
            </a>
          ) : null}

          <div class="space-y-1">
            <p class="flex flex-wrap items-baseline gap-3">
              {price === null ? (
                <span class="text-base text-muted">{t('unavailable')}</span>
              ) : (
                <>
                  {compareAt !== null &&
                  basePrice !== null &&
                  compareAt > basePrice ? (
                    <s class="text-lg text-muted">{money(compareAt)}</s>
                  ) : null}
                  <span class="text-3xl font-semibold">{money(price)}</span>
                </>
              )}
            </p>
            {priceBlocks.map((type) =>
              type === 'installments' ? (
                <InstallmentsBlock key={type} shop={shop} price={price} />
              ) : type === 'pix-price' ? (
                <PixBlock key={type} shop={shop} price={price} />
              ) : (
                <PromotionBlock key={type} shop={shop} product={product} />
              ),
            )}
          </div>
          <KitSlot
            place="product.belowPrice"
            view={view}
            product={product}
            variant={variant}
          />

          {needsVariant ? (
            <ProductOptions
              shop={shop}
              product={product}
              variant={variant}
              onChange={chooseVariant}
            />
          ) : null}

          <CustomFields
            shop={shop}
            product={product}
            values={custom}
            error={customError}
            onChange={(values) => {
              setCustom(values);
              setCustomError(null);
              setAdded(false);
            }}
          />

          {soldOut && enabled.stockAlerts ? (
            <StockAlert shop={shop} product={product} variant={variant} />
          ) : (
            <div class="space-y-3">
              <div class="flex items-stretch gap-3">
                <QuantityStepper
                  shop={shop}
                  value={quantity}
                  max={Math.min(
                    MAX_LINE_QUANTITY,
                    stockLeft ?? MAX_LINE_QUANTITY,
                  )}
                  onChange={(value) => {
                    setQuantity(value);
                    setAdded(false);
                  }}
                />
                <button
                  type="button"
                  disabled={!canBuy}
                  onClick={() => add('drawer')}
                  class="flex-1 rounded-theme border-2 border-primary px-5 py-3 font-medium text-ink transition hover:bg-primary hover:text-primary-fg disabled:opacity-40"
                >
                  {soldOut ? t('soldOut') : t('add')}
                </button>
              </div>
              <button
                type="button"
                disabled={!canBuy}
                onClick={() => add('checkout')}
                class="w-full rounded-theme bg-primary px-5 py-3.5 font-semibold text-primary-fg transition hover:opacity-90 disabled:opacity-40"
              >
                {t('buy')}
              </button>
              {added ? (
                <p class="text-sm" role="status">
                  {t('added')}{' '}
                  <a class="font-medium underline" href={href('/carrinho')}>
                    {t('cart')}
                  </a>
                </p>
              ) : null}
            </div>
          )}
          <KitSlot
            place="product.buyBox"
            view={view}
            product={product}
            variant={variant}
          />

          {columnBlocks.map((type) => {
            switch (type) {
              case 'shipping-estimate':
                return (
                  <ShippingEstimateBlock
                    key={type}
                    shop={shop}
                    product={product}
                    variant={variant}
                    quantity={quantity}
                  />
                );
              case 'trust-badges':
                return (
                  <TrustBadges
                    key={type}
                    badges={view.storefront?.trustBadges ?? []}
                    compact
                  />
                );
              case 'attributes':
                return (
                  <AttributesBlock key={type} shop={shop} product={product} />
                );
              case 'size-guide':
                return (
                  <SizeGuideBlock
                    key={type}
                    shop={shop}
                    slug={product.sizeGuidePageSlug}
                  />
                );
              case 'description':
                return product.description ? (
                  <div key={type} class="space-y-2">
                    <p class="text-sm font-medium">{t('description')}</p>
                    <p class="whitespace-pre-line leading-relaxed text-muted">
                      {product.description}
                    </p>
                  </div>
                ) : null;
              default:
                return null;
            }
          })}
          <KitSlot
            place="product.afterDescription"
            view={view}
            product={product}
          />
        </div>
      </article>

      {wideBlocks.map((type) =>
        type === 'reviews' ? (
          enabled.reviews ? (
            <Reviews key={type} shop={shop} product={product} />
          ) : null
        ) : type === 'related' ? (
          <RelatedBlock key={type} shop={shop} product={product} />
        ) : (
          <RecentlyViewed
            key={type}
            shop={shop}
            title={t('recentlyViewed')}
            exclude={productListKey(product)}
          />
        ),
      )}

      {/* Botão fixo no celular: preço e comprar sempre à mão. */}
      {!soldOut ? (
        <div class="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-neutral-200 bg-white px-4 py-3 text-neutral-900 md:hidden">
          <span class="min-w-0 flex-1">
            <span class="block truncate text-xs text-neutral-500">
              {product.name}
            </span>
            <span class="font-semibold">{money(price)}</span>
          </span>
          <button
            type="button"
            disabled={!canBuy}
            onClick={() => add('drawer')}
            class="rounded-theme bg-primary px-5 py-2.5 text-sm font-semibold text-primary-fg disabled:opacity-40"
          >
            {t('add')}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Foto da variante (`imageIndex`), quando ela tem uma. */
function variantImage(
  product: StorefrontProduct,
  variant: StorefrontVariant | null,
): string | null {
  const index = variant?.imageIndex;
  return typeof index === 'number' ? (product.imageUrls[index] ?? null) : null;
}

function QuantityStepper({
  shop,
  value,
  max,
  onChange,
}: {
  shop: Shop;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const clamp = (next: number) => Math.max(1, Math.min(max, next || 1));
  return (
    <div class="flex items-center rounded-theme border border-neutral-300">
      <button
        type="button"
        aria-label="-"
        disabled={value <= 1}
        onClick={() => onChange(clamp(value - 1))}
        class="px-3 py-2 disabled:opacity-30"
      >
        <Minus class="size-4" aria-hidden="true" />
      </button>
      <input
        type="number"
        min={1}
        max={max}
        value={value}
        aria-label={shop.t('quantity')}
        onInput={(event) => onChange(clamp(Number(event.currentTarget.value)))}
        class="w-12 bg-transparent text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="+"
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
        class="px-3 py-2 disabled:opacity-30"
      >
        <Plus class="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Campos de personalização do produto (gravação, escolha); o acréscimo aparece no rótulo. */
function CustomFields({
  shop,
  product,
  values,
  error,
  onChange,
}: {
  shop: Shop;
  product: StorefrontProduct;
  values: Record<string, string>;
  error: CustomError | null;
  onChange: (values: Record<string, string>) => void;
}) {
  const { t, money } = shop;
  const fields = product.customFields ?? [];
  if (fields.length === 0) return null;
  return (
    <fieldset class="space-y-3 rounded-theme border border-neutral-200 p-4">
      <legend class="px-1 text-sm font-medium">{t('customize')}</legend>
      {fields.map((field) => {
        const id = `custom-${field.key}`;
        const invalid = error?.key === field.key;
        const set = (value: string) =>
          onChange({ ...values, [field.key]: value });
        return (
          <label key={field.key} class="block text-sm" for={id}>
            <span class="font-medium">{field.label}</span>
            {field.required ? null : (
              <span class="text-muted"> ({t('optional')})</span>
            )}
            {field.price > 0 ? (
              <span class="text-muted"> · + {money(field.price)}</span>
            ) : null}
            {field.type === 'select' ? (
              <select
                id={id}
                value={values[field.key] ?? ''}
                aria-invalid={invalid}
                onChange={(event) => set(event.currentTarget.value)}
                class="mt-1 block w-full rounded-theme border border-neutral-300 bg-transparent px-3 py-2 aria-[invalid=true]:border-red-500"
              >
                <option value="">{t('select')}</option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={id}
                value={values[field.key] ?? ''}
                maxLength={field.maxLength}
                aria-invalid={invalid}
                onInput={(event) => set(event.currentTarget.value)}
                class="mt-1 block w-full rounded-theme border border-neutral-300 bg-transparent px-3 py-2 aria-[invalid=true]:border-red-500"
              />
            )}
            {invalid ? (
              <span class="mt-1 block text-red-600">
                {error?.problem === 'tooLong'
                  ? t('fieldTooLong')
                  : t('fieldRequired')}
              </span>
            ) : null}
          </label>
        );
      })}
    </fieldset>
  );
}

/** "Avise-me quando chegar" para produto ou variante esgotada. */
function StockAlert({
  shop,
  product,
  variant,
}: {
  shop: Shop;
  product: StorefrontProduct;
  variant: StorefrontVariant | null;
}) {
  const { t, config, view } = shop;
  const [email, setEmail] = useState('');
  const [state, setState] = useState<
    'idle' | 'sending' | 'done' | 'inStock' | 'error' | 'tooMany'
  >('idle');
  useEffect(() => setState('idle'), [variant?.variantId]);
  if (state === 'done' || state === 'inStock') {
    return (
      <p
        class="rounded-theme bg-emerald-50 p-4 text-sm text-emerald-800"
        role="status"
      >
        {state === 'done' ? t('stockAlertDone') : t('stockAlertInStock')}
      </p>
    );
  }
  return (
    <form
      class="space-y-2 rounded-theme border border-neutral-200 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!email.trim()) return;
        setState('sending');
        requestStockAlert(config, {
          productId: product.productId,
          ...(variant ? { variantId: variant.variantId } : {}),
          email: email.trim(),
          locale: view.locale,
        })
          .then((result) => setState(result.inStock ? 'inStock' : 'done'))
          .catch((error: unknown) =>
            setState(
              error instanceof StorefrontApiError && error.status === 429
                ? 'tooMany'
                : 'error',
            ),
          );
      }}
    >
      <p class="font-medium">{t('stockAlertTitle')}</p>
      <p class="text-sm text-muted">{t('stockAlertText')}</p>
      <div class="flex gap-2">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          placeholder={t('email')}
          aria-label={t('email')}
          onInput={(event) => setEmail(event.currentTarget.value)}
          class="min-w-0 flex-1 rounded-theme border border-neutral-300 bg-transparent px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={state === 'sending'}
          class="rounded-theme bg-primary px-4 py-2 text-sm font-medium text-primary-fg disabled:opacity-50"
        >
          {t('notifyMe')}
        </button>
      </div>
      {state === 'error' || state === 'tooMany' ? (
        <p class="text-sm text-red-600" role="alert">
          {state === 'tooMany' ? t('tooMany') : t('sendError')}
        </p>
      ) : null}
    </form>
  );
}
