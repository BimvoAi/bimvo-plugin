import { useEffect, useState } from 'preact/hooks';
import { Ruler, Truck, X } from 'lucide-preact';
import {
  estimateShipping,
  installmentPreview,
  interestFreePreview,
  loadRelated,
  pixDiscountPercent,
  pixPrice,
  promotionFor,
  StorefrontApiError,
  type ShippingEstimate as Estimate,
  type StorefrontProduct,
  type StorefrontVariant,
} from '@bigbang/page-kit/storefront';
import { RichText, useStorePage } from './ContentPage';
import { ProductRow } from './HomeSections';
import { SectionTitle } from './parts';
import { promotionText, type Shop } from './shop';

/** "em até 12x de R$ X" (e "até 6x sem juros" quando há juros acima disso). */
export function InstallmentsBlock({
  shop,
  price,
}: {
  shop: Shop;
  price: number | null;
}) {
  const { t, money, view } = shop;
  const best = installmentPreview(price, view.paymentPreview);
  if (!best) return null;
  const free = best.interestFree
    ? null
    : interestFreePreview(price, view.paymentPreview);
  return (
    <p class="text-sm text-muted">
      {t('upTo', { count: best.count, amount: money(best.amount) })}
      {best.interestFree ? ` ${t('interestFree')}` : ''}
      {free ? (
        <span class="block">
          {t('installments', { count: free.count, amount: money(free.amount) })}{' '}
          {t('interestFree')}
        </span>
      ) : null}
    </p>
  );
}

export function PixBlock({
  shop,
  price,
}: {
  shop: Shop;
  price: number | null;
}) {
  const { t, money, view } = shop;
  const amount = pixPrice(price, view.paymentPreview);
  const percent = pixDiscountPercent(view.paymentPreview);
  if (amount === null) return null;
  return (
    <p class="text-sm">
      <span class="font-semibold text-accent">
        {t('pixPrice', { amount: money(amount) })}
      </span>
      {percent !== null ? (
        <span class="text-muted"> · {t('pixSaving', { percent })}</span>
      ) : null}
    </p>
  );
}

export function PromotionBlock({
  shop,
  product,
}: {
  shop: Shop;
  product: StorefrontProduct;
}) {
  const promotion = promotionFor(product, shop.view.promotions);
  if (!promotion) return null;
  const detail = promotionText(promotion, shop.t, shop.money);
  return (
    <p class="inline-flex flex-wrap items-center gap-2 rounded-theme border border-dashed border-accent px-3 py-2 text-sm">
      <span class="font-semibold text-accent">{promotion.title}</span>
      {detail !== promotion.title ? (
        <span class="text-muted">{detail}</span>
      ) : null}
    </p>
  );
}

/** Frete estimado pelo CEP, com o mesmo cálculo do checkout. */
export function ShippingEstimateBlock({
  shop,
  product,
  variant,
  quantity,
}: {
  shop: Shop;
  product: StorefrontProduct;
  variant: StorefrontVariant | null;
  quantity: number;
}) {
  const { t, money, config, view } = shop;
  const [postalCode, setPostalCode] = useState('');
  const [state, setState] = useState<
    | { status: 'idle' | 'loading' }
    | { status: 'ready'; estimate: Estimate }
    | { status: 'error'; message: string }
  >({ status: 'idle' });

  if (!product.isPhysical) return null;
  return (
    <div class="space-y-3 rounded-theme border border-neutral-200 p-4">
      <p class="flex items-center gap-2 text-sm font-medium">
        <Truck class="size-4" aria-hidden="true" />
        {t('shippingTitle')}
      </p>
      <form
        class="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const code = postalCode.trim();
          if (code.length < 3) return;
          setState({ status: 'loading' });
          estimateShipping(config, {
            postalCode: code,
            currency: view.currency,
            items: [
              {
                productId: product.productId,
                ...(variant ? { variantId: variant.variantId } : {}),
                quantity,
              },
            ],
          })
            .then((estimate) => setState({ status: 'ready', estimate }))
            .catch((error: unknown) =>
              setState({
                status: 'error',
                message:
                  error instanceof StorefrontApiError && error.status === 429
                    ? t('tooMany')
                    : t('loadError'),
              }),
            );
        }}
      >
        <input
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={16}
          value={postalCode}
          placeholder={t('postalCode')}
          aria-label={t('postalCode')}
          onInput={(event) => setPostalCode(event.currentTarget.value)}
          class="min-w-0 flex-1 rounded-theme border border-neutral-300 bg-transparent px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={state.status === 'loading'}
          class="rounded-theme border border-neutral-900 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {state.status === 'loading' ? t('loading') : t('calculate')}
        </button>
      </form>
      {state.status === 'error' ? (
        <p class="text-sm text-red-600">{state.message}</p>
      ) : null}
      {state.status === 'ready' ? (
        state.estimate.options.length === 0 ? (
          <p class="text-sm text-muted">{t('shippingNone')}</p>
        ) : (
          <ul class="divide-y divide-neutral-100 text-sm">
            {state.estimate.options.map((option, index) => (
              <li key={index} class="flex justify-between gap-3 py-2">
                <span>
                  <span class="block font-medium">
                    {option.carrier ? `${option.carrier} · ` : ''}
                    {option.name}
                  </span>
                  <span class="text-muted">
                    {option.minDays === option.maxDays || option.minDays === 0
                      ? t('shippingSameDay', { max: option.maxDays })
                      : t('shippingDays', {
                          min: option.minDays,
                          max: option.maxDays,
                        })}
                  </span>
                </span>
                <span
                  class={
                    option.free ? 'font-semibold text-accent' : 'tabular-nums'
                  }
                >
                  {option.free ? t('free') : money(option.price)}
                </span>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}

export function AttributesBlock({
  shop,
  product,
}: {
  shop: Shop;
  product: StorefrontProduct;
}) {
  const attributes = product.attributes ?? [];
  if (attributes.length === 0) return null;
  return (
    <div class="space-y-2">
      <p class="text-sm font-medium">{shop.t('attributes')}</p>
      <dl class="divide-y divide-neutral-100 rounded-theme border border-neutral-200 text-sm">
        {attributes.map((attribute, index) => (
          <div key={index} class="grid grid-cols-[40%_1fr] gap-3 px-3 py-2">
            <dt class="text-muted">{attribute.name}</dt>
            <dd>{attribute.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Botão do guia de medidas: abre a página de conteúdo indicada no produto numa janela. */
export function SizeGuideBlock({
  shop,
  slug,
}: {
  shop: Shop;
  slug: string | null | undefined;
}) {
  const [open, setOpen] = useState(false);
  if (!slug) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        class="inline-flex items-center gap-2 text-sm font-medium underline"
      >
        <Ruler class="size-4" aria-hidden="true" />
        {shop.t('sizeGuide')}
      </button>
      {open ? (
        <SizeGuideDialog
          shop={shop}
          slug={slug}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function SizeGuideDialog({
  shop,
  slug,
  onClose,
}: {
  shop: Shop;
  slug: string;
  onClose: () => void;
}) {
  const page = useStorePage(shop, slug);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={shop.t('sizeGuide')}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div class="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-theme bg-white p-6 text-neutral-900">
        <button
          type="button"
          aria-label={shop.t('close')}
          onClick={onClose}
          class="absolute right-3 top-3 rounded-full p-1 hover:bg-neutral-100"
        >
          <X class="size-5" aria-hidden="true" />
        </button>
        {page === 'loading' ? <p>{shop.t('loading')}</p> : null}
        {page === 'missing' || page === 'error' ? (
          <p>{shop.t('notFound')}</p>
        ) : null}
        {typeof page === 'object' ? (
          <div class="space-y-4">
            <h2 class="pr-8 font-heading text-2xl font-semibold">
              {page.title}
            </h2>
            <RichText body={page.body} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Mesma categoria ou marcadores em comum. Some sem relacionados. */
export function RelatedBlock({
  shop,
  product,
}: {
  shop: Shop;
  product: StorefrontProduct;
}) {
  const { config, view, t } = shop;
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const key = product.slug ?? product.productId;
  useEffect(() => {
    let cancelled = false;
    loadRelated(config, key, {
      locale: view.locale,
      currency: view.currency,
      limit: 8,
    })
      .then((page) => {
        if (!cancelled) setProducts(page.products);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [config, key, view.locale, view.currency]);
  if (products.length === 0) return null;
  return (
    <section>
      <SectionTitle>{t('related')}</SectionTitle>
      <ProductRow shop={shop} products={products} carousel />
    </section>
  );
}
