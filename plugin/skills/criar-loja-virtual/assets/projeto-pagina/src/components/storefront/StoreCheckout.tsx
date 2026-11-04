import { useEffect, useState } from 'preact/hooks';
import type { BuyerCartItem, Currency } from '@bigbang/page-kit/checkout';
import { href, navigate } from '@bigbang/page-kit/router';
import { Checkout } from '../checkout/Checkout';
import { checkoutLocale, type Shop } from './shop';
import { Loading, Retry } from './states';
import { useCartStatus } from './useCartStatus';

/**
 * Checkout do carrinho: só os itens à venda agora, no idioma e na moeda da loja virtual. Os
 * itens ficam fixos ao abrir; o carrinho esvazia quando o pedido é gerado.
 */
export function StoreCheckout({ shop }: { shop: Shop }) {
  const { config, view, t, cart } = shop;
  const [attempt, setAttempt] = useState(0);
  const check = useCartStatus(shop, attempt);
  const [items, setItems] = useState<BuyerCartItem[] | null>(null);

  useEffect(() => {
    if (items || check.status !== 'ready') return;
    const available = check.lines
      .filter((item) => item.problem === null)
      .map(({ line }) => ({
        productId: line.productId,
        ...(line.variantId ? { variantId: line.variantId } : {}),
        quantity: line.quantity,
        ...(line.customization ? { customization: line.customization } : {}),
      }));
    if (available.length === 0) navigate(href('/carrinho'), { replace: true });
    else setItems(available);
  }, [check, items]);

  if (check.status === 'error') {
    return <Retry t={t} onRetry={() => setAttempt((n) => n + 1)} />;
  }
  if (!items) return <Loading t={t} />;
  return (
    <section class="space-y-4">
      <a class="text-sm underline" href={href('/carrinho')}>
        {t('cart')}
      </a>
      <Checkout
        config={{
          ...config,
          products: [],
          locale: checkoutLocale(view.locale),
          currency: view.currency as Currency,
        }}
        items={items}
        onOrder={() => cart.clear()}
      />
    </section>
  );
}
