---
name: configurar-frete
description: Cria e ajusta os métodos de envio de uma loja da BimvoAI (PAC, Sedex, motoboy, internacional) com prazo, preço fixo, preço por item adicional, preço por país, estado ou faixa de CEP/código postal, frete grátis acima de um valor e preços por moeda. Use quando o usuário disser /configurar-frete, "configura o frete", "frete grátis acima de", "cobra X para o Nordeste", "entrega por motoboy em SP", "quanto fica o frete para tal CEP", ou quando a loja tiver produto físico sem frete.
---

# Frete da loja

O frete só aparece no checkout quando o carrinho tem produto físico. O comprador informa país e
código postal, vê as opções que atendem o endereço e escolhe uma.

## Regras

- Tudo acontece na conta que autorizou este assistente, e o frete é por loja.
- Siga a mensagem de erro das ferramentas; o `code` é estável.
- Antes de criar ou alterar algo, chame `big_bang_get_account_status` e veja `finance`
  (`status`, `access`, `openCents`, `readOnlyAt`, `blockedAt`, `financeUrl`). Com
  `access` diferente de `full`, não tente: avise como abaixo.
- Erro `FEES_OVERDUE`: diga em uma frase que a conta está restrita porque há taxas de venda
  vencidas, cite o valor em aberto, mostre o `financeUrl` do erro e não tente outra
  ferramenta de escrita. As páginas e o checkout continuam vendendo.
- Se as ferramentas citadas não existirem no servidor, diga que o frete ainda não está liberado.

## Como o preço é calculado (explique só se o usuário perguntar)

1. Vale a regra mais específica que atende o endereço: faixa de código postal, depois estado ou
   região, depois país, depois o preço padrão do método. Sem regra nem padrão, o método não aparece.
2. Soma-se o valor por item adicional para cada item físico além do primeiro.
3. Fica zero se os itens (já com cupom) atingirem o mínimo para frete grátis do método, ou com
   cupom de frete grátis.

Valores são por moeda, na unidade mínima (R$ 20,00 = `2000` em BRL). Um método sem valor na moeda
do checkout não aparece nela.

## Fluxos

- **Listar**: `big_bang_list_shipping_methods`. Mostre em linguagem simples: "PAC: R$ 20,00, 5 a
  9 dias úteis, grátis acima de R$ 200,00; Sudeste R$ 15,00".
- **Criar**: `big_bang_create_shipping_method` (`name`, `minDays`, `maxDays`, `defaultPrice`,
  `additionalItemPrice`, `rules[]` com `kind` `country` | `region` | `postal_range`, `freeAbove`,
  `position`; valores sempre como `{ "BRL": 2000 }`). Traduza o pedido do usuário em regras:
  - "Frete fixo de 20 reais, 7 dias" → preço padrão 2000 BRL, prazo 7 a 7.
  - "Grátis acima de 200" → mínimo para frete grátis 20000 BRL.
  - "Nordeste 35 reais" → regras por estado para AL, BA, CE, MA, PB, PE, PI, RN, SE.
  - "Motoboy só na cidade de São Paulo" → regra por faixa de CEP 01000-000 a 05999-999 e
    08000-000 a 08499-999, sem preço padrão.
  - "Envio para Portugal 12 euros" → regra por país `PT` com valor em EUR (a loja precisa aceitar
    EUR).
  Confirme o resumo antes de criar quando houver mais de duas regras.
- **Ajustar ou desativar**: `big_bang_update_shipping_method`. A ordem define a ordem em que as
  opções aparecem ao comprador.
- **Simular**: para "quanto fica para o CEP X", aplique as regras listadas e explique o resultado;
  deixe claro que é uma simulação a partir das regras.

## Transportadoras e envios

A loja pode conectar plataformas de frete (Melhor Envio e SuperFrete). Com uma conexão pronta, o
checkout mostra as opções das transportadoras (PAC, SEDEX, Jadlog…) com preço e prazo reais, junto
com os métodos manuais. Cada pedido pago com produto físico vira um envio.

- **Conectar, trocar token ou desconectar é só pela tela.** Você nunca recebe nem pede token. Para
  conectar, mande o usuário para Frete › Transportadoras (`big_bang_abrir_minha_loja` com
  `section: 'shipping'`). Lá também ficam o endereço de origem, a caixa padrão e o peso e as
  medidas dos produtos.
- **Ver as transportadoras**: `big_bang_list_shipping_providers` mostra status, conta, se está
  pronta para cotar, serviços ligados e se a etiqueta automática está ligada. `needs_setup` quer
  dizer que falta o CEP de origem ou um serviço ligado; `needs_reconnect`, que o usuário precisa
  conectar de novo pela tela.
- **Configurar**: `big_bang_update_shipping_provider_settings` liga e desliga serviços, muda o nome
  mostrado, o acréscimo (fixo em centavos e percentual), os dias de manuseio, o frete grátis acima
  de um valor, seguro, aviso de recebimento, mão própria e a etiqueta automática. Exemplo: "cobra
  R$ 3 a mais no SEDEX" → `priceAdjustment: { fixedCents: 300, percent: 0 }` (vale para todos os
  serviços da conexão). A origem não muda por aqui.
- **Envios**: `big_bang_list_shipments` com `group` `to_ship` (falta enviar ou gerar etiqueta),
  `ready` (etiqueta gerada), `in_transit` ou `done`. Para "quais pedidos falta enviar?", use
  `to_ship` e resuma por pedido, comprador, serviço e status. `big_bang_get_shipment` abre um envio
  pelo `shipmentId` ou pelo `orderId`.
- **Gerar etiquetas**: `big_bang_generate_shipping_labels` (até 20 por vez) compra a etiqueta com o
  saldo do lojista na plataforma. Sempre confirme com o usuário quantas etiquetas e de quais
  pedidos antes de chamar. O resultado vem por envio: mostre o código de rastreio dos que deram
  certo e o motivo dos que falharam.
- **Rastreio manual**: para envio com frete manual, `big_bang_set_shipment_tracking` com a
  transportadora (`correios`, `jadlog`, `loggi`, `jt`, `azul`, `buslog` ou `other` com
  `carrierName`) e o código. Ex.: "o rastreio do pedido 123 é AB123456789BR" → ache o envio do
  pedido, depois informe `correios` e o código. Na primeira vez, o comprador recebe o e-mail
  "Pedido enviado"; corrigir o código não manda outro e-mail.
- Imprimir, cancelar etiqueta, informar CPF ou NF-e e marcar como entregue ficam na tela (Frete ›
  Envios ou no detalhe do pedido).

## Erros

| Código | O que fazer |
|---|---|
| `STORE_NOT_FOUND` | Listar lojas e escolher uma existente. |
| `SHIPPING_METHOD_NOT_FOUND` | Listar os métodos e usar um existente. |
| `CURRENCY_NOT_ACCEPTED` | Adicionar a moeda à loja (`configurar-loja`) ou tirar o valor. |
| `INVALID_SHIPPING_RULE` | Ler a mensagem (faixa invertida, prazo mínimo maior que o máximo, mais de 100 regras) e ajustar. |
| `SHIPPING_PROVIDER_NOT_CONNECTED` | A plataforma não está conectada ou precisa ser reconectada: mande o usuário para Frete › Transportadoras. |
| `UNKNOWN_SHIPPING_SERVICE` | Listar as transportadoras e usar um `serviceId` da lista. |
| `SHIPMENT_NOT_FOUND` | Listar os envios e usar um existente. |
| `SHIPMENT_NOT_MANUAL` | O envio tem etiqueta de plataforma: o rastreio chega sozinho depois da etiqueta. |
| `SHIPMENT_NOT_EDITABLE` | O envio já foi entregue, cancelado ou mudou de status; abra de novo e explique. |
| `INSUFFICIENT_BALANCE` (por envio) | Pedir ao usuário para pôr saldo na carteira da plataforma e tentar de novo. |
| `RECIPIENT_DOCUMENT_REQUIRED` (por envio) | Pedir o CPF ou CNPJ do comprador e informar pela tela do envio; depois gerar de novo. |
