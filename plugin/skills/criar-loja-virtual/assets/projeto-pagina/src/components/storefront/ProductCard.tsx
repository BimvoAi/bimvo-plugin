import { href } from '@bigbang/page-kit/router';
import { KitSlot } from '@bigbang/page-kit/slots';
import {
  discountPercent,
  promotionFor,
  type StorefrontProduct,
} from '@bigbang/page-kit/storefront';
import { PaymentLines, Stars, WishlistButton } from './parts';
import { ProductPhoto } from './ProductPhoto';
import { features, productPath, promotionText, type Shop } from './shop';

/** Card do produto nas listas: foto, selo de desconto, preço, parcela, PIX, nota e favoritar. */
export function ProductCard({
  shop,
  product,
}: {
  shop: Shop;
  product: StorefrontProduct;
}) {
  const { t, money, view } = shop;
  const [image, second] = product.imageUrls;
  const off = discountPercent(product.price, product.compareAtPrice);
  const promotion = promotionFor(product, view.promotions);
  const rating = features(view).reviews ? product.rating : null;
  return (
    <div class="group relative">
      <a href={href(productPath(product))} class="block space-y-2">
        <span class="relative block overflow-hidden rounded-theme bg-neutral-100">
          <ProductPhoto
            src={image}
            alt=""
            loading="lazy"
            className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
          />
          {second ? (
            <img
              src={second}
              alt=""
              loading="lazy"
              class="absolute inset-0 hidden aspect-square w-full object-cover opacity-0 transition duration-300 group-hover:opacity-100 sm:block"
            />
          ) : null}
          <span class="absolute left-2 top-2 flex flex-col items-start gap-1">
            {off !== null ? (
              <span class="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-fg">
                {t('off', { percent: off })}
              </span>
            ) : null}
            {promotion ? (
              <span class="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">
                {promotionText(promotion, t, money)}
              </span>
            ) : null}
            {product.price !== null && !product.purchasable ? (
              <span class="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-white">
                {t('soldOut')}
              </span>
            ) : null}
          </span>
        </span>
        <span class="block text-sm font-medium leading-snug group-hover:underline">
          {product.name}
        </span>
        {rating && rating.count > 0 ? (
          <span class="flex items-center gap-1 text-xs text-muted">
            <Stars
              rating={rating.average}
              label={t('stars', { rating: rating.average })}
              size="size-3.5"
            />
            ({rating.count})
          </span>
        ) : null}
        <span class="flex flex-wrap items-baseline gap-2 text-sm">
          {product.price === null ? (
            <span class="text-muted">{t('unavailable')}</span>
          ) : (
            <>
              {product.compareAtPrice !== null &&
              product.compareAtPrice > product.price ? (
                <s class="text-muted">{money(product.compareAtPrice)}</s>
              ) : null}
              <span class="font-semibold">{money(product.price)}</span>
            </>
          )}
        </span>
        <PaymentLines shop={shop} price={product.price} />
      </a>
      <WishlistButton
        shop={shop}
        product={product}
        class="absolute right-2 top-2"
      />
      <KitSlot place="listing.card" view={view} product={product} />
    </div>
  );
}
