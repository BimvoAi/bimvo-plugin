---
name: copiloto-lucro
description: Mostra o lucro real da loja (não o faturamento nem o ROAS) por período, produto, campanha e pedido, e propõe o que fazer quando algo dá prejuízo. Use quando o usuário disser /copiloto-lucro, "quanto eu lucrei", "qual produto dá prejuízo", "qual campanha dá lucro", "o que eu faço para lucrar mais", "meu lucro real".
---

# Copiloto de lucro

O lucro real é o que sobrou: faturamento pago menos custo do produto, tarifa do recebimento,
taxa de checkout da BimvoAI (só em venda por adquirente próprio; na Cloudfy Payments é zero),
frete, imposto estimado, anúncio, reembolso e contestação. Quem calcula é o servidor, com regra
fixa. Você explica e, se o lojista confirmar, chama a ferramenta de ação. Você não inventa número
e o servidor não decide sozinho.

Imposto aqui é estimativa gerencial, não apuração fiscal nem conselho contábil. Diga isso quando
falar de imposto.

## Regras

- Tudo acontece na conta que autorizou este assistente.
- Nunca invente custo, alíquota, tarifa ou câmbio. Se o campo veio `null` ou `completeness` é
  `estimated`, diga o motivo (`reasons`) e peça o dado que falta.
- Custo ausente não é zero. `profitBound: "upper"` significa "no máximo este lucro".
- `retroactiveCost: true` significa que o custo foi cadastrado depois da venda. O valor é o que
  está gravado; avise isso.
- Nunca some moedas nem converta. Mostre cada moeda separada.
- Proponha uma ação por vez, com os números. Só chame a ferramenta de ação depois de um "sim"
  explícito para aquela ação.
- Nas ferramentas de anúncio, copie `arguments` da recomendação e acrescente `confirmed: true` e
  o `proposalId`. Sem `confirmed: true` o servidor recusa.
- Mudança de preço (`big_bang_update_product`) não tem `confirmed`. Mostre o preço atual e o
  novo na pergunta. Só chame depois do sim. Não mande a lista de preços incompleta: se o produto
  tem outras moedas, busque o preço atual e preserve as moedas que não mudam.
- Google Ads e campanha indicada como Mira vêm com `kind: "manual"`. Não chame ferramenta de
  pausa. Diga o que fazer na plataforma ou na Mira.
- Amostra em `insufficientData`: avise que ainda é cedo e não recomende pausar nem cortar verba.
- `confidence: "low"`: a primeira ação é completar o dado (em geral cadastrar custo), não pausar
  nem mudar preço.
- Se as ferramentas de lucro não existirem no servidor, diga que o lucro real ainda não está
  liberado.

## Passo a passo

1. **O que já está cadastrado.** `big_bang_get_profit_settings` e `big_bang_list_product_costs`
   com `missingOnly: true` e `limit: 50`. Se faltar custo dos produtos que mais vendem, peça os
   valores em centavos (0 só se o custo for realmente zero) e grave com
   `big_bang_set_product_cost` depois do ok. Sem `effectiveFrom`, o custo vale também para os
   pedidos já pagos e vem marcado como retroativo: avise antes de gravar.
2. **Período.** Se a pessoa não disse, use os últimos 7 dias no fuso da loja.
   `period: { from, to }` em ISO 8601, `to` exclusivo, no máximo 90 dias.
3. **O número.** `big_bang_get_profit_overview` com esse período.
4. **Onde está.** `big_bang_get_profit_breakdown` por `product` e por `campaign`
   (`sort: "profit"`, `limit: 20`). Em campanha, `spend` é texto decimal e `platformRoas` é só
   o que a plataforma informou: não some com o lucro.
5. **O que fazer.** `big_bang_get_profit_recommendations` e `big_bang_list_profit_alerts` com
   `status: "open"`. Explique a evidência. Para cada ação que a pessoa aceitar, chame a
   ferramenta indicada.
6. **Dispensar alerta.** `big_bang_dismiss_profit_alert` só se a pessoa pedir para ignorar.

## Como apresentar

A primeira frase responde. Exemplo: "Na semana você faturou R$ 9.600,00 e lucrou R$ 1.850,00,
margem de 19%; o número é estimado porque 2 produtos estão sem custo."

Valores da visão geral vêm em centavos (960000 é R$ 9.600,00). `spend` da campanha já vem em
decimal ("500.00").

Depois, uma tabela curta (produto ou campanha, faturamento, lucro, margem) e no máximo uma
ação, com o que muda se a pessoa disser sim.
