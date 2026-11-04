import { useState } from 'preact/hooks';
import {
  requestOrderLookup,
  StorefrontApiError,
} from '@bigbang/page-kit/storefront';
import type { Shop } from './shop';

/**
 * Rastrear pedido (`/rastreio`) e Minha conta (`/conta`), sem senha: o comprador informa o
 * e-mail e recebe os links dos pedidos. A resposta é sempre a mesma (não diz se há pedido).
 */
export function OrderLookup({
  shop,
  mode,
}: {
  shop: Shop;
  mode: 'lookup' | 'account';
}) {
  const { t, config, view } = shop;
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [state, setState] = useState<
    'idle' | 'sending' | 'done' | 'error' | 'tooMany'
  >('idle');

  return (
    <div class="mx-auto max-w-md space-y-6 py-6">
      <header class="space-y-2">
        <h1 class="font-heading text-2xl font-bold tracking-tight">
          {mode === 'lookup' ? t('lookupTitle') : t('account')}
        </h1>
        <p class="text-muted">
          {mode === 'lookup' ? t('lookupText') : t('accountText')}
        </p>
      </header>
      {state === 'done' ? (
        <p
          class="rounded-theme bg-emerald-50 p-4 text-sm text-emerald-800"
          role="status"
        >
          {t('lookupDone')}
        </p>
      ) : (
        <form
          class="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!email.trim()) return;
            const number = Number(orderNumber.replace(/\D/g, ''));
            setState('sending');
            requestOrderLookup(config, {
              email: email.trim(),
              ...(mode === 'lookup' && number > 0
                ? { orderNumber: number }
                : {}),
              locale: view.locale,
            })
              .then(() => setState('done'))
              .catch((error: unknown) =>
                setState(
                  error instanceof StorefrontApiError && error.status === 429
                    ? 'tooMany'
                    : 'error',
                ),
              );
          }}
        >
          <label class="block text-sm">
            <span class="font-medium">{t('email')}</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onInput={(event) => setEmail(event.currentTarget.value)}
              class="mt-1 w-full rounded-theme border border-neutral-300 bg-transparent px-3 py-2.5"
            />
          </label>
          {mode === 'lookup' ? (
            <label class="block text-sm">
              <span class="font-medium">{t('orderNumber')}</span>
              <input
                inputMode="numeric"
                value={orderNumber}
                onInput={(event) => setOrderNumber(event.currentTarget.value)}
                class="mt-1 w-full rounded-theme border border-neutral-300 bg-transparent px-3 py-2.5"
              />
            </label>
          ) : null}
          {state === 'error' || state === 'tooMany' ? (
            <p class="text-sm text-red-600" role="alert">
              {state === 'tooMany' ? t('tooMany') : t('sendError')}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={state === 'sending'}
            class="w-full rounded-theme bg-primary px-5 py-3 font-semibold text-primary-fg disabled:opacity-50"
          >
            {state === 'sending' ? t('loading') : t('send')}
          </button>
        </form>
      )}
    </div>
  );
}
