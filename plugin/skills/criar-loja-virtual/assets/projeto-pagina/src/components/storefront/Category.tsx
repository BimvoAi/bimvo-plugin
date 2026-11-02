import { ProductList } from './ProductList';
import type { Shop } from './shop';
import { NotFound } from './states';

export function Category({ shop, slug }: { shop: Shop; slug: string }) {
  const category = shop.view.categories.find((item) => item.slug === slug);
  if (!category) return <NotFound t={shop.t} />;
  return (
    <div class="space-y-6">
      <header class="space-y-1">
        <h1 class="text-2xl font-bold tracking-tight">{category.name}</h1>
        {category.description ? (
          <p class="text-neutral-600">{category.description}</p>
        ) : null}
      </header>
      <ProductList shop={shop} category={category.slug} />
    </div>
  );
}
