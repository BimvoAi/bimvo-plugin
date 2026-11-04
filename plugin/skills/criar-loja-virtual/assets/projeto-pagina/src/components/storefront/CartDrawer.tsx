import { useEffect, useState } from 'preact/hooks';
import { Minus, Plus, Trash2, X } from 'lucide-preact';
import { href } from '@bigbang/page-kit/router';
import { KitSlot } from '@bigbang/page-kit/slots';
import {
  cartSubtotal,
  freeShippingProgress,
  lineTotal,
  MAX_LINE_QUANTITY,
  useCartDrawer,
  type CartLineStatus,
} from '@bigbang/page-kit/storefront';
import { ProductPhoto } from './ProductPhoto';
import { features, productPath, type Shop } from './shop';
import { Loading, Retry } from './states';
import { useCartStatus, type CartCheck } from './useCartStatus';

/** "Faltam R$ X para o frete grátis" com a barra de progresso (conta no kit). */
export function FreeShippingBar({
  shop,
  subtotal,
}: {
  shop: Shop;
  subtotal: number;
}) {
  const bar = features(shop.view).freeShippingBar;
  const progress = bar?.enabled
    ? freeShippingProgress(subtotal, bar.threshold)
    : null;
  if (!progress) return null;
  return (
    <div class="space-y-1.5">
      <p class="text-sm">
        {progress.reached
          ? shop.t('freeShippingReached')
          : shop.t('freeShippingRemaining', {
              amount: shop.money(progress.remaining),
            })}
      </p>
      <div
        class="h-2 overflow-hidden rounded-full bg-neutral-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
      >
        <div
          class="h-full rounded-full bg-accent transition-all"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}

/** Variante e personalização da linha, em texto curto. */
export function LineDetails({ item }: { item: CartLineStatus }) {
  const { variant, line, product } = item;
  const fields = product?.customFields ?? [];
  const custom = Object.entries(line.customization ?? {});
  if (!variant && custom.length === 0) return null;
  return (
    <span class="block space-y-0.5 text-xs text-muted">
      {variant ? (
        <span class="block">
          {variant.options.map((option) => option.value).join(' / ') ||
            variant.label}
        </span>
      ) : null}
      {custom.map(([key, value]) => (
        <span key={key} class="block">
          {fields.find((field) => field.key === key)?.label ?? key}: {value}
        </span>
      ))}
    </span>
  );
}

export function problemText(shop: Shop, item: CartLineStatus): string | null {
  const { t } = shop;
  switch (item.problem) {
    case 'removed':
      return t('removed');
    case 'soldOut':
      return t('soldOut');
    case 'noPrice':
      return t('unavailable');
    case 'notEnough':
      return t('notEnough');
    default:
      return null;
  }
}

/** Carrinho em gaveta, aberto ao adicionar um item ou pelo ícone do cabeçalho. */
export function CartDrawer({ shop }: { shop: Shop }) {
  const drawer = useCartDrawer();
  useEffect(() => {
    if (!drawer.open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [drawer.open]);
  if (!drawer.open) return null;
  return (
    <div
      class="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={(event) => {
        if (event.target === event.currentTarget) drawer.hide();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={shop.t('cart')}
        class="flex h-full w-full max-w-md flex-col bg-white text-neutral-900 shadow-xl"
      >
        <header class="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 class="font-heading text-lg font-semibold">
            {shop.t('cart')} ({shop.cart.count})
          </h2>
          <button
            type="button"
            aria-label={shop.t('close')}
            onClick={drawer.hide}
            class="rounded-full p-1 hover:bg-neutral-100"
          >
            <X class="size-5" aria-hidden="true" />
          </button>
        </header>
        <DrawerBody shop={shop} onNavigate={drawer.hide} />
      </div>
    </div>
  );
}

function DrawerBody({
  shop,
  onNavigate,
}: {
  shop: Shop;
  onNavigate: () => void;
}) {
  const { t, money, cart, view } = shop;
  const [attempt, setAttempt] = useState(0);
  const check: CartCheck = useCartStatus(shop, attempt);
  if (cart.lines.length === 0) {
    return (
      <div class="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p>{t('cartEmpty')}</p>
        <button type="button" class="underline" onClick={onNavigate}>
          {t('continueShopping')}
        </button>
      </div>
    );
  }
  if (check.status === 'loading')
    return (
      <div class="p-5">
        <Loading t={t} />
      </div>
    );
  if (check.status === 'error')
    return (
      <div class="p-5">
        <Retry t={t} onRetry={() => setAttempt((n) => n + 1)} />
      </div>
    );
  const subtotal = cartSubtotal(check.lines);
  const available = check.lines.some((item) => item.problem === null);
  return (
    <>
      <div class="border-b border-neutral-200 px-5 py-3">
        <FreeShippingBar shop={shop} subtotal={subtotal} />
      </div>
      <ul class="flex-1 divide-y divide-neutral-100 overflow-y-auto px-5">
        {check.lines.map((item) => {
          const { line, product } = item;
          const problem = problemText(shop, item);
          return (
            <li
              key={`${line.productId}:${line.variantId ?? ''}:${JSON.stringify(line.customization ?? {})}`}
              class="flex gap-3 py-4"
            >
              <ProductPhoto
                src={product?.imageUrls[0]}
                alt=""
                className="size-20 shrink-0 rounded-theme object-cover"
              />
              <div class="min-w-0 flex-1 space-y-1">
                {product ? (
                  <a
                    href={href(productPath(product))}
                    onClick={onNavigate}
                    class="block text-sm font-medium hover:underline"
                  >
                    {product.name}
                  </a>
                ) : (
                  <span class="block text-sm font-medium">—</span>
                )}
                <LineDetails item={item} />
                {problem ? (
                  <span class="block text-xs text-red-600">{problem}</span>
                ) : null}
                <div class="flex items-center justify-between gap-2 pt-1">
                  <div class="flex items-center rounded-theme border border-neutral-300">
                    <button
                      type="button"
                      aria-label="-"
                      disabled={line.quantity <= 1}
                      onClick={() => cart.setQuantity(line, line.quantity - 1)}
                      class="p-1.5 disabled:opacity-30"
                    >
                      <Minus class="size-3.5" aria-hidden="true" />
                    </button>
                    <span class="w-7 text-center text-sm tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="+"
                      disabled={line.quantity >= MAX_LINE_QUANTITY}
                      onClick={() => cart.setQuantity(line, line.quantity + 1)}
                      class="p-1.5 disabled:opacity-30"
                    >
                      <Plus class="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <span class="text-sm font-semibold tabular-nums">
                    {money(lineTotal(item))}
                  </span>
                  <button
                    type="button"
                    aria-label={t('remove')}
                    onClick={() => cart.remove(line)}
                    class="p-1 text-muted hover:text-red-600"
                  >
                    <Trash2 class="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <footer class="space-y-3 border-t border-neutral-200 px-5 py-4">
        <p class="flex justify-between text-base">
          <span>{t('subtotal')}</span>
          <span class="font-semibold">{money(subtotal)}</span>
        </p>
        <p class="text-xs text-muted">{t('subtotalHint')}</p>
        <KitSlot
          place="cart.summary"
          view={view}
          lines={check.lines}
          subtotal={subtotal}
        />
        {available ? (
          <a
            href={href('/checkout')}
            onClick={onNavigate}
            class="block rounded-theme bg-primary px-5 py-3 text-center font-semibold text-primary-fg"
          >
            {t('checkout')}
          </a>
        ) : null}
        <a
          href={href('/carrinho')}
          onClick={onNavigate}
          class="block text-center text-sm underline"
        >
          {t('viewCart')}
        </a>
      </footer>
    </>
  );
}
