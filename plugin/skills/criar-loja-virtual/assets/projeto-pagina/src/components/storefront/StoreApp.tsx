import { useEffect, useMemo, useState } from 'preact/hooks';
import type { PageConfig } from '@bigbang/page-kit/page';
import { href, navigate, useRoute } from '@bigbang/page-kit/router';
import { isStoreUnavailable } from '@bigbang/page-kit/page';
import { loadStore, StorefrontApiError } from '@bigbang/page-kit/storefront';
import { formatStoreMoney } from '@bigbang/page-kit/storefront';
import type { StorefrontView } from '@bigbang/page-kit/storefront';
import { OrderStatus } from '../order/OrderStatus';
import { StoreUnavailable } from '../StoreUnavailable';
import { ThankYou } from '../order/ThankYou';
import { Cart } from './Cart';
import { Category } from './Category';
import { storeText } from './copy';
import { Footer } from './Footer';
import { Home } from './Home';
import { Policy } from './Policy';
import { Product } from './Product';
import { Search } from './Search';
import { checkoutLocale, type Shop } from './shop';
import { NotFound, Retry } from './states';
import { StoreCheckout } from './StoreCheckout';
import { useCart } from './useCart';

type Loaded =
  | { status: 'loading' }
  | { status: 'ready'; view: StorefrontView }
  | { status: 'unavailable' }
  | { status: 'blocked' }
  | { status: 'error' };

function choiceFromUrl() {
  const params = new URLSearchParams(location.search);
  return {
    locale: params.get('locale') ?? undefined,
    currency: params.get('currency') ?? undefined,
  };
}

/** Grava idioma ou moeda na query, para os links internos levarem a escolha junto. */
function writeChoice(name: 'locale' | 'currency', value: string | undefined) {
  const url = new URL(location.href);
  if (value) url.searchParams.set(name, value);
  else url.searchParams.delete(name);
  history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

/**
 * Loja virtual headless: lê a loja na API (idioma e moeda pela query) e monta as rotas de
 * contracts/page-routes.md. Nada de catálogo, preço ou política fica no código.
 */
export function StoreApp({ config }: { config: PageConfig }) {
  const route = useRoute();
  const cart = useCart(config.storeId);
  const [choice, setChoice] = useState(choiceFromUrl);
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState(
    route.name === 'search' ? route.query : '',
  );

  useEffect(() => {
    let cancelled = false;
    loadStore(config, choice.locale, choice.currency)
      .then((view) => {
        if (cancelled) return;
        setLoaded({ status: 'ready', view });
        document.documentElement.lang = view.locale;
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (isStoreUnavailable(error)) {
          setLoaded({ status: 'blocked' });
        } else if (
          error instanceof StorefrontApiError &&
          error.status === 404
        ) {
          setLoaded({ status: 'unavailable' });
        } else if (
          error instanceof StorefrontApiError &&
          error.status === 422 &&
          (choice.locale || choice.currency)
        ) {
          // Idioma ou moeda que a loja deixou de aceitar: volta aos padrões dela.
          writeChoice('locale', undefined);
          writeChoice('currency', undefined);
          setChoice({ locale: undefined, currency: undefined });
        } else {
          setLoaded({ status: 'error' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [config, choice, attempt]);

  const view = loaded.status === 'ready' ? loaded.view : null;
  const shop = useMemo<Shop | null>(() => {
    if (!view) return null;
    const decimals =
      view.currencies.find((item) => item.code === view.currency)?.decimals ??
      2;
    return {
      config,
      view,
      t: storeText(view.locale),
      money: (amount) =>
        amount === null
          ? ''
          : formatStoreMoney(amount, view.currency, decimals, view.locale),
      cart,
    };
  }, [config, view, cart]);

  useEffect(() => {
    if (view && route.name !== 'product' && route.name !== 'policy') {
      document.title = view.name;
    }
  }, [view, route]);

  const t = shop?.t ?? storeText(choice.locale ?? config.locale);
  if (loaded.status === 'loading') {
    return (
      <main class="mx-auto max-w-6xl px-4 py-10 text-neutral-600">
        {t('loading')}
      </main>
    );
  }
  if (loaded.status === 'blocked') {
    return <StoreUnavailable locale={choice.locale ?? config.locale} />;
  }
  if (loaded.status === 'unavailable') {
    return (
      <main class="mx-auto max-w-6xl px-4 py-20 text-center text-lg">
        {t('storeUnavailable')}
      </main>
    );
  }
  if (loaded.status === 'error' || !shop || !view) {
    return (
      <main class="mx-auto max-w-6xl px-4 py-10">
        <Retry t={t} onRetry={() => setAttempt((n) => n + 1)} />
      </main>
    );
  }

  const choose = (name: 'locale' | 'currency', value: string) => {
    writeChoice(name, value);
    setChoice((current) => ({ ...current, [name]: value }));
  };

  return (
    <div class="mx-auto flex min-h-screen max-w-6xl flex-col px-4">
      <header class="flex flex-wrap items-center gap-4 border-b border-neutral-200 py-5">
        <a
          href={href('/')}
          class="flex items-center gap-2 text-xl font-bold tracking-tight"
        >
          <img src="/brand/mark.svg" alt="" class="size-8" />
          {view.name}
        </a>
        <form
          class="order-last flex w-full gap-2 sm:order-none sm:w-auto sm:flex-1"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            navigate(href('/busca', { query: { q: query.trim() } }));
          }}
        >
          <input
            type="search"
            value={query}
            placeholder={t('searchPlaceholder')}
            aria-label={t('search')}
            onInput={(event) => setQuery(event.currentTarget.value)}
            class="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
          <button
            type="submit"
            class="rounded-lg bg-neutral-900 px-4 py-2 text-white"
          >
            {t('search')}
          </button>
        </form>
        <div class="ml-auto flex items-center gap-3 text-sm">
          {view.locales.length > 1 ? (
            <select
              aria-label={t('language')}
              value={view.locale}
              onChange={(event) => choose('locale', event.currentTarget.value)}
              class="rounded border border-neutral-300 px-2 py-1"
            >
              {view.locales.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          ) : null}
          {view.currencies.length > 1 ? (
            <select
              aria-label={t('currency')}
              value={view.currency}
              onChange={(event) =>
                choose('currency', event.currentTarget.value)
              }
              class="rounded border border-neutral-300 px-2 py-1"
            >
              {view.currencies.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code}
                </option>
              ))}
            </select>
          ) : null}
          <a href={href('/carrinho')} class="font-medium">
            {t('cart')} ({cart.count})
          </a>
        </div>
      </header>
      <main class="flex-1 py-8">
        {route.name === 'home' ? <Home shop={shop} /> : null}
        {route.name === 'search' ? (
          <Search shop={shop} query={route.query} />
        ) : null}
        {route.name === 'category' ? (
          <Category shop={shop} slug={route.slug} />
        ) : null}
        {route.name === 'product' ? (
          <Product shop={shop} productKey={route.key} />
        ) : null}
        {route.name === 'cart' ? <Cart shop={shop} /> : null}
        {route.name === 'checkout' ? <StoreCheckout shop={shop} /> : null}
        {route.name === 'order' ? (
          <OrderStatus
            config={{ ...config, locale: checkoutLocale(view.locale) }}
            orderId={route.orderId}
            orderToken={route.token}
          />
        ) : null}
        {route.name === 'thanks' ? (
          <ThankYou
            config={{ ...config, locale: checkoutLocale(view.locale) }}
            orderId={route.orderId}
            orderToken={route.token}
          />
        ) : null}
        {route.name === 'policy' ? (
          <Policy shop={shop} kind={route.kind} />
        ) : null}
        {route.name === 'notFound' ? <NotFound t={t} /> : null}
      </main>
      <Footer shop={shop} />
    </div>
  );
}
