import { useEffect, useState } from 'preact/hooks';
import { href } from '@bigbang/page-kit/router';
import {
  loadProductsByKeys,
  useWishlist,
  type StorefrontProduct,
} from '@bigbang/page-kit/storefront';
import { ProductRow } from './HomeSections';
import type { Shop } from './shop';
import { Loading, Retry } from './states';

/** Favoritos (`/favoritos`): a lista fica no navegador; os produtos são lidos agora na API. */
export function Wishlist({ shop }: { shop: Shop }) {
  const { config, view, t } = shop;
  const wishlist = useWishlist(view.storeId);
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'ready'; products: StorefrontProduct[] }
    | { status: 'error' }
  >({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const keys = wishlist.items.join(',');

  useEffect(() => {
    let cancelled = false;
    if (wishlist.items.length === 0) {
      setState({ status: 'ready', products: [] });
      return;
    }
    loadProductsByKeys(config, wishlist.items, view.locale, view.currency)
      .then((products) => {
        if (!cancelled) setState({ status: 'ready', products });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [config, keys, view.locale, view.currency, attempt]);

  return (
    <div class="space-y-6">
      <h1 class="font-heading text-2xl font-bold tracking-tight">
        {t('wishlist')}
      </h1>
      {state.status === 'loading' ? <Loading t={t} /> : null}
      {state.status === 'error' ? (
        <Retry t={t} onRetry={() => setAttempt((n) => n + 1)} />
      ) : null}
      {state.status === 'ready' && state.products.length === 0 ? (
        <div class="space-y-3 py-10 text-center">
          <p class="text-lg">{t('wishlistEmpty')}</p>
          <a class="underline" href={href('/')}>
            {t('continueShopping')}
          </a>
        </div>
      ) : null}
      {state.status === 'ready' && state.products.length > 0 ? (
        <ProductRow shop={shop} products={state.products} />
      ) : null}
    </div>
  );
}
