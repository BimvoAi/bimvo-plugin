---
name: criar-checkout
description: Cria e publica a página de checkout de uma loja do tipo checkout na BimvoAI - o comprador chega pelo link de um produto, vê o produto e paga - no domínio do lojista. Também atualiza o checkout já publicado, entrega o link de venda de cada produto e cuida das versões (listar, voltar a uma versão, publicar uma versão em outra página, usar como base, apagar). Use quando o usuário pedir /criar-checkout ou disser "cria meu checkout", "cria a página de checkout", "publica o checkout", "me passa o link do checkout", "volta o checkout para a versão 2", e também quando pedir landing page, página de captura ou link na bio numa loja checkout (a skill explica que a página é o checkout e oferece criá-lo). Para loja do tipo ecommerce, use a skill criar-loja-virtual.
---

# Criar e publicar a página de checkout

A página de uma loja `checkout` é focada em comprar: o comprador chega pelo link de um produto, vê
uma apresentação curta dele (nome, imagem, descrição e preço, vindos da BimvoAI) e paga. A página
é só apresentação: produtos, preços, frete, cupons, ofertas e pedidos vêm da BimvoAI quando o
comprador abre o link. A BimvoAI recusa publicar numa loja a página de outro tipo.

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
- Esta skill é só da loja `checkout`. Loja `ecommerce` tem a loja virtual (skill
  `criar-loja-virtual`), que já inclui o checkout: diga isso em uma frase e siga por ela.
- Não gere landing page, página de captura, link na bio nem outro site. Se o usuário pedir, diga
  em uma frase que a página da loja é a página de checkout e ofereça criá-la. A apresentação do
  produto vem do cadastro dele na BimvoAI.
- Nunca escreva preço, nome, descrição, imagem de produto ou estoque no código da página. Mude
  só a apresentação: cores, fontes, logo, layout e textos de interface.
- Na página de checkout, não liste produtos para o comprador escolher e não monte seletor,
  grade ou seção "Escolha o produto". Com `products` vazio, o produto vem de `?product=` (ou
  `?produto=`). Sem esse parâmetro e sem carrinho fixo, a página só avisa que o link não indica
  o produto. Quem lista produtos para navegar é a loja virtual.
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
vê: a página, a aparência, os textos, o produto, o endereço e o que ele pode pedir em seguida.

- Não narre o que acontece por dentro ("criando o projeto", "rodando o build", "empacotando",
  "enviando o pacote", "chamando a ferramenta"). No máximo, diga "estou montando sua página" e
  "estou publicando".
- Nunca cite tecnologia, ferramenta ou bastidor: nomes de bibliotecas, frameworks, linguagens ou
  hospedagem, "headless", "API", "template", "build", "deploy", "worker", "MCP", nomes de
  ferramentas (`big_bang_*`), scripts, comandos, pastas, nomes de arquivos, classes de CSS,
  componentes, contratos, specs ou o repositório.
- Nunca mostre identificadores nem dados internos: IDs de loja, produto, página, versão ou envio,
  hashes, tamanho do pacote, cabeçalhos, endereços de envio ou de download, JSON, códigos de erro
  ou mensagens de erro cruas. Traduza o erro para o que aconteceu e o que ele pode fazer.
- Se ele perguntar como a página funciona por dentro, responda em uma ou duas frases simples, sem
  detalhes de implementação.

## Passo 1 — Conferir a conta (antes de gerar qualquer coisa)

1. Se as ferramentas `big_bang_*` não estão disponíveis, o servidor MCP da BimvoAI não está
   instalado ou autorizado neste assistente. Diga isso e indique o guia de instalação
   (`skills/README.md` do repositório BimvoAI). Pare.
2. Chame `big_bang_get_account_status`.
3. Se `finance.access` não for `full`, avise como em "Regras" e pare. Não gere a página antes
   disso: o usuário perderia o trabalho.

## Passo 2 — A loja e o produto

Chame `big_bang_list_stores`. O usuário precisa saber em qual loja a página vai ser criada antes
de você gerar qualquer coisa:

- Conversa já ligada a uma loja: use essa loja e diga o nome dela.
- Uma loja só: diga o nome e confirme ("Vou criar na loja Ana Modas, certo?").
- Várias: pergunte qual, mostrando os nomes. Se ele citou uma marca que bate com uma loja, sugira
  essa e confirme. Não escolha sozinho.

Com a loja escolhida:

- `type` `ecommerce`: a página dessa loja é a loja virtual. Diga isso em uma frase e siga a skill
  `criar-loja-virtual`. Não gere página de checkout.
- Sem produto ativo (`activeProductCount` 0): não gere a prévia. Diga que o checkout precisa de
  um produto para mostrar nome, preço e pagamento, e ofereça cadastrar com a skill
  `gerenciar-produtos`. `big_bang_gerar_previa_pagina` recusa a prévia enquanto não houver
  produto ativo com preço.
- Com produto: escolha a página, abaixo, e siga [references/pagina-de-checkout.md](references/pagina-de-checkout.md).

### Em qual página publicar

Chame `big_bang_list_pages` com o `storeId` da loja escolhida e considere só as páginas dessa loja
(`storeId` igual). Não continue sem o usuário saber onde a página vai ser publicada:

- Nenhuma página: diga que vai ser criada uma página nova. Sugira o nome a partir da loja (ex.:
  `checkout-ana`) e confirme.
- Uma ou mais páginas: mostre cada uma pelo nome e pelo domínio (`customDomain.hostname`, ou "sem
  domínio"), com a versão no ar (`liveVersionNumber`), e pergunte em qual ele quer publicar, ou se
  prefere uma página nova. Não escolha por ele, nem quando há uma só. Página com `matchesStoreType`
  `false` é de outro tipo: diga que ela será trocada pela página de checkout.
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
- Tom dos textos de interface (títulos, botões).

## Passo 4 — Gerar a partir do template

Com `big_bang_criar_projeto_pagina`, crie o projeto passando `storeId` e `kind: checkout`. Ele grava `src/config.ts` e `public/bigbang-page.json` com a loja e o tipo; não
altere esses dois. Deixe `products` vazio (cada produto é vendido pelo link), personalize a
apresentação e chame `big_bang_gerar_previa_pagina`.

Com `big_bang_start_page_build` e um terminal (sem `big_bang_criar_projeto_pagina`), crie o projeto
e personalize a apresentação como em [references/montar-aqui.md](references/montar-aqui.md). Não
há prévia: descreva ao usuário o que vai mudar antes de publicar.


## Passo 5 — Publicar

Com `big_bang_publicar_pagina`, publique quando o usuário pedir, seguindo
[references/publicar.md](references/publicar.md). Com `big_bang_start_page_build`, publique como em
"Publicar" de [references/montar-aqui.md](references/montar-aqui.md). Com `url` `null`, a página está no ar mas ainda não abre: conecte o
domínio como em "Domínio" de [references/publicar.md](references/publicar.md). Com o domínio
ativo, dê o link de venda como em "Link do checkout", abaixo, e não o endereço sem produto.

## Versões

Pedidos de versões ("quais versões eu tenho?", "volta o checkout para a versão 2", "publica a
versão 4 como natal", "faz um novo baseado na versão 2", "apaga as versões antigas"): siga
"Versões" em [references/publicar.md](references/publicar.md).

## Link do checkout

Quando a pessoa pedir o link (depois de publicar, ou "me passa o link do checkout"):

- Sem domínio ativo (`url` `null`): não há link ainda. Conecte o domínio como em "Domínio" de
  [references/publicar.md](references/publicar.md); os links saem quando ele estiver `active`.

- Checkout com `products` vazio: use `productLinks` devolvido por `big_bang_publicar_pagina`, ou
  monte `url?product=<productId>` com `big_bang_list_products`. Se ela citou um produto, entregue
  só esse. Se houver vários e ela não escolheu, entregue um link por produto, com o nome. Nunca
  entregue o endereço sem `?product=`.
- Vários produtos num link só ("um link com o curso e a mentoria", "kit com 2 camisetas e um
  boné"): monte `url?product=<id>:<quantidade>,<id>` com `big_bang_list_products`. A quantidade
  é opcional (1 a 99, sem ela vale 1); até 20 produtos. O comprador paga tudo junto, num pedido.
- Sem produto ativo com preço: não entregue endereço nenhum. Peça para cadastrar um produto e
  explique que o checkout precisa dele para mostrar nome, preço e pagamento.
- Carrinho fixo (`products` preenchido): entregue a url da página sem `?product=`. Esse parâmetro
  substituiria o carrinho.

A prévia (`big_bang_gerar_previa_pagina`) abre o checkout com um produto ativo da loja. Sem produto, ela não abre.

## Erros do checkout

Os erros de publicação e de versões estão em [references/publicar.md](references/publicar.md).

| Código | O que fazer |
|---|---|
| `PAGE_KIND_MISMATCH` | A loja não é `checkout` (`storeType`). Se for `ecommerce`, siga a skill `criar-loja-virtual`. |
| `CHECKOUT_NEEDS_PRODUCT` | A loja não tem produto ativo com preço. Cadastrar com `gerenciar-produtos` e gerar a prévia de novo. Não entregue o endereço da página. |
| `CHECKOUT_PRODUCTS_UNAVAILABLE` | Não deu para ler os produtos. Repetir a prévia. |
