import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import {
  loadPage,
  StorefrontApiError,
  type StorePage,
} from '@bigbang/page-kit/storefront';
import type { Shop } from './shop';
import { Loading, NotFound, Retry } from './states';

/** Trechos `**negrito**` de uma linha (sem HTML: o texto nunca é interpretado como marcação). */
function inline(text: string): ComponentChildren[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) =>
      part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
        <strong key={index}>{part.slice(2, -2)}</strong>
      ) : (
        part
      ),
    );
}

/**
 * Texto das páginas de conteúdo: parágrafos separados por linha em branco, listas com "- " e
 * **negrito**. O resto é texto simples.
 */
export function RichText({ body }: { body: string }) {
  const blocks = body.replace(/\r\n/g, '\n').split(/\n\s*\n/);
  return (
    <div class="space-y-4 leading-relaxed">
      {blocks.map((block, index) => {
        const lines = block.split('\n').filter((line) => line.trim());
        if (lines.length > 0 && lines.every((line) => /^\s*-\s+/.test(line))) {
          return (
            <ul key={index} class="list-disc space-y-1 pl-6">
              {lines.map((line, item) => (
                <li key={item}>{inline(line.replace(/^\s*-\s+/, ''))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} class="whitespace-pre-line">
            {inline(lines.join('\n'))}
          </p>
        );
      })}
    </div>
  );
}

/** Página lida na API; `missing` quando não existe ou está desligada. */
export function useStorePage(
  shop: Shop,
  slug: string,
  attempt = 0,
): StorePage | 'loading' | 'missing' | 'error' {
  const { config, view } = shop;
  const [page, setPage] = useState<StorePage | 'loading' | 'missing' | 'error'>(
    'loading',
  );
  useEffect(() => {
    let cancelled = false;
    setPage('loading');
    loadPage(config, slug, view.locale)
      .then((loaded) => {
        if (!cancelled) setPage(loaded);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setPage(
          error instanceof StorefrontApiError && error.status === 404
            ? 'missing'
            : 'error',
        );
      });
    return () => {
      cancelled = true;
    };
  }, [config, slug, view.locale, attempt]);
  return page;
}

/** Página de conteúdo (`/p/<slug>`): sobre, como comprar, guia de medidas… */
export function ContentPage({ shop, slug }: { shop: Shop; slug: string }) {
  const { t, view } = shop;
  const [attempt, setAttempt] = useState(0);
  const page = useStorePage(shop, slug, attempt);
  useEffect(() => {
    if (typeof page === 'object')
      document.title = `${page.title} · ${view.name}`;
  }, [page, view.name]);
  if (page === 'loading') return <Loading t={t} />;
  if (page === 'missing') return <NotFound t={t} />;
  if (page === 'error')
    return <Retry t={t} onRetry={() => setAttempt((n) => n + 1)} />;
  return (
    <article class="mx-auto max-w-3xl space-y-6" lang={page.locale}>
      <h1 class="font-heading text-3xl font-bold tracking-tight">
        {page.title}
      </h1>
      <RichText body={page.body} />
    </article>
  );
}
