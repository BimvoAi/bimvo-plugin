import { useEffect, useState } from 'preact/hooks';
import {
  ChevronDown,
  Heart,
  Menu,
  Search as SearchIcon,
  ShoppingBag,
  User,
  X,
} from 'lucide-preact';
import { href, navigate } from '@bigbang/page-kit/router';
import {
  useCartDrawer,
  useWishlist,
  type StorefrontMenuItem,
} from '@bigbang/page-kit/storefront';
import { features, linkProps, type Shop } from './shop';

/** Barra de anúncio no topo: as frases da loja, uma por vez. */
export function AnnouncementBar({ shop }: { shop: Shop }) {
  const items = shop.view.storefront?.announcement?.items ?? [];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % items.length),
      5000,
    );
    return () => clearInterval(timer);
  }, [items.length]);
  const item = items[index % Math.max(items.length, 1)];
  if (!item) return null;
  return (
    <div class="bg-primary px-4 py-2 text-center text-xs font-medium tracking-wide text-primary-fg sm:text-sm">
      {item.link ? (
        <a {...linkProps(item.link)} class="hover:underline">
          {item.text}
        </a>
      ) : (
        <span>{item.text}</span>
      )}
    </div>
  );
}

/** Itens do menu: o do painel ou, sem ele, as categorias de primeiro nível. */
function menuItems(shop: Shop): StorefrontMenuItem[] {
  const configured = shop.view.storefront?.menus.header ?? [];
  if (configured.length > 0) return configured;
  const top = shop.view.categories.filter((category) => !category.parentSlug);
  return top.map((category) => ({
    label: category.name,
    link: {
      href: `/categoria/${encodeURIComponent(category.slug)}`,
      external: false,
    },
    children: shop.view.categories
      .filter((child) => child.parentSlug === category.slug)
      .map((child) => ({
        label: child.name,
        link: {
          href: `/categoria/${encodeURIComponent(child.slug)}`,
          external: false,
        },
      })),
  }));
}

/**
 * Cabeçalho da loja: logo do tema, menu com submenu, busca, idioma/moeda, conta, favoritos e o
 * carrinho em gaveta.
 */
export function Header({
  shop,
  query,
  onQuery,
  onChoose,
}: {
  shop: Shop;
  query: string;
  onQuery: (query: string) => void;
  onChoose: (name: 'locale' | 'currency', value: string) => void;
}) {
  const { view, t, cart } = shop;
  const drawer = useCartDrawer();
  const wishlist = useWishlist(view.storeId);
  const enabled = features(view);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const items = menuItems(shop);
  const logo = view.storefront?.theme.logoUrl ?? null;

  useEffect(() => {
    const close = () => {
      setMenuOpen(false);
      setSearchOpen(false);
    };
    addEventListener('popstate', close);
    return () => removeEventListener('popstate', close);
  }, []);

  const search = (
    <form
      class="flex w-full gap-2"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        setSearchOpen(false);
        navigate(href('/busca', { query: { q: query.trim() } }));
      }}
    >
      <input
        type="search"
        value={query}
        placeholder={t('searchPlaceholder')}
        aria-label={t('search')}
        onInput={(event) => onQuery(event.currentTarget.value)}
        class="w-full rounded-theme border border-neutral-300 bg-transparent px-3 py-2 text-sm"
      />
      <button
        type="submit"
        aria-label={t('search')}
        class="rounded-theme bg-primary px-3 py-2 text-primary-fg"
      >
        <SearchIcon class="size-4" aria-hidden="true" />
      </button>
    </form>
  );

  const iconButton =
    'relative flex size-10 items-center justify-center rounded-full hover:bg-black/5';

  return (
    <header class="sticky top-0 z-30 border-b border-neutral-200 bg-page/95 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <button
          type="button"
          class={`${iconButton} lg:hidden`}
          aria-label={t('menu')}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <Menu class="size-5" aria-hidden="true" />
        </button>
        <a
          href={href('/')}
          class="flex min-w-0 items-center gap-2 font-heading text-xl font-bold tracking-tight"
        >
          {logo ? (
            <img
              src={logo}
              alt={view.name}
              class="h-9 w-auto max-w-[160px] object-contain sm:h-10"
            />
          ) : (
            <>
              <img src="/brand/mark.svg" alt="" class="size-8" />
              <span class="truncate">{view.name}</span>
            </>
          )}
        </a>
        <nav class="ml-6 hidden flex-1 lg:block" aria-label={t('menu')}>
          <ul class="flex flex-wrap items-center gap-1">
            {items.map((item, index) => (
              <li key={index} class="group relative">
                <a
                  {...linkProps(item.link)}
                  class="flex items-center gap-1 rounded-theme px-3 py-2 text-sm font-medium hover:bg-black/5"
                >
                  {item.label}
                  {item.children.length > 0 ? (
                    <ChevronDown class="size-3.5" aria-hidden="true" />
                  ) : null}
                </a>
                {item.children.length > 0 ? (
                  <ul class="invisible absolute left-0 top-full z-40 min-w-52 rounded-theme border border-neutral-200 bg-white py-2 text-neutral-900 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    {item.children.map((child, childIndex) => (
                      <li key={childIndex}>
                        <a
                          {...linkProps(child.link)}
                          class="block px-4 py-2 text-sm hover:bg-neutral-100"
                        >
                          {child.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>
        <div class="ml-auto flex items-center gap-1">
          <div class="mr-2 hidden lg:block">
            <LocaleCurrency shop={shop} onChoose={onChoose} />
          </div>
          <div class="hidden w-56 xl:block">{search}</div>
          <button
            type="button"
            class={`${iconButton} xl:hidden`}
            aria-label={t('search')}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((value) => !value)}
          >
            <SearchIcon class="size-5" aria-hidden="true" />
          </button>
          <a
            href={href('/conta')}
            class={`${iconButton} hidden sm:flex`}
            aria-label={t('account')}
          >
            <User class="size-5" aria-hidden="true" />
          </a>
          {enabled.wishlist ? (
            <a
              href={href('/favoritos')}
              class={iconButton}
              aria-label={t('wishlist')}
            >
              <Heart class="size-5" aria-hidden="true" />
              {wishlist.count > 0 ? (
                <span class="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] font-semibold leading-4 text-primary-fg">
                  {wishlist.count}
                </span>
              ) : null}
            </a>
          ) : null}
          <button
            type="button"
            class={iconButton}
            aria-label={`${t('cart')} (${cart.count})`}
            onClick={drawer.show}
          >
            <ShoppingBag class="size-5" aria-hidden="true" />
            {cart.count > 0 ? (
              <span class="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] font-semibold leading-4 text-primary-fg">
                {cart.count}
              </span>
            ) : null}
          </button>
        </div>
      </div>
      {searchOpen ? (
        <div class="mx-auto max-w-6xl px-4 pb-3 xl:hidden">{search}</div>
      ) : null}
      {menuOpen ? (
        <MobileMenu
          shop={shop}
          items={items}
          onClose={() => setMenuOpen(false)}
          onChoose={onChoose}
        />
      ) : null}
    </header>
  );
}

function MobileMenu({
  shop,
  items,
  onClose,
  onChoose,
}: {
  shop: Shop;
  items: StorefrontMenuItem[];
  onClose: () => void;
  onChoose: (name: 'locale' | 'currency', value: string) => void;
}) {
  const { t } = shop;
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div
      class="fixed inset-0 z-50 bg-black/40 lg:hidden"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <nav
        aria-label={t('menu')}
        class="flex h-full w-80 max-w-[85vw] flex-col overflow-y-auto bg-white text-neutral-900 shadow-xl"
      >
        <div class="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <span class="font-heading font-semibold">{t('menu')}</span>
          <button
            type="button"
            aria-label={t('close')}
            onClick={onClose}
            class="rounded-full p-1 hover:bg-neutral-100"
          >
            <X class="size-5" aria-hidden="true" />
          </button>
        </div>
        <ul class="flex-1 divide-y divide-neutral-100">
          {items.map((item, index) => (
            <li key={index}>
              <div class="flex items-center">
                <a
                  {...linkProps(item.link)}
                  onClick={onClose}
                  class="flex-1 px-4 py-3 font-medium"
                >
                  {item.label}
                </a>
                {item.children.length > 0 ? (
                  <button
                    type="button"
                    aria-expanded={open === index}
                    aria-label={item.label}
                    onClick={() => setOpen(open === index ? null : index)}
                    class="px-4 py-3"
                  >
                    <ChevronDown
                      class={`size-4 transition ${open === index ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                ) : null}
              </div>
              {open === index ? (
                <ul class="bg-neutral-50 pb-2">
                  {item.children.map((child, childIndex) => (
                    <li key={childIndex}>
                      <a
                        {...linkProps(child.link)}
                        onClick={onClose}
                        class="block px-8 py-2 text-sm"
                      >
                        {child.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
          <li>
            <a href={href('/conta')} onClick={onClose} class="block px-4 py-3">
              {t('account')}
            </a>
          </li>
          <li>
            <a
              href={href('/rastreio')}
              onClick={onClose}
              class="block px-4 py-3"
            >
              {t('lookupTitle')}
            </a>
          </li>
        </ul>
        <LocaleCurrency
          shop={shop}
          onChoose={onChoose}
          class="border-t border-neutral-200 p-4"
        />
      </nav>
    </div>
  );
}

/** Seletores de idioma e moeda (só aparecem com mais de uma opção). */
export function LocaleCurrency({
  shop,
  onChoose,
  class: className = '',
}: {
  shop: Shop;
  onChoose: (name: 'locale' | 'currency', value: string) => void;
  class?: string;
}) {
  const { view, t } = shop;
  if (view.locales.length < 2 && view.currencies.length < 2) return null;
  return (
    <div class={`flex flex-wrap items-center gap-2 text-sm ${className}`}>
      {view.locales.length > 1 ? (
        <select
          aria-label={t('language')}
          value={view.locale}
          onChange={(event) => onChoose('locale', event.currentTarget.value)}
          class="rounded-theme border border-neutral-300 bg-transparent px-2 py-1"
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
          onChange={(event) => onChoose('currency', event.currentTarget.value)}
          class="rounded-theme border border-neutral-300 bg-transparent px-2 py-1"
        >
          {view.currencies.map((item) => (
            <option key={item.code} value={item.code}>
              {item.code}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
