---
name: criar-loja-virtual
description: Cria e publica a loja virtual completa de uma loja do tipo ecommerce na BimvoAI - início, busca, categorias, página de produto, carrinho, checkout, acompanhamento do pedido e políticas - no domínio do lojista. Também atualiza a loja virtual já publicada, ajusta sem republicar o que é configuração da loja (cores, fontes, logo, barra de anúncio, menus, seções da página inicial, blocos da página de produto, selos, recursos como WhatsApp e popup de newsletter, SEO e páginas de conteúdo) e cuida das versões (listar, voltar a uma versão, publicar uma versão em outra página, usar como base, apagar). Use quando o usuário pedir /criar-loja-virtual ou disser "cria minha loja virtual", "cria minha loja online", "cria o site da loja", "publica a loja virtual", "volta a loja para a versão 2", "muda as cores da loja", "coloca uma barra de anúncio", "arruma o menu da loja", "troca o banner da página inicial", "cria a página quem somos", "liga o botão do WhatsApp", e também quando pedir landing page, página de captura ou link na bio numa loja ecommerce (a skill explica que a página é a loja virtual e oferece criá-la). Para loja do tipo checkout, use a skill criar-checkout.
---

# Criar e publicar a loja virtual

A página de uma loja `ecommerce` é a loja virtual completa: início com destaques, busca,
categorias, página de cada produto, carrinho, checkout, acompanhamento do pedido e políticas. Ela
é só apresentação: catálogo, preços, estoque, frete, cupons, ofertas, políticas e pedidos vêm do
BimvoAI quando o comprador abre a loja. A BimvoAI recusa publicar numa loja a página de outro
tipo, e recusa a loja virtual sem a identificação do vendedor e as políticas.

A página é sempre publicada pela BimvoAI. Como ela é montada depende das ferramentas que você
tem:

- Com `big_bang_criar_projeto_pagina` e `big_bang_publicar_pagina`, monte e publique com elas
  (Passos 4 e 5). O build roda dentro dessas ferramentas: não rode comandos.
- Sem elas, mas com `big_bang_start_page_build` e um terminal (você cria arquivos e roda
  comandos neste computador), monte o projeto aqui pelo template desta skill e envie para a
  BimvoAI fazer o build e publicar, como em [references/montar-aqui.md](references/montar-aqui.md).
- Sem nenhuma das duas (assistente sem terminal), não há como montar a página: diga em uma
  frase que ela é criada pelo Claude Code ou Codex com o plugin da BimvoAI, ou com um modelo
  pronto em Modelos, no painel, e pare.

## Regras

- Tudo acontece na conta que autorizou este assistente. Não existe como agir em outra conta.
- Esta skill é só da loja `ecommerce`. Loja `checkout` tem a página de checkout (skill
  `criar-checkout`); a loja virtual pede mudar o tipo da loja (skill `configurar-loja`).
- Não gere landing page, página de captura, link na bio nem outro site. Se o usuário pedir, diga
  em uma frase que a página da loja é a loja virtual e ofereça criá-la. A apresentação dos
  produtos vem do cadastro dele na BimvoAI.
- Nunca escreva preço, nome, descrição, imagem de produto, estoque, categoria, frete ou política
  no código da página. Mude só a apresentação: cores, fontes, logo, layout, o destaque da página
  inicial e os textos de interface.
- Nunca peça ao usuário senha, token, chave ou segredo na conversa. Quando algo
  precisa ser conectado, mostre o endereço devolvido pela ferramenta e peça para ele abrir no
  navegador.
- Erros das ferramentas trazem `code` estável e uma mensagem com o próximo passo. Siga a mensagem;
  não tente contornar.
- Antes de criar ou alterar algo, chame `big_bang_get_account_status` e veja `finance`
  (`status`, `access`, `openCents`, `readOnlyAt`, `blockedAt`, `financeUrl`). Com
  `access` diferente de `full`, não tente: avise como abaixo.
- Erro `FEES_OVERDUE`: diga em uma frase que a conta está restrita porque há taxas de venda
  vencidas, cite o valor em aberto, mostre o `financeUrl` do erro e não tente outra
  ferramenta de escrita. As páginas e o checkout continuam vendendo.
- Fale com o usuário como descrito em "Como falar com o usuário", logo abaixo.

## Como falar com o usuário

O usuário é lojista, não programador. Tudo o que esta skill e as referências dizem sobre como a
página é feita serve para você, não para ele. Enquanto trabalha e ao terminar, fale só do que ele
vê: a loja, a aparência, os textos, os produtos, o endereço e o que ele pode pedir em seguida.

- Não narre o que acontece por dentro ("criando o projeto", "rodando o build", "empacotando",
  "enviando o pacote", "chamando a ferramenta"). No máximo, diga "estou montando sua loja" e
  "estou publicando".
- Nunca cite tecnologia, ferramenta ou bastidor: nomes de bibliotecas, frameworks, linguagens ou
  hospedagem, "headless", "API", "template", "build", "deploy", "worker", "MCP", nomes de
  ferramentas (`big_bang_*`), scripts, comandos, pastas, nomes de arquivos, classes de CSS,
  componentes, contratos, specs ou o repositório.
- Nunca mostre identificadores nem dados internos: IDs de loja, produto, página, versão ou envio,
  hashes, tamanho do pacote, cabeçalhos, endereços de envio ou de download, JSON, códigos de erro
  ou mensagens de erro cruas. Traduza o erro para o que aconteceu e o que ele pode fazer.
- Se ele perguntar como a loja funciona por dentro, responda em uma ou duas frases simples, sem
  detalhes de implementação.

## Passo 1 — Conferir a conta (antes de gerar qualquer coisa)

1. Se as ferramentas `big_bang_*` não estão disponíveis, o servidor MCP da BimvoAI não está
   instalado ou autorizado neste assistente. Diga isso e indique a tela Assistentes do painel da
   BimvoAI, que mostra como instalar e autorizar em cada assistente. Pare.
2. Chame `big_bang_get_account_status`.
3. Se `finance.access` não for `full`, avise como em "Regras" e pare. Não gere a loja antes
   disso: o usuário perderia o trabalho.

## Passo 2 — A loja, os produtos e os dados legais

Chame `big_bang_list_stores`. O usuário precisa saber em qual loja a página vai ser criada antes
de você gerar qualquer coisa:

- Conversa já ligada a uma loja: use essa loja e diga o nome dela.
- Uma loja só: diga o nome e confirme ("Vou criar na loja Ana Modas, certo?").
- Várias: pergunte qual, mostrando os nomes. Se ele citou uma marca que bate com uma loja, sugira
  essa e confirme. Não escolha sozinho.

Com a loja escolhida:

- `type` `checkout`: diga em uma frase que essa loja vende por página de checkout e que a loja
  virtual pede mudar o tipo da loja. Ofereça as duas saídas: criar a página de checkout (skill
  `criar-checkout`) ou mudar o tipo para loja virtual (skill `configurar-loja`) e voltar aqui.
  Não gere a loja virtual numa loja `checkout`.
- Sem produto ativo (`activeProductCount` 0): não gere a prévia. Diga que a loja virtual precisa
  de produtos para mostrar e ofereça cadastrar com a skill `gerenciar-produtos`.
- `missingLegal` não vazio: avise o que falta (identificação do vendedor, política de troca e
  devolução, política de privacidade) e ofereça cadastrar com a skill `configurar-loja` antes de
  gerar. A BimvoAI recusa publicar a loja virtual sem esses dados.
- Tudo certo: escolha a página, abaixo, e siga [references/loja-virtual.md](references/loja-virtual.md).

### Em qual página publicar

Chame `big_bang_list_pages` com o `storeId` da loja escolhida e considere só as páginas dessa loja
(`storeId` igual). Não continue sem o usuário saber onde a página vai ser publicada:

- Nenhuma página: diga que vai ser criada uma página nova. Sugira o nome a partir da loja (ex.:
  `loja-ana`) e confirme.
- Uma ou mais páginas: mostre cada uma pelo nome e pelo domínio (`customDomain.hostname`, ou "sem
  domínio"), com a versão no ar (`liveVersionNumber`), e pergunte em qual ele quer publicar, ou se
  prefere uma página nova. Não escolha por ele, nem quando há uma só. Página com `matchesStoreType`
  `false` é de outro tipo: diga que ela será trocada pela loja virtual.
- Página existente escolhida: use o `name` dela como nome da página e avise que publicar substitui
  o que está no ar nela e mantém o domínio.
- Página nova: o nome tem 3 a 50 caracteres, só minúsculas, números e hífens, sem hífen nas pontas,
  e não pode ser o de uma página que já existe. Sugira um e confirme.

O nome identifica a página na conta; o endereço é o domínio do lojista (veja "Domínio" em
[references/publicar.md](references/publicar.md)).

## Passo 3 — Entender a apresentação

Pergunte só o que faltar, de uma vez, em no máximo 3 perguntas curtas (pode ser junto com a
pergunta da página, acima). Se o usuário já deu material suficiente, não pergunte nada e siga:

- Identidade: cores, fontes, logo (arquivo local ou endereço que ele forneça).
- O que destacar na página inicial (categorias, produtos em destaque, texto curto da loja).
- Tom dos textos de interface (títulos, botões).

## Passo 4 — Gerar a partir do template

Com `big_bang_criar_projeto_pagina`, crie o projeto passando `storeId` e `kind: ecommerce`. Ele grava `src/config.ts` e `public/bigbang-page.json` com a loja e o tipo; não
altere esses dois. Personalize a apresentação e chame `big_bang_gerar_previa_pagina`. A prévia
roda em modo demonstração, com produtos de exemplo: avise o usuário que, publicada, a loja mostra
o catálogo dele.

Com `big_bang_start_page_build` e um terminal (sem `big_bang_criar_projeto_pagina`), crie o projeto
e personalize a apresentação como em [references/montar-aqui.md](references/montar-aqui.md). Não
há prévia: descreva ao usuário o que vai mudar antes de publicar.


## Passo 5 — Publicar

Com `big_bang_publicar_pagina`, publique quando o usuário pedir, seguindo
[references/publicar.md](references/publicar.md). Com `big_bang_start_page_build`, publique como em
"Publicar" de [references/montar-aqui.md](references/montar-aqui.md). Com `url` `null`, a loja está no ar mas ainda não abre: conecte o
domínio como em "Domínio" de [references/publicar.md](references/publicar.md). Com o domínio
ativo, dê o endereço da loja: ele abre o início, e cada produto e categoria tem endereço próprio
que pode ser compartilhado.

## Ajustar sem publicar de novo

Cores, fontes, logo, barra de anúncio, menus, seções da página inicial, blocos da página de
produto, selos, recursos (WhatsApp, popup de newsletter, favoritos, avise-me, frete grátis,
cookies), SEO e páginas de conteúdo são configuração da loja: mudam na próxima abertura, sem gerar
nem publicar versão. Para esses pedidos, numa loja virtual já publicada, siga
[references/vitrine.md](references/vitrine.md) em vez dos Passos 3 a 5. Gere e publique de novo
só quando o pedido muda o desenho da página (layout, componentes, textos de interface).

## Versões

Pedidos de versões ("quais versões eu tenho?", "volta a loja para a versão 2", "publica a versão
4 como natal", "faz uma nova baseada na versão 2", "apaga as versões antigas"): siga "Versões" em
[references/publicar.md](references/publicar.md).

## Erros da loja virtual

Os erros de publicação e de versões estão em [references/publicar.md](references/publicar.md).

| Código | O que fazer |
|---|---|
| `PAGE_KIND_MISMATCH` | A loja não é `ecommerce` (`storeType`). Oferecer a página de checkout (skill `criar-checkout`) ou mudar o tipo da loja (skill `configurar-loja`). |
| `STORE_LEGAL_INFO_MISSING` | Loja virtual sem identificação do vendedor ou sem política (`missing`). Cadastrar com a skill `configurar-loja` e repetir. |
