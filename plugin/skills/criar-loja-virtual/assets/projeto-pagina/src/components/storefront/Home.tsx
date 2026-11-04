import { href } from '@bigbang/page-kit/router';
import { HomeSections, RecentlyViewed } from './HomeSections';
import { TrustBadges } from './parts';
import { ProductList } from './ProductList';
import type { Shop } from './shop';

/**
 * Início. Com a página inicial montada no painel (`storefront.home`), desenha as seções na ordem
 * do lojista; sem ela, o layout padrão: texto da loja, categorias e produtos.
 */
export function Home({ shop }: { shop: Shop }) {
  const { view, t } = shop;
  const sections = view.storefront?.home?.sections;
  if (sections) return <HomeSections shop={shop} sections={sections} />;
  const categories = view.categories.filter((category) => !category.parentSlug);
  return (
    <div class="space-y-10">
      <section class="overflow-hidden rounded-theme bg-neutral-950 bg-[url('/brand/banner.svg')] bg-cover bg-center px-6 py-12 text-white">
        <p class="font-heading text-2xl font-semibold tracking-tight">
          {view.tagline ?? view.name}
        </p>
      </section>
      {categories.length > 0 ? (
        <section class="space-y-3">
          <h2 class="text-lg font-semibold">{t('categories')}</h2>
          <ul class="flex flex-wrap gap-2">
            {categories.map((category) => (
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
        <ProductList shop={shop} toolbar={false} />
      </section>
      {view.storefront && view.storefront.trustBadges.length > 0 ? (
        <section class="rounded-theme border border-neutral-200 p-6">
          <TrustBadges badges={view.storefront.trustBadges} />
        </section>
      ) : null}
      <RecentlyViewed shop={shop} title={t('recentlyViewed')} />
    </div>
  );
}
