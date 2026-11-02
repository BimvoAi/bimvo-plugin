---
name: ver-metricas
description: Mostra como está a operação de uma loja ou de todas as lojas da BimvoAI - faturamento, pedidos pagos, ticket médio, conversão e funil do checkout, aprovação por meio de pagamento e adquirente, reembolsos, cupons, order bump e upsell, ranking de produtos, páginas e campanhas, série por dia e comparação com o período anterior, separado por moeda. Use quando o usuário disser /ver-metricas, "como estão as vendas", "quanto vendi", "faturamento do mês", "qual loja vende mais", "conversão do checkout", "taxa de aprovação do cartão", "qual campanha vende mais", "onde estou perdendo vendas".
---

# Métricas da operação

## Regras

- Tudo acontece na conta que autorizou este assistente.
- Nunca some valores de moedas diferentes nem converta câmbio: mostre uma linha por moeda.
- Taxas "sem dados" significam que não houve base no período; não as trate como zero.
- Os números são lidos na hora; um pedido aparece assim que é pago ou atualizado pelo adquirente.
- Se as ferramentas citadas não existirem no servidor, diga que métricas ainda não estão liberadas.

## Escolher a ferramenta

| Pergunta | Ferramenta |
|---|---|
| "Como estão as vendas?", "quanto vendi?" | `big_bang_get_store_metrics` |
| "Como foi dia a dia?", "qual dia vendeu mais?" | `big_bang_get_metrics_timeseries` |
| "Qual produto/página/campanha/loja/meio vende mais?", "como estão os order bumps?" | `big_bang_get_metrics_breakdown` |
| "Onde perco vendas?", "conversão do checkout" | `big_bang_get_checkout_funnel` (e o resumo) |

Sem `storeId`, as ferramentas de métricas devolvem todas as lojas da conta juntas; para
comparar lojas, use o recorte `store`.

Toda chamada leva `period: { from, to }` em ISO 8601 com fuso (`to` exclusivo, até 366 dias).
Se o usuário não disser o período, use os últimos 7 dias; o resumo já compara com o período
anterior de mesma duração. Interprete "este mês", "ontem", "black friday" no fuso da loja
(`big_bang_get_store` mostra o fuso).

- Valores em dinheiro vêm como lista por moeda, `[{ currency, amount }]`, em unidade mínima
  (centavos): 24450 em BRL é R$ 244,50.
- Série: `granularity` `day` ou `hour` (até 2 dias) e, opcionalmente, `metrics` entre
  `paidRevenue`, `paidOrders`, `checkoutConversion` e `startedCheckouts`.
- Recortes (`dimension`): `payment_method`, `acquirer`, `product`, `page`, `utm_source`,
  `utm_campaign`, `installments`, `currency`, `buyer_country`, `store`, `order_bump`, `upsell`,
  `coupon`; `limit` de 1 a 50 (padrão 10).

## Como apresentar

Comece pela resposta, em uma ou duas frases ("Você faturou R$ 18.240,00 nos últimos 7 dias, 12%
a mais que na semana anterior, com 96 pedidos pagos."). Depois, só o que ajuda a decidir:

- **Resumo**: faturamento pago e líquido, pedidos pagos, ticket médio, conversão, com a variação.
- **Alertas**: destaque o que piorou muito (aprovação do cartão caindo, abandono subindo,
  reembolsos acima do normal) e diga o que investigar.
- **Rankings**: até 5 linhas, a menos que peçam mais.
- **Série**: se o ambiente permitir, um gráfico simples; senão, uma tabela curta ou os picos.

Leitura útil dos números:

- Conversão baixa com muitos "dados completos" e poucos pedidos → problema no pagamento ou no
  frete; olhe o recorte por meio.
- Aprovação de cartão baixa num adquirente → compare adquirentes (recorte `acquirer`) e parcelas;
  na Cloudfy Payments, confira o 3DS em `configurar-pagamentos`.
- PIX com taxa de pagamento baixa → validade curta ou página sem copiar-código fácil.
- Order bump com aceite abaixo de 5% → oferta pouco relacionada ou preço alto.

Faturamento é o que o comprador pagou (com frete e juros), antes das tarifas de pagamento. O
BimvoAI não calcula lucro. Para cruzar vendas com o gasto em anúncios (ROAS real por campanha),
use a skill `analisar-anuncios`.

## Erros

| Código | O que fazer |
|---|---|
| `STORE_NOT_FOUND` | Listar lojas e escolher uma existente. |
| `INVALID_PERIOD` | Ajustar para até 366 dias, com fim depois do início. |
| `INVALID_GRANULARITY` | Por hora só vale para períodos de até 2 dias; usar por dia. |
| `INVALID_BREAKDOWN` | Usar um dos recortes aceitos (a mensagem lista). |
