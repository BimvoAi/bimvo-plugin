/** Foto do produto, ou o espaço reservado que acompanha a página. */
export function ProductPhoto({
  src,
  alt,
  className,
  loading,
}: {
  src: string | null | undefined;
  alt: string;
  className: string;
  loading?: 'lazy';
}) {
  return (
    <img
      src={src || '/brand/empty-product.svg'}
      alt={alt}
      loading={loading}
      class={className}
    />
  );
}
