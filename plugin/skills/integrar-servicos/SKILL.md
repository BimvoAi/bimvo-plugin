---
name: integrar-servicos
description: Liga a loja a serviços externos — webhook assinado e Utmify — pela tela Integrações do painel ou pelas ferramentas de integração. Use quando o usuário disser /integrar-servicos, "integra a loja", "webhook de pedido", "Utmify", "ActiveCampaign", "rastrear campanha", "avisar quando pagar". Pixel de anúncio (Meta, Google, TikTok, Kwai) fica em configurar-loja.
---

# Integrações da loja

## Regras

- Tudo é da loja desta conversa. Não passe `storeId` de outra loja. Se a ferramenta disser
  `CONVERSATION_STORE_MISMATCH`, peça uma conversa nova na loja certa.
- **Nunca** repita token, credencial de API ou segredo de assinatura na conversa. Se o usuário
  colar um, salve com a ferramenta e não o escreva de volta. Diga que o texto ficou exposto e que
  o segredo de assinatura do webhook só se copia na tela Integrações do painel (big_bang_abrir_minha_loja com section integrations).
- Serviço com `available: false` está em breve (`INTEGRATION_NOT_AVAILABLE`). Não invente
  configuração. Ofereça o webhook, que avisa o destino com assinatura.
- Siga a mensagem de erro. O `code` é estável.
- Antes de criar ou alterar algo, chame `big_bang_get_account_status` e veja `finance`
  (`status`, `access`, `openCents`, `readOnlyAt`, `blockedAt`, `financeUrl`). Com
  `access` diferente de `full`, não tente: avise como abaixo.
- Erro `FEES_OVERDUE`: diga em uma frase que a conta está restrita porque há taxas de venda
  vencidas, cite o valor em aberto, mostre o `financeUrl` do erro e não tente outra
  ferramenta de escrita. As páginas e o checkout continuam vendendo.

## Ver o catálogo

`big_bang_list_integrations`. Resuma em poucas linhas: o que está conectado, o que falta
configurar e o que está em breve. Categorias: automação, tracking, marketing, SMS.

## Configurar

`big_bang_configure_integration`. Segredos omitidos são mantidos. A resposta só traz
`configured` e `last4`.

- **Webhook** (`providerId: webhook`): `url` https público na porta 443 e `events`
  (`order.created`, `order.paid`, `order.refused`, `order.refunded`, `order.chargeback`).
  A BimvoAI gera o segredo de assinatura. Abra a tela com big_bang_abrir_minha_loja (section integrations) e diga para copiar lá.
  `rotateSigningSecret: true` gera outro; o valor novo também só aparece no painel.
- **Utmify** (`utmify`): `apiToken` (credencial de API, em Integrações → Webhooks → Credenciais
  de API na Utmify) e `events`. A venda sai com a campanha (utm) do checkout. Moeda fora da lista
  da Utmify não é enviada.
- **Pixel de anúncio não é integração.** Meta, Google, TikTok e Kwai ficam em Pixels da loja:
  `big_bang_list_store_pixels` e `big_bang_connect_store_pixel` (roteiro em configurar-loja), ou
  a seção Pixels em "Minha loja".
- **Mira Ads não se conecta pela conversa.** Quem conecta, reconecta ou desconecta é o usuário,
  no painel, na tela Anúncios (Configurações > Anúncios). Não peça token da Mira. Para saber se já
  está conectada, use `big_bang_get_mira_connection`.

`big_bang_test_integration` confere a conexão. Utmify recebe um pedido com `isTest` (não grava
venda). Webhook recebe um aviso `integration.test` assinado.

`big_bang_disable_integration` para de enviar e guarda o que já foi salvo. Para ligar de novo,
`enabled: true`.

`big_bang_list_integration_deliveries` mostra as entregas recentes (situação, tentativas, HTTP).
Não traz o corpo. Falha vira `retry` e, depois de cinco tentativas, `failed`.

## O que ainda não existe

ActiveCampaign, Google, TikTok, Otimizey, XTracky e SMSFunnel aparecem no catálogo e não
configuram nesta versão. Recuperação de venda por SMS da própria loja existe: use
`big_bang_get_sms_recovery_settings`, `big_bang_update_sms_recovery_settings` e
`big_bang_get_sms_recovery_metrics`. Ligar o débito no saldo é
`big_bang_set_sms_billing_consent` e pede confirmação, mostrando o preço antes.
