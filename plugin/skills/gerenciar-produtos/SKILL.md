---
name: gerenciar-produtos
description: Cadastra, lista, busca, altera preço e desativa produtos e categorias do catálogo de uma loja da BimvoAI, com preço em cada moeda, tradução por idioma, indicação de produto físico ou digital e os entregáveis (links e instruções) que o comprador de produto digital recebe. Use quando o usuário disser /gerenciar-produtos, "cria um produto", "cadastra meu curso", "muda o preço", "coloca preço em dólar", "traduz o produto", "cria uma categoria", "desativa o produto", "quais produtos eu tenho", "adiciona o link do curso", "quais produtos estão sem conteúdo", ou quando outra skill precisar de um produto que não existe.
---

# Produtos da loja

O preço cobrado vem sempre deste catálogo; a página só referencia o identificador do produto.

## Regras

- Tudo acontece na conta que autorizou este assistente, e o catálogo é por loja.
- Siga a mensagem de erro das ferramentas; o `code` é estável.
- Antes de criar ou alterar algo, chame `big_bang_get_account_status` e veja `finance`
  (`status`, `access`, `openCents`, `readOnlyAt`, `blockedAt`, `financeUrl`). Com
  `access` diferente de `full`, não tente: avise como abaixo.
- Erro `FEES_OVERDUE`: diga em uma frase que a conta está restrita porque há taxas de venda
  vencidas, cite o valor em aberto, mostre o `financeUrl` do erro e não tente outra
  ferramenta de escrita. As páginas e o checkout continuam vendendo.
- Se as ferramentas citadas não existirem no servidor, diga que o catálogo ainda não está liberado.

## Valores

Preços são informados por moeda, na **unidade mínima** da moeda: R$ 97,00 é `9700` em BRL; US$
19,00 é `1900` em USD. Converta o que o usuário disser e mostre de volta formatado ("R$ 97,00")
para ele conferir. O preço na moeda padrão da loja é obrigatório; nas demais moedas aceitas, peça
só se o usuário vende nelas. A BimvoAI não converte câmbio. O mesmo vale para variante e para o
preço riscado (`compareAtPrices`), que só aparece na loja virtual e precisa ser maior que o preço
cobrado naquela moeda.

Nome e descrição são o **idioma padrão** da loja. Tradução dos outros idiomas habilitados
(`pt-BR`, `en` e `es`) vai em `translations`: `{ "en": { "name": "Basic tee", "description": "…" } }`.
O nome e o valor das opções da variante, no idioma que não é o padrão, vão em `optionTranslations`:
`{ "es": { "names": { "Tamanho": "Talla" }, "values": { "Tamanho": { "M": "M" } } } }`.
Não repita o idioma padrão nesse mapa. O mapa enviado substitui o anterior.

## Fluxos

- **Listar**: `big_bang_list_products` (inclua inativos só se pedido). Tabela com nome, preços,
  físico/digital, ativo. Para achar por texto, `big_bang_search_products`.
- **Categorias**: `big_bang_create_category`, `big_bang_list_categories`, `big_bang_update_category`.
  Até 100 por loja. Tradução no mesmo formato do produto.
- **Criar**: precisa de loja, nome e preço. Pergunte se é **físico** só se não for óbvio (curso,
  e-book e mentoria são digitais; camiseta e livro impresso são físicos). Descrição, categoria,
  imagens https (até 8), código e estoque são opcionais. `stock` nulo não controla; `0` esgota.
  Variantes (até 30) trazem opções, preço por moeda, preço riscado e estoque próprios; com
  variante ativa, o checkout exige `variantId`. `big_bang_create_product`. Devolva o identificador
  público: é o que a página usa.
- **Foto anexada na conversa**: se você tem `big_bang_foto_produto` e o usuário anexa uma imagem e
  pede para usá-la num produto, chame `big_bang_foto_produto` com o caminho que vem em `[Anexos]`, a loja e o produto
  (crie o produto antes, se ainda não existir). Não peça link. Uma chamada por foto; ela entra no
  fim da lista. Sem essa ferramenta, só dá para usar imagens https.
- **Alterar**: `big_bang_update_product`. Ao trocar preços, variantes ou traduções, mande a lista
  ou o mapa completo (ele substitui o anterior). Avise que pedidos já gerados mantêm o nome e o
  preço da época, na moeda do pedido.
- **Desativar**: confirme antes. Produto inativo some de carrinhos, order bumps e upsells novos.
  Prefira desativar a pedir para apagar: não existe exclusão.

Produto físico exige frete na loja; se não houver método de envio, ofereça `configurar-frete`.

## Entregáveis do produto digital

É o que o comprador recebe depois do pagamento aprovado: até 20 itens por produto, entre
arquivos, links e um texto de instruções. A BimvoAI manda o link da página de acesso no e-mail
de pedido aprovado e mostra o botão na página de obrigado. Reembolso e chargeback encerram o
acesso na hora.

- **Arquivo** (PDF, e-book, vídeo, ZIP… até 500 MB): só pelo bloco "Entregáveis" da tela do
  produto, em Minha loja → Produtos. Você não envia arquivos: quando o lojista pedir, chame
  `big_bang_abrir_minha_loja` com a seção `products` e diga para arrastar o arquivo no bloco.
- **Link** (aula, área de membros, grupo): título, endereço `https://` e descrição opcional.
  `big_bang_save_product_deliverable` com `kind: 'link'`.
- **Texto** (instruções, chave de acesso): até 5.000 caracteres, um por produto.
  `big_bang_save_product_deliverable` com `kind: 'text'`. Para editar, passe o `deliverableId`.
- **Listar**: `big_bang_list_product_deliverables`. Para achar produtos digitais ativos sem
  conteúdo, `big_bang_list_products_missing_deliverables`: ofereça cadastrar, porque quem compra
  esses produtos não recebe nada pela BimvoAI.
- **Reordenar**: `big_bang_reorder_product_deliverables` com todos os ids na ordem nova.
- **Remover**: confirme antes, avisando que o item some também da página de quem já comprou.
  `big_bang_delete_product_deliverable`.
- Produto físico não tem entregáveis (`PRODUCT_NOT_DIGITAL`). Ao criar um produto digital,
  ofereça cadastrar o conteúdo logo em seguida.

## Vender pelo mesmo endereço da página

A loja pode ter vários produtos e uma só página de checkout. Com o carrinho da página vazio, o
lojista vende cada produto ativo pelo mesmo endereço, compartilhando `?product=<productId>` (o
identificador desta lista; `?produto=` também serve). Sem esse parâmetro, a página avisa que o
link não indica o produto: ela não lista o catálogo. Uma página gravada com carrinho fixo
continua vendendo esse carrinho sem o parâmetro. Quem lista produtos para o comprador navegar é
a loja virtual. Produto inativo não entra no link.

## Erros

| Código | O que fazer |
|---|---|
| `STORE_NOT_FOUND` | Listar lojas e escolher uma existente. |
| `PRODUCT_NOT_FOUND` | Listar os produtos da loja e usar um existente. |
| `CURRENCY_NOT_ACCEPTED` | A loja não aceita a moeda: adicionar com `configurar-loja` ou tirar o preço. |
| `DEFAULT_CURRENCY_PRICE_REQUIRED` | Incluir o preço na moeda padrão da loja. |
| `CATEGORY_NOT_FOUND` | Listar as categorias e usar uma da mesma loja. |
| `SLUG_TAKEN` | Escolher outro endereço curto. |
| `SKU_TAKEN` | O código já existe nesta loja. |
| `COMPARE_AT_NOT_HIGHER` | O preço riscado precisa ser maior que o cobrado na mesma moeda. |
| `VARIANT_INVALID` | Mesmos nomes de opção, na mesma ordem, combinações únicas, até 30. |
| `LOCALE_NOT_ENABLED` | Habilitar o idioma na loja (`configurar-loja`) antes de traduzir. |
| `PRODUCT_NOT_DIGITAL` | Entregável é só para produto digital: confirmar se o produto deve deixar de ser físico. |
| `DELIVERABLE_LIMIT_REACHED` | O produto já tem 20 itens: remover um antes de adicionar. |
| `DELIVERABLE_TEXT_EXISTS` | Já há um texto: editar o existente com o `deliverableId`. |
| `DELIVERABLE_INVALID` | Conferir título (até 120), endereço `https://` (até 2.000) e texto (até 5.000). |
| `DELIVERABLE_FILE_UPLOAD_IN_UI` | Arquivo só pela UI: abrir Minha loja → Produtos com `big_bang_abrir_minha_loja`. |
