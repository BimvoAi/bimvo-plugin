import { href } from '@bigbang/page-kit/router';
import { ProductList } from './ProductList';
import type { Shop } from './shop';

/** Início: texto da loja, categorias e produtos. Sem categoria, só os produtos. */
export function Home({ shop }: { shop: Shop }) {
  const { view, t } = shop;
  return (
    <div class="space-y-10">
      <section class="overflow-hidden rounded-2xl bg-neutral-950 bg-[url('/brand/banner.svg')] bg-cover bg-center px-6 py-12 text-white">
        <p class="text-2xl font-semibold tracking-tight">
          {view.tagline ?? view.name}
        </p>
      </section>
      {view.categories.length > 0 ? (
        <section class="space-y-3">
          <h2 class="text-lg font-semibold">{t('categories')}</h2>
          <ul class="flex flex-wrap gap-2">
            {view.categories.map((category) => (
              <li key={category.categoryId}>
                <a
                  class="block rounded-full border border-neutral-300 px-4 py-1.5 text-sm hover:border-neutral-900"
                  href={href(`/categoria/${encodeURIComponent(category.slug)}`)}
                >
                  {category.name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section class="space-y-3">
        <h2 class="text-lg font-semibold">{t('products')}</h2>
        <ProductList shop={shop} />
      </section>
    </div>
  );
}
