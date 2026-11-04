import { useEffect, useState } from 'preact/hooks';
import { SlidersHorizontal, X } from 'lucide-preact';
import {
  loadProducts,
  parseStoreMoney,
  type CatalogFacets,
  type ProductQuery,
  type StorefrontProduct,
  type StorefrontSort,
} from '@bigbang/page-kit/storefront';
import type { CopyKey } from './copy';
import { ProductCard } from './ProductCard';
import type { Shop } from './shop';
import { Loading, Retry } from './states';

const SORTS: { value: StorefrontSort; label: CopyKey }[] = [
  { value: 'featured', label: 'sortFeatured' },
  { value: 'newest', label: 'sortNewest' },
  { value: 'bestsellers', label: 'sortBestsellers' },
  { value: 'price_asc', label: 'sortPriceAsc' },
  { value: 'price_desc', label: 'sortPriceDesc' },
  { value: 'name_asc', label: 'sortName' },
];

interface Filters {
  sort: StorefrontSort;
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  /** `<nome>:<valor>`. */
  options: string[];
}

const NO_FILTERS: Filters = { sort: 'featured', inStock: false, options: [] };

/**
 * Grade de produtos da API, com ordenação, filtros (preço, opções das variantes, em estoque) e
 * "ver mais" pelo cursor. Nada de catálogo no código; os filtros disponíveis vêm da API.
 */
export function ProductList({
  shop,
  q,
  category,
  collection,
  toolbar = true,
}: {
  shop: Shop;
  q?: string;
  category?: string;
  collection?: string;
  /** Mostra ordenação e filtros (a página inicial padrão esconde). */
  toolbar?: boolean;
}) {
  const { config, view, t } = shop;
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [facets, setFacets] = useState<CatalogFacets | null>(null);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Outra busca, categoria ou coleção começa sem filtros.
  useEffect(() => setFilters(NO_FILTERS), [q, category, collection]);

  const query = (after?: string): ProductQuery => ({
    locale: view.locale,
    currency: view.currency,
    q: q || undefined,
    category: category || undefined,
    collection: collection || undefined,
    cursor: after,
    sort: filters.sort === 'featured' ? undefined : filters.sort,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    inStock: filters.inStock || undefined,
    option: filters.options.length > 0 ? filters.options : undefined,
    facets: toolbar && !after ? true : undefined,
  });
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    loadProducts(config, query())
      .then((page) => {
        if (cancelled) return;
        setProducts(page.products);
        setCursor(page.nextCursor);
        if (page.facets) setFacets(page.facets);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [
    config,
    view.locale,
    view.currency,
    q,
    category,
    collection,
    filterKey,
    attempt,
  ]);

  async function more() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await loadProducts(config, query(cursor));
      setProducts((current) => [...current, ...page.products]);
      setCursor(page.nextCursor);
    } catch {
      setStatus('error');
    } finally {
      setLoadingMore(false);
    }
  }

  const filtered =
    filters.inStock ||
    filters.options.length > 0 ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined;

  return (
    <div class="space-y-6">
      {toolbar ? (
        <Toolbar
          shop={shop}
          facets={facets}
          filters={filters}
          onChange={setFilters}
        />
      ) : null}
      {status === 'loading' ? <Loading t={t} /> : null}
      {status === 'error' ? (
        <Retry t={t} onRetry={() => setAttempt((n) => n + 1)} />
      ) : null}
      {status === 'ready' && products.length === 0 ? (
        <div class="space-y-3 py-6">
          <p class="text-muted">{t('empty')}</p>
          {filtered ? (
            <button
              type="button"
              class="text-sm underline"
              onClick={() => setFilters({ ...NO_FILTERS, sort: filters.sort })}
            >
              {t('clearFilters')}
            </button>
          ) : null}
        </div>
      ) : null}
      {status === 'ready' && products.length > 0 ? (
        <>
          <ul class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <li key={product.productId}>
                <ProductCard shop={shop} product={product} />
              </li>
            ))}
          </ul>
          {cursor ? (
            <div class="flex justify-center">
              <button
                type="button"
                disabled={loadingMore}
                class="rounded-theme border border-neutral-300 px-6 py-2.5 text-sm font-medium transition hover:border-neutral-900 disabled:opacity-50"
                onClick={() => void more()}
              >
                {loadingMore ? t('loading') : t('loadMore')}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Toolbar({
  shop,
  facets,
  filters,
  onChange,
}: {
  shop: Shop;
  facets: CatalogFacets | null;
  filters: Filters;
  onChange: (filters: Filters) => void;
}) {
  const { t, view } = shop;
  const [open, setOpen] = useState(false);
  const decimals =
    view.currencies.find((item) => item.code === view.currency)?.decimals ?? 2;
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const active =
    filters.options.length +
    (filters.inStock ? 1 : 0) +
    (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0);

  function toggleOption(value: string) {
    onChange({
      ...filters,
      options: filters.options.includes(value)
        ? filters.options.filter((item) => item !== value)
        : [...filters.options, value],
    });
  }

  return (
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 border-y border-neutral-200 py-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          class="inline-flex items-center gap-2 text-sm font-medium"
        >
          <SlidersHorizontal class="size-4" aria-hidden="true" />
          {t('filters')}
          {active > 0 ? (
            <span class="rounded-full bg-primary px-1.5 text-xs text-primary-fg">
              {active}
            </span>
          ) : null}
        </button>
        <label class="flex items-center gap-2 text-sm">
          <span class="text-muted">{t('sortBy')}</span>
          <select
            value={filters.sort}
            onChange={(event) =>
              onChange({
                ...filters,
                sort: event.currentTarget.value as StorefrontSort,
              })
            }
            class="rounded-theme border border-neutral-300 bg-transparent px-2 py-1.5"
          >
            {SORTS.map((sort) => (
              <option key={sort.value} value={sort.value}>
                {t(sort.label)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {open ? (
        <div class="grid gap-6 rounded-theme border border-neutral-200 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <form
            class="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              onChange({
                ...filters,
                minPrice: parseStoreMoney(min, decimals) ?? undefined,
                maxPrice: parseStoreMoney(max, decimals) ?? undefined,
              });
            }}
          >
            <p class="text-sm font-medium">{t('price')}</p>
            {facets?.priceRange ? (
              <p class="text-xs text-muted">
                {shop.money(facets.priceRange.min)} –{' '}
                {shop.money(facets.priceRange.max)}
              </p>
            ) : null}
            <div class="flex items-center gap-2">
              <input
                inputMode="decimal"
                value={min}
                placeholder={t('minPrice')}
                aria-label={t('minPrice')}
                onInput={(event) => setMin(event.currentTarget.value)}
                class="w-full rounded-theme border border-neutral-300 bg-transparent px-2 py-1.5 text-sm"
              />
              <input
                inputMode="decimal"
                value={max}
                placeholder={t('maxPrice')}
                aria-label={t('maxPrice')}
                onInput={(event) => setMax(event.currentTarget.value)}
                class="w-full rounded-theme border border-neutral-300 bg-transparent px-2 py-1.5 text-sm"
              />
              <button
                type="submit"
                class="rounded-theme bg-primary px-3 py-1.5 text-sm text-primary-fg"
              >
                {t('apply')}
              </button>
            </div>
            <label class="flex items-center gap-2 pt-2 text-sm">
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={(event) =>
                  onChange({ ...filters, inStock: event.currentTarget.checked })
                }
              />
              {t('inStock')}
            </label>
          </form>
          {(facets?.options ?? []).map((option) => (
            <fieldset key={option.name} class="space-y-2">
              <legend class="text-sm font-medium">{option.name}</legend>
              <div class="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const key = `${option.name}:${value}`;
                  const selected = filters.options.includes(key);
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleOption(key)}
                      class={`rounded-full border px-3 py-1 text-sm ${
                        selected
                          ? 'border-primary bg-primary text-primary-fg'
                          : 'border-neutral-300'
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
          {active > 0 ? (
            <div class="sm:col-span-2 lg:col-span-3">
              <button
                type="button"
                class="inline-flex items-center gap-1 text-sm underline"
                onClick={() => {
                  setMin('');
                  setMax('');
                  onChange({ ...NO_FILTERS, sort: filters.sort });
                }}
              >
                <X class="size-4" aria-hidden="true" />
                {t('clearFilters')}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
