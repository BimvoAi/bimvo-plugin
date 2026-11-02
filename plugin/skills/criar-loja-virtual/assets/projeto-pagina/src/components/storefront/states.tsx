import { href } from '@bigbang/page-kit/router';
import type { StoreText } from './copy';

export function Loading({ t }: { t: StoreText }) {
  return <p class="text-neutral-600">{t('loading')}</p>;
}

/** API fora do ar: avisa e deixa tentar de novo, sem mostrar dado guardado. */
export function Retry({ t, onRetry }: { t: StoreText; onRetry: () => void }) {
  return (
    <div class="space-y-3">
      <p class="text-neutral-700">{t('loadError')}</p>
      <button
        type="button"
        class="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white"
        onClick={onRetry}
      >
        {t('retry')}
      </button>
    </div>
  );
}

export function NotFound({ t }: { t: StoreText }) {
  return (
    <div class="space-y-3 py-10 text-center">
      <p class="text-lg">{t('notFound')}</p>
      <a class="underline" href={href('/')}>
        {t('backHome')}
      </a>
    </div>
  );
}
