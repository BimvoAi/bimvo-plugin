---
name: primeiros-passos
description: Guia o usuário do zero até a primeira venda na BimvoAI, conferindo o que já está pronto e fazendo só o que falta - conta conectada, loja, recebimentos, meios de pagamento, produto e página de vendas publicada. Use quando o usuário disser /primeiros-passos, "como começo", "configura tudo pra mim", "quero começar a vender", "o que falta pra eu vender", ou estiver claramente usando a BimvoAI pela primeira vez.
---

# Primeiros passos na BimvoAI

Você leva o usuário até a loja pronta para vender e uma página no ar, sem que ele precise conhecer
a BimvoAI. Confira tudo primeiro e só pergunte ou peça ação do que estiver faltando.

## Regras

- Tudo acontece na conta que autorizou este assistente.
- Nunca peça senha, chave, segredo, token de pixel (server-side)
  ou token de conta de anúncio (Meta, TikTok, Google Ads) na conversa. Para conectar algo,
  mostre o endereço devolvido pela ferramenta e peça para o usuário abrir no navegador.
- Siga a mensagem de erro das ferramentas; o `code` é estável.
- Antes de criar ou alterar algo, chame `big_bang_get_account_status` e veja `finance`
  (`status`, `access`, `openCents`, `readOnlyAt`, `blockedAt`, `financeUrl`). Com
  `access` diferente de `full`, não tente: avise como abaixo.
- Erro `FEES_OVERDUE`: diga em uma frase que a conta está restrita porque há taxas de venda
  vencidas, cite o valor em aberto, mostre o `financeUrl` do erro e não tente outra
  ferramenta de escrita. As páginas e o checkout continuam vendendo.
- Se uma ferramenta citada aqui não existir no servidor, diga que essa parte ainda não está
  liberada e siga para o próximo passo possível.

## 1. Diagnóstico (faça tudo antes de falar com o usuário)

Chame, em paralelo quando possível:

- `big_bang_get_account_status` → conta e financeiro (`finance`).
- `big_bang_list_stores` → lojas, se estão prontas para vender, meios ativos, moedas, produtos e
  páginas.

Para a loja escolhida (a única, a padrão, ou a que o usuário citar), chame
`big_bang_get_payment_settings` e `big_bang_list_products`.

Mostre um checklist curto com o que está pronto (✅) e o que falta (⬜), nesta ordem:

1. Conta conectada ao assistente
2. Loja criada (toda conta já nasce com uma; renomear é opcional)
3. Recebimentos ativos (`account.status` `active` em `big_bang_get_payment_settings`)
4. Meios de pagamento ativos (PIX e cartão)
5. Ao menos um produto ativo
6. Página da loja publicada: "Página de checkout publicada" na loja `checkout`, ou "Loja virtual
   publicada" na loja `ecommerce` (que antes precisa de `missingLegal` vazio)
7. Pixels de anúncio (opcional, não impede a venda): `pixelsSummary` em `big_bang_list_stores`

## 2. Resolver o que falta, um item por vez

- **Loja**: pergunte o nome da marca e se quer renomear a loja padrão
  (`big_bang_update_store`) ou criar outra (`big_bang_create_store`). Pergunte a moeda só se ele
  vender fora do Brasil (padrão BRL).
- **Recebimentos**: quem cadastra e ativa é o lojista, no painel; você só lê o status (skill
  `configurar-pagamentos`). Em análise, ele segue montando a loja e vende quando aprovar. Faltando
  algo do lado dele (verificação de identidade, cadastro recusado ou sem cadastro), peça para ele
  abrir Recebimentos no painel (no app, `big_bang_abrir_minha_loja` com `payments`). Não fale em
  adquirente nem em gateway.
- **Meios de pagamento**: proponha uma configuração padrão e peça só um "ok":
  PIX ativo com 5% de desconto e validade de 30 minutos; cartão em até 12x, sem juros até 3x, com
  a confirmação do banco (3DS) ligada. Com o "ok", uma chamada de
  `big_bang_update_payment_method` por meio:
  - PIX: `method: "pix"`, `active: true`, `adjustmentBps: -500`, `expiresInMinutes: 30`;
  - cartão: `method: "credit_card"`, `active: true`, `maxInstallments: 12`,
    `interestFreeInstallments: 3`, `monthlyInterestBps: 299` (2,99% ao mês; confirme o valor),
    `threeDSecure: true`.
  A loja só vende com `readyToSell: true` (Recebimentos ativos e algum meio ligado).
- **Produto**: pergunte nome, preço e se é físico; crie com `big_bang_create_product`
  (`prices: { "BRL": 9700 }` em centavos, `isPhysical`). Produto físico pede também frete
  (skill `configurar-frete`).
- **Página**: use a skill do tipo da loja: `criar-checkout` (loja `checkout`) ou
  `criar-loja-virtual` (loja `ecommerce`).
  - Loja `checkout`: deixe o carrinho da página vazio. Cada produto ativo é vendido pelo mesmo
    endereço com `?product=` (o identificador). Sem esse parâmetro, a página avisa que falta o
    produto; ela não mostra uma lista para escolher.
  - Loja `ecommerce`: antes, cadastre a identificação do vendedor e as políticas de troca e de
    privacidade (skill `configurar-loja`), senão a BimvoAI recusa publicar a loja virtual.
  - A página só abre no domínio do lojista: depois de publicar, conecte o domínio ou subdomínio
    que ele escolher ("Domínio" na referência de publicação da skill). O item fica pronto quando
    o domínio está ativo.
- **Pixels** (opcional, depois da página): pergunte se ele anuncia no Meta, Google, TikTok ou
  Kwai, e se tem mais de um pixel. Com cada ID público, chame `big_bang_connect_store_pixel` (modo
  `client` por padrão). Na loja `checkout`, pergunte se algum pixel é só de certos produtos
  (`productIds`). Server-side só existe para Meta, TikTok e Google GA4 (`G-...`); siga
  `allowedModes` de `big_bang_list_store_pixels` e os modos da skill `configurar-loja`. Para ele,
  `big_bang_get_pixel_server_connect_link` com o `pixelId` e mostre o endereço, ou a seção Pixels
  em "Minha loja"; o token não entra nesta conversa e, sem ele, o pixel segue pelo navegador. Não
  republica a página para o pixel passar a valer.

Depois de cada item, mostre o checklist atualizado em uma linha (ex.: "5 de 7 prontos"). Os
pixels não entram nessa conta de venda: a loja vende sem eles.

## 3. Fechamento

Quando tudo estiver pronto, diga o endereço da página. Se houver mais de um produto, mostre que o
mesmo endereço vende cada um (`?product=` com o identificador) e sugira os próximos passos úteis,
sem executar: cupom de lançamento (`gerenciar-cupons`), order bump ou upsell (`gerenciar-ofertas`),
acompanhar vendas (`ver-metricas`).
