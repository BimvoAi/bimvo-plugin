import { useEffect } from 'preact/hooks';
import { Checkout } from './components/checkout/Checkout';
import { OrderStatus } from './components/order/OrderStatus';
import { ThankYou } from './components/order/ThankYou';
import { StoreApp } from './components/storefront/StoreApp';
import { config } from './config';
import { resolveProductLink } from '@bigbang/page-kit/checkout';
import { installStorePixels } from '@bigbang/page-kit/pixels';
import { navigate, useRoute } from '@bigbang/page-kit/router';

// A página é sempre a do tipo da loja: checkout ou loja virtual. Personalize a apresentação
// (classes, cores, textos de interface); preço, nome, descrição e estoque vêm da API.
export function App() {
  useEffect(() => {
    void installStorePixels(config.apiUrl, config.storeId, visitProductIds());
  }, []);
  return config.kind === 'ecommerce' ? (
    <StoreApp config={config} />
  ) : (
    <CheckoutPage />
  );
}

function CheckoutPage() {
  const route = useRoute();
  if (route.name === 'order') {
    return (
      <main class="mx-auto max-w-3xl px-4 py-10">
        <OrderStatus
          config={config}
          orderId={route.orderId}
          orderToken={route.token}
        />
      </main>
    );
  }
  if (route.name === 'thanks') {
    return (
      <main class="mx-auto max-w-3xl px-4 py-10">
        <ThankYou
          config={config}
          orderId={route.orderId}
          orderToken={route.token}
        />
      </main>
    );
  }
  if (route.name !== 'home') return <BackToCheckout />;
  return (
    <main class="mx-auto max-w-5xl px-4 py-10">
      <h1 class="mb-8 text-3xl font-bold tracking-tight">
        Finalize sua compra
      </h1>
      <Checkout config={config} />
    </main>
  );
}

/** Na página de checkout, os produtos do link decidem quais pixels por produto disparam. */
function visitProductIds(): string[] {
  if (config.kind !== 'checkout') return [];
  const link = resolveProductLink(config.products, location.search);
  return link.kind === 'product' || link.kind === 'fixed'
    ? link.items.map((item) => item.productId)
    : [];
}

/** Qualquer outro caminho volta para o checkout, mantendo ?product= e os utm_*. */
function BackToCheckout() {
  useEffect(() => navigate(`/${location.search}`, { replace: true }), []);
  return null;
}
