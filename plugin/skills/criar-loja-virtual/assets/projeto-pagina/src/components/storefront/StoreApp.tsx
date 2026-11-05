import { useEffect, useMemo, useState } from 'preact/hooks';
import type { PageConfig } from '@bigbang/page-kit/page';
import { useRoute } from '@bigbang/page-kit/router';
import { isStoreUnavailable } from '@bigbang/page-kit/page';
import { KitSlot } from '@bigbang/page-kit/slots';
import { loadStore, StorefrontApiError } from '@bigbang/page-kit/storefront';
import { formatStoreMoney } from '@bigbang/page-kit/storefront';
import type { StorefrontView } from '@bigbang/page-kit/storefront';
import { OrderStatus } from '../order/OrderStatus';
import { StoreUnavailable } from '../StoreUnavailable';
import { ThankYou } from '../order/ThankYou';
import { Account } from './Account';
import { CookieBanner, NewsletterPopup, WhatsAppButton } from './Capture';
import { Cart } from './Cart';
import { CartDrawer } from './CartDrawer';
import { Category } from './Category';
import { Collection } from './Collection';
import { ContentPage } from './ContentPage';
import { storeText } from './copy';
import { Footer } from './Footer';
import { AnnouncementBar, Header } from './Header';
import { Home } from './Home';
import { Policy } from './Policy';
import { Product } from './Product';
import { Search } from './Search';
import { checkoutLocale, type Shop } from './shop';
import { NotFound, Retry } from './states';
import { StoreCheckout } from './StoreCheckout';
import { applyTheme } from './theme';
import { useCart } from './useCart';
import { Wishlist } from './Wishlist';

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
 * contracts/page-routes.md. Nada de catálogo, preço ou política fica no código. Visual, menus,
 * página inicial e recursos vêm de `storefront` (specs/046) e mudam sem publicar de novo.
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
        applyTheme(view.storefront?.theme);
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
    if (
      view &&
      !['product', 'policy', 'storePolicy', 'page', 'collection'].includes(
        route.name,
      )
    ) {
      document.title = view.storefront?.seo.title ?? view.name;
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
    <div class="bb-store flex min-h-screen flex-col">
      <KitSlot place="store.header" view={view} />
      <AnnouncementBar shop={shop} />
      <Header shop={shop} query={query} onQuery={setQuery} onChoose={choose} />
      <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {route.name === 'home' ? <Home shop={shop} /> : null}
        {route.name === 'search' ? (
          <Search shop={shop} query={route.query} />
        ) : null}
        {route.name === 'category' ? (
          <Category shop={shop} slug={route.slug} />
        ) : null}
        {route.name === 'collection' ? (
          <Collection shop={shop} slug={route.slug} />
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
        {route.name === 'policy' || route.name === 'storePolicy' ? (
          <Policy shop={shop} kind={route.kind} />
        ) : null}
        {route.name === 'page' ? (
          <ContentPage shop={shop} slug={route.slug} />
        ) : null}
        {route.name === 'wishlist' ? <Wishlist shop={shop} /> : null}
        {route.name === 'lookup' || route.name === 'account' ? (
          <Account shop={shop} mode={route.name} />
        ) : null}
        {route.name === 'notFound' ? <NotFound t={t} /> : null}
      </main>
      <div class="mx-auto w-full max-w-6xl px-4">
        <Footer shop={shop} />
      </div>
      <CartDrawer shop={shop} />
      <NewsletterPopup shop={shop} />
      <WhatsAppButton shop={shop} />
      <CookieBanner shop={shop} />
    </div>
  );
}
