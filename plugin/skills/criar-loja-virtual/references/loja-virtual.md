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
| `/` | Início: texto curto da loja, categorias e produtos; com a página inicial montada no painel, as seções dela na ordem do lojista |
| `/busca?q=` | Busca por nome, descrição, código e opção de variante, com ordenação e filtros |
| `/categoria/<slug>` | Produtos da categoria (subcategorias, ordenação, filtros de preço, opções e estoque, "ver mais") |
| `/colecao/<slug>` | Produtos da coleção |
| `/produto/<slug ou id>` | Galeria (com a foto da variante), preço, parcela, PIX, promoção, opções (botões, lista ou amostras), personalização, frete estimado, selos, ficha técnica, guia de medidas, avise-me, avaliações, relacionados e vistos recentemente, conforme os blocos da loja |
| `/carrinho` | Carrinho guardado no navegador e conferido na API a cada abertura, com a barra de frete grátis |
| `/checkout` | Checkout do carrinho (frete, cupom, promoção automática, embalagem de presente, order bump, PIX, cartão, boleto, upsell) |
| `/pedido/<id>#t=<token>` | Acompanhamento do pedido |
| `/p/<slug>` | Páginas de conteúdo da loja (sobre, como comprar, guia de medidas) |
| `/favoritos` | Lista de desejos (guardada no navegador) |
| `/rastreio` e `/conta` | O comprador informa o e-mail e recebe os links dos pedidos (sem senha) |
| `/politicas/trocas`, `/politicas/privacidade`, `/politicas/frete` e `/politicas/termos` | Políticas da loja |

Em todas: barra de anúncio, cabeçalho com logo, menu (com submenu), busca, idioma, moeda, conta,
favoritos e carrinho em gaveta; rodapé com os grupos de links, páginas, políticas, newsletter,
quem vende (nome ou razão social, CPF ou CNPJ, endereço) e contato; popup de newsletter, botão
do WhatsApp e aviso de cookies quando a loja liga; estados de carregando, API fora do ar ("tentar
de novo") e loja indisponível. Endereço de produto, categoria, coleção, página ou política que
não existe mostra "não encontrado".

Cada produto e categoria tem endereço próprio, que pode ser compartilhado. Idioma e moeda vão na
query (`?locale=&currency=`) e acompanham os links internos.

## Visual e recursos em dado

Cores, fontes, arredondamento, logo, ícone, barra de anúncio, menus, seções da página inicial,
blocos da página de produto, selos e recursos (parcela e PIX nos cards, favoritos, vistos
recentemente, avaliações, avise-me, frete grátis, WhatsApp, newsletter, cookies) são configurados
pela loja (`big_bang_update_storefront` ou o painel) e chegam em `storefront` na leitura da loja:
mudam sem publicar a página de novo. O tema entra como variáveis CSS `--bb-*` (`index.css`,
`theme.ts`); as classes usam `bg-primary`, `text-primary-fg`, `text-accent`, `text-muted`,
`font-heading` e `rounded-theme`. Para mudar cores ou o conteúdo da página inicial, prefira a
configuração da loja ao código, como em [vitrine.md](vitrine.md). Seção de tipo que a página não desenha vai para `<KitSection>` do
kit.

## O que personalizar

Só a apresentação: classes do Tailwind nos componentes de `src/components/storefront`, o
desenho de cada seção (`HomeSections.tsx`), o layout padrão da página inicial (`Home.tsx`) e os
textos de interface (`copy.ts`).

Não escreva preço, nome, descrição, imagem de produto, estoque, categoria, frete ou política no
código, e não troque as chamadas à API. Parcela, preço no PIX, desconto, promoção e frete grátis
são calculados pelo kit (`installmentPreview`, `pixPrice`, `promotionFor`, `freeShippingProgress`):
não faça conta de dinheiro na página. O carrinho guarda só produto, variante, quantidade e a
personalização preenchida.

## Prévia

A prévia (`big_bang_gerar_previa_pagina`) não tem internet: nela a loja virtual roda em modo demonstração, com uma loja
e produtos de exemplo, para conferir o visual e o fluxo. Avise o usuário. Publicada, ela lê o
catálogo dele.

## Publicar

Siga [publicar.md](publicar.md) com `pageKind: ecommerce`. A loja virtual só abre no domínio
do lojista: depois de publicar, conecte o domínio como em "Domínio" de [publicar.md](publicar.md).
