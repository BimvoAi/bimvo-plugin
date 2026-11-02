import { useEffect, useState } from 'preact/hooks';
import { href } from '@bigbang/page-kit/router';
import { loadProducts } from '@bigbang/page-kit/storefront';
import type { StorefrontProduct } from '@bigbang/page-kit/storefront';
import { ProductPhoto } from './ProductPhoto';
import { productPath, type Shop } from './shop';
import { Loading, Retry } from './states';

/** Grade de produtos da API, com "ver mais" pelo cursor. Nada de catálogo no código. */
export function ProductList({
  shop,
  q,
  category,
}: {
  shop: Shop;
  q?: string;
  category?: string;
}) {
  const { config, view, t } = shop;
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [attempt, setAttempt] = useState(0);

  const load = (after?: string) =>
    loadProducts(config, {
      locale: view.locale,
      currency: view.currency,
      q: q || undefined,
      category: category || undefined,
      cursor: after,
    });

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    load()
      .then((page) => {
        if (cancelled) return;
        setProducts(page.products);
        setCursor(page.nextCursor);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [config, view.locale, view.currency, q, category, attempt]);

  async function more() {
    if (!cursor) return;
    try {
      const page = await load(cursor);
      setProducts((current) => [...current, ...page.products]);
      setCursor(page.nextCursor);
    } catch {
      setStatus('error');
    }
  }

  if (status === 'loading') return <Loading t={t} />;
  if (status === 'error') {
    return <Retry t={t} onRetry={() => setAttempt((n) => n + 1)} />;
  }
  if (products.length === 0) {
    return <p class="text-neutral-600">{t('empty')}</p>;
  }
  return (
    <div class="space-y-6">
      <ul class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <li key={product.productId}>
            <ProductCard shop={shop} product={product} />
          </li>
        ))}
      </ul>
      {cursor ? (
        <button
          type="button"
          class="rounded-lg border border-neutral-300 px-4 py-2 text-sm"
          onClick={() => void more()}
        >
          {t('loadMore')}
        </button>
      ) : null}
    </div>
  );
}

function ProductCard({
  shop,
  product,
}: {
  shop: Shop;
  product: StorefrontProduct;
}) {
  const { t, money } = shop;
  const [image] = product.imageUrls;
  return (
    <a href={href(productPath(product))} class="group block space-y-2">
      <ProductPhoto
        src={image}
        alt=""
        loading="lazy"
        className="aspect-square w-full rounded-xl object-cover"
      />
      <span class="block font-medium group-hover:underline">
        {product.name}
      </span>
      <span class="flex flex-wrap items-baseline gap-2 text-sm">
        {product.price === null ? (
          <span class="text-neutral-500">{t('unavailable')}</span>
        ) : (
          <>
            <span class="font-semibold">{money(product.price)}</span>
            {product.compareAtPrice !== null ? (
              <s class="text-neutral-500">{money(product.compareAtPrice)}</s>
            ) : null}
          </>
        )}
        {product.price !== null && !product.purchasable ? (
          <span class="rounded bg-neutral-200 px-1.5 text-xs">
            {t('soldOut')}
          </span>
        ) : null}
      </span>
    </a>
  );
}
