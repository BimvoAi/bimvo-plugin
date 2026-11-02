import type {
  ButtonHTMLAttributes,
  ComponentChildren,
  InputHTMLAttributes,
  JSX,
} from 'preact';
import type { FieldProps } from '@bigbang/page-kit/forms';

// Peças visuais do checkout. Troque as classes para seguir a identidade da página.

export function Section({
  title,
  children,
}: {
  title: string;
  children: ComponentChildren;
}) {
  return (
    <section class="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 class="mb-4 text-lg font-semibold">{title}</h2>
      <div class="space-y-4">{children}</div>
    </section>
  );
}

/** Atributos do <input> que os campos do checkout usam. */
interface InputAttrs {
  type?: 'text' | 'email' | 'tel';
  inputMode?: 'text' | 'numeric' | 'email' | 'tel';
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
}

export function Field({
  label,
  error,
  hint,
  field,
  class: className,
  ...input
}: {
  label: string;
  error?: string;
  hint?: string;
  field: FieldProps;
  class?: string;
} & InputAttrs) {
  const id = `f-${field.name}`;
  const props: InputHTMLAttributes<HTMLInputElement> = {
    id,
    type: input.type ?? 'text',
    inputMode: input.inputMode,
    autoComplete: input.autoComplete,
    placeholder: input.placeholder,
    maxLength: input.maxLength,
    ...field,
    'aria-describedby': error ? `${id}-error` : undefined,
    class:
      'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-red-500/10',
  };
  return (
    <div class={className}>
      <label for={id} class="mb-1 block text-sm font-medium text-neutral-700">
        {label}
      </label>
      {/* O tipo do <input> do Preact separa os atributos por `type`; com `type` variável o
          TypeScript não consegue escolher a variante, então as props vão já validadas acima. */}
      <input {...(props as JSX.IntrinsicElements['input'])} />
      {error ? (
        <p id={`${id}-error`} class="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p class="mt-1 text-xs text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  loading,
  class: className = '',
  ...props
}: {
  children: ComponentChildren;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  class?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'class'>) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60';
  const styles =
    variant === 'primary'
      ? 'bg-neutral-900 text-white hover:bg-neutral-800'
      : 'border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50';
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      class={`${base} ${styles} ${className}`}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Alert({
  children,
  tone = 'error',
}: {
  children: ComponentChildren;
  tone?: 'error' | 'info' | 'success';
}) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-amber-200 bg-amber-50 text-amber-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  }[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      class={`rounded-xl border px-4 py-3 text-sm ${styles}`}
    >
      {children}
    </div>
  );
}

/**
 * Aviso "Seu acesso está liberado" com o botão para a página de acesso aos produtos digitais.
 * Abre em outra aba e sem Referer: o link leva o token do comprador.
 */
export function AccessNotice({
  url,
  title,
  detail,
  button,
}: {
  url: string;
  title: string;
  detail: string;
  button: string;
}) {
  return (
    <div class="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left text-emerald-900">
      <div class="space-y-1">
        <p class="text-base font-semibold">{title}</p>
        <p class="text-sm">{detail}</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-5 py-3 font-semibold text-white transition hover:bg-neutral-800"
      >
        {button}
      </a>
    </div>
  );
}

export function Spinner() {
  return (
    <span
      class="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
      aria-hidden="true"
    />
  );
}
