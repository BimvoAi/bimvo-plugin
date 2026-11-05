import { useEffect, useMemo, useState } from 'preact/hooks';
import { shipmentStatusKey, translator } from '@bigbang/page-kit/checkout';
import { fromE164Br, maskPhoneBr, toE164 } from '@bigbang/page-kit/forms';
import { href, orderHref } from '@bigbang/page-kit/router';
import {
  accountOrderAction,
  accountOrderPayHref,
  buyAgain,
  deleteAccount,
  formatStoreMoney,
  loadAccount,
  requestAccountCode,
  signIn,
  signOut,
  StorefrontApiError,
  updateAccount,
  useAccountSession,
  type AccountPage,
  type BuyerOrderSummary,
} from '@bigbang/page-kit/storefront';
import type { CopyKey } from './copy';
import { OrderLookup } from './OrderLookup';
import { checkoutLocale, features, type Shop } from './shop';
import { Retry } from './states';

const RESEND_SECONDS = 30;
const input =
  'mt-1 w-full rounded-theme border border-neutral-300 bg-transparent px-3 py-2.5';
const primary =
  'w-full rounded-theme bg-primary px-5 py-3 font-semibold text-primary-fg disabled:opacity-50';
const STATUS: Record<string, CopyKey> = {
  awaiting_payment: 'statusPending',
  in_analysis: 'statusPending',
  paid: 'statusPaid',
  refused: 'statusRefused',
  charge_failed: 'statusRefused',
  expired: 'statusExpired',
  refunded: 'statusRefunded',
  chargeback: 'statusRefunded',
  cancelled: 'statusCancelled',
};

/**
 * Minha conta (`/conta`) e Rastrear pedido (`/rastreio`) com a conta do comprador (specs/047):
 * login por código no e-mail, pedidos e dados. Loja sem `customerAccounts` segue com os links por
 * e-mail (`OrderLookup`); em `/rastreio`, deslogado também, com o convite para entrar.
 */
export function Account({
  shop,
  mode,
}: {
  shop: Shop;
  mode: 'lookup' | 'account';
}) {
  const session = useAccountSession(shop.config.storeId);
  if (!features(shop.view).customerAccounts) {
    return <OrderLookup shop={shop} mode={mode} />;
  }
  if (session) return <SignedIn shop={shop} mode={mode} />;
  if (mode === 'account') return <SignInForm shop={shop} />;
  return (
    <>
      <OrderLookup shop={shop} mode="lookup" />
      <p class="text-center">
        <a href={href('/conta')} class="font-semibold underline">
          {shop.t('signInToSee')}
        </a>
      </p>
    </>
  );
}

type Problem = 'invalidCode' | 'codeExpired' | 'tooMany' | 'sendError' | null;

function problemOf(error: unknown): Problem {
  if (!(error instanceof StorefrontApiError)) return 'sendError';
  if (error.status === 429) return 'tooMany';
  if (error.code === 'INVALID_CODE') return 'invalidCode';
  if (error.code === 'CODE_EXPIRED') return 'codeExpired';
  return 'sendError';
}

function SignInForm({ shop }: { shop: Shop }) {
  const { t, config, view } = shop;
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [consent, setConsent] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);
  const [now, setNow] = useState(Date.now);
  const wait = sentAt
    ? Math.max(0, RESEND_SECONDS - Math.floor((now - sentAt) / 1000))
    : 0;

  useEffect(() => {
    if (!wait) return;
    const timer = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(timer);
  }, [wait, now]);

  const run = (task: Promise<unknown>, after?: () => void) => {
    setBusy(true);
    setProblem(null);
    task
      .then(after)
      .catch((error: unknown) => setProblem(problemOf(error)))
      .finally(() => setBusy(false));
  };
  const sendCode = () =>
    run(
      requestAccountCode(config, { email: email.trim(), locale: view.locale }),
      () => {
        setSentAt(Date.now());
        setNow(Date.now());
        setCode('');
      },
    );

  return (
    <div class="mx-auto max-w-md space-y-6 py-6">
      <header class="space-y-2">
        <h1 class="font-heading text-2xl font-bold tracking-tight">
          {t('account')}
        </h1>
        <p class="text-muted">
          {sentAt ? t('codeSent', { email: email.trim() }) : t('signInText')}
        </p>
      </header>
      <form
        class="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!sentAt) {
            if (email.trim()) sendCode();
          } else if (code.length === 6) {
            // A sessão gravada troca esta tela pela conta (useAccountSession).
            run(
              signIn(config, {
                email: email.trim(),
                code,
                ...(consent ? { marketingConsent: true } : {}),
              }),
            );
          }
        }}
      >
        {sentAt ? (
          <>
            <label class="block text-sm">
              <span class="font-medium">{t('code')}</span>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onInput={(event) =>
                  setCode(event.currentTarget.value.replace(/\D/g, ''))
                }
                class={`${input} text-center text-2xl tracking-[0.5em]`}
              />
            </label>
            <label class="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.currentTarget.checked)}
                class="mt-0.5 size-4"
              />
              <span>{t('marketingConsent')}</span>
            </label>
          </>
        ) : (
          <label class="block text-sm">
            <span class="font-medium">{t('email')}</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onInput={(event) => setEmail(event.currentTarget.value)}
              class={input}
            />
          </label>
        )}
        {problem ? (
          <p class="text-sm text-red-600" role="alert">
            {t(problem)}
          </p>
        ) : null}
        <button type="submit" disabled={busy} class={primary}>
          {busy ? t('loading') : sentAt ? t('signIn') : t('sendCode')}
        </button>
        {sentAt ? (
          <div class="flex justify-between text-sm">
            <button
              type="button"
              class="underline"
              onClick={() => {
                setSentAt(null);
                setProblem(null);
              }}
            >
              {t('changeEmail')}
            </button>
            <button
              type="button"
              disabled={busy || wait > 0}
              class="underline disabled:no-underline disabled:opacity-60"
              onClick={sendCode}
            >
              {wait > 0 ? t('resendIn', { seconds: wait }) : t('resendCode')}
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
}

function SignedIn({ shop, mode }: { shop: Shop; mode: 'lookup' | 'account' }) {
  const { t, config } = shop;
  const [page, setPage] = useState<AccountPage | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    // 401 apaga a sessão local e a tela volta ao login sozinha.
    loadAccount(config)
      .then((loaded) => !cancelled && setPage(loaded))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [config, attempt]);

  if (failed) return <Retry t={t} onRetry={() => setAttempt((n) => n + 1)} />;
  if (!page) return <p class="text-muted">{t('loading')}</p>;
  const firstName = page.account.name?.trim().split(/\s+/)[0];

  return (
    <div class="mx-auto max-w-2xl space-y-8 py-6">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="font-heading text-2xl font-bold tracking-tight">
            {mode === 'lookup'
              ? t('lookupTitle')
              : firstName
                ? t('hello', { name: firstName })
                : t('account')}
          </h1>
          <p class="text-sm text-muted">{page.account.email}</p>
        </div>
        {mode === 'lookup' ? (
          <a href={href('/conta')} class="text-sm underline">
            {t('account')}
          </a>
        ) : (
          <button
            type="button"
            class="text-sm underline"
            onClick={() => void signOut(config)}
          >
            {t('signOut')}
          </button>
        )}
      </header>
      <section class="space-y-3">
        <h2 class="font-heading text-lg font-semibold">{t('myOrders')}</h2>
        <OrderList shop={shop} orders={page.orders} />
      </section>
      {mode === 'account' ? (
        <>
          <Profile
            shop={shop}
            page={page}
            onSaved={(account) => setPage({ ...page, account })}
          />
          <DeleteAccount shop={shop} />
        </>
      ) : null}
    </div>
  );
}

function OrderList({
  shop,
  orders,
}: {
  shop: Shop;
  orders: BuyerOrderSummary[];
}) {
  const { t, view } = shop;
  const kit = useMemo(
    () => translator(checkoutLocale(view.locale)),
    [view.locale],
  );
  if (orders.length === 0) return <p class="text-muted">{t('noOrders')}</p>;
  return (
    <ul class="divide-y divide-neutral-200 rounded-theme border border-neutral-200">
      {orders.map((order) => {
        const status = STATUS[order.status];
        const action = accountOrderAction(order);
        const decimals =
          view.currencies.find((item) => item.code === order.currency)
            ?.decimals ?? 2;
        return (
          <li key={order.orderId} class="space-y-1 p-4">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <span class="font-semibold">
                {t('orderNumberShort', { number: order.number })}
              </span>
              <span class="font-semibold">
                {formatStoreMoney(
                  order.total,
                  order.currency,
                  decimals,
                  view.locale,
                )}
              </span>
            </div>
            <p class="text-sm text-muted">
              {new Date(order.createdAt).toLocaleDateString(view.locale)}
              {status ? ` · ${t(status)}` : ''}
              {order.shipment && order.status === 'paid'
                ? ` · ${kit(shipmentStatusKey(order.shipment.status))}`
                : ''}
            </p>
            <div class="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span>
                {order.firstItemName}
                {order.itemCount > 1
                  ? ` ${t('moreItems', { count: order.itemCount - 1 })}`
                  : ''}
              </span>
              <a
                href={orderHref(order.orderId, order.orderToken)}
                class="font-semibold underline"
              >
                {t('viewOrder')}
              </a>
            </div>
            {action ? (
              <button
                type="button"
                class={`mt-2 rounded-theme px-4 py-2 text-sm font-semibold ${
                  action === 'buyAgain'
                    ? 'border border-neutral-300'
                    : 'bg-primary text-primary-fg'
                }`}
                onClick={() =>
                  location.assign(
                    action === 'buyAgain'
                      ? buyAgain(shop.config.storeId, order)
                      : accountOrderPayHref(order),
                  )
                }
              >
                {t(action === 'buyAgain' ? 'buyAgain' : 'payNow')}
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function Profile({
  shop,
  page,
  onSaved,
}: {
  shop: Shop;
  page: AccountPage;
  onSaved: (account: AccountPage['account']) => void;
}) {
  const { t, config, view } = shop;
  const br = checkoutLocale(view.locale) === 'pt-BR';
  const { account } = page;
  const [name, setName] = useState(account.name ?? '');
  const [phone, setPhone] = useState(
    account.phone ? (br ? fromE164Br(account.phone) : account.phone) : '',
  );
  const [consent, setConsent] = useState(account.marketingConsent);
  const [state, setState] = useState<'idle' | 'busy' | 'saved' | 'error'>(
    'idle',
  );

  return (
    <form
      class="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setState('busy');
        updateAccount(config, {
          name: name.trim() || null,
          phone: phone.trim() ? toE164(phone, br ? '55' : '') : null,
          marketingConsent: consent,
        })
          .then((result) => {
            onSaved(result.account);
            setState('saved');
          })
          .catch(() => setState('error'));
      }}
    >
      <h2 class="font-heading text-lg font-semibold">{t('yourData')}</h2>
      <label class="block text-sm">
        <span class="font-medium">{t('name')}</span>
        <input
          autoComplete="name"
          value={name}
          onInput={(event) => setName(event.currentTarget.value)}
          class={input}
        />
      </label>
      <label class="block text-sm">
        <span class="font-medium">{t('phone')}</span>
        <input
          type="tel"
          autoComplete="tel"
          value={phone}
          onInput={(event) =>
            setPhone(
              br
                ? maskPhoneBr(event.currentTarget.value)
                : event.currentTarget.value,
            )
          }
          class={input}
        />
      </label>
      <label class="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.currentTarget.checked)}
          class="mt-0.5 size-4"
        />
        <span>{t('marketingConsent')}</span>
      </label>
      {state === 'saved' || state === 'error' ? (
        <p
          class={`text-sm ${state === 'error' ? 'text-red-600' : 'text-emerald-700'}`}
          role={state === 'error' ? 'alert' : 'status'}
        >
          {t(state === 'error' ? 'sendError' : 'saved')}
        </p>
      ) : null}
      <button type="submit" disabled={state === 'busy'} class={primary}>
        {state === 'busy' ? t('loading') : t('save')}
      </button>
    </form>
  );
}

/** Excluir a conta (specs/049): pede confirmação; no sucesso a sessão sai e volta o login. */
function DeleteAccount({ shop }: { shop: Shop }) {
  const { t, config } = shop;
  const [state, setState] = useState<'idle' | 'confirm' | 'busy' | 'error'>(
    'idle',
  );
  if (state === 'idle') {
    return (
      <p class="border-t border-neutral-200 pt-6">
        <button
          type="button"
          class="text-sm text-red-600 underline"
          onClick={() => setState('confirm')}
        >
          {t('deleteAccount')}
        </button>
      </p>
    );
  }
  return (
    <section class="space-y-3 rounded-theme border border-red-200 p-4">
      <h2 class="font-heading text-lg font-semibold">{t('deleteAccount')}</h2>
      <p class="text-sm text-muted">{t('deleteAccountText')}</p>
      {state === 'error' ? (
        <p class="text-sm text-red-600" role="alert">
          {t('sendError')}
        </p>
      ) : null}
      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={state === 'busy'}
          class="rounded-theme bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          onClick={() => {
            setState('busy');
            // A sessão apagada troca esta tela pelo login (useAccountSession).
            deleteAccount(config).catch(() => setState('error'));
          }}
        >
          {state === 'busy' ? t('loading') : t('deleteAccountConfirm')}
        </button>
        <button
          type="button"
          disabled={state === 'busy'}
          class="text-sm underline"
          onClick={() => setState('idle')}
        >
          {t('cancel')}
        </button>
      </div>
    </section>
  );
}
