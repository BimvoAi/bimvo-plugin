import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import {
  addLine,
  readCart,
  removeLine,
  setQuantity,
  writeCart,
  type CartLine,
} from '@bigbang/page-kit/storefront';
import { addToCartEventId, trackPixel } from '@bigbang/page-kit/pixels';
import type { CartApi } from './shop';

/** Carrinho gravado no navegador; outra aba da mesma loja vê a mudança. */
export function useCart(storeId: string): CartApi {
  const [lines, setLines] = useState<CartLine[]>(() => readCart(storeId));

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.endsWith(storeId)) {
        setLines(readCart(storeId));
      }
    };
    addEventListener('storage', onStorage);
    return () => removeEventListener('storage', onStorage);
  }, [storeId]);

  const update = useCallback(
    (next: (current: CartLine[]) => CartLine[]) =>
      setLines((current) => {
        const updated = next(current);
        writeCart(storeId, updated);
        return updated;
      }),
    [storeId],
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
