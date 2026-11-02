/** Ícone genérico do cartão. O PIX usa o símbolo oficial em `PixLogo`. */
const MARKS = {
  credit_card: '/checkout/card.svg',
} as const;

export function paymentMark(method: string): string | null {
  if (method === 'credit_card') return MARKS[method];
  return null;
}
