---
name: gerenciar-cupons
description: Cria, lista, altera e desativa cupons de desconto de uma loja da BimvoAI - percentual, valor fixo por moeda ou frete grátis, com validade, limite de usos total e por comprador, valor mínimo e produtos elegíveis - e mostra quantas vezes cada cupom foi usado. Use quando o usuário disser /gerenciar-cupons, "cria um cupom", "cupom de 10%", "BLACKFRIDAY", "frete grátis com cupom", "desativa o cupom", "quantas pessoas usaram o cupom".
---

# Cupons da loja

## Regras

- Tudo acontece na conta que autorizou este assistente, e os cupons são por loja.
- Siga a mensagem de erro das ferramentas; o `code` é estável.
- Antes de criar ou alterar algo, chame `big_bang_get_account_status` e veja `finance`
  (`status`, `access`, `openCents`, `readOnlyAt`, `blockedAt`, `financeUrl`). Com
  `access` diferente de `full`, não tente: avise como abaixo.
- Erro `FEES_OVERDUE`: diga em uma frase que a conta está restrita porque há taxas de venda
  vencidas, cite o valor em aberto, mostre o `financeUrl` do erro e não tente outra
  ferramenta de escrita. As páginas e o checkout continuam vendendo.
- Se as ferramentas citadas não existirem no servidor, diga que cupons ainda não estão liberados.

## O que o comprador vive

- Um cupom por checkout. O código não diferencia maiúsculas.
- O desconto vale só sobre os produtos elegíveis (todos, se nenhum for escolhido), nunca sobre
  itens de order bump, e nunca deixa o valor negativo.
- Cupom de valor fixo só vale nas moedas em que tem valor; o percentual vale em qualquer moeda.
- Cupom de frete grátis só é aceito em carrinho com produto físico.
- O uso é contado quando o pedido é gerado e devolvido se o pedido não for pago.

## Criar

Monte a partir da frase do usuário e confirme numa linha antes de criar:

- "10% de desconto" → tipo percentual, 10.
- "50 reais de desconto" → tipo fixo, 5000 em BRL.
- "frete grátis" → tipo frete grátis.
- "até domingo" → fim da validade no domingo às 23:59 no fuso da loja.
- "só os 100 primeiros" → limite total 100. "uma vez por pessoa" → limite por comprador 1.
- "acima de 200 reais" → valor mínimo 20000 em BRL.
- "só no curso X" → produtos elegíveis (busque o identificador com `big_bang_list_products`).

Sugira um código curto e memorável se o usuário não deu (3 a 30 caracteres). Chame
`big_bang_create_coupon` (`code`, `kind`: `percent` | `fixed` | `free_shipping`, `percent` de 1 a
100, `fixedAmount` e `minSubtotal` por moeda em unidade mínima, `startsAt`/`endsAt` em ISO 8601,
`maxUses`, `maxUsesPerBuyer`, `productIds`).

## Listar, ajustar, desativar

- `big_bang_list_coupons`: mostre código, desconto, validade, usos / limite, ativo.
- `big_bang_update_coupon`: para mudar regra ou desativar. Confirme antes de desativar um cupom em
  uso; checkouts abertos com ele terão de revisar o total.
- Para saber o desconto total concedido por cupom no período, use a skill `ver-metricas`.

## Erros

| Código | O que fazer |
|---|---|
| `COUPON_CODE_TAKEN` | Já existe na loja: sugerir variação ou editar o existente. |
| `COUPON_NOT_FOUND` | Listar os cupons e usar um existente. |
| `PRODUCT_NOT_FOUND` | Conferir os produtos com `big_bang_list_products`. |
| `CURRENCY_NOT_ACCEPTED` | A loja não aceita a moeda do valor fixo ou mínimo. |
| `INVALID_COUPON_RULE` | Ler a mensagem (percentual fora de 1 a 100, fim antes do início etc.) e ajustar. |
| `STORE_NOT_FOUND` | Listar lojas e escolher uma existente. |
