import { useState } from 'preact/hooks';
import { href } from '@bigbang/page-kit/router';
import { KitSlot } from '@bigbang/page-kit/slots';
import {
  cartSubtotal,
  lineTotal,
  MAX_LINE_QUANTITY,
} from '@bigbang/page-kit/storefront';
import { FreeShippingBar, LineDetails, problemText } from './CartDrawer';
import { ProductPhoto } from './ProductPhoto';
import { productPath, type Shop } from './shop';
import { Loading, Retry } from './states';
import { useCartStatus } from './useCartStatus';

/** Carrinho: itens conferidos agora; o que não está à venda fica marcado e fora do pagamento. */
export function Cart({ shop }: { shop: Shop }) {
  const { t, money, cart, view } = shop;
  const [attempt, setAttempt] = useState(0);
  const check = useCartStatus(shop, attempt);

  if (cart.lines.length === 0) {
    return (
      <div class="space-y-3 py-10 text-center">
        <p class="text-lg">{t('cartEmpty')}</p>
        <a class="underline" href={href('/')}>
          {t('continueShopping')}
        </a>
      </div>
    );
  }
  if (check.status === 'loading') return <Loading t={t} />;
  if (check.status === 'error') {
    return <Retry t={t} onRetry={() => setAttempt((n) => n + 1)} />;
  }

  const available = check.lines.some((item) => item.problem === null);
  const subtotal = cartSubtotal(check.lines);

  return (
    <div class="grid gap-8 lg:grid-cols-[1fr_340px]">
      <section class="space-y-4">
        <h1 class="font-heading text-2xl font-bold tracking-tight">
          {t('cart')}
        </h1>
        <ul class="divide-y divide-neutral-200">
          {check.lines.map((item) => {
            const { line, product } = item;
            const name = product?.name ?? '—';
            const problem = problemText(shop, item);
            return (
              <li
                key={`${line.productId}:${line.variantId ?? ''}:${JSON.stringify(line.customization ?? {})}`}
                class="flex gap-4 py-4"
              >
                <ProductPhoto
                  src={product?.imageUrls[0]}
                  alt=""
                  className="size-20 rounded-theme object-cover"
                />
                <div class="flex-1 space-y-1">
                  {product ? (
                    <a
                      class="font-medium underline-offset-2 hover:underline"
                      href={href(productPath(product))}
                    >
                      {name}
                    </a>
                  ) : (
                    <span class="font-medium">{name}</span>
                  )}
                  <LineDetails item={item} />
                  {problem ? (
                    <p class="text-sm text-red-700">{problem}</p>
                  ) : null}
                  <div class="flex items-center gap-3 text-sm">
                    <label>
                      <span class="sr-only">{t('quantity')}</span>
                      <input
                        type="number"
                        min={1}
                        max={MAX_LINE_QUANTITY}
                        value={line.quantity}
                        onChange={(event) =>
                          cart.setQuantity(
                            line,
                            Number(event.currentTarget.value) || 1,
                          )
                        }
                        class="w-20 rounded-theme border border-neutral-300 bg-transparent px-2 py-1"
                      />
                    </label>
                    <button
                      type="button"
                      class="underline"
                      onClick={() => cart.remove(line)}
                    >
                      {t('remove')}
                    </button>
                  </div>
                </div>
                <p class="font-semibold">{money(lineTotal(item))}</p>
              </li>
            );
          })}
        </ul>
      </section>
      <aside class="h-fit space-y-4 rounded-theme border border-neutral-200 p-5">
        <FreeShippingBar shop={shop} subtotal={subtotal} />
        <p class="flex justify-between text-lg">
          <span>{t('subtotal')}</span>
          <span class="font-semibold">{money(subtotal)}</span>
        </p>
        <p class="text-sm text-muted">{t('subtotalHint')}</p>
        <KitSlot
          place="cart.summary"
          view={view}
          lines={check.lines}
          subtotal={subtotal}
        />
        {available ? (
          <a
            class="block rounded-theme bg-primary px-5 py-3 text-center font-medium text-primary-fg"
            href={href('/checkout')}
          >
            {t('checkout')}
          </a>
        ) : null}
        <a class="block text-center text-sm underline" href={href('/')}>
          {t('continueShopping')}
        </a>
      </aside>
    </div>
  );
}
