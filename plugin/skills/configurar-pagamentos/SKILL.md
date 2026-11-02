---
name: configurar-pagamentos
description: Mostra a situação dos Recebimentos da conta (se a loja já pode vender) e configura os meios de pagamento de uma loja da BimvoAI - PIX e cartão de crédito, liga ou desliga, desconto ou acréscimo por meio, parcelas e juros do cartão, confirmação do banco (3DS) e validade do PIX. Use quando o usuário disser /configurar-pagamentos, "quero parcelar em 12x", "dá desconto no PIX", "desliga o 3DS", "por que não aparece PIX", "já posso vender?", "como estão meus recebimentos".
---

# Pagamentos da loja

## Regras

- A loja recebe só por **PIX** e **cartão de crédito**, pela conta de **Recebimentos** do lojista
  (uma por conta, vale para todas as lojas). Boleto não existe.
- Não fale em adquirente, gateway nem em nomes de processadores de pagamento. Para o lojista,
  existe só "Recebimentos".
- Você **lê** o status dos Recebimentos, mas não cadastra, não vincula e não ativa: isso é do
  lojista, no painel da BimvoAI, em Recebimentos. Peça para ele abrir lá ("abrir Recebimentos"
  abaixo): no app da BimvoAI, chame `big_bang_abrir_minha_loja` com `payments`; fora dele, diga
  onde fica no painel.
- **Nunca** peça, aceite ou repita chaves, tokens, segredos ou documentos na conversa. Se o
  usuário colar um segredo, não o use nem o repita: diga que ele deve ser informado só no painel,
  em Recebimentos, e que é melhor gerar um novo, porque o colado ficou exposto.
- A configuração dos meios é por loja.
- Siga a mensagem de erro das ferramentas; o `code` é estável.
- Antes de criar ou alterar algo, chame `big_bang_get_account_status` e veja `finance`
  (`status`, `access`, `openCents`, `readOnlyAt`, `blockedAt`, `financeUrl`). Com
  `access` diferente de `full`, não tente: avise como abaixo.
- Erro `FEES_OVERDUE`: diga em uma frase que a conta está restrita porque há taxas vencidas,
  cite o valor em aberto, mostre o `financeUrl` do erro e não tente outra ferramenta de escrita.
- Se as ferramentas citadas não existirem no servidor, diga que pagamentos ainda não estão
  liberados e pare.

## Escolher a loja

Se o usuário não disse, use `big_bang_list_stores`: com uma loja, use-a; com várias, pergunte.

## Ver como está

`big_bang_get_payment_settings`. Resuma em poucas linhas:

- **Recebimentos** (`account.status`):
  - `active`: ativos, a loja pode vender.
  - `pending_review`: cadastro em análise. Ele pode seguir montando a loja; vende quando aprovar.
  - `pending_kyc`: falta a verificação de identidade. Abra Recebimentos para ele concluir.
  - `rejected`: cadastro recusado. Diga o motivo (`account.rejectionReason`, quando vier) e abra
    Recebimentos para ele ver o que fazer.
  - `blocked`: recebimentos bloqueados; a loja não vende. Abra Recebimentos.
  - `none`: sem cadastro. Abra Recebimentos para ele cadastrar ou vincular a conta.
- **Meios**: para PIX e cartão, se está ativo, o ajuste, as parcelas e juros do cartão, o 3DS e a
  validade do PIX.
- **Pode vender?** Só com `readyToSell: true` (Recebimentos ativos e algum meio ligado). Com
  `false`, diga o que falta: Recebimentos não ativos ou nenhum meio ligado.

## Configurar meios

Use `big_bang_update_payment_method`, um meio por chamada (`pix` ou `credit_card`).

- **Ligar ou desligar**: `active`. Loja nova já vem com PIX e cartão ligados.
- **Cartão**: `maxInstallments` (1 a 12), `interestFreeInstallments` (até quantas sem juros),
  `monthlyInterestBps` (juros ao mês nas demais, em pontos-base: 2,99% = `299`, tabela price) e
  `minInstallmentAmount` em unidade mínima (R$ 5,00 = `{ "BRL": 500 }`).
- **Confirmação do banco (3DS)** do cartão: `threeDSecure` (`true` ou `false`). Vem ligada. Ligada,
  o comprador confirma a compra no app ou por SMS do banco quando o banco pedir, e a loja fica
  mais protegida contra fraude e contestação. Desligada, a compra fica mais rápida, mas o risco de
  fraude e contestação fica com a loja. Só desligue se o lojista pedir; explique a troca numa frase
  e confirme antes.
- **Ajuste por meio** (`adjustmentBps`, pontos-base sobre o total): desconto até 50% (`-5000`) ou
  acréscimo até 20% (`2000`). Ex.: 5% off no PIX = `-500`.
- **PIX**: `expiresInMinutes` de 5 a 1440.

Mostre ao usuário em porcentagem e reais, nunca em pontos-base ou centavos.

Quando o usuário pedir algo vago ("deixa padrão"), proponha e confirme numa frase: PIX com 5% de
desconto e 30 minutos; cartão até 12x, 3x sem juros, 2,99% ao mês depois e 3DS ligado.

Mudanças valem para checkouts novos; pedidos já gerados não mudam. Com Recebimentos ainda não
ativos, os meios ficam configurados e começam a valer quando forem aprovados.

## Erros

| Código | O que fazer |
|---|---|
| `INVALID_PAYMENT_RULE` | Ler a mensagem (faixa ou combinação inválida) e ajustar. |
| `STORE_NOT_FOUND` | Listar as lojas e escolher uma existente. |
| Outro | Ler a mensagem, explicar em uma frase e, se for sobre Recebimentos, abrir Recebimentos. |
