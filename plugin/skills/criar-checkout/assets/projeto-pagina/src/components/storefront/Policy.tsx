import { useEffect, useState } from 'preact/hooks';
import { loadPolicy, StorefrontApiError } from '@bigbang/page-kit/storefront';
import type {
  PolicyKind,
  StorefrontPolicy,
} from '@bigbang/page-kit/storefront';
import type { Shop } from './shop';
import { Loading, NotFound, Retry } from './states';

/** Texto da política vindo da API, em texto simples (sem HTML). */
export function Policy({ shop, kind }: { shop: Shop; kind: PolicyKind }) {
  const { config, view, t } = shop;
  const [policy, setPolicy] = useState<
    StorefrontPolicy | 'missing' | 'error' | null
  >(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setPolicy(null);
    loadPolicy(config, kind, view.locale)
      .then((loaded) => {
        if (cancelled) return;
        setPolicy(loaded);
        document.title = `${loaded.title} · ${view.name}`;
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setPolicy(
          error instanceof StorefrontApiError && error.status === 404
            ? 'missing'
            : 'error',
        );
      });
    return () => {
      cancelled = true;
    };
  }, [config, kind, view.locale, view.name, attempt]);

  if (policy === null) return <Loading t={t} />;
  if (policy === 'missing') return <NotFound t={t} />;
  if (policy === 'error')
    return <Retry t={t} onRetry={() => setAttempt((n) => n + 1)} />;
  return (
    <article class="mx-auto max-w-3xl space-y-4" lang={policy.locale}>
      <h1 class="text-2xl font-bold tracking-tight">{policy.title}</h1>
      <p class="text-sm text-neutral-500">
        {t('policyUpdated', {
          date: new Date(policy.updatedAt).toLocaleDateString(view.locale),
        })}
      </p>
      <p class="whitespace-pre-line leading-relaxed text-neutral-800">
        {policy.text}
      </p>
    </article>
  );
}
