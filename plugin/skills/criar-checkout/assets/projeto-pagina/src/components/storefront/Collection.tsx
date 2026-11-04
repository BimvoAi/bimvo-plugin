import { useEffect } from 'preact/hooks';
import { ProductList } from './ProductList';
import type { Shop } from './shop';
import { NotFound } from './states';

/** Coleção (`/colecao/<slug>`): nome, texto e foto da configuração; produtos pela lista da API. */
export function Collection({ shop, slug }: { shop: Shop; slug: string }) {
  const collection = shop.view.collections?.find((item) => item.slug === slug);
  useEffect(() => {
    if (collection) document.title = `${collection.name} · ${shop.view.name}`;
  }, [collection, shop.view.name]);
  if (!collection) return <NotFound t={shop.t} />;
  return (
    <div class="space-y-6">
      {collection.imageUrl ? (
        <div class="relative -mx-4 overflow-hidden sm:mx-0 sm:rounded-theme">
          <img
            src={collection.imageUrl}
            alt=""
            class="max-h-80 w-full object-cover"
          />
          <div class="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-6 text-white">
            <h1 class="font-heading text-3xl font-bold tracking-tight">
              {collection.name}
            </h1>
            {collection.description ? (
              <p class="max-w-2xl opacity-90">{collection.description}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <header class="space-y-1">
          <h1 class="font-heading text-2xl font-bold tracking-tight">
            {collection.name}
          </h1>
          {collection.description ? (
            <p class="text-muted">{collection.description}</p>
          ) : null}
        </header>
      )}
      <ProductList shop={shop} collection={collection.slug} />
    </div>
  );
}
