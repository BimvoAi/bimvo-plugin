import type { ComponentChildren } from 'preact';
import {
  Clock,
  CreditCard,
  Gift,
  Heart,
  Lock,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Star,
  Truck,
} from 'lucide-preact';
import {
  installmentPreview,
  pixPrice,
  productListKey,
  useWishlist,
  type StorefrontProduct,
  type TrustBadge,
} from '@bigbang/page-kit/storefront';
import { features, type Shop } from './shop';

// Peças visuais pequenas da loja virtual. Troque as classes para seguir a identidade da página;
// as contas (parcela, PIX) vêm do kit.

const TRUST_ICONS = {
  truck: Truck,
  shield: ShieldCheck,
  refresh: RefreshCw,
  lock: Lock,
  gift: Gift,
  star: Star,
  clock: Clock,
  card: CreditCard,
  pix: QrCode,
  heart: Heart,
};

export function TrustIcon({
  icon,
  class: className,
}: {
  icon: string;
  class?: string;
}) {
  const Icon = TRUST_ICONS[icon as keyof typeof TRUST_ICONS];
  return Icon ? <Icon class={className} aria-hidden="true" /> : null;
}

export function TrustBadges({
  badges,
  compact,
}: {
  badges: TrustBadge[];
  compact?: boolean;
}) {
  if (badges.length === 0) return null;
  return (
    <ul
      class={
        compact
          ? 'grid gap-3 text-sm sm:grid-cols-2'
          : 'grid grid-cols-2 gap-4 md:grid-cols-4'
      }
    >
      {badges.map((badge, index) => (
        <li key={index} class="flex items-start gap-3">
          <TrustIcon
            icon={badge.icon}
            class="mt-0.5 size-6 shrink-0 text-accent"
          />
          <span>
            <span class="block font-medium">{badge.title}</span>
            {badge.text ? (
              <span class="block text-sm text-muted">{badge.text}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Nota em estrelas (cheias até a média arredondada). */
export function Stars({
  rating,
  label,
  size = 'size-4',
}: {
  rating: number;
  label: string;
  size?: string;
}) {
  const full = Math.round(rating);
  return (
    <span
      class="inline-flex items-center gap-0.5"
      role="img"
      aria-label={label}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          aria-hidden="true"
          class={`${size} ${value <= full ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
        />
      ))}
    </span>
  );
}

/** Coração de favoritar; só aparece com a lista de desejos ligada na loja. */
export function WishlistButton({
  shop,
  product,
  class: className = '',
}: {
  shop: Shop;
  product: Pick<StorefrontProduct, 'slug' | 'productId'>;
  class?: string;
}) {
  const wishlist = useWishlist(shop.view.storeId);
  if (!features(shop.view).wishlist) return null;
  const key = productListKey(product);
  const saved = wishlist.has(key);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? shop.t('removeWishlist') : shop.t('addWishlist')}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        wishlist.toggle(key);
      }}
      class={`flex size-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-105 ${className}`}
    >
      <Heart
        aria-hidden="true"
        class={`size-5 ${saved ? 'fill-red-500 text-red-500' : 'text-neutral-700'}`}
      />
    </button>
  );
}

/** "12x de R$ X sem juros" e "R$ Y no PIX" para um preço, se a loja mostra. */
export function PaymentLines({
  shop,
  price,
  card,
  pix,
  size = 'text-xs',
}: {
  shop: Shop;
  price: number | null;
  /** Mostra a parcela (padrão: `installmentsOnCards`). */
  card?: boolean;
  /** Mostra o preço no PIX (padrão: `pixPriceOnCards`). */
  pix?: boolean;
  size?: string;
}) {
  const { t, money, view } = shop;
  const enabled = features(view);
  const installment =
    (card ?? enabled.installmentsOnCards)
      ? installmentPreview(price, view.paymentPreview)
      : null;
  const pixAmount =
    (pix ?? enabled.pixPriceOnCards)
      ? pixPrice(price, view.paymentPreview)
      : null;
  if (!installment && pixAmount === null) return null;
  return (
    <span class={`block space-y-0.5 text-muted ${size}`}>
      {pixAmount !== null ? (
        <span class="block font-medium text-accent">
          {t('pixPrice', { amount: money(pixAmount) })}
        </span>
      ) : null}
      {installment ? (
        <span class="block">
          {t('installments', {
            count: installment.count,
            amount: money(installment.amount),
          })}
          {installment.interestFree ? ` ${t('interestFree')}` : ''}
        </span>
      ) : null}
    </span>
  );
}

/** Título de seção com espaço padrão. */
export function SectionTitle({ children }: { children: ComponentChildren }) {
  return (
    <h2 class="mb-4 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
      {children}
    </h2>
  );
}
