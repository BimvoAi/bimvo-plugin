# Página de checkout (loja `checkout`)

A página de uma loja `checkout` é focada em comprar: uma apresentação curta do produto, vinda do
BimvoAI (nome, imagem, descrição e preço), e o checkout completo. Não leva copy longa,
depoimentos nem seções de marketing: isso não é a página da loja.

O contrato completo do checkout está em `specs/003-checkout-module/contracts/checkout.openapi.yaml`.
O que cada abertura vende está em `specs/011-checkout-no-picker/contracts/checkout-visit.md`.

## O que o template já faz

`src/app.tsx` monta, para `kind: 'checkout'`:

- `/`: o checkout (`<Checkout config={config} />`) com dados do comprador, entrega e frete quando
  há produto físico, cupom, order bump, PIX, cartão (o kit gera o token no adquirente e, na
  Cloudfy Payments com 3DS, abre sozinho a confirmação do banco), boleto, acompanhamento, nova
  tentativa e upsell; eventos do funil saem sozinhos;
- `/pedido/<orderId>#t=<orderToken>`: o acompanhamento do pedido (estado, PIX ou boleto). O
  checkout mostra o link "Acompanhar pedido" depois de gerar o pedido;
- qualquer outro caminho volta para `/`, mantendo a query.

## Um endereço para cada produto, pelo link

- Deixe `products` vazio em `src/config.ts`. O mesmo endereço vende o produto do link:
  `?product=<productId>` (`big_bang_list_products`).
- `?produto=<productId>` vale quando `product` não está no endereço. `quantity` (1 a 99) é
  opcional; sem ela, a quantidade é 1.
- Vários produtos no mesmo carrinho: `?product=<id>:<quantidade>,<id>` (ou `product` repetido).
  A quantidade de cada um é opcional (1 a 99); até 20 produtos; o mesmo id repetido soma.
  Com mais de um produto, `quantity` não vale e invalida o link.
- Sem `product` e sem `produto`, e com `products` vazio, a página avisa que o link não indica o
  produto. Não liste os produtos da loja, não chame o catálogo para montar seletor e não crie a
  seção "Escolha o produto". A lista para o comprador navegar é só da loja virtual.
- Preencha `products` com `productId` e quantidade só quando a página deve vender sempre esse
  carrinho. Sem produto no endereço, esse carrinho continua valendo.

O preço cobrado é sempre o do catálogo no checkout. Nome, imagem, descrição e preço vêm da API
quando o checkout abre — não de uma lista na página.

## Prévia e link de venda

A prévia não tem internet e não deve abrir no aviso de link sem produto. A ferramenta
`big_bang_gerar_previa_pagina` escolhe um produto ativo com preço e abre o checkout com ele. Sem
esse produto, a prévia não é criada: peça para cadastrar um antes (o checkout precisa dele para
mostrar nome, preço e pagamento).

O link que você entrega à pessoa já leva `?product=<productId>`. Um produto citado por ela, ou um
link por produto ativo quando ela não escolheu. Não entregue o endereço nu. Carrinho fixo
(`products` preenchido) é a exceção: a url da página já vende esse carrinho, e `?product=` o
substituiria.

Produto digital não pede endereço de entrega. O endereço de cobrança só aparece quando o meio
escolhido exige (`requiresAddress`, que a API calcula): Cloudfy Payments no cartão (a confirmação
do banco autentica com esse endereço); Pagar.me no cartão, no boleto e no PIX de conta PSP;
Mercado Pago só no boleto. Produto físico pede endereço de entrega e frete.

## O que personalizar

Classes do Tailwind (`src/components/checkout/ui.tsx` e os componentes), cores, fontes, logo e o
título da página em `src/app.tsx`. Mantenha as chamadas à API e os eventos.

Nunca escreva preço, nome, descrição, imagem de produto ou estoque no código. Quem calcula preço,
desconto, frete, juros e total é a BimvoAI.

## Origem e testes locais

A página só funciona publicada pela BimvoAI (a API confere a origem). Para testar localmente,
`http://localhost:*` é aceito fora de produção, desde que a loja já tenha ao menos uma página
publicada. A prévia (`big_bang_gerar_previa_pagina`) roda em modo demonstração, com dados de exemplo.
