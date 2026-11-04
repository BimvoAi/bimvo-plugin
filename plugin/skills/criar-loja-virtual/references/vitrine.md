# Ajustar a loja virtual sem publicar de novo

Boa parte da loja virtual é configuração da loja, não código da página. Ela vale na próxima vez
que o comprador abrir a loja, sem gerar nem publicar versão. Quando o pedido couber aqui, use
estas ferramentas em vez de mexer no projeto da página.

| O lojista quer mudar | Onde |
|---|---|
| Cores, fontes, arredondamento, logo, ícone da aba | `theme` |
| Barra de anúncio no topo (até 5 mensagens com link) | `announcement` |
| Menu do cabeçalho (com submenu) e grupos de links do rodapé | `menus` |
| Página inicial: banners, categorias, vitrines de produtos, abas, grade de imagens, texto, faixa, depoimentos, selos, newsletter, vistos recentemente, promoções | `home` (seções na ordem do lojista) |
| Blocos abaixo do botão de compra na página do produto e a ordem deles | `product` |
| Selos de confiança (frete, troca, compra segura…) | `trustBadges` |
| Parcela e PIX nos cards, favoritos, vistos recentemente, avaliações, avise-me, barra de frete grátis, WhatsApp, popup de newsletter (com cupom), aviso de cookies | `features` |
| Título, descrição e imagem de compartilhamento da loja no Google e nas redes | `seo` |

## A versão no ar mostra as configurações?

Só a loja virtual montada com um template que desenha a vitrine (plugin 1.2.0 ou posterior) lê
essas configurações. Antes de prometer que a mudança aparece sem publicar, confira:

- `big_bang_get_storefront` (e `big_bang_update_storefront`) trazem `livePages`, uma linha por
  página da loja virtual no ar, com `showsSettings`:
  - `true`: siga "Como alterar";
  - `false`: só `seo` e as páginas de conteúdo aparecem nessa página. Veja "Página que não mostra"
    abaixo;
  - `null`: não se sabe (publicada antes de o build registrar o template). Grave e diga ao lojista
    que, se a mudança não aparecer, a página precisa de uma versão nova.
  Quando vier `livePagesNotice`, ele já diz o que avisar.
- Servidor sem `livePages` na resposta (anterior a ele): confira a versão no ar com
  `big_bang_list_page_versions` (a de `live`). Publicada a partir de 04/11/2026 conta como `true`;
  antes disso, como `false`.

### Página que não mostra

Cores, fontes, barra de anúncio, menus, seções da página inicial, blocos do produto, selos e
recursos ficam guardados mas não mudam a loja até ela ganhar uma versão nova. Diga isso ao lojista
antes de gravar, grave o que ele pedir e ofereça publicar a versão nova: monte pelo template atual
e publique com o mesmo `pageName` (Passos 4 e 5 do `SKILL.md`), o que mantém o domínio. Avise que
a página é montada de novo e substitui a que está no ar.

## Como alterar

1. `big_bang_get_storefront` com a loja. `storefront: null` = a página usa o layout padrão.
   `options` traz os tipos de seção, os blocos da página de produto, as fontes e os ícones de selo
   aceitos: ofereça só esses.
2. Monte a mudança e mostre ao lojista em linguagem de negócio ("a barra do topo vai dizer
   'Frete grátis acima de R$ 199', com link para a coleção Novidades").
3. `big_bang_update_storefront` só com as chaves que mudam. Cada chave enviada substitui a guardada
   inteira: parta do que veio no passo 1 e mande a chave completa (para mudar uma seção da home,
   mande a lista `home` toda). `null` apaga a chave.

Textos levam o idioma padrão em `text` e os outros idiomas habilitados em `translations`. Links
apontam para o início, uma categoria, coleção, produto, página de conteúdo, política, busca ou
endereço externo; use o slug que as listas devolvem (`big_bang_list_categories`,
`big_bang_list_collections`, `big_bang_list_products`, `big_bang_list_store_pages`). Imagens só
por endereço https. A configuração inteira tem limite de 64 KB.

A seção de avaliações em destaque ainda não mostra nada na loja; não a ofereça como pronta.
Avaliações na página do produto pedem o recurso de avaliações ligado (skill
`avaliacoes-e-contatos`). Promoções automáticas e embalagem de presente são da skill
`gerenciar-ofertas`; coleções e campos do produto, da `gerenciar-produtos`.

## Páginas de conteúdo

Páginas como "Quem somos", "Como comprar", "Perguntas frequentes" e "Guia de medidas", abertas em
`/p/<slug>`. Até 30 por loja, texto simples (até 20 000 caracteres, com **negrito** e listas
com "- ", sem HTML), traduzível.

- Listar: `big_bang_list_store_pages`; com `slug`, traz o texto completo para editar.
- Criar ou editar: `big_bang_save_store_page`. Texto proposto por você: mostre inteiro e só grave
  depois de o lojista confirmar. Para esconder sem apagar, salve inativa.
- Pôr no menu ou no rodapé: um link de página em `menus` (`big_bang_update_storefront`).
- Guia de medidas de um produto: a página de conteúdo indicada no produto (skill
  `gerenciar-produtos`).
- Apagar: `big_bang_delete_store_page`, depois de confirmar. Links do menu para ela ficam
  quebrados: tire-os em seguida.

Políticas (troca, privacidade, frete e entrega, termos de uso) não são páginas de conteúdo: ficam
na loja (skill `configurar-loja`).

## Loja do tipo checkout

Se a resposta de `big_bang_get_storefront`, `big_bang_update_storefront` ou
`big_bang_save_store_page` trouxer `notice`, a loja não é loja virtual: a configuração foi
guardada, mas só aparece quando a loja passar a ser `ecommerce` e tiver a loja virtual publicada.
Repasse isso ao lojista em uma frase e ofereça mudar o tipo (skill `configurar-loja`).

## No painel

O lojista também faz tudo isso em Minha loja › Loja virtual (Aparência, Barra de anúncio, Menus,
Página inicial, Página de produto, Selos, Recursos, Páginas de conteúdo). Com
`big_bang_abrir_minha_loja`, abra a seção `storefront`.

## Erros

| Código | O que fazer |
|---|---|
| `STOREFRONT_SETTINGS_TOO_LARGE` | Passou de 64 KB: tirar seções, itens de menu ou textos longos. |
| `STORE_PAGE_NOT_FOUND` | Listar as páginas de conteúdo e usar um slug existente. |
| `STORE_PAGE_LIMIT_REACHED` | A loja já tem 30 páginas: apagar uma antes. |
