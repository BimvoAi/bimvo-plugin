# Publicar a página e cuidar das versões

Vale para a página de checkout e para a loja virtual. A página é sempre publicada pela BimvoAI;
o caminho depende das ferramentas que você tem:

- **Com `big_bang_publicar_pagina`**, ela faz o build, o empacote, o envio e a publicação. Não rode
  comandos nem envie pacote por outro caminho. Siga "Responder ao usuário", "Versões" e "Erros
  comuns".
- **Com `big_bang_start_page_build` e um terminal** (sem `big_bang_publicar_pagina`), monte o
  projeto aqui e envie para o build da BimvoAI como em [montar-aqui.md](montar-aqui.md). Depois
  siga "Responder ao usuário", "Versões" e "Erros comuns".
- **Sem nenhuma das duas** (assistente sem terminal, como claude.ai ou ChatGPT), não há como
  montar a página: diga em uma frase que ela é criada pelo Claude Code ou Codex com o plugin da
  BimvoAI, ou com um modelo pronto em Modelos, no painel. Versões e domínio continuam valendo
  (veja "Versões" e "Domínio").

## Responder ao usuário

Diga se foi criação ou atualização, o número da versão publicada (`versionNumber`) e o que ele
pode pedir em seguida (ajustar texto, trocar cores, voltar a uma versão anterior). A página só abre
no domínio do lojista: com o domínio ativo, `url` traz `https://<domínio>` e o link de venda segue
as regras do `SKILL.md` da tarefa. Com `url` `null`, a página está no ar mas ainda não abre: não
entregue endereço nem link de venda e siga "Domínio", abaixo.

## Versões

Toda publicação concluída vira uma versão guardada da página, numerada em sequência (1, 2, 3…).
As versões são da loja: só se listam e se reutilizam dentro dela.

- **Listar** ("quais versões eu tenho?"): `big_bang_list_page_versions` com a loja (e `pageId`
  para uma página só). Mostre número, página, data, descrição e qual está no ar (`live`). Versão
  com `available: false` perdeu o pacote e não pode ser publicada.
- **Voltar uma página para uma versão** ("volta para a versão 2"): `big_bang_publish_page_version`
  com o `versionId`, sem `pageName`. Não gera nem envia nada; o domínio continua o mesmo e não
  cria versão nova, só troca a que está no ar.
- **Publicar uma versão em outra página da loja** ("publica a versão 4 como natal"):
  `big_bang_publish_page_version` com `versionId` e `pageName`. Cria a página (ou a versão
  seguinte dela) com a origem registrada. Avise antes se a página de destino já existe: o
  conteúdo dela será substituído.
- **Mudar uma página publicada sem o projeto na conversa** (conversa nova, outro computador): com
  `big_bang_restaurar_projeto_pagina`, traga o projeto da versão no ar (`pageName`) para uma
  subpasta nova (`paginas/<nome>`), gere a prévia com o mesmo nome e siga o fluxo de sempre. Com
  `big_bang_start_page_build`, prepare o projeto como em "1. Preparar o projeto" de
  [montar-aqui.md](montar-aqui.md): ele parte da versão no ar, baixando o projeto dela quando a
  pasta daqui não é dessa versão.
- **Usar uma versão como base** ("faz uma nova baseada na versão 2, com fundo escuro"):
  - Com `big_bang_criar_projeto_pagina`, se o projeto da página ainda existe na conversa, trabalhe
    nele. Se não existe, traga-o com `big_bang_restaurar_projeto_pagina` (`versionId` da versão de
    base, numa subpasta nova `paginas/<nome>`), gere a prévia com o nome da página nova e siga. Se
    voltar `PROJECT_NOT_SAVED`, gere a página de novo pelo template com o que a pessoa pediu.
  - Com `big_bang_start_page_build`, se a versão de base tem `hasProject`, baixe o projeto dela
    para `paginas/<nome da página nova>` como em "Baixar o projeto da versão no ar" de
    [montar-aqui.md](montar-aqui.md), trocando o `versionId` pelo da versão de base, e siga
    "2. Personalizar". Sem projeto guardado (`PROJECT_NOT_SAVED`), monte de novo pelo template
    descrevendo a versão de base e o que mudar. Para reaproveitar a versão sem mudanças, publique-a
    em outra página com `big_bang_publish_page_version`.
- **Origem de cada versão**: `big_bang_list_page_versions` traz `sourceVersion` (versão de que
  partiu) e `sourcePreset` (modelo do catálogo de que partiu, com `name`). Use o nome do modelo
  ao falar da versão ("a versão 1 veio do modelo Checkout Essencial").
- **Apagar** ("apaga as versões antigas"): confirme com o usuário quais versões, porque não se
  desfaz, e chame `big_bang_delete_page_version` para cada uma. A versão no ar de uma página não
  pode ser apagada.

## Atualizar para o template novo

A página no ar guarda o projeto do template de que saiu; recursos novos do template (como o login
de clientes) só chegam a ela com uma atualização. Ofereça quando `templateNotice` (de
`big_bang_start_page_build`) ou `livePagesNotice` disserem que a página saiu de um template
antigo, quando o lojista pedir um recurso novo do template, ou quando a versão no ar em
`big_bang_list_page_versions` tiver `hasProject` e `templateRevision` menor que a atual (`null`
conta como antiga).

Servidor sem `big_bang_upgrade_page_template` é anterior a este recurso: ofereça montar de novo
pelo template, avisando que o visual pode mudar e que a publicação substitui a que está no ar.
Com ela:

1. Diga em uma frase o que a página ganha e que as personalizações dela são mantidas. Com o ok,
   chame `big_bang_upgrade_page_template` com `storeId`, `pageId` e `start: true`.
2. Enquanto `upgrade.status` for `preparing`, chame de novo sem `start` a cada poucos segundos (leva
   cerca de 1 minuto).
3. `ready`: mostre o `previewUrl` (vale 2 horas e usa dados de demonstração, não os da loja), os
   recursos novos (`newFeatures`) e o resumo de `changes` (arquivos atualizados, juntados com as
   mudanças dele e mantidos). Publique com `big_bang_publish_page_template_upgrade` (`storeId`,
   `pageId`, `upgradeId`) só depois que o lojista confirmar, e responda como em "Responder ao
   usuário" com `publication`. A versão anterior continua guardada para voltar. `PAGE_CHANGED`: a
   página ganhou outra versão depois da preparação; prepare de novo com `start: true`.
4. `conflict`: as mudanças da página e o template novo mexem nas mesmas partes dos arquivos de
   `conflicts`. Faça a atualização à mão:
   - Com terminal (`big_bang_start_page_build`): baixe o projeto da versão no ar como em "Baixar o
     projeto da versão no ar" de [montar-aqui.md](montar-aqui.md). O template novo é o
     `assets/projeto-pagina/` desta skill: em cada arquivo de `conflicts`, leve para o projeto o
     que o template mudou, mantendo o que o lojista mudou. Copie também do template o
     `bigbang-template.json` e os arquivos que existem nele e faltam no projeto. Publique como em
     "3. Publicar" de [montar-aqui.md](montar-aqui.md), com o mesmo `pageName`.
   - Com `big_bang_criar_projeto_pagina`: traga o projeto da versão no ar com
     `big_bang_restaurar_projeto_pagina` e crie à parte, numa subpasta nova, um projeto do template
     com `big_bang_criar_projeto_pagina` para servir de template novo; faça o mesmo nos arquivos de
     `conflicts` e publique como sempre.
5. `unsupported`: o projeto saiu de um template antigo demais para atualizar sozinho. Siga como
   num servidor sem a ferramenta (montar de novo pelo template, com o aviso).
6. `failed`: diga em uma frase que a preparação não deu certo (use `message` se ajudar a
   explicar) e ofereça tentar de novo com `start: true`.

## Domínio

A página só abre no domínio do lojista; não há endereço da plataforma. Depois de publicar, com
`url` `null` (ou quando ele pedir, "quero usar loja.minhamarca.com.br"):

1. Pergunte qual domínio ou subdomínio ele quer para a página e chame `big_bang_set_custom_domain`
   com o `pageId` e o `hostname`. Ele não precisa conectar nenhuma conta: a BimvoAI hospeda a
   página e emite o certificado HTTPS sozinho.
2. Mostre os registros de `dnsRecords` (tipo, nome e valor) para ele criar onde gerencia o DNS
   (onde comprou o domínio): CNAME para um subdomínio, registros A para o domínio raiz.
3. Explique o `status`: `pending_dns` (o DNS ainda não aponta para a BimvoAI), `pending_certificate`
   (o DNS já aponta e o certificado HTTPS está sendo emitido) ou `active` (a página abre no
   domínio). A BimvoAI confere sozinha e ativa quando estiver pronto; para ver como está,
   `big_bang_get_custom_domain`. Os links de venda só saem com o domínio `active`. Para tirar o
   domínio, `big_bang_remove_custom_domain`: a página continua publicada, mas deixa de abrir.

## Erros comuns

| Código | O que fazer |
|---|---|
| `PAGE_KIND_MISMATCH` | A página não é a do tipo da loja: checkout para loja `checkout`, loja virtual para `ecommerce`. |
| `PAGE_NAME_TAKEN` | A loja já tem uma página publicada com esse nome. Se o lojista quer publicar nela, publique de novo com o mesmo nome (substitui e mantém o domínio); se quer uma página nova, sugerir outro nome. |
| `PACKAGE_TOO_LARGE` | (com `big_bang_publicar_pagina`) Reduzir imagens (WebP, largura máxima 1600 px) e publicar de novo. |
| `MISSING_MANIFEST` / `MANIFEST_MISMATCH` | (com `big_bang_publicar_pagina`) O projeto não veio do template ou é de outra loja: criar o projeto de novo com `big_bang_criar_projeto_pagina`. |
| `PUBLICATION_IN_PROGRESS` | Outra publicação do mesmo nome está em andamento: esperar 1 minuto e repetir. |
| `STORE_NOT_FOUND` | Listar as lojas de novo e escolher uma existente. |
| `PROJECT_NOT_SAVED` | (com `big_bang_restaurar_projeto_pagina`) A versão foi publicada antes de a BimvoAI guardar o projeto: dizer isso em uma frase e oferecer criar a página de novo. |
| `PAGE_CHANGED` | (atualização do template) A página ganhou outra versão depois da preparação: chamar `big_bang_upgrade_page_template` com `start: true` de novo. |
| `UPGRADE_NOT_READY` | (atualização do template) A atualização não está pronta: consultar com `big_bang_upgrade_page_template` e seguir o `status`. |
| `TEMPLATE_UPGRADE_NOT_NEEDED` | A versão no ar já está no template atual: nada a atualizar. |
| `PAGE_VERSION_NOT_FOUND` | A versão não existe (ou foi apagada): listar as versões de novo e escolher outra. |
| `PAGE_VERSION_OTHER_STORE` | A versão é de outra loja: versões só se reutilizam na própria loja. Escolher uma desta loja ou gerar a página. |
| `PAGE_VERSION_UNAVAILABLE` | O pacote da versão não está mais guardado: escolher outra versão ou gerar a página de novo. |
| `PAGE_VERSION_LIVE` | Essa versão está no ar: publicar outra versão na página antes de apagar. |
| `CUSTOM_DOMAIN_INVALID` / `CUSTOM_DOMAIN_RESERVED` | (domínio) O endereço não serve: pedir um domínio dele, como `loja.marca.com.br`. |
| `CUSTOM_DOMAIN_TAKEN` | (domínio) O domínio já está em outra página: tirar de lá antes ou usar outro. |
| `CUSTOM_DOMAIN_CONFLICT` | (domínio) O domínio mudou no meio do caminho: ler de novo com `big_bang_get_custom_domain` e repetir. |
| `PAGE_NOT_PUBLISHED` | (domínio) Publicar a página antes de configurar o domínio. |
| `PACKAGE_STORAGE_UNAVAILABLE` | O armazenamento não respondeu e nada mudou: repetir em alguns instantes. |
