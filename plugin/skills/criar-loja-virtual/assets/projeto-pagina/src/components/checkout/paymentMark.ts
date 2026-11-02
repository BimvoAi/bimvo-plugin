/** Ícones genéricos de cartão e boleto. O PIX usa o símbolo oficial em `PixLogo`. */
const MARKS = {
  credit_card: '/checkout/card.svg',
  boleto: '/checkout/boleto.svg',
} as const;

export function paymentMark(method: string): string | null {
  if (method === 'credit_card' || method === 'boleto') return MARKS[method];
  return null;
}
