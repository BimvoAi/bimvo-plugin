---
name: gerenciar-ofertas
description: Cria, lista, ordena e ajusta ofertas de order bump (oferta marcada dentro do checkout, no mesmo pedido) e de upsell (oferta depois da compra, aceita com um clique) de uma loja da BimvoAI, com produtos que disparam a oferta, preço especial por moeda e prazo. Use quando o usuário disser /gerenciar-ofertas, "cria um order bump", "oferta no checkout", "upsell depois da compra", "one click", "quem comprar X ganha oferta de Y", "como estão meus order bumps".
---

# Order bump e upsell

| | Order bump | Upsell |
|---|---|---|
| Quando aparece | No checkout, antes de pagar, se o carrinho tem o produto disparador | Depois do pagamento aprovado de um pedido com o produto disparador |
| Como aceita | Marca uma caixa | Um clique na página de obrigado |
| Pedido | Entra no mesmo pedido e na mesma cobrança | Gera um pedido novo ligado ao original |
| Limite | Até 3 por checkout, na ordem do lojista | Uma de cada vez; ao recusar, aparece a próxima |
| Cupom | Não recebe cupom | Não recebe cupom |

No upsell pago com cartão, o comprador pode precisar digitar o cartão de novo (e confirmar no
banco, quando a loja usa 3DS); em PIX, gera nova cobrança. Upsell de produto físico usa o endereço e o frete do pedido original,
sem cobrar frete de novo.

## Regras

- Tudo acontece na conta que autorizou este assistente, e as ofertas são por loja.
- Siga a mensagem de erro das ferramentas; o `code` é estável.
- Antes de criar ou alterar algo, chame `big_bang_get_account_status` e veja `finance`
  (`status`, `access`, `openCents`, `readOnlyAt`, `blockedAt`, `financeUrl`). Com
  `access` diferente de `full`, não tente: avise como abaixo.
- Erro `FEES_OVERDUE`: diga em uma frase que a conta está restrita porque há taxas de venda
  vencidas, cite o valor em aberto, mostre o `financeUrl` do erro e não tente outra
  ferramenta de escrita. As páginas e o checkout continuam vendendo.
- Se as ferramentas citadas não existirem no servidor, diga que ofertas ainda não estão liberadas.

## Criar

Descubra: qual produto dispara, qual produto é oferecido, preço especial (por moeda, na unidade
mínima) e, no upsell, o prazo para aceitar (5 a 60 minutos; padrão sugerido 15). Busque os
identificadores com `big_bang_list_products`; se o produto oferecido não existe, ofereça criar com
`gerenciar-produtos`. Se o produto oferecido tem variante ativa, peça `offeredVariantId` (uma
variante ativa). O preço cobrado continua o especial; a variante escolhe o estoque, que é reservado
quando o pedido é gerado e devolvido se o pedido expira sem pagamento ou é reembolsado. Produto sem
variante não leva `offeredVariantId`.

- Order bump: `big_bang_create_order_bump`, com título curto e persuasivo (até 80) e descrição
  (até 200). Escreva-os se o usuário não der, e mostre antes de criar.
- Upsell: `big_bang_create_upsell_offer`.

Mostre o preço normal ao lado do especial ("de R$ 97,00 por R$ 47,00") para o usuário conferir.

## Listar, ordenar, ajustar

- `big_bang_list_order_bumps` / `big_bang_list_upsell_offers`: mostre na ordem, com disparadores,
  produto oferecido, preços e se está ativa.
- `big_bang_update_order_bump` / `big_bang_update_upsell_offer`: preço, textos, ordem, ativa.
- Para desempenho (exibições, aceites, taxa de aceite, valor gerado), use `ver-metricas` com o
  recorte de order bump ou upsell.

## Erros

| Código | O que fazer |
|---|---|
| `PRODUCT_NOT_FOUND` | Conferir os produtos da loja. |
| `ORDER_BUMP_NOT_FOUND` / `UPSELL_OFFER_NOT_FOUND` | Listar e usar uma oferta existente. |
| `CURRENCY_NOT_ACCEPTED` | A loja não aceita a moeda do preço especial. |
| `INVALID_ORDER_BUMP_RULE` / `INVALID_UPSELL_RULE` | Ler a mensagem (produto oferecido igual ao disparador, prazo fora da faixa etc.) e ajustar. |
| `STORE_NOT_FOUND` | Listar lojas e escolher uma existente. |
