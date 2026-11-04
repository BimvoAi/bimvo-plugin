---
name: avaliacoes-e-contatos
description: Cuida das avaliações de produto e dos contatos da newsletter da loja virtual de uma loja da BimvoAI - lista avaliações por situação, nota ou produto, aprova, recusa e responde em público, importa avaliações de outra plataforma por CSV e lista quem se cadastrou na newsletter, no popup ou no rodapé. Use quando o usuário disser /avaliacoes-e-contatos, "tem avaliação para aprovar?", "aprova as avaliações", "responde a avaliação", "recusa essa avaliação", "importa minhas avaliações da Shopify", "trazer avaliações da Yampi", "quem se cadastrou na newsletter", "meus leads", "contatos do popup", "e-mail pedindo avaliação".
---

# Avaliações e contatos da loja virtual

As duas coisas nascem na loja virtual (loja `ecommerce`): o comprador avalia o produto na página
dele, e o visitante deixa o e-mail no popup, no rodapé ou numa seção da página inicial.

## Regras

- Tudo acontece na conta que autorizou este assistente, e avaliações e contatos são por loja.
- Siga a mensagem de erro das ferramentas; o `code` é estável.
- Antes de alterar algo, chame `big_bang_get_account_status` e veja `finance`
  (`status`, `access`, `openCents`, `readOnlyAt`, `blockedAt`, `financeUrl`). Com
  `access` diferente de `full`, não tente: avise como abaixo.
- Erro `FEES_OVERDUE`: diga em uma frase que a conta está restrita porque há taxas de venda
  vencidas, cite o valor em aberto, mostre o `financeUrl` do erro e não tente outra
  ferramenta de escrita. As páginas e o checkout continuam vendendo.
- Se as ferramentas citadas não existirem no servidor, diga que avaliações e contatos ainda não
  estão liberados.
- Os dados do comprador (nome, e-mail) são do lojista: mostre só o que ele pediu e não os copie
  para outro lugar.

## Avaliações

Toda avaliação enviada pelo comprador chega como pendente (`pending`) e só aparece na loja
depois de aprovada. Avaliação de quem comprou o produto leva o selo de compra verificada.

- **Ver**: `big_bang_list_reviews`, filtrando por situação (`pending`, `approved`, `rejected`),
  produto ou nota; a resposta traz a contagem por situação. Para "tem avaliação para aprovar?",
  filtre `pending`. Mostre nota, produto, autor, trecho do texto, fotos e se é verificada. Mais
  resultados: passe o `nextCursor`.
- **Aprovar ou recusar**: `big_bang_moderate_review` com `approved` (publica) ou `rejected`
  (tira da loja). A nota média do produto muda na hora. Para várias de uma vez, mostre a lista e
  confirme antes; uma chamada por avaliação.
- **Responder**: `big_bang_moderate_review` com `reply`. A resposta é pública, abaixo da
  avaliação: escreva no tom da loja, mostre o texto e só grave depois de o lojista confirmar.
  `null` apaga a resposta.
- **Importar de outra plataforma**: `big_bang_import_reviews` com o texto do CSV (até 1.000
  linhas), cabeçalho `name, rating, title, body, date, photoUrls, productSlug`, separado por
  vírgula ou ponto e vírgula. `productSlug` é o endereço curto ou o identificador do produto na
  BimvoAI: se o arquivo veio de outra plataforma, troque pelo slug daqui
  (`big_bang_list_products`) antes de importar. As importadas entram já aprovadas e sem o selo de
  compra verificada. Diga quantas entraram e, das puladas (`skipped`), a linha e o motivo.
- **Só no painel** (Minha loja › Avaliações; com `big_bang_abrir_minha_loja`, seção `reviews`):
  publicar sozinhas as avaliações verificadas com nota 4 ou 5, e em quantos dias depois do envio
  sai o e-mail pedindo avaliação. Sem esse prazo, o e-mail não sai, mesmo ligado nos e-mails ao
  comprador (skill `configurar-loja`).
- **Aparecer na loja**: as avaliações só aparecem na página do produto com o recurso de
  avaliações ligado e o bloco de avaliações na página de produto (skill `criar-loja-virtual`,
  "Ajustar sem publicar de novo").

## Contatos (newsletter)

`big_bang_list_leads` lista quem se cadastrou, do mais recente, com e-mail, nome, origem (`popup`,
`footer` ou `section`) e data, e o total. Busca por parte do e-mail ou do nome (`q`) e filtra pela
origem; mais resultados com o `nextCursor`. O arquivo CSV completo sai só no painel (Minha loja ›
Contatos; seção `leads`). O popup, o cupom que ele oferece e a seção de newsletter da página
inicial se ligam na configuração da loja virtual (skill `criar-loja-virtual`).

## Erros

| Código | O que fazer |
|---|---|
| `STORE_NOT_FOUND` | Listar lojas e escolher uma existente. |
| `REVIEW_NOT_FOUND` | Listar as avaliações e usar uma existente. |
| `REVIEW_IMPORT_INVALID` | O CSV não pôde ser lido (cabeçalho, colunas, tamanho): mostrar a mensagem e pedir o arquivo corrigido. |
