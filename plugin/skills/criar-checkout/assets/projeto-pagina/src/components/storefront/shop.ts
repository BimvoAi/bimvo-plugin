import type { Locale } from '@bigbang/page-kit/checkout';
import type { PageConfig } from '@bigbang/page-kit/page';
import type { CartLine } from '@bigbang/page-kit/storefront';
import type { StorefrontView } from '@bigbang/page-kit/storefront';
import type { StoreText } from './copy';

/** O carrinho como as telas usam (ver useCart). */
export interface CartApi {
  lines: CartLine[];
  count: number;
  add(line: CartLine): void;
  setQuantity(
    target: Pick<CartLine, 'productId' | 'variantId'>,
    quantity: number,
  ): void;
  remove(target: Pick<CartLine, 'productId' | 'variantId'>): void;
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
