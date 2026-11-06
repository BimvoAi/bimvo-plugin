import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import type { PageConfig } from '@bigbang/page-kit/page';
import {
  addLine,
  CART_EVENT,
  cartKey,
  readCart,
  removeLine,
  setQuantity,
  syncAccountCart,
  writeCart,
  type CartLine,
} from '@bigbang/page-kit/storefront';
import { addToCartEventId, trackPixel } from '@bigbang/page-kit/pixels';
import type { CartApi } from './shop';

/**
 * Carrinho gravado no navegador; outra aba da mesma loja vê a mudança. Com o comprador logado,
 * cada mudança também vai para a conta (specs/050).
 */
export function useCart(config: PageConfig): CartApi {
  const { storeId } = config;
  const [lines, setLines] = useState<CartLine[]>(() => readCart(storeId));

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.endsWith(storeId)) {
        setLines(readCart(storeId));
      }
    };
    // O kit gravou o carrinho nesta aba (o carrinho da conta, ao entrar).
    const onLocal = (event: Event) => {
      if ((event as CustomEvent<string>).detail === cartKey(storeId)) {
        setLines(readCart(storeId));
      }
    };
    addEventListener('storage', onStorage);
    addEventListener(CART_EVENT, onLocal);
    return () => {
      removeEventListener('storage', onStorage);
      removeEventListener(CART_EVENT, onLocal);
    };
  }, [storeId]);

  const update = useCallback(
    (next: (current: CartLine[]) => CartLine[]) =>
      setLines((current) => {
        const updated = next(current);
        writeCart(storeId, updated);
        syncAccountCart(config, updated);
        return updated;
      }),
    [storeId, config],
  );

  return useMemo(
    () => ({
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      add: (line) => {
        trackPixel('add_to_cart', {
          contentIds: [line.productId],
          eventId: addToCartEventId(),
        });
        update((current) => addLine(current, line));
      },
      setQuantity: (target, quantity) =>
        update((current) => setQuantity(current, target, quantity)),
      remove: (target) => update((current) => removeLine(current, target)),
      clear: () => update(() => []),
    }),
    [lines, update],
  );
}
