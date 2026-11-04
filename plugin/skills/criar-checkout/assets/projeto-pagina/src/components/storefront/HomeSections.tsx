import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { ChevronLeft, ChevronRight } from 'lucide-preact';
import { href } from '@bigbang/page-kit/router';
import {
  KitSection,
  useRecentlyViewedProducts,
  useSectionProducts,
  type BannerSection,
  type CategoriesSection,
  type HeroSection,
  type HomeSection,
  type ImageGridSection,
  type ProductSource,
  type ProductTabsSection,
  type StorefrontLink,
  type StorefrontProduct,
  type TestimonialsSection,
} from '@bigbang/page-kit/storefront';
import { NewsletterForm } from './Capture';
import { SectionTitle, Stars, TrustBadges } from './parts';
import { ProductCard } from './ProductCard';
import { features, linkProps, promotionText, type Shop } from './shop';

/**
 * Página inicial montada pelo lojista (`storefront.home.sections`), na ordem dele. Tipo que esta
 * página não desenha vai para `<KitSection>` do kit (visual neutro); o que nem o kit conhece some.
 */
export function HomeSections({
  shop,
  sections,
}: {
  shop: Shop;
  sections: HomeSection[];
}) {
  return (
    <div class="space-y-12 sm:space-y-16">
      {sections.map((section) => (
        <HomeSectionView key={section.id} shop={shop} section={section} />
      ))}
    </div>
  );
}

function HomeSectionView({
  shop,
  section,
}: {
  shop: Shop;
  section: HomeSection;
}) {
  switch (section.type) {
    case 'hero':
      return <Hero shop={shop} section={section} />;
    case 'categories':
      return <Categories shop={shop} section={section} />;
    case 'products':
      return (
        <ProductsBlock
          shop={shop}
          title={section.settings.title}
          source={section.settings.source}
          limit={section.settings.limit}
          carousel={section.settings.style === 'carousel'}
        />
      );
    case 'product-tabs':
      return <ProductTabs shop={shop} section={section} />;
    case 'banner':
      return <Banner section={section} />;
    case 'image-grid':
      return <ImageGrid section={section} />;
    case 'text':
      return (
        <section
          class={`mx-auto max-w-3xl space-y-3 ${section.settings.align === 'center' ? 'text-center' : ''}`}
        >
          {section.settings.title ? (
            <SectionTitle>{section.settings.title}</SectionTitle>
          ) : null}
          <p class="whitespace-pre-line leading-relaxed text-muted">
            {section.settings.text}
          </p>
        </section>
      );
    case 'text-strip':
      return (
        <MaybeLink
          link={section.settings.link}
          class="-mx-4 block bg-primary px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide text-primary-fg"
        >
          {section.settings.text}
        </MaybeLink>
      );
    case 'testimonials':
      return <Testimonials shop={shop} section={section} />;
    case 'trust-badges':
      return (
        <section class="rounded-theme border border-neutral-200 p-6">
          <TrustBadges badges={shop.view.storefront?.trustBadges ?? []} />
        </section>
      );
    case 'newsletter':
      return (
        <section class="-mx-4 bg-primary px-4 py-10 text-primary-fg">
          <div class="mx-auto max-w-xl space-y-3 text-center">
            <h2 class="font-heading text-2xl font-semibold">
              {section.settings.title ?? shop.t('newsletterTitle')}
            </h2>
            {section.settings.text ? (
              <p class="opacity-80">{section.settings.text}</p>
            ) : null}
            <div class="text-left">
              <NewsletterForm shop={shop} source="section" dark />
            </div>
          </div>
        </section>
      );
    case 'recently-viewed':
      return (
        <RecentlyViewed
          shop={shop}
          title={section.settings.title ?? shop.t('recentlyViewed')}
        />
      );
    case 'promotions':
      return <Promotions shop={shop} title={section.settings.title} />;
    default:
      // featured-reviews e tipos novos: renderização neutra do kit.
      return <KitSection section={section} shop={shop} />;
  }
}

function MaybeLink({
  link,
  class: className,
  children,
}: {
  link: StorefrontLink | null;
  class?: string;
  children: ComponentChildren;
}) {
  if (!link) return <div class={className}>{children}</div>;
  return (
    <a {...linkProps(link)} class={className}>
      {children}
    </a>
  );
}

function Picture({
  imageUrl,
  mobileImageUrl,
  alt,
  class: className,
  eager,
}: {
  imageUrl: string;
  mobileImageUrl: string | null;
  alt: string;
  class: string;
  eager?: boolean;
}) {
  return (
    <picture>
      {mobileImageUrl ? (
        <source media="(max-width: 640px)" srcset={mobileImageUrl} />
      ) : null}
      <img
        src={imageUrl}
        alt={alt}
        loading={eager ? undefined : 'lazy'}
        class={className}
      />
    </picture>
  );
}

function Hero({ shop, section }: { shop: Shop; section: HeroSection }) {
  const { slides, autoplaySeconds } = section.settings;
  const [index, setIndex] = useState(0);
  const count = slides.length;
  useEffect(() => {
    if (!autoplaySeconds || count < 2) return;
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % count),
      autoplaySeconds * 1000,
    );
    return () => clearInterval(timer);
  }, [autoplaySeconds, count]);
  if (count === 0) return null;
  const slide = slides[index % count] ?? slides[0];
  if (!slide) return null;
  return (
    <section class="relative -mx-4 overflow-hidden sm:mx-0 sm:rounded-theme">
      <MaybeLink link={slide.link} class="relative block">
        <Picture
          imageUrl={slide.imageUrl}
          mobileImageUrl={slide.mobileImageUrl}
          alt={slide.title ?? ''}
          class="h-auto max-h-[70vh] w-full object-cover"
          eager
        />
        {slide.title || slide.text || slide.ctaLabel ? (
          <span class="absolute inset-0 flex flex-col items-start justify-end gap-3 bg-gradient-to-t from-black/60 via-black/10 to-transparent p-6 text-white sm:p-10">
            {slide.title ? (
              <span class="font-heading text-3xl font-bold tracking-tight sm:text-5xl">
                {slide.title}
              </span>
            ) : null}
            {slide.text ? (
              <span class="max-w-xl text-base sm:text-lg">{slide.text}</span>
            ) : null}
            {slide.ctaLabel ? (
              <span class="rounded-theme bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900">
                {slide.ctaLabel}
              </span>
            ) : null}
          </span>
        ) : null}
      </MaybeLink>
      {count > 1 ? (
        <>
          <button
            type="button"
            aria-label={shop.t('previous')}
            onClick={() => setIndex((index - 1 + count) % count)}
            class="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-neutral-900 shadow sm:block"
          >
            <ChevronLeft class="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={shop.t('next')}
            onClick={() => setIndex((index + 1) % count)}
            class="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-neutral-900 shadow sm:block"
          >
            <ChevronRight class="size-5" aria-hidden="true" />
          </button>
          <span class="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {slides.map((_, dot) => (
              <button
                key={dot}
                type="button"
                aria-label={String(dot + 1)}
                aria-current={dot === index}
                onClick={() => setIndex(dot)}
                class={`size-2.5 rounded-full ${dot === index ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </span>
        </>
      ) : null}
    </section>
  );
}

function Categories({
  shop,
  section,
}: {
  shop: Shop;
  section: CategoriesSection;
}) {
  const wanted = section.settings.categorySlugs;
  const categories =
    wanted.length > 0
      ? wanted.flatMap((slug) => {
          const found = shop.view.categories.find((item) => item.slug === slug);
          return found ? [found] : [];
        })
      : shop.view.categories.filter((category) => !category.parentSlug);
  if (categories.length === 0) return null;
  const carousel = section.settings.style === 'carousel';
  return (
    <section>
      {section.settings.title ? (
        <SectionTitle>{section.settings.title}</SectionTitle>
      ) : null}
      <ul
        class={
          carousel
            ? 'bb-scroll-x -mx-4 flex snap-x gap-4 overflow-x-auto px-4'
            : 'grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6'
        }
      >
        {categories.map((category) => (
          <li
            key={category.categoryId}
            class={carousel ? 'w-24 shrink-0 snap-start sm:w-32' : ''}
          >
            <a
              href={href(`/categoria/${encodeURIComponent(category.slug)}`)}
              class="group block space-y-2 text-center"
            >
              <span class="block aspect-square overflow-hidden rounded-full bg-neutral-100">
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt=""
                    loading="lazy"
                    class="size-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <span class="flex size-full items-center justify-center font-heading text-2xl font-semibold text-muted">
                    {category.name.slice(0, 1)}
                  </span>
                )}
              </span>
              <span class="block text-sm font-medium group-hover:underline">
                {category.name}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Grade ou carrossel de cards. */
export function ProductRow({
  shop,
  products,
  carousel,
}: {
  shop: Shop;
  products: StorefrontProduct[];
  carousel?: boolean;
}) {
  if (carousel) {
    return (
      <ul class="bb-scroll-x -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
        {products.map((product) => (
          <li key={product.productId} class="w-40 shrink-0 snap-start sm:w-56">
            <ProductCard shop={shop} product={product} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <li key={product.productId}>
          <ProductCard shop={shop} product={product} />
        </li>
      ))}
    </ul>
  );
}

function seeAllHref(source: ProductSource): string | null {
  if (source.kind === 'category')
    return href(`/categoria/${encodeURIComponent(source.slug)}`);
  if (source.kind === 'collection')
    return href(`/colecao/${encodeURIComponent(source.slug)}`);
  return null;
}

function ProductsBlock({
  shop,
  title,
  source,
  limit,
  carousel,
}: {
  shop: Shop;
  title: string | null;
  source: ProductSource;
  limit: number;
  carousel: boolean;
}) {
  const { status, products } = useSectionProducts(shop, source, limit);
  if (status !== 'ready' || products.length === 0) return null;
  const all = seeAllHref(source);
  return (
    <section>
      <div class="flex items-baseline justify-between gap-4">
        {title ? <SectionTitle>{title}</SectionTitle> : <span />}
        {all ? (
          <a href={all} class="text-sm font-medium underline">
            {shop.t('seeAll')}
          </a>
        ) : null}
      </div>
      <ProductRow shop={shop} products={products} carousel={carousel} />
    </section>
  );
}

function ProductTabs({
  shop,
  section,
}: {
  shop: Shop;
  section: ProductTabsSection;
}) {
  const [active, setActive] = useState(0);
  const tab = section.settings.tabs[active];
  return (
    <section class="space-y-4">
      {section.settings.title ? (
        <SectionTitle>{section.settings.title}</SectionTitle>
      ) : null}
      <div role="tablist" class="flex flex-wrap justify-center gap-2">
        {section.settings.tabs.map((item, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={index === active}
            onClick={() => setActive(index)}
            class={`rounded-full border px-4 py-1.5 text-sm font-medium ${
              index === active
                ? 'border-primary bg-primary text-primary-fg'
                : 'border-neutral-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab ? (
        <ProductsBlock
          key={active}
          shop={shop}
          title={null}
          source={tab.source}
          limit={section.settings.limit}
          carousel={false}
        />
      ) : null}
    </section>
  );
}

function Banner({ section }: { section: BannerSection }) {
  return (
    <section class="overflow-hidden rounded-theme">
      <MaybeLink link={section.settings.link} class="block">
        <Picture
          imageUrl={section.settings.imageUrl}
          mobileImageUrl={section.settings.mobileImageUrl}
          alt={section.settings.alt ?? ''}
          class="h-auto w-full object-cover"
        />
      </MaybeLink>
    </section>
  );
}

function ImageGrid({ section }: { section: ImageGridSection }) {
  if (section.settings.items.length === 0) return null;
  return (
    <section>
      {section.settings.title ? (
        <SectionTitle>{section.settings.title}</SectionTitle>
      ) : null}
      <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {section.settings.items.map((item, index) => (
          <li key={index}>
            <MaybeLink
              link={item.link}
              class="group relative block overflow-hidden rounded-theme"
            >
              <img
                src={item.imageUrl}
                alt={item.caption ?? ''}
                loading="lazy"
                class="aspect-square w-full object-cover transition group-hover:scale-105"
              />
              {item.caption ? (
                <span class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-sm font-medium text-white">
                  {item.caption}
                </span>
              ) : null}
            </MaybeLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Testimonials({
  shop,
  section,
}: {
  shop: Shop;
  section: TestimonialsSection;
}) {
  if (section.settings.items.length === 0) return null;
  return (
    <section>
      {section.settings.title ? (
        <SectionTitle>{section.settings.title}</SectionTitle>
      ) : null}
      <ul class="bb-scroll-x -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
        {section.settings.items.map((item, index) => (
          <li
            key={index}
            class="w-72 shrink-0 snap-start space-y-3 rounded-theme border border-neutral-200 p-5"
          >
            {item.rating ? (
              <Stars
                rating={item.rating}
                label={shop.t('stars', { rating: item.rating })}
              />
            ) : null}
            <p class="text-sm leading-relaxed">“{item.text}”</p>
            <p class="flex items-center gap-2 text-sm font-medium">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  loading="lazy"
                  class="size-8 rounded-full object-cover"
                />
              ) : null}
              {item.name}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Vistos recentemente (lista do navegador); some quando vazia ou desligada na loja. */
export function RecentlyViewed({
  shop,
  title,
  exclude,
}: {
  shop: Shop;
  title: string;
  exclude?: string;
}) {
  const products = useRecentlyViewedProducts(shop, exclude);
  if (!features(shop.view).recentlyViewed || products.length === 0) return null;
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <ProductRow shop={shop} products={products} carousel />
    </section>
  );
}

function Promotions({ shop, title }: { shop: Shop; title: string | null }) {
  const promotions = shop.view.promotions ?? [];
  if (promotions.length === 0) return null;
  return (
    <section>
      {title ? <SectionTitle>{title}</SectionTitle> : null}
      <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {promotions.map((promotion) => (
          <li
            key={promotion.promotionId}
            class="rounded-theme border-2 border-dashed border-accent p-5"
          >
            <p class="font-heading text-lg font-semibold">{promotion.title}</p>
            <p class="text-sm text-muted">
              {promotionText(promotion, shop.t, shop.money)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
