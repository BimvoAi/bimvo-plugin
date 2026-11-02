---
name: configurar-pagamentos
description: Mostra como a loja recebe (Recebimentos da Cloudfy Payments ou adquirente próprio - Mercado Pago, Pagar.me), conecta adquirentes pela página web segura e configura os meios de pagamento de uma loja da BimvoAI - PIX, cartão e boleto, qual adquirente processa cada meio em cada moeda, liga ou desliga, desconto ou acréscimo por meio, parcelas e juros do cartão, confirmação do banco (3DS) e prazos de PIX e boleto. Use quando o usuário disser /configurar-pagamentos, "conecta o Mercado Pago", "cadastra o Pagar.me", "quero usar a Cloudfy Payments", "quero parcelar em 12x", "dá desconto no PIX", "muda o adquirente do cartão", "desconecta o adquirente", "desliga o 3DS", "por que não aparece PIX", "já posso vender?", "como estão meus recebimentos".
---

# Pagamentos da loja

## Regras

- A loja pode receber de dois jeitos, e pode misturar os dois por meio e moeda:
  - **Cloudfy Payments** (`cloudfy_payments`): a conta de **Recebimentos** do lojista (uma por
    conta, vale para todas as lojas). PIX e cartão, só em reais. **Sem taxa de checkout** nas vendas
    processadas por ela.
  - **Adquirente próprio** (Mercado Pago, Pagar.me): conectado por loja, com as chaves do painel
    dele. PIX, cartão e boleto, conforme o adquirente. A BimvoAI cobra a **taxa de checkout** por
    venda processada por ele.
- Você **lê** o status dos Recebimentos, mas não cadastra, não vincula e não ativa: isso é do
  lojista, no painel da BimvoAI, em Recebimentos. No app da BimvoAI, chame
  `big_bang_abrir_minha_loja` com `payments`; fora dele, diga onde fica no painel.
- **Nunca** peça, aceite ou repita chaves, tokens, segredos ou documentos na conversa. Se o
  usuário colar um segredo, não o use nem o repita: diga que ele deve ser informado só na página
  web (adquirente) ou no painel (Recebimentos), e que é melhor gerar um novo, porque o colado
  ficou exposto.
- A configuração dos meios é por loja.
- Siga a mensagem de erro das ferramentas; o `code` é estável.
- Antes de criar ou alterar algo, chame `big_bang_get_account_status` e veja `finance`
  (`status`, `access`, `openCents`, `readOnlyAt`, `blockedAt`, `financeUrl`). Com
  `access` diferente de `full`, não tente: avise como abaixo.
- Erro `FEES_OVERDUE`: diga em uma frase que a conta está restrita porque há taxas de venda
  vencidas, cite o valor em aberto, mostre o `financeUrl` do erro e não tente outra
  ferramenta de escrita. As páginas e o checkout continuam vendendo.
- Se as ferramentas citadas não existirem no servidor, diga que pagamentos ainda não estão
  liberados e pare.

## Escolher a loja

Se o usuário não disse, use `big_bang_list_stores`: com uma loja, use-a; com várias, pergunte.

## Ver como está

`big_bang_get_payment_settings`. Resuma em poucas linhas:

- **Recebimentos / Cloudfy Payments** (`account.status`):
  - `active`: ativos; a Cloudfy Payments pode processar PIX e cartão em reais.
  - `pending_review`: cadastro em análise. Ele pode seguir montando a loja.
  - `pending_kyc`: falta a verificação de identidade. Abra Recebimentos para ele concluir.
  - `rejected`: cadastro recusado. Diga o motivo (`account.rejectionReason`, quando vier) e abra
    Recebimentos para ele ver o que fazer.
  - `refused`: a análise de segurança não aprovou; nova tentativa só depois de alguns meses. Sugira
    vender com um adquirente próprio enquanto isso.
  - `blocked`: recebimentos bloqueados. Fale com o suporte.
  - `none`: sem cadastro. Ele pode cadastrar em Recebimentos ou usar um adquirente próprio.
- **Adquirentes** (`acquirers`): situação de cada um (`connected`, `needs_reconnect`…). A Cloudfy
  Payments aparece na lista com `managedBy: 'account'`: ela segue o status de Recebimentos.
- **Meios**: para PIX, cartão e boleto, se está ativo, qual adquirente em cada moeda
  (`acquirerByCurrency`; vazio em reais = Cloudfy Payments, quando ativa), o ajuste, as parcelas e
  juros do cartão, o 3DS (só na Cloudfy Payments) e os prazos de PIX e boleto.
- **Pode vender?** Só com `readyToSell: true` (algum meio ligado com adquirente pronto). Com
  `false`, diga o que falta ("cartão sem adquirente em USD", "Pagar.me precisa reconectar",
  "Recebimentos em análise e nenhum adquirente conectado").

## Conectar um adquirente (Mercado Pago, Pagar.me)

1. `big_bang_get_acquirer_connect_link` com a loja (e o adquirente, se o usuário disse qual). No
   app da BimvoAI, pode abrir direto com `big_bang_abrir_minha_loja` e `acquirers`.
2. Mostre o endereço e explique: abrir no navegador, entrar na BimvoAI se pedir, escolher o
   adquirente e colar as chaves do painel dele. A BimvoAI confere as chaves na hora.
3. Peça para avisar quando terminar; confira com `big_bang_get_payment_settings`.
4. Se for o primeiro adquirente, proponha já atribuir a ele os meios que ele suporta.
5. No Pagar.me, mostre uma vez o endereço de aviso (`pendingNotifications`) e onde colar, como
   recomendação. Não espere o aviso chegar.

Para reconectar (situação `needs_reconnect`) o caminho é o mesmo.

A Cloudfy Payments não se conecta por aqui: ela é ativada em Recebimentos (conectar ou
desconectar devolve `ACQUIRER_MANAGED_BY_ACCOUNT`). Quando o lojista estiver escolhendo, vale
dizer numa frase que vendas pela Cloudfy Payments não pagam a taxa de checkout da BimvoAI.

## Configurar meios

Use `big_bang_update_payment_method`, um meio por chamada (`pix`, `credit_card`, `boleto`).

- **Ligar ou desligar**: `active`.
- **Adquirente por moeda** (`acquirerByCurrency`, ex.: `{ "BRL": "mercado_pago" }`; `null` tira):
  cada meio, em cada moeda aceita pela loja, tem no máximo um adquirente. Só atribua a um
  adquirente pronto que cobre aquele meio naquela moeda. PIX e boleto só em BRL. A Cloudfy
  Payments não tem boleto.
- **Cartão**: `maxInstallments` (1 a 12), `interestFreeInstallments` (até quantas sem juros),
  `monthlyInterestBps` (juros ao mês nas demais, em pontos-base: 2,99% = `299`, tabela price) e
  `minInstallmentAmount` por moeda em unidade mínima (R$ 5,00 = `{ "BRL": 500 }`). O máximo
  efetivo também respeita o limite do adquirente.
- **Confirmação do banco (3DS)** do cartão: `threeDSecure` (`true` ou `false`). Só vale quando o
  cartão passa pela Cloudfy Payments; vem ligada. Ligada, o comprador confirma a compra no app ou
  por SMS do banco quando o banco pedir, e a loja fica mais protegida contra fraude e
  contestação. Desligada, a compra fica mais rápida, mas o risco fica com a loja. Só desligue se
  o lojista pedir; explique a troca numa frase e confirme antes.
- **Ajuste por meio** (`adjustmentBps`, pontos-base sobre o total): desconto até 50% (`-5000`) ou
  acréscimo até 20% (`2000`). Ex.: 5% off no PIX = `-500`.
- **PIX**: `expiresInMinutes` de 5 a 1440. **Boleto**: `dueInDays` de 1 a 30.

Mostre ao usuário em porcentagem e reais, nunca em pontos-base ou centavos.

Quando o usuário pedir algo vago ("deixa padrão"), proponha e confirme numa frase: PIX com 5% de
desconto e 30 minutos; cartão até 12x, 3x sem juros, 2,99% ao mês depois (e 3DS ligado na Cloudfy
Payments); boleto em 3 dias, se o adquirente tiver boleto.

Mudanças valem para checkouts novos; pedidos já gerados não mudam.

## Desconectar

Confirme antes. `big_bang_disconnect_acquirer` apaga as chaves; os meios atribuídos a ele ficam
sem adquirente (em reais, voltam para a Cloudfy Payments se ela estiver ativa) e pagamentos em
andamento seguem sendo acompanhados. Mostre quais meios ficaram sem adquirente e se a loja
continua pronta para vender.

## Erros

| Código | O que fazer |
|---|---|
| `ACQUIRER_NOT_SUPPORTED` | Mostrar os adquirentes suportados (vêm no link de conexão). |
| `ACQUIRER_NOT_CONNECTED` | Conectar primeiro pelo link (ou, na Cloudfy Payments, ativar Recebimentos). |
| `ACQUIRER_MANAGED_BY_ACCOUNT` | A Cloudfy Payments é gerida em Recebimentos: abrir Recebimentos. |
| `ACQUIRER_METHOD_UNSUPPORTED` | Esse adquirente não processa o meio: sugerir outro pronto que processe. |
| `ACQUIRER_CURRENCY_UNSUPPORTED` | O adquirente não cobra nessa moeda: escolher outro ou outra moeda. |
| `CURRENCY_NOT_ACCEPTED` | A loja não aceita essa moeda: adicionar com `configurar-loja`. |
| `INVALID_PAYMENT_RULE` | Ler a mensagem (faixa ou combinação inválida) e ajustar. |
| `STORE_NOT_FOUND` | Listar as lojas e escolher uma existente. |
