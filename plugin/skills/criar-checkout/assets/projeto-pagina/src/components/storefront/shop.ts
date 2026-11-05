import type { Locale } from '@bigbang/page-kit/checkout';
import type { PageConfig } from '@bigbang/page-kit/page';
import { href } from '@bigbang/page-kit/router';
import {
  pixDiscountPercent,
  type CartLine,
  type CartLineTarget,
  type PublicPromotion,
  type StorefrontFeatures,
  type StorefrontLink,
} from '@bigbang/page-kit/storefront';
import type { StorefrontView } from '@bigbang/page-kit/storefront';
import type { StoreText } from './copy';

/** O carrinho como as telas usam (ver useCart). */
export interface CartApi {
  lines: CartLine[];
  count: number;
  add(line: CartLine): void;
  setQuantity(target: CartLineTarget, quantity: number): void;
  remove(target: CartLineTarget): void;
  clear(): void;
}

/** O que toda tela da loja virtual recebe: loja lida agora, idioma, moeda e carrinho. */
export interface Shop {
  config: PageConfig;
  view: StorefrontView;
  t: StoreText;
  money(amount: number | null): string;
  cart: CartApi;
}

/** Idioma do checkout para o idioma de conteúdo da loja. */
export function checkoutLocale(locale: string): Locale {
  return locale === 'en' || locale === 'es' ? locale : 'pt-BR';
}

/** Endereço do produto: o slug quando existe, senão o id. */
export function productPath(product: {
  slug: string | null;
  productId: string;
}) {
  return `/produto/${encodeURIComponent(product.slug ?? product.productId)}`;
}

/** Link da configuração da loja: interno leva idioma e moeda; externo abre fora. */
export function linkProps(link: StorefrontLink): {
  href: string;
  target?: string;
  rel?: string;
} {
  if (link.external)
    return { href: link.href, target: '_blank', rel: 'noopener' };
  const [path, query = ''] = link.href.split('?');
  return {
    href: href(path ?? '/', {
      query: Object.fromEntries(new URLSearchParams(query)),
    }),
  };
}

/**
 * Recursos da vitrine. API anterior à 046 não manda `storefront`: valem os padrões da loja
 * virtual de antes (sem favoritos, avaliações, captura nem conta do comprador).
 */
export function features(view: StorefrontView): StorefrontFeatures {
  return (
    view.storefront?.features ?? {
      installmentsOnCards: true,
      pixPriceOnCards: pixDiscountPercent(view.paymentPreview) !== null,
      wishlist: false,
      recentlyViewed: true,
      reviews: false,
      stockAlerts: false,
      freeShippingBar: null,
      whatsapp: null,
      newsletterPopup: null,
      cookieBanner: null,
      customerAccounts: false,
    }
  );
}

/** Texto curto da promoção ("Compre 3, pague 2"), pela maior faixa. */
export function promotionText(
  promotion: PublicPromotion,
  t: StoreText,
  money: (amount: number | null) => string,
): string {
  const percent = (bps: number) => String(Math.round(bps / 100));
  if (promotion.kind === 'quantity_pay') {
    const [tier] = promotion.tiers;
    return tier
      ? t('promoBuyPay', { buy: tier.buy, pay: tier.pay })
      : promotion.title;
  }
  if (promotion.kind === 'quantity_percent') {
    const [tier] = promotion.tiers;
    return tier
      ? t('promoQuantity', {
          percent: percent(tier.percentBps),
          quantity: tier.minQuantity,
        })
      : promotion.title;
  }
  const [tier] = promotion.tiers;
  return tier
    ? t('promoSubtotal', {
        percent: percent(tier.percentBps),
        amount: money(tier.minSubtotal),
      })
    : promotion.title;
}
