# Skills da BimvoAI

Skills que ensinam um assistente de IA (Claude Code, Codex, Gemini CLI, Cursor, VS Code/Copilot,
OpenCode, Claude Desktop) a operar a BimvoAI pelas ferramentas MCP. Com elas instaladas, o usuário
faz tudo conversando: cria a loja, configura os recebimentos (Cloudfy Payments ou adquirente próprio), cadastra produtos, configura frete, cupons
e ofertas, publica a página da loja (página de checkout ou loja virtual, conforme o tipo da loja)
e acompanha pedidos e métricas.

As skills seguem o padrão aberto [Agent Skills](https://agentskills.io) (uma pasta com `SKILL.md`)
e funcionam em qualquer assistente que o suporte.

## Skills

| Skill | O que faz | Situação |
|---|---|---|
| `primeiros-passos` | Diagnostica a conta e leva até a primeira venda, fazendo só o que falta | **disponível** |
| `criar-checkout` | Gera a página de checkout da loja `checkout` (o comprador chega pelo link do produto e paga), headless, publica no domínio do lojista e cuida das versões | **disponível** (features 002, 009 e 026) |
| `criar-loja-virtual` | Gera a loja virtual completa da loja `ecommerce` (início, busca, categorias, coleções, produto, carrinho, checkout, pedido e políticas), headless, publica no domínio do lojista e cuida das versões; ajusta sem republicar tema, barra de anúncio, menus, seções da página inicial, blocos do produto, selos, recursos, SEO e páginas de conteúdo | **disponível** (features 006, 009 e 026) |
| `configurar-loja` | Cria e ajusta lojas, tipo, moedas, fuso, identificação do vendedor, políticas (troca, privacidade, frete e termos), pixels e e-mails ao comprador | **disponível** |
| `configurar-pagamentos` | Mostra os Recebimentos (Cloudfy Payments), conecta adquirentes (Mercado Pago, Pagar.me) e configura PIX, cartão, boleto, parcelas, juros, desconto e 3DS | **disponível** |
| `gerenciar-produtos` | Catálogo com preço por moeda, físico ou digital, categorias com foto e subcategoria, coleções, ficha técnica, amostras, foto por variante, SEO e personalização | **disponível** |
| `configurar-frete` | Métodos de envio por país, estado e CEP, frete grátis | **disponível** |
| `gerenciar-cupons` | Cupons percentuais, fixos e de frete grátis | **disponível** |
| `gerenciar-ofertas` | Order bump, upsell, promoções automáticas (compre 3 pague 2, desconto progressivo) e embalagem de presente | **disponível** |
| `avaliacoes-e-contatos` | Modera, responde e importa avaliações de produto e lista os contatos da newsletter da loja virtual | **disponível** (feature 046) |
| `consultar-pedidos` | Lista e abre pedidos, explica recusas | **disponível** |
| `ver-metricas` | Faturamento, conversão, funil, rankings, por loja ou da conta | **disponível** |
| `analisar-anuncios` | ROAS e CPA reais por campanha (Meta, TikTok, Google Ads) cruzando gasto com vendas pagas por UTM; pausa e orçamento com confirmação | **disponível** |
| `integrar-servicos` | Liga a loja a serviços externos: webhook assinado e Utmify | **disponível** |
| `copiloto-lucro` | Lucro real por pedido, produto, campanha e período, com recomendações que só executam depois do ok | **disponível** (feature 045) |

As ferramentas que as skills chamam estão em `specs/003-checkout-module/contracts/mcp-tools.md`.
Se o servidor conectado for de uma versão sem alguma delas, a skill avisa o usuário de que a
função ainda não está liberada.

## Como as skills de página publicam

- As skills de página escolhem o caminho pelas ferramentas que o assistente tem:
  - Com `big_bang_criar_projeto_pagina` e `big_bang_publicar_pagina` (Cloudfy AI na web), o
    agente monta o projeto e publica por essas ferramentas; o build roda no servidor. O pacote
    sobe pelo fluxo `big_bang_start_page_upload`, envio e `big_bang_publish_page`, que o agente
    nunca chama direto.
  - Com `big_bang_start_page_build` e um terminal (Claude Code e Codex), o
    assistente monta o projeto no computador do usuário a partir do template que a
    skill leva (`assets/projeto-pagina`) e envia só o projeto. O cloud-agent faz o build com o kit
    e a BimvoAI publica, sem créditos de IA (`specs/043-local-page-server-build/contract.md`).
  - Sem terminal (como o claude.ai), não há como montar a página: as skills indicam o Claude
    Code ou o Codex com o plugin, ou um modelo pronto em Modelos, no painel.
- Toda página publicada leva `bigbang-page.json` na raiz (loja e tipo), gravado pelo template ao
  criar o projeto. A BimvoAI recusa o pacote sem ele ou com loja ou tipo diferentes
  (`specs/009-store-type-pages/contracts/page-manifest.md`).
- Ações que alteram a conta pedem confirmação na Cloudfy AI, com o texto de
  `_meta["big-bang/confirmation"]` de cada ferramenta.

## Antes de instalar

- Uma conta na BimvoAI (cadastro pelo site).
- O endereço do MCP da BimvoAI: `https://api.bimvoai.com/mcp`.
- Fora do Claude Code e do Codex: o código deste repositório na máquina (`git clone`), para copiar
  as skills de `plugin/skills/`.

A autorização é sempre pelo navegador (OAuth): o assistente abre a tela da BimvoAI, o usuário entra
com a própria conta e autoriza. Nenhuma senha, token ou chave passa pela conversa.

## Por assistente

Para cada assistente: onde ficam as skills, como registrar o MCP e como autorizar. Fora do Claude
Code e do Codex, copie as pastas de `plugin/skills/` para a pasta de skills indicada e registre o
MCP no assistente. A autorização é sempre do usuário.

### Claude Code

**Jeito mais prático: plugin.** Skills e MCP entram juntos, e as atualizações chegam pelo próprio
Claude Code.

```bash
claude plugin marketplace add bimvoai/bimvo-plugin
claude plugin install bimvo@bimvo
```

Na instalação, o Claude Code pede o endereço do MCP (`mcp_url`). Para mudar depois:
`claude plugin configure bimvo`. Com o plugin, as skills são chamadas como
`/bimvo:criar-checkout`.

**Sem plugin:** copie as pastas de `plugin/skills/` para `~/.claude/skills/` (ou `.claude/skills/`
no projeto) e registre o MCP com:

```bash
claude mcp add --transport http --scope user bimvo https://api.bimvoai.com/mcp
```

**Autorizar:** abra `claude`, digite `/mcp`, escolha `bimvo` e autorize no navegador.

O servidor e o plugin se chamavam `big-bang`. Quem instalou com esse nome: rode
`claude plugin uninstall big-bang@big-bang` (ou `claude mcp remove big-bang`) antes de instalar o `bimvo`, para não ficar com as ferramentas em dobro.

### OpenAI Codex (CLI e app)

**Jeito mais prático: plugin.** O repositório também é um marketplace do Codex
(`.agents/plugins/marketplace.json`, plugin em `plugin/.codex-plugin/plugin.json`):

```bash
codex plugin marketplace add bimvoai/bimvo-plugin
```

Depois, instale o `bimvo` em `/plugins`. O plugin do Codex não tem campo de configuração: o MCP
aponta para produção (`plugin/.codex-mcp.json`). Para outra API, use a instalação sem plugin abaixo.

**Autorizar:** o marketplace pede a autorização na instalação (`"authentication": "ON_INSTALL"`),
e o Codex abre o navegador. Se não abrir, rode `codex mcp login bimvo`.

**Sem plugin:**

- Skills: `~/.agents/skills/` (usuário) ou `.agents/skills/` (repositório).
- MCP, por comando ou em `~/.codex/config.toml`:

  ```bash
  codex mcp add bimvo --url https://api.bimvoai.com/mcp
  ```

  ```toml
  [mcp_servers.bimvo]
  url = "https://api.bimvoai.com/mcp"
  ```

- Autorizar: `codex mcp login bimvo`.

### Gemini CLI

- Skills: `~/.agents/skills/` ou `~/.gemini/skills/` (usuário); `.agents/skills/` ou
  `.gemini/skills/` (projeto).
- MCP, por comando ou em `~/.gemini/settings.json` (Streamable HTTP usa `httpUrl`, não `url`):

  ```bash
  gemini mcp add --transport http -s user bimvo https://api.bimvoai.com/mcp
  ```

  ```json
  { "mcpServers": { "bimvo": { "httpUrl": "https://api.bimvoai.com/mcp" } } }
  ```

- Autorizar: dentro do `gemini`, rode `/mcp auth bimvo`. O login precisa de navegador na mesma
  máquina; não funciona por SSH sem interface gráfica.

### Cursor

- Skills: `~/.agents/skills/` ou `~/.cursor/skills/` (usuário); `.agents/skills/` ou
  `.cursor/skills/` (projeto).
- MCP em `~/.cursor/mcp.json` (ou `.cursor/mcp.json` no projeto):

  ```json
  { "mcpServers": { "bimvo": { "url": "https://api.bimvoai.com/mcp" } } }
  ```

- Autorizar: em Settings > MCP, ative `bimvo` e clique em Login.

### VS Code com GitHub Copilot

- Skills: `~/.agents/skills/` ou `~/.copilot/skills/` (usuário); `.agents/skills/` ou
  `.github/skills/` (projeto).
- MCP em `.vscode/mcp.json` (projeto) ou no `mcp.json` do usuário (comando "MCP: Open User
  Configuration"):

  ```json
  { "servers": { "bimvo": { "type": "http", "url": "https://api.bimvoai.com/mcp" } } }
  ```

- Autorizar: no `mcp.json`, clique em Start sobre `bimvo`; o VS Code abre o navegador.

### OpenCode

- Skills: `~/.agents/skills/` ou `~/.config/opencode/skills/` (usuário); `.agents/skills/` ou
  `.opencode/skills/` (projeto).
- MCP em `~/.config/opencode/opencode.json` (ou `opencode.json` no projeto):

  ```json
  {
    "$schema": "https://opencode.ai/config.json",
    "mcp": { "bimvo": { "type": "remote", "url": "https://api.bimvoai.com/mcp", "enabled": true } }
  }
  ```

- Autorizar: `opencode mcp auth bimvo`.

### Claude Desktop e claude.ai

Não há instalação por linha de comando.

1. **MCP**: Customize > Connectors > Add custom connector, nome `bimvo`, URL do MCP. Em planos
   Team/Enterprise, quem administra adiciona em Organization settings > Connectors e cada pessoa
   clica em Connect.
2. **Skills**: precisam da execução de código ligada (Settings > Capabilities). Compacte cada pasta de
   `plugin/skills/` num `.zip` (por exemplo, `cd plugin/skills && zip -r criar-checkout.zip
   criar-checkout`) e envie um por vez em Customize > Skills > Upload a skill.

Nestes assistentes, a `criar-checkout` e a `criar-loja-virtual` não rodam nada na máquina do
usuário: pedem a página pronta pelo MCP e a Cloudfy AI da BimvoAI monta e publica no servidor. Nos
assistentes de terminal (Claude Code, Codex), elas montam a página no computador do usuário e só o
build roda no servidor.

## Primeiro uso

Depois de instalar e autorizar, peça ao assistente:

> /primeiros-passos

Ele confere a conta e mostra o que falta para vender. Para conferir só a conexão, peça "qual é a
situação da minha conta na BimvoAI?": a resposta deve trazer seu nome e e-mail.

Problemas comuns:

| Sintoma | Causa provável |
|---|---|
| O assistente não vê ferramentas `big_bang_*` | MCP não registrado ou não autorizado: refaça o passo de autorização do assistente. |
| Pede autorização toda hora | Acesso revogado em Configurações > Assistentes, senha redefinida ou 30 dias sem uso. |
| As skills não aparecem | Pasta errada para o assistente, ou o assistente precisa ser reiniciado depois de instalar. |
| "Função ainda não liberada" | A skill depende de ferramentas da feature 003, que o servidor ainda não tem. |

## Atualizar e remover

- **Atualizar:** no plugin do Claude Code, use `claude plugin update bimvo`; no do Codex, atualize
  o marketplace em `/plugins`. Sem plugin: `git pull` e copie as pastas de `plugin/skills/` de
  novo, apagando as de skills que deixaram de existir (a `criar-pagina` virou `criar-checkout` e
  `criar-loja-virtual`).
- **Remover:** apague as pastas das skills (`~/.claude/skills/<nome>`, `~/.agents/skills/<nome>`)
  e remova o servidor `bimvo` do assistente (`claude mcp remove bimvo`,
  `codex mcp remove bimvo`, `gemini mcp remove bimvo`, ou apague a entrada no JSON).
  Revogue o acesso do assistente em Configurações > Assistentes na BimvoAI.

## Para quem mantém as skills

- Cada skill fica em `plugin/skills/<nome>/SKILL.md`. O `name` do frontmatter é igual ao nome da pasta
  (minúsculas e hífens). A `description` diz o que a skill faz e quando usar, com frases que o
  usuário diria.
- No frontmatter, use só `name` e `description` (o claude.ai recusa campos de outros assistentes).
- Material longo vai em `references/` e scripts em `scripts/`, citados pelo `SKILL.md` com caminho
  relativo. Scripts usam só Node 20 e ferramentas presentes em macOS, Linux e Windows.
- As ferramentas são citadas pelo nome do contrato (`big_bang_*`). Os nomes de campo vêm do schema
  que o servidor publica; não os repita na skill, exceto nos fluxos já implementados.
- A tabela de erros de cada skill acompanha os códigos de `McpToolErrorCode`
  (`apps/api/src/mcp/mcp.errors.ts`). Código novo numa ferramenta: atualize a skill que a usa.
- Nenhuma skill pede segredo na conversa. Conectar algo é sempre por um endereço que o usuário
  abre no navegador.
- Antes de abrir PR: `claude plugin validate plugin` e `claude plugin validate .` (marketplace).
  Para ver o custo em tokens: `claude --plugin-dir plugin plugin details bimvo`.
- Mudou a versão? Atualize `version` nos dois manifests (`plugin/.claude-plugin/plugin.json` e
  `plugin/.codex-plugin/plugin.json`). O MCP do Claude Code fica no `plugin.json` (com `mcp_url`
  configurável); o do Codex, em `plugin/.codex-mcp.json`. Não crie `plugin/.mcp.json`: o Claude
  Code o carregaria também e o servidor `bimvo` apareceria em dobro.
- Skill nova entra automaticamente no plugin; só falta
  incluí-la na tabela do topo deste arquivo.
- O template de página que a `criar-checkout` e a `criar-loja-virtual` levam
  (`assets/projeto-pagina`) é cópia de `packages/core/page-template` do repo big-bang. Mudou o
  template? Rode `node skills/sync-page-template.mjs` no big-bang e copie as skills atualizadas
  para cá.
