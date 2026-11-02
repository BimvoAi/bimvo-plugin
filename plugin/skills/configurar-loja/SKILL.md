---
name: configurar-loja
description: Cria, lista e ajusta lojas na BimvoAI - nome, tipo (checkout ou ecommerce), identificação do vendedor e políticas da loja virtual, idiomas, moedas aceitas, moeda padrão e fuso horário - pixels de anúncio (Meta, Google, TikTok, Kwai), e mostra o que cada loja tem (páginas, produtos, meios de pagamento, se está pronta para vender). Use quando o usuário disser /configurar-loja, "cria uma loja", "minhas lojas", "renomeia a loja", "quero vender em dólar/euro", "muda o fuso da loja", "qual loja está pronta", "loja em inglês", "loja virtual", "CNPJ da loja", "política de troca", "política de privacidade", "pixel da Meta", "pixel do TikTok", "tag do Google", "pausar pixel", "pixel por produto".
---

# Lojas na BimvoAI

Cada conta pode ter até 20 lojas; a conta já nasce com uma loja padrão. Toda página, produto,
regra de pagamento, cupom, oferta, frete, pedido e métrica pertence a uma loja, e nada
é herdado entre lojas.

## Regras

- Tudo acontece na conta que autorizou este assistente.
- Nunca peça chaves ou tokens na conversa. O token de pixel server-side entra só no formulário
  de `big_bang_get_pixel_server_connect_link`.
- Siga a mensagem de erro das ferramentas; o `code` é estável.
- Antes de criar ou alterar algo, chame `big_bang_get_account_status` e veja `finance`
  (`status`, `access`, `openCents`, `readOnlyAt`, `blockedAt`, `financeUrl`). Com
  `access` diferente de `full`, não tente: avise como abaixo.
- Erro `FEES_OVERDUE`: diga em uma frase que a conta está restrita porque há taxas de venda
  vencidas, cite o valor em aberto, mostre o `financeUrl` do erro e não tente outra
  ferramenta de escrita. As páginas e o checkout continuam vendendo.
- Se `big_bang_list_stores` não existir no servidor, diga que lojas ainda não estão liberadas e pare.

## Listar

`big_bang_list_stores`. Mostre uma tabela curta: nome, tipo (`checkout` ou `ecommerce`), idioma
padrão, idiomas habilitados, padrão (sim/não), pronta para vender, meios ativos,
moedas, produtos ativos, páginas. Destaque o que impede de vender (Recebimentos ainda não ativos,
nenhum meio ligado, produtos sem preço numa moeda aceita) e, na loja `ecommerce`, o que falta em `missingLegal` para
publicar a loja virtual.

## Criar

Pergunte o nome (2 a 80 caracteres) se não foi dito. O tipo decide a única página da loja:
`checkout` (padrão) publica a página de checkout; `ecommerce` publica a loja virtual, com
catálogo, carrinho e checkout. Use `ecommerce` quando o lojista quiser uma loja com vários
produtos para o comprador navegar. Moeda padrão é BRL e idioma padrão
é `pt-BR`; só pergunte se o usuário falou em vender fora do Brasil ou em outro idioma. Chame
`big_bang_create_store`. Em seguida ofereça configurar PIX e cartão (skill `configurar-pagamentos`).

## Ajustar

`big_bang_update_store` com o que mudou:

- **Nome**.
- **Tipo**: `checkout` (página de checkout) ou `ecommerce` (loja virtual). Dá para trocar depois;
  a resposta traz em `mismatchedPages` as páginas publicadas que ficaram de outro tipo. Mostre
  essas páginas e ofereça gerar a do tipo novo com o mesmo nome, que mantém o endereço: skill
  `criar-checkout` para `checkout`, `criar-loja-virtual` para `ecommerce`.
- **Identificação do vendedor** (`seller`, exigida na loja virtual): nome ou razão social, CPF ou
  CNPJ e endereço completo (rua, número, complemento opcional, bairro, cidade, UF, CEP). Peça os
  dados ao usuário; não invente. O objeto enviado substitui o anterior.
- **Políticas** (`policies`, exigidas na loja virtual): `returns` (troca e devolução) e `privacy`
  (privacidade), em texto simples. O texto do idioma padrão vai em `text`; os outros idiomas
  habilitados, em `translations`. Se o usuário pedir ajuda, proponha um texto inicial curto e
  claro (no Brasil, cite o direito de arrependimento de 7 dias da compra on-line e como os dados
  são usados), mostre o texto inteiro, diga que o conteúdo é responsabilidade dele e só grave
  depois que ele confirmar. Uma política ausente no envio fica como está; `null` apaga.
- **Idiomas**: `defaultLocale` e `enabledLocales`. O catálogo traduz `pt-BR`, `en` e `es`. O idioma
  padrão entra sempre na lista. O texto curto do padrão vai em `tagline`; o dos outros idiomas, em
  `taglineTranslations` (o mapa enviado substitui o anterior). Nome e descrição de produto no
  idioma padrão ficam nos campos principais; se mudar o padrão, peça para recolocar esse texto e
  mover o antigo para `translations` (skill `gerenciar-produtos`).
- **E-mail de contato** (`supportEmail`).
- **Página de obrigado externa** (`thankYouUrl`, só `https://`): depois do pagamento aprovado, o
  comprador vai para esse endereço com `?order=<orderId>&token=<orderToken>`. Vale para todas as
  páginas da loja na hora, sem republicar. `null` volta para a página de obrigado padrão, que toda
  página publicada já tem em `/obrigado/<pedido>`. Se houver upsell, ele aparece antes.
  Com página externa, o comprador de produto digital não vê o botão de acesso da BimvoAI: o link
  da página de acesso chega pelo e-mail de pedido aprovado (ou por um e-mail só de acesso, se
  esse estiver desligado). A página externa não recebe os entregáveis.
- **Fuso horário** (ex.: `America/Sao_Paulo`, `Europe/Lisbon`): afeta como as métricas agrupam dias.
- **Moedas aceitas e moeda padrão** (códigos ISO 4217, até 10):
  - A moeda padrão não pode sair da lista.
  - Para virar padrão, a moeda precisa ter preço em todos os produtos ativos
    (`MISSING_PRICES_FOR_CURRENCY`): ofereça preencher os preços com `gerenciar-produtos`.
  - A BimvoAI não converte câmbio: cada produto, frete e oferta precisa de preço em cada moeda.
  - Os pagamentos (PIX e cartão) cobram só em BRL: outra moeda ainda não tem meio de pagamento.
    Diga isso se o usuário quiser vender em outra moeda.

## Pixels de anúncio

Ficam na loja, não na página, e valem para todas as páginas dela sem republicar. A loja aceita
até 20, inclusive vários da mesma plataforma (`meta`, `google`, `tiktok`, `kwai`), cada um com
nome, eventos, modo e token próprios. `big_bang_list_stores` traz `pixelsSummary`.

- **Sempre liste antes de mudar**: `big_bang_list_store_pixels`. As outras ferramentas pedem o
  `pixelId` de lá. Se o pedido citar só a plataforma ("pausa o pixel da Meta") e houver mais de
  um dela, pergunte qual, mostrando nome e ID público, antes de alterar.
- **Instalar**: `big_bang_connect_store_pixel` cria um pixel novo (modo `client` por padrão,
  `mode` e `name` opcionais). Para mudar um que existe, nunca instale de novo.
- **Pausar e reativar**: `big_bang_update_store_pixel` com `active: false` ou `true`. Pausar
  guarda tudo; prefira a remover quando o usuário quer só parar. Remover:
  `big_bang_remove_store_pixel` (apaga o token junto).
- **Renomear, trocar ID, modo ou código de teste**: `big_bang_update_store_pixel`.
- **Eventos**: `big_bang_update_store_pixel_events`, por pixel.
- **Por produto** (só loja `checkout`): `productIds` ao instalar ou `productScope` em
  `big_bang_update_store_pixel`. Sem escolha, vale para todos os produtos. Na loja `ecommerce`,
  não tente: explique que o pixel vale para a loja inteira porque o comprador monta um carrinho
  com vários produtos, e que a segmentação por produto se faz na plataforma de anúncio com os IDs
  de produto que os eventos já enviam. `scopeStatus: empty` na lista = nenhum produto escolhido
  está ativo e o pixel não dispara: avise.
- Se a resposta trouxer `republishHint`, repasse: a página publicada antes desta versão precisa
  ser republicada uma vez.

### Modos: navegador, servidor ou os dois

Cada pixel tem um `mode`:

- `client` (navegador): o script da plataforma roda na página do comprador.
- `server` (servidor): o servidor da BimvoAI envia os eventos para a API da plataforma. Funciona
  mesmo com bloqueador de anúncio. Precisa do token.
- `both` (os dois): navegador e servidor juntos, com o mesmo id de evento, e a plataforma
  deduplica. Recomendado quando há token. No Google GA4, o servidor envia só a compra
  (`purchase`), porque o GA4 não deduplica e contaria os outros eventos em dobro.

Quem tem servidor: Meta (API de Conversões), TikTok (Events API) e Google com ID GA4 `G-...`
(Measurement Protocol). Google Ads (`AW-...`) e `GT-...` e a Kwai ficam só no navegador; explique
isso se o usuário pedir servidor para eles. Não repita a regra de cabeça:
`big_bang_list_store_pixels` traz, por pixel, `allowedModes` (os modos que a plataforma e o ID
aceitam) e `effectiveMode` (o que vale agora). Ofereça só os modos de `allowedModes`.

Sem token, um pixel em `server` ou `both` continua enviando pelo navegador
(`effectiveMode: client`) até o token ser salvo: avise o usuário em vez de dizer que o servidor já
está valendo.
Trocar o ID público apaga o token, que vale só para o ID anterior; peça o token de novo.

O token entra só fora da conversa: `big_bang_get_pixel_server_connect_link` com o `pixelId` e
mostre o endereço (a página tem o passo a passo de onde gerar o token em cada plataforma), ou, se
você tem `big_bang_abrir_minha_loja`, abra a seção `pixels`. Nunca peça o token aqui.
`big_bang_test_store_pixel` dispara um teste e atualiza o estado do servidor. Se o pixel tiver
`testEventCode`, os eventos do servidor vão para a ferramenta de testes da plataforma: lembre o
usuário de remover o código depois de testar.

O usuário também pode fazer tudo sozinho em Marketing › Pixels, no painel:
instalar com o modo, salvar o token, testar, pausar e remover.

## Recuperação por SMS

A loja pode mandar SMS de PIX pendente, checkout abandonado e cartão recusado.
O texto do SMS é fixo, o mesmo para todas as lojas: começa com o nome da loja, traz o link e o rodapé de opt-out. Nem o lojista nem você editam a mensagem; se pedirem outro texto, explique que não é possível. O telefone do comprador só aparece mascarado.

- `big_bang_get_sms_recovery_settings` mostra fluxos, saldo, preço por segmento e se o débito está ligado.
- `big_bang_update_sms_recovery_settings` liga o fluxo e ajusta o prazo. A 2ª etapa do abandono exige um cupom ativo da loja (1 a 20 caracteres: letras, números, - e _).
- `big_bang_get_sms_recovery_metrics` responde "quanto recuperei com SMS essa semana?" (enviados, cliques, vendas, receita, custo, ROI).
- `big_bang_list_sms_messages` lista os envios com telefone mascarado.
- A recuperação por SMS começa desativada em toda conta e só a Cloudfy libera. Se `billing.featureEnabled` vier `false`, diga isso e oriente pedir a liberação ao suporte; não tente ligar o desconto. Ligar "Descontar SMS do meu saldo" é `big_bang_set_sms_billing_consent`. É ação de dinheiro: mostre o `priceCentsPerSegment` (valor provisório) e espere a confirmação. Sem essa autorização, nenhum SMS sai. Sem saldo, os envios pausam e o saldo não fica negativo.

## Erros

| Código | O que fazer |
|---|---|
| `STORE_LIMIT_REACHED` | A conta já tem 20 lojas: sugerir reaproveitar uma. |
| `STORE_NOT_FOUND` | Listar de novo e usar uma loja existente. |
| `CURRENCY_NOT_SUPPORTED` | Mostrar que a moeda não é suportada; listar as aceitas na mensagem. |
| `DEFAULT_CURRENCY_REQUIRED` | Manter a moeda padrão na lista ou trocar a padrão antes. |
| `MISSING_PRICES_FOR_CURRENCY` | Preencher preços na moeda e tentar de novo. |
| `LOCALE_NOT_SUPPORTED` | O idioma ainda não está na lista da BimvoAI (hoje: pt-BR, en e es). |
| `DEFAULT_LOCALE_REQUIRED` | Manter o idioma padrão em `enabledLocales`, ou trocar o padrão antes. |
| `LOCALE_NOT_ENABLED` | Habilitar o idioma antes de gravar a tradução. |
| `SELLER_DOCUMENT_INVALID` | O CPF ou CNPJ não confere: pedir ao usuário para conferir os dígitos. |
