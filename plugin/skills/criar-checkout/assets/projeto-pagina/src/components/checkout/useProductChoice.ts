import { useEffect, useState } from 'preact/hooks';
import {
  isPreview,
  resolveProductLink,
  type CheckoutConfig,
} from '@bigbang/page-kit/checkout';

/**
 * Decide o que esta visita vende: carrinho gravado ou produto do endereço.
 * Sem os dois, o link não indica produto. A página de checkout não lista o catálogo.
 */
export function useProductChoice(config: CheckoutConfig) {
  const ready = isPreview() || Boolean(config.storeId);
  const [search, setSearch] = useState(() =>
    typeof location === 'undefined' ? '' : location.search,
  );

  useEffect(() => {
    const onPop = () => setSearch(location.search);
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);

  const resolution = resolveProductLink(config.products, search);
  const items =
    resolution.kind === 'fixed' || resolution.kind === 'product'
      ? resolution.items
      : null;

  return {
    ready,
    missing: resolution.kind === 'missing',
    invalid: resolution.kind === 'invalid',
    items,
  };
}
