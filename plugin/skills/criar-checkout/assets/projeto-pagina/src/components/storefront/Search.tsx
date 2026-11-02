import { ProductList } from './ProductList';
import type { Shop } from './shop';

export function Search({ shop, query }: { shop: Shop; query: string }) {
  return (
    <div class="space-y-6">
      <h1 class="text-2xl font-bold tracking-tight">
        {query ? shop.t('searchResults', { q: query }) : shop.t('search')}
      </h1>
      <ProductList shop={shop} q={query} />
    </div>
  );
}
