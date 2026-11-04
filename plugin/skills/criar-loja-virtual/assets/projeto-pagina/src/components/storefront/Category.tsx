import { href } from '@bigbang/page-kit/router';
import { ProductList } from './ProductList';
import type { Shop } from './shop';
import { NotFound } from './states';

export function Category({ shop, slug }: { shop: Shop; slug: string }) {
  const category = shop.view.categories.find((item) => item.slug === slug);
  if (!category) return <NotFound t={shop.t} />;
  const children = shop.view.categories.filter(
    (item) => item.parentSlug === category.slug,
  );
  return (
    <div class="space-y-6">
      <header class="space-y-1">
        <h1 class="font-heading text-2xl font-bold tracking-tight">
          {category.name}
        </h1>
        {category.description ? (
          <p class="text-muted">{category.description}</p>
        ) : null}
      </header>
      {children.length > 0 ? (
        <ul class="flex flex-wrap gap-2">
          {children.map((child) => (
            <li key={child.categoryId}>
              <a
                class="block rounded-full border border-neutral-300 px-4 py-1.5 text-sm hover:border-neutral-900"
                href={href(`/categoria/${encodeURIComponent(child.slug)}`)}
              >
                {child.name}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      <ProductList shop={shop} category={category.slug} />
    </div>
  );
}
