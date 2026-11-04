import { useEffect, useState } from 'preact/hooks';
import { loadProduct, StorefrontApiError } from '@bigbang/page-kit/storefront';
import {
  revalidateCart,
  type CartLineStatus,
} from '@bigbang/page-kit/storefront';
import type { Shop } from './shop';

export type CartCheck =
  | { status: 'loading' }
  | { status: 'ready'; lines: CartLineStatus[] }
  | { status: 'error' };

/** Confere cada item do carrinho na API, no idioma e na moeda atuais. */
export function useCartStatus(shop: Shop, attempt = 0): CartCheck {
  const { config, view, cart } = shop;
  const [check, setCheck] = useState<CartCheck>({ status: 'loading' });
  const key = cart.lines
    .map(
      (line) =>
        `${line.productId}:${line.variantId ?? ''}:${line.quantity}:${JSON.stringify(line.customization ?? {})}`,
    )
    .join(',');

  useEffect(() => {
    let cancelled = false;
    revalidateCart(cart.lines, async (productId) => {
      try {
        return (
          await loadProduct(config, productId, view.locale, view.currency)
        ).product;
      } catch (error) {
        // 404: o produto saiu da loja. Outra falha é da API, não do carrinho.
        if (error instanceof StorefrontApiError && error.status === 404)
          return null;
        throw error;
      }
    })
      .then((lines) => {
        if (!cancelled) setCheck({ status: 'ready', lines });
      })
      .catch(() => {
        if (!cancelled) setCheck({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [config, view.locale, view.currency, key, attempt]);

  return check;
}
