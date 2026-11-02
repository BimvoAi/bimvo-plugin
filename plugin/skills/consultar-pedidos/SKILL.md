---
name: consultar-pedidos
description: Lista e abre pedidos de uma loja da BimvoAI - filtra por situação (pago, aguardando, recusado, expirado, reembolsado, contestado) e período, e mostra um pedido com itens, cupom, frete, comprador, tentativas de pagamento, upsells ligados e a linha do tempo do checkout. Use quando o usuário disser /consultar-pedidos, "últimos pedidos", "pedidos pagos hoje", "o pedido 1234", "por que esse pagamento foi recusado", "a Maria pagou?", "quais PIX expiraram".
---

# Pedidos da loja

## Regras

- Tudo acontece na conta que autorizou este assistente; pedidos de outras contas não existem para
  ele.
- Dados do comprador são pessoais: mostre só o necessário para o que o usuário pediu, e não os
  copie para fora da conversa sem ele pedir.
- A BimvoAI não reembolsa nem cancela pedidos: o estorno é feito no painel de Recebimentos, e o
  pedido é atualizado sozinho quando o pagamento muda. Diga isso se o usuário pedir.
- Se as ferramentas citadas não existirem no servidor, diga que pedidos ainda não estão liberados.

## Listar

`big_bang_list_orders` com `storeId` e, quando fizer sentido, `status` (`paid`,
`awaiting_payment`, `refused`, `expired`, `refunded`...) e `period: { from, to }` em ISO 8601
(data de criação do pedido, até 366 dias). Valores vêm em unidade mínima (centavos).
Interprete datas relativas ("hoje", "semana passada", "em março") no fuso da loja. Vêm até 50 por
vez; use o `nextCursor` como `cursor` para buscar mais só se o usuário quiser.

Mostre uma tabela enxuta: número, data, comprador (nome), total com moeda, meio, situação, e se é
upsell. Termine com um total da página ("12 pedidos pagos, R$ 3.480,00").

## Abrir um pedido

`big_bang_get_order`. Para encontrar pelo nome ou e-mail do comprador, liste no período provável e
filtre. Mostre:

1. Resumo: número, situação, total, meio e parcelas, data.
2. Itens (marcando order bump), cupom, frete e endereço quando houver.
3. Tentativas de pagamento: quando houver recusa, o motivo em linguagem simples.
4. Linha do tempo resumida: do checkout iniciado ao pagamento, destacando onde travou.
5. Pedido de origem ou upsells ligados.

## Perguntas comuns

- "Por que foi recusado?": leia o motivo da tentativa; recusas de cartão costumam ser saldo,
  suspeita de fraude ou dados errados; sugira ao lojista orientar o comprador a tentar PIX.
- "O PIX expirou, e agora?": o comprador pode gerar outro pelo mesmo endereço de acompanhamento
  enquanto o checkout não foi abandonado.
- Para números agregados ("quanto vendi"), use `ver-metricas`.

## Erros

| Código | O que fazer |
|---|---|
| `ORDER_NOT_FOUND` | Conferir o número; listar pedidos no período. |
| `STORE_NOT_FOUND` | Listar lojas e escolher uma existente. |
| `INVALID_PERIOD` | Período maior que 366 dias ou com fim antes do início: ajustar. |
