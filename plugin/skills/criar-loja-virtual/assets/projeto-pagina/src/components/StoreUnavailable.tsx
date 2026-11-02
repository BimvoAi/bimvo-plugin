import { storeUnavailableText } from '@bigbang/page-kit/page';

/** Tela neutra, de página inteira, para a loja fora do ar (sem marca e sem motivo). */
export function StoreUnavailable({ locale }: { locale: string | undefined }) {
  const text = storeUnavailableText(locale);
  return (
    <main class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-white px-4 text-center">
      <h1 class="text-2xl font-semibold text-neutral-900">{text.title}</h1>
      <p class="text-neutral-600">{text.detail}</p>
    </main>
  );
}
