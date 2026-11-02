# Loja virtual (loja `ecommerce`)

A loja virtual é headless: não guarda catálogo, preço, estoque, texto nem política. Ela lê tudo de
`GET /storefront/stores/{storeId}` e das rotas abaixo dela, com `locale` e `currency`, e paga no
mesmo checkout da página de checkout. Contrato: `specs/006-ecommerce-module/contracts/storefront.openapi.yaml`
e `specs/009-store-type-pages/contracts/storefront-legal.openapi.yaml`.

## Antes de gerar

Em `big_bang_list_stores`, a loja precisa de:

- produtos ativos (`activeProductCount` maior que 0) — senão, skill `gerenciar-produtos`;
- `missingLegal` vazio: identificação do vendedor e políticas de troca e devolução e de
  privacidade — senão, skill `configurar-loja`. Sem isso a BimvoAI recusa publicar
  (`STORE_LEGAL_INFO_MISSING`).

## O que o template já faz

Com `kind: 'ecommerce'`, `src/app.tsx` monta `<StoreApp config={config} />`
(`src/components/storefront/`), com estas rotas:

| Caminho | Tela |
|---|---|
| `/` | Início: texto curto da loja, categorias e produtos |
| `/busca?q=` | Busca por nome, descrição, código e opção de variante |
| `/categoria/<slug>` | Produtos da categoria |
| `/produto/<slug ou id>` | Imagens, descrição, preço, preço riscado, variantes, disponibilidade e quantidade |
| `/carrinho` | Carrinho guardado no navegador e conferido na API a cada abertura |
| `/checkout` | Checkout do carrinho (frete, cupom, order bump, PIX, cartão, upsell) |
| `/pedido/<id>#t=<token>` | Acompanhamento do pedido |
| `/politicas/trocas` e `/politicas/privacidade` | Políticas da loja |

Em todas: cabeçalho com busca, idioma, moeda e carrinho; rodapé com quem vende (nome ou razão
social, CPF ou CNPJ, endereço), contato e links das políticas; estados de carregando, API fora do
ar ("tentar de novo") e loja indisponível. Endereço de produto, categoria ou política que não
existe mostra "não encontrado".

Cada produto e categoria tem endereço próprio, que pode ser compartilhado. Idioma e moeda vão na
query (`?locale=&currency=`) e acompanham os links internos.

## O que personalizar

Só a apresentação: classes do Tailwind nos componentes de `src/components/storefront`, cores,
fontes, logo, o destaque da página inicial (`Home.tsx`) e os textos de interface (`copy.ts`).

Não escreva preço, nome, descrição, imagem de produto, estoque, categoria, frete ou política no
código, e não troque as chamadas à API. O carrinho guarda só produto, variante e quantidade.

## Prévia

A prévia (`big_bang_gerar_previa_pagina`) não tem internet: nela a loja virtual roda em modo demonstração, com uma loja
e produtos de exemplo, para conferir o visual e o fluxo. Avise o usuário. Publicada, ela lê o
catálogo dele.

## Publicar

Siga [publicar.md](publicar.md) com `pageKind: ecommerce`. A loja virtual só abre no domínio
do lojista: depois de publicar, conecte o domínio como em "Domínio" de [publicar.md](publicar.md).
