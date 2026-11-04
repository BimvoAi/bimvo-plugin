import { useEffect, useState } from 'preact/hooks';
import { BadgeCheck, Star } from 'lucide-preact';
import {
  loadReviews,
  MAX_REVIEW_PHOTOS,
  StorefrontApiError,
  submitReview,
  type ProductReview,
  type ReviewSort,
  type ReviewSummary,
  type StorefrontProduct,
} from '@bigbang/page-kit/storefront';
import type { CopyKey } from './copy';
import { SectionTitle, Stars } from './parts';
import type { Shop } from './shop';
import { Retry } from './states';

const SORTS: { value: ReviewSort; label: CopyKey }[] = [
  { value: 'recent', label: 'reviewSortRecent' },
  { value: 'rating_desc', label: 'reviewSortRating' },
  { value: 'photos', label: 'reviewSortPhotos' },
];

/** Avaliações aprovadas do produto: resumo, ordenação, fotos, resposta da loja e o formulário. */
export function Reviews({
  shop,
  product,
}: {
  shop: Shop;
  product: StorefrontProduct;
}) {
  const { config, t } = shop;
  const key = product.slug ?? product.productId;
  const [sort, setSort] = useState<ReviewSort>('recent');
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [attempt, setAttempt] = useState(0);
  const [writing, setWriting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    loadReviews(config, key, { sort })
      .then((page) => {
        if (cancelled) return;
        setSummary(page.summary);
        setReviews(page.reviews);
        setCursor(page.nextCursor);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [config, key, sort, attempt]);

  async function more() {
    if (!cursor) return;
    try {
      const page = await loadReviews(config, key, { sort, cursor });
      setReviews((current) => [...current, ...page.reviews]);
      setCursor(page.nextCursor);
    } catch {
      setStatus('error');
    }
  }

  return (
    <section id="avaliacoes" class="scroll-mt-24 space-y-6">
      <SectionTitle>{t('reviews')}</SectionTitle>
      {status === 'error' ? (
        <Retry t={t} onRetry={() => setAttempt((n) => n + 1)} />
      ) : null}
      {summary ? (
        <div class="grid gap-6 rounded-theme border border-neutral-200 p-5 sm:grid-cols-[200px_1fr_auto] sm:items-center">
          <div class="space-y-1 text-center sm:text-left">
            <p class="font-heading text-4xl font-bold">
              {summary.count > 0 ? summary.average.toFixed(1) : '–'}
            </p>
            <Stars
              rating={summary.average}
              label={t('stars', { rating: summary.average })}
            />
            <p class="text-sm text-muted">
              {t('reviewsCount', { count: summary.count })}
            </p>
          </div>
          <ul class="space-y-1 text-sm">
            {summary.distribution.map((count, index) => {
              const rating = 5 - index;
              const width =
                summary.count > 0
                  ? Math.round((count / summary.count) * 100)
                  : 0;
              return (
                <li key={rating} class="flex items-center gap-2">
                  <span class="flex w-8 items-center gap-0.5">
                    {rating}
                    <Star
                      class="size-3 fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                  </span>
                  <span class="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                    <span
                      class="block h-full rounded-full bg-amber-400"
                      style={{ width: `${width}%` }}
                    />
                  </span>
                  <span class="w-8 text-right text-muted">{count}</span>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => setWriting((value) => !value)}
            class="rounded-theme border border-neutral-900 px-4 py-2 text-sm font-medium"
          >
            {t('writeReview')}
          </button>
        </div>
      ) : null}
      {writing ? (
        <ReviewForm
          shop={shop}
          productKey={key}
          onClose={() => setWriting(false)}
        />
      ) : null}
      {status === 'ready' && reviews.length === 0 ? (
        <p class="text-muted">{t('reviewsEmpty')}</p>
      ) : null}
      {reviews.length > 0 ? (
        <>
          <label class="flex items-center gap-2 text-sm">
            <span class="text-muted">{t('sortBy')}</span>
            <select
              value={sort}
              onChange={(event) =>
                setSort(event.currentTarget.value as ReviewSort)
              }
              class="rounded-theme border border-neutral-300 bg-transparent px-2 py-1"
            >
              {SORTS.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.label)}
                </option>
              ))}
            </select>
          </label>
          <ul class="divide-y divide-neutral-200">
            {reviews.map((review) => (
              <ReviewItem key={review.reviewId} shop={shop} review={review} />
            ))}
          </ul>
          {cursor ? (
            <button
              type="button"
              class="rounded-theme border border-neutral-300 px-4 py-2 text-sm"
              onClick={() => void more()}
            >
              {t('loadMore')}
            </button>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function ReviewItem({ shop, review }: { shop: Shop; review: ProductReview }) {
  const { t, view } = shop;
  return (
    <li class="space-y-2 py-5">
      <div class="flex flex-wrap items-center gap-3">
        <Stars
          rating={review.rating}
          label={t('stars', { rating: review.rating })}
        />
        <span class="text-sm font-medium">{review.authorName}</span>
        {review.verified ? (
          <span class="inline-flex items-center gap-1 text-xs text-accent">
            <BadgeCheck class="size-4" aria-hidden="true" />
            {t('reviewVerified')}
          </span>
        ) : null}
        <time class="text-xs text-muted" dateTime={review.createdAt}>
          {new Date(review.createdAt).toLocaleDateString(view.locale)}
        </time>
      </div>
      {review.title ? <p class="font-semibold">{review.title}</p> : null}
      <p class="whitespace-pre-line text-sm leading-relaxed">{review.body}</p>
      {review.photoUrls.length > 0 ? (
        <ul class="flex gap-2">
          {review.photoUrls.map((url) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noopener">
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  class="size-20 rounded-theme object-cover"
                />
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {review.reply ? (
        <div class="rounded-theme bg-neutral-50 p-3 text-sm">
          <p class="font-medium">{t('reviewReply')}</p>
          <p class="whitespace-pre-line text-muted">{review.reply.text}</p>
        </div>
      ) : null}
    </li>
  );
}

function ReviewForm({
  shop,
  productKey,
  onClose,
}: {
  shop: Shop;
  productKey: string;
  onClose: () => void;
}) {
  const { t, config } = shop;
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [state, setState] = useState<
    | { status: 'idle' | 'sending' | 'sent' }
    | { status: 'error'; message: string }
  >({ status: 'idle' });

  if (state.status === 'sent') {
    return (
      <p
        class="rounded-theme bg-emerald-50 p-4 text-sm text-emerald-800"
        role="status"
      >
        {t('reviewSent')}
      </p>
    );
  }

  return (
    <form
      class="space-y-4 rounded-theme border border-neutral-200 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (rating < 1 || !body.trim() || !name.trim()) return;
        setState({ status: 'sending' });
        submitReview(config, productKey, {
          rating,
          title: title.trim() || undefined,
          body: body.trim(),
          authorName: name.trim(),
          photos,
          website: website || undefined,
        })
          .then(() => setState({ status: 'sent' }))
          .catch((error: unknown) =>
            setState({
              status: 'error',
              message:
                error instanceof StorefrontApiError
                  ? error.code === 'REVIEW_PHOTO_INVALID'
                    ? t('reviewPhotoInvalid')
                    : error.status === 429
                      ? t('tooMany')
                      : error.message || t('sendError')
                  : t('sendError'),
            }),
          );
      }}
    >
      <fieldset>
        <legend class="mb-1 text-sm font-medium">{t('reviewRating')}</legend>
        <div class="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={rating === value}
              aria-label={t('stars', { rating: value })}
              onClick={() => setRating(value)}
            >
              <Star
                aria-hidden="true"
                class={`size-7 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
              />
            </button>
          ))}
        </div>
      </fieldset>
      <label class="block text-sm">
        <span class="font-medium">{t('reviewName')}</span>
        <input
          required
          maxLength={80}
          value={name}
          onInput={(event) => setName(event.currentTarget.value)}
          class="mt-1 w-full rounded-theme border border-neutral-300 px-3 py-2"
        />
      </label>
      <label class="block text-sm">
        <span class="font-medium">
          {t('reviewTitle')} <span class="text-muted">({t('optional')})</span>
        </span>
        <input
          maxLength={120}
          value={title}
          onInput={(event) => setTitle(event.currentTarget.value)}
          class="mt-1 w-full rounded-theme border border-neutral-300 px-3 py-2"
        />
      </label>
      <label class="block text-sm">
        <span class="font-medium">{t('reviewBody')}</span>
        <textarea
          required
          maxLength={2000}
          rows={4}
          value={body}
          onInput={(event) => setBody(event.currentTarget.value)}
          class="mt-1 w-full rounded-theme border border-neutral-300 px-3 py-2"
        />
      </label>
      <label class="block text-sm">
        <span class="font-medium">{t('reviewPhotos')}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(event) =>
            setPhotos(
              Array.from(event.currentTarget.files ?? []).slice(
                0,
                MAX_REVIEW_PHOTOS,
              ),
            )
          }
          class="mt-1 block text-sm"
        />
      </label>
      {/* Armadilha para robô: pessoas não veem nem preenchem. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onInput={(event) => setWebsite(event.currentTarget.value)}
        class="absolute -left-[9999px] size-px opacity-0"
      />
      {state.status === 'error' ? (
        <p class="text-sm text-red-600" role="alert">
          {state.message}
        </p>
      ) : null}
      <div class="flex gap-3">
        <button
          type="submit"
          disabled={state.status === 'sending' || rating < 1}
          class="rounded-theme bg-primary px-5 py-2.5 text-sm font-medium text-primary-fg disabled:opacity-50"
        >
          {state.status === 'sending' ? t('loading') : t('reviewSubmit')}
        </button>
        <button type="button" class="text-sm underline" onClick={onClose}>
          {t('close')}
        </button>
      </div>
    </form>
  );
}
