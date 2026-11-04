# Montar a página aqui e publicar pela BimvoAI

Vale quando você tem `big_bang_start_page_build` e consegue criar arquivos e rodar comandos neste
computador (Claude Code, Codex e afins). A página é montada aqui, a partir do template que vem
com esta skill, e a BimvoAI faz o build e publica. Não há nada para instalar nem build para rodar
aqui, e não gasta créditos de IA da BimvoAI.

## 1. Preparar o projeto

O projeto fica na pasta `paginas/<pageName>` do diretório atual. `pageName` é o da página que o
lojista escolheu no `SKILL.md` (uma existente da loja ou uma nova). Depois de cada publicação, a
pasta guarda em `.bigbang-version.json` a versão que saiu dela (item 6 de "Publicar").

**Página nova**: crie a pasta vazia e copie o template, como em "Começar pelo template", abaixo.

**Página existente**: a base é sempre a versão que está no ar, para não perder o que já foi
publicado de outro computador, pela Cloudfy AI ou numa volta de versão.

1. Chame `big_bang_list_page_versions` com o `storeId` e o `pageId` da página e pegue a versão
   com `live: true`.
2. Se a pasta existe e o `versionId` de `.bigbang-version.json` é o dessa versão, continue nela.
3. Se não (pasta ausente, sem `.bigbang-version.json` ou com outra versão), traga o projeto da
   versão no ar, como em "Baixar o projeto da versão no ar". Antes, se a pasta existe:
   - Veja se ela tem mudanças que não foram publicadas:
     `find "paginas/<pageName>" -newer "paginas/<pageName>/.bigbang-version.json" -type f -not -path '*/node_modules/*' -not -path '*/dist/*'`
     (sem `.bigbang-version.json`, considere que tem).
   - Sem mudanças: diga em uma frase que a página no ar (versão N) é mais nova que a cópia
     deste computador e que vai trabalhar sobre ela.
   - Com mudanças: diga que a página no ar (versão N) não é a que este computador tem e que
     aqui há alterações ainda não publicadas, e pergunte se ele quer partir da página no ar
     (recomendado) ou publicar as alterações daqui por cima dela. Na segunda opção, continue
     na pasta como está.
   - Partindo da página no ar, renomeie a pasta para `paginas/<pageName>.anterior-<data e hora>`
     (não apague) antes de baixar.
4. Se a versão no ar não tem `hasProject`, ou o download voltar `PROJECT_NOT_SAVED` ou
   `PAGE_VERSION_UNAVAILABLE`, ou o servidor não tiver `big_bang_get_page_project_download`: a
   página não guardou o projeto (veio de um modelo pronto ou é anterior a esse recurso). Use a
   pasta daqui, se existir; se não, avise antes que a página vai ser montada de novo pelo template
   com o que ele pediu, que o visual pode mudar e que a publicação substituirá a que está no ar, e
   siga com o ok dele em "Começar pelo template".

### Baixar o projeto da versão no ar

1. Chame `big_bang_get_page_project_download` com o `versionId` da versão no ar.
2. Baixe, confira o `sha256` e extraia numa pasta nova (o endereço vale 15 minutos):

   ```bash
   mkdir -p "paginas/<pageName>"
   curl -sSfL -o "paginas/<pageName>.projeto.tar.gz" '<downloadUrl>'
   shasum -a 256 "paginas/<pageName>.projeto.tar.gz"
   tar -xzf "paginas/<pageName>.projeto.tar.gz" -C "paginas/<pageName>"
   rm "paginas/<pageName>.projeto.tar.gz"
   ```

   Se o `shasum` não bater com o `sha256` devolvido, apague o arquivo e baixe de novo; se
   continuar diferente, trate como projeto não guardado (item 4, acima).
3. Grave `.bigbang-version.json` na pasta com `versionId`, `versionNumber` (o `number` da versão)
   e `pageName`.
4. Siga em "2. Personalizar" sobre o que está na pasta, mudando só o que o lojista pediu. Não
   copie o template por cima.

### Começar pelo template

- Copie para a pasta o conteúdo de `assets/projeto-pagina/`, que fica na pasta desta skill (onde
  está o `SKILL.md`): `cp -R "<pasta da skill>/assets/projeto-pagina/." "paginas/<pageName>/"`.
- Em `src/config.ts`, deixe `apiUrl`, `storeId` e `kind` como vieram (vazios): a página lê a loja
  do manifesto ao abrir. Siga o `SKILL.md` da tarefa para o resto da configuração.
- Não crie `public/bigbang-page.json` agora: ele vem de `big_bang_start_page_build`, no passo 3.

## 2. Personalizar

- Mude só a apresentação, em `src/app.tsx`, `src/index.css` e `src/components/`: cores, fontes,
  layout, textos de interface. Logo e imagens da marca vão em `public/brand/`.
- Não altere `package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx` nem
  `bigbang-template.json`: o build da BimvoAI usa a configuração dele, e o `bigbang-template.json`
  diz de que template o projeto saiu.
- A lógica de pagamento, API, eventos e formulários vem do kit: importe só de
  `@bigbang/page-kit/<entrada>` (`checkout`, `forms`, `page`, `pixels`, `router`, `slots`,
  `storefront`), como o template já faz, e não crie cópia dela. Além do kit, só `preact`,
  `lucide-preact` e `dayjs`.
- Aqui não há prévia. O editor pode acusar que `@bigbang/page-kit` não existe: é esperado, o kit
  fica no servidor. Não tente instalá-lo.

## 3. Publicar

1. Confira `big_bang_get_account_status` como no Passo 1 do `SKILL.md`.
2. Chame `big_bang_start_page_build` com `storeId`, `pageName`, `description` (uma frase sobre o
   que mudou) e `templateRevision`: o `revision` do `bigbang-template.json` da raiz do projeto, ou
   `0` quando o arquivo não existe (projeto de uma versão anterior do plugin). Servidor que recusar
   `templateRevision` como campo desconhecido é anterior a ele: chame de novo sem o campo. O envio
   vence em 15 minutos: faça os passos seguintes em seguida.

   Com `templateNotice` na resposta, o projeto saiu de um template mais antigo que o da BimvoAI. A
   publicação segue. Se a pasta do projeto veio de uma publicação anterior e o template desta
   skill é mais novo (o `revision` de `assets/projeto-pagina/bigbang-template.json` é maior),
   ofereça ao lojista montar de novo pelo template desta skill na próxima mudança. Se o template
   desta skill também é antigo, diga ao lojista, numa frase, para atualizar o plugin da BimvoAI
   (no Claude Code: `claude plugin update bimvo`).
3. Grave o `manifest` devolvido, como JSON, em `public/bigbang-page.json`.
4. Empacote a raiz do projeto e envie com o método, o endereço e os cabeçalhos devolvidos:

   ```bash
   cd "paginas/<pageName>"
   COPYFILE_DISABLE=1 tar -czf ../<pageName>.tar.gz --exclude node_modules --exclude dist \
     --exclude .bigbang-version.json .
   curl -sS -o /dev/null -w '%{http_code}\n' -X PUT --data-binary @../<pageName>.tar.gz \
     -H 'content-type: application/gzip' -H 'x-upload-token: <token de uploadHeaders>' \
     '<projectUploadUrl>'
   ```

   `204` é recebido. Outra resposta traz `code` e `message`: siga a mensagem.
5. Chame `big_bang_build_page` com o `uploadId`:
   - `building`: chame de novo com o mesmo `uploadId`;
   - `published`: siga "Responder ao usuário" em [publicar.md](publicar.md) com `publication`
     (`url` `null`: siga "Domínio");
   - `failed`: `message` traz o erro do build. Corrija os arquivos e repita a partir do item 2
     (um envio não aceita outro projeto). Para o lojista, diga só que está ajustando a página.
6. Apague o `.tar.gz` e grave em `.bigbang-version.json`, na raiz do projeto, `versionId`,
   `versionNumber` e `pageName` de `publication` (sem `versionId`, servidor antigo: não grave). A
   pasta do projeto fica para as próximas mudanças.

## Mudar depois

Para ajustar a página, prepare o projeto como em "1. Preparar o projeto" (a pasta daqui, se ela
saiu da versão no ar, ou o projeto baixado dessa versão), mude só o que foi pedido e publique de
novo com o mesmo `pageName`: a página é substituída e o domínio continua. Avise antes de
substituir. O template só entra quando a versão no ar não guardou o projeto.

## Erros deste caminho

| Código | O que fazer |
|---|---|
| `PROJECT_NOT_SAVED` ou `PAGE_VERSION_UNAVAILABLE` no download do projeto | A versão não tem projeto guardado: siga o item 4 de "1. Preparar o projeto". |
| `PROJECT_NOT_RECEIVED` | O PUT não chegou: repita o item 4 e chame `big_bang_build_page` de novo. |
| `UPLOAD_EXPIRED` | O envio venceu: repita a partir do item 2. |
| `UPLOAD_ALREADY_RECEIVED` | O projeto deste envio já chegou: chame `big_bang_build_page`. |
| `PACKAGE_INVALID` com `MISSING_MANIFEST` ou `MANIFEST_MISMATCH` | Grave em `public/bigbang-page.json` o `manifest` do envio atual e empacote de novo. |
| `PACKAGE_INVALID` com `CONTENT_TOO_LARGE` | Tire do projeto arquivos grandes (imagens em WebP, largura máxima 1600 px) e repita a partir do item 2. |
| `PAGE_BUILD_UNAVAILABLE` | O servidor de build não respondeu: chame `big_bang_build_page` de novo em instantes. |
