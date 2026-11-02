---
name: analisar-anuncios
description: Cruza o gasto das campanhas de Meta Ads, TikTok Ads e Google Ads com as vendas pagas de verdade na BimvoAI (pelo utm_campaign dos pedidos) e mostra o ROAS e o CPA reais de cada campanha, ao lado do que a plataforma informa. Aponta campanhas que gastam sem vender e as que merecem mais verba, e pausa ou ajusta orçamento só com o ok do usuário. Use quando o usuário disser /analisar-anuncios, "qual campanha dá retorno de verdade", "meu ROAS real", "quanto gastei em anúncio e quanto vendi", "qual anúncio pausar", "vale escalar essa campanha", "o Facebook diz uma coisa e minhas vendas outra", "relatório dos anúncios".
---

# ROAS real das campanhas

A plataforma de anúncio conta conversões pelo próprio pixel, com a janela de atribuição dela, e
costuma inflar o resultado. A BimvoAI sabe o que foi pago de verdade e de qual `utm_campaign` o
comprador veio. Esta skill junta os dois.

## Regras

- Tudo acontece na conta que autorizou este assistente.
- Nunca peça, aceite ou repita token de anúncio na conversa. Para conectar, use
  `big_bang_get_ad_connect_link` e mostre o endereço.
- Nunca some valores de moedas diferentes nem converta câmbio. Se a conta de anúncio está numa
  moeda e as vendas em outra, mostre os dois lados separados e diga que o ROAS não dá para
  calcular.
- Pausar, reativar ou mudar orçamento mexe no dinheiro do usuário: só proponha, explique o motivo
  com os números e chame a ferramenta depois do ok explícito, campanha por campanha.
- O que esta skill mostra é **ROAS sobre faturamento**, não lucro: o faturamento é o que o
  comprador pagou, antes das tarifas de pagamento, do frete e do custo do produto. Diga isso uma
  vez na resposta. Quando o lojista quiser lucro de verdade, ou já tiver custo cadastrado, use a
  skill `copiloto-lucro` (`big_bang_get_profit_overview` e `big_bang_get_profit_breakdown`). Não
  invente margem para transformar ROAS em lucro.
- Se as ferramentas citadas não existirem no servidor, diga que a análise de anúncios ainda não
  está liberada.

## Passo a passo

1. **Conexões.** `big_bang_list_ad_connections`. Sem conexão, ofereça
   `big_bang_get_ad_connect_link`. Estado `needs_reconnect`: peça para conectar de novo na tela de
   Anúncios. Sem conta selecionada, liste com `big_bang_list_ad_accounts` e, com o ok do usuário,
   selecione com `big_bang_select_ad_accounts`. Cada conta traz `storeIds`: as lojas que ela
   atende (vazio = todas). Se o usuário tem várias lojas e disser que uma conta é só de uma delas,
   ligue com `big_bang_link_ad_account_stores`, depois do ok.
2. **Período.** Padrão: últimos 7 dias. Use o mesmo período dos dois lados.
   - `big_bang_get_ad_insights` recebe `since` e `until` como dia UTC (`YYYY-MM-DD`, até 90 dias,
     `until` inclusivo).
   - `big_bang_get_metrics_breakdown` recebe `period: { from, to }` em ISO 8601 com fuso, `to`
     exclusivo. Para casar com o lado do anúncio, use `from = <since>T00:00:00Z` e
     `to = <dia seguinte ao until>T00:00:00Z`.
   - Avise que a borda do dia pode deslocar algumas vendas, porque a plataforma conta no fuso da
     conta de anúncio.
3. **Gasto e vendas reais.** `big_bang_get_ad_insights` para cada conta selecionada de cada
   plataforma. Os valores (`spend`, `conversionValue`, `cpa`, `roas`) vêm como texto decimal na
   moeda da conta (`"123.45"`). Cada campanha já traz `sales`: `orders` (pedidos pagos das lojas
   da conta cujo `utm_campaign` casa com a campanha pela regra do passo 5), `revenue` (decimal na
   moeda da conta) e `roas` (ROAS real). O `sales` do topo soma a conta. Use esses números: não
   refaça o casamento das campanhas que já vieram com vendas. Vendas em outra moeda não entram
   em `revenue`; nesse caso, mostre-as à parte com o passo 4.
4. **UTMs sem campanha.** `big_bang_get_metrics_breakdown` com `dimension: "utm_campaign"` e
   `limit: 50`, sem `storeId` se a conta de anúncio atende todas as lojas, ou com a loja certa.
   Serve para achar as UTMs com venda que não casaram com nenhuma campanha.
   Cada linha tem `key` (o valor da UTM), `count` (pedidos pagos), `paidRevenue` por moeda **em
   centavos** (24450 em BRL é R$ 244,50) e `rates.conversion`. A linha `none` são vendas sem UTM.
   Repita com `dimension: "utm_source"` para ver quanto veio de cada plataforma.
5. **Regra do casamento** (a mesma que o servidor usa em `sales`): o `key` da UTM casa com a
   campanha quando é
   1. igual ao `campaignId`, ou traz o id depois de `|` (`nome|id`);
   2. igual ao `campaignName`;
   3. igual ao nome normalizado: minúsculas, sem acento, e espaços, `+` e `%20` tratados como o
      mesmo separador.

   Não invente correspondência por semelhança parcial. Se dois nomes forem parecidos mas não
   iguais, pergunte ao usuário. Liste à parte:
   - campanhas com gasto e sem nenhuma UTM correspondente;
   - UTMs com venda que não batem com nenhuma campanha (podem ser campanhas antigas, renomeadas
     ou tráfego orgânico).
6. **Calcular**, por campanha, a partir de `sales`:
   - ROAS real = `sales.roas` (faturamento pago ÷ gasto);
   - CPA real = gasto ÷ `sales.orders`;
   - diferença = ROAS da plataforma − ROAS real.

   Sem pedidos, o CPA real é "sem vendas", não zero.

## Como apresentar

Comece pela resposta, em uma ou duas frases: "Nos últimos 7 dias você gastou R$ 3.200,00 em
anúncios e vendeu R$ 9.600,00 pelas campanhas, ROAS real de 3,0. A Meta informa 4,1."

Depois, uma tabela com até 10 campanhas, ordenadas por gasto:

| Campanha | Gasto | Vendas pagas | Faturamento | ROAS real | ROAS da plataforma | CPA real |
|---|---|---|---|---|---|---|

Em seguida, só o que ajuda a decidir:

- **Gastando sem vender**: gasto relevante (por exemplo, acima de 2× o ticket médio) e zero
  vendas pagas no período. Sugira pausar.
- **Abaixo do ponto de equilíbrio**: ROAS real abaixo de 1. Se o usuário souber a margem, o
  equilíbrio é 1 ÷ margem (margem de 40% → ROAS 2,5). Pergunte a margem se fizer sentido.
- **Candidatas a escalar**: ROAS real alto e estável com volume razoável de vendas. Sugira subir
  o orçamento diário aos poucos, de 20% a 30% por vez, para não reiniciar o aprendizado.
- **Plataforma muito otimista**: ROAS da plataforma bem acima do real. Isso é normal até certo
  ponto, mas uma diferença grande pede checar o pixel (skill `integrar-servicos`, ferramenta
  `big_bang_test_store_pixel`).
- **Vendas sem UTM** (`none`) altas: o rastreamento está falhando. Veja a seção abaixo.

Com um período curto (1 a 3 dias) ou poucas vendas, diga que a amostra é pequena antes de
recomendar pausar.

## Ações (sempre com confirmação)

- Pausar ou reativar: `big_bang_update_ad_campaign_status` com `status` `paused` ou `active` e
  `confirmed: true`, depois do ok.
- Orçamento diário: `big_bang_update_ad_campaign_budget` com `dailyBudget` decimal na moeda da
  conta (`"50.00"`) e `confirmed: true`. Só funciona em campanha que já tem orçamento diário. Se a
  verba estiver no conjunto de anúncios ou o orçamento for total, diga que precisa ser feito no
  gerenciador da plataforma.
- A BimvoAI ainda não cria campanha nem mexe em conjunto de anúncios, anúncio ou criativo.

## Quando as UTMs não batem

Se poucas campanhas casarem, explique como deixar a UTM das campanhas no padrão. O ideal é usar o
id da campanha, que não muda quando a campanha é renomeada:

| Plataforma | Parâmetros de URL do anúncio |
|---|---|
| Meta Ads | `utm_source=facebook&utm_campaign={{campaign.id}}` |
| TikTok Ads | `utm_source=tiktok&utm_campaign=__CAMPAIGN_ID__` |
| Google Ads | `utm_source=google&utm_campaign={campaignid}` |

Avise que a mudança vale só para cliques novos: as vendas antigas continuam com a UTM de antes.

## Erros

| Código | O que fazer |
|---|---|
| `ADS_NOT_CONNECTED` | Mostrar o endereço de `big_bang_get_ad_connect_link`. |
| `ADS_NEEDS_RECONNECT`, `ADS_CREDENTIALS_INVALID` | Pedir para conectar de novo na tela de Anúncios. |
| `ADS_PERMISSION_MISSING` | A conexão não tem permissão de leitura ou gestão de anúncios; conectar de novo aceitando todas as permissões. |
| `ADS_ACCOUNT_NOT_SELECTED`, `ADS_ACCOUNT_NOT_ACCESSIBLE` | Listar as contas e selecionar uma acessível. |
| `ADS_PLATFORM_NOT_CONFIGURED`, `ADS_AUTH_METHOD_UNAVAILABLE` | A plataforma ainda não está liberada na BimvoAI; seguir com as outras. |
| `ADS_PERIOD_INVALID` | Ajustar para até 90 dias, sem data futura. |
| `ADS_CAMPAIGN_NOT_FOUND` | Listar as campanhas de novo com `big_bang_list_ad_campaigns`. |
| `ADS_BUDGET_UNSUPPORTED` | A campanha não usa orçamento diário; ajustar no gerenciador da plataforma. |
| `ADS_UNAVAILABLE` | A plataforma não respondeu; tentar de novo em alguns minutos. |
| `INVALID_PERIOD`, `INVALID_BREAKDOWN` | Ajustar o período ou o recorte conforme a mensagem. |
