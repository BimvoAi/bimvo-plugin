import { useEffect, useState } from 'preact/hooks';
import { MessageCircle, X } from 'lucide-preact';
import { href, policyPath } from '@bigbang/page-kit/router';
import {
  StorefrontApiError,
  subscribeLead,
  type LeadSource,
} from '@bigbang/page-kit/storefront';
import { features, type Shop } from './shop';

// Captura e contato da loja (specs/046): newsletter (rodapé, seção e popup), botão do WhatsApp
// e aviso de cookies. Tudo liga e desliga pelo painel (`storefront.features`).

/** Formulário da newsletter; o cupom, quando a loja oferece, volta na resposta. */
export function NewsletterForm({
  shop,
  source,
  dark,
  onDone,
}: {
  shop: Shop;
  source: LeadSource;
  /** Fundo escuro (texto claro). */
  dark?: boolean;
  onDone?: () => void;
}) {
  const { t, config, view } = shop;
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<
    | { status: 'idle' | 'sending' }
    | { status: 'error'; message: string }
    | { status: 'done'; coupon: string | null }
  >({ status: 'idle' });

  if (state.status === 'done') {
    return (
      <div class="space-y-1" role="status">
        <p class="font-medium">{t('subscribed')}</p>
        {state.coupon ? (
          <p class="font-semibold">
            {t('couponLabel', { code: state.coupon })}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      class="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!consent || !email.trim()) return;
        setState({ status: 'sending' });
        subscribeLead(config, {
          email: email.trim(),
          source,
          consent: true,
          locale: view.locale,
        })
          .then(({ couponCode }) => {
            setState({ status: 'done', coupon: couponCode });
            onDone?.();
          })
          .catch((error: unknown) =>
            setState({
              status: 'error',
              message:
                error instanceof StorefrontApiError && error.status === 429
                  ? t('tooMany')
                  : t('sendError'),
            }),
          );
      }}
    >
      <div class="flex gap-2">
        <input
          type="email"
          required
          value={email}
          placeholder={t('email')}
          aria-label={t('email')}
          autoComplete="email"
          onInput={(event) => setEmail(event.currentTarget.value)}
          class={`min-w-0 flex-1 rounded-theme border px-3 py-2 text-sm ${
            dark
              ? 'border-white/30 bg-white/10 text-white placeholder:text-white/60'
              : 'border-neutral-300 bg-white text-neutral-900'
          }`}
        />
        <button
          type="submit"
          disabled={!consent || state.status === 'sending'}
          class={`rounded-theme px-4 py-2 text-sm font-medium disabled:opacity-50 ${
            dark ? 'bg-white text-neutral-900' : 'bg-primary text-primary-fg'
          }`}
        >
          {t('subscribe')}
        </button>
      </div>
      <label class="flex items-start gap-2 text-xs opacity-80">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.currentTarget.checked)}
          class="mt-0.5"
        />
        {t('consent')}
      </label>
      {state.status === 'error' ? (
        <p class="text-sm text-red-500" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function storageFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function setStorageFlag(key: string) {
  try {
    localStorage.setItem(key, '1');
  } catch {
    // Sem armazenamento: o aviso pode voltar na próxima visita.
  }
}

/** Popup da newsletter: abre uma vez por navegador, depois do atraso escolhido pela loja. */
export function NewsletterPopup({ shop }: { shop: Shop }) {
  const popup = features(shop.view).newsletterPopup;
  const key = `bb-popup:${shop.view.storeId}`;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!popup || storageFlag(key)) return;
    const timer = setTimeout(
      () => setOpen(true),
      Math.max(0, popup.delaySeconds) * 1000,
    );
    return () => clearTimeout(timer);
  }, [popup, key]);

  if (!popup || !open) return null;
  const close = () => {
    setStorageFlag(key);
    setOpen(false);
  };
  return (
    <div
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={popup.title}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div class="relative w-full max-w-md space-y-4 rounded-theme bg-white p-6 text-neutral-900 shadow-xl">
        <button
          type="button"
          aria-label={shop.t('close')}
          onClick={close}
          class="absolute right-3 top-3 rounded-full p-1 hover:bg-neutral-100"
        >
          <X class="size-5" aria-hidden="true" />
        </button>
        <h2 class="pr-8 font-heading text-2xl font-semibold">{popup.title}</h2>
        {popup.text ? <p class="text-neutral-600">{popup.text}</p> : null}
        <NewsletterForm
          shop={shop}
          source="popup"
          onDone={() => setStorageFlag(key)}
        />
        <button type="button" class="text-sm underline" onClick={close}>
          {shop.t('noThanks')}
        </button>
      </div>
    </div>
  );
}

/** Botão flutuante do WhatsApp da loja. */
export function WhatsAppButton({ shop }: { shop: Shop }) {
  const whatsapp = features(shop.view).whatsapp;
  if (!whatsapp) return null;
  return (
    <a
      href={whatsapp.href}
      target="_blank"
      rel="noopener"
      aria-label={shop.t('whatsapp')}
      class="fixed bottom-20 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 md:bottom-6"
    >
      <MessageCircle class="size-7" aria-hidden="true" />
    </a>
  );
}

/** Aviso de cookies, até o comprador confirmar. */
export function CookieBanner({ shop }: { shop: Shop }) {
  const banner = features(shop.view).cookieBanner;
  const key = `bb-cookies:${shop.view.storeId}`;
  const [accepted, setAccepted] = useState(() => storageFlag(key));
  if (!banner || accepted) return null;
  const privacy = shop.view.policies.find(
    (policy) => policy.kind === 'privacy',
  );
  return (
    <div
      class="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white p-4 text-sm text-neutral-800 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
      role="region"
      aria-label={shop.t('cookieAccept')}
    >
      <div class="mx-auto flex max-w-6xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {banner.text ?? shop.t('cookieText')}{' '}
          {privacy ? (
            <a class="underline" href={href(policyPath('privacy'))}>
              {privacy.title}
            </a>
          ) : null}
        </p>
        <button
          type="button"
          onClick={() => {
            setStorageFlag(key);
            setAccepted(true);
          }}
          class="shrink-0 rounded-theme bg-primary px-4 py-2 font-medium text-primary-fg"
        >
          {shop.t('cookieAccept')}
        </button>
      </div>
    </div>
  );
}
