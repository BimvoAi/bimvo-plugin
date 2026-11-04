---
name: gerenciar-ofertas
description: Cria, lista, ordena e ajusta ofertas de order bump (oferta marcada dentro do checkout, no mesmo pedido) e de upsell (oferta depois da compra, aceita com um clique) de uma loja da BimvoAI, com produtos que disparam a oferta, preço especial por moeda e prazo; promoções automáticas aplicadas no checkout sem cupom (compre 3 pague 2, desconto a partir de N itens ou de um valor) e a embalagem de presente. Use quando o usuário disser /gerenciar-ofertas, "cria um order bump", "oferta no checkout", "upsell depois da compra", "one click", "quem comprar X ganha oferta de Y", "como estão meus order bumps", "compre 3 pague 2", "leve mais pague menos", "desconto progressivo", "preço de atacado", "10% acima de R$ 300", "promoção automática", "embalagem de presente".
---

# Ofertas: order bump, upsell, promoções automáticas e presente

Order bump e upsell estão logo abaixo; promoções automáticas e embalagem de presente, em seções
próprias no fim.

| | Order bump | Upsell |
|---|---|---|
| Quando aparece | No checkout, antes de pagar, se o carrinho tem o produto disparador | Depois do pagamento aprovado de um pedido com o produto disparador |
| Como aceita | Marca uma caixa | Um clique na página de obrigado |
| Pedido | Entra no mesmo pedido e na mesma cobrança | Gera um pedido novo ligado ao original |
| Limite | Até 3 por checkout, na ordem do lojista | Uma de cada vez; ao recusar, aparece a próxima |
| Cupom | Não recebe cupom | Não recebe cupom |

No upsell pago com cartão, o comprador não redigita o cartão quando o adquirente permite (senão
digita de novo e, na Cloudfy Payments com 3DS, confirma no banco); em PIX e boleto, gera nova
cobrança. Upsell de produto físico usa o endereço e o frete do pedido original,
sem cobrar frete de novo.

## Regras

- Tudo acontece na conta que autorizou este assistente, e as ofertas são por loja.
- Siga a mensagem de erro das ferramentas; o `code` é estável.
- Antes de criar ou alterar algo, chame `big_bang_get_account_status` e veja `finance`
  (`status`, `access`, `openCents`, `readOnlyAt`, `blockedAt`, `financeUrl`). Com
  `access` diferente de `full`, não tente: avise como abaixo.
- Erro `FEES_OVERDUE`: diga em uma frase que a conta está restrita porque há taxas de venda
  vencidas, cite o valor em aberto, mostre o `financeUrl` do erro e não tente outra
  ferramenta de escrita. As páginas e o checkout continuam vendendo.
- Se as ferramentas citadas não existirem no servidor, diga que ofertas ainda não estão liberadas.

## Criar

Descubra: qual produto dispara, qual produto é oferecido, preço especial (por moeda, na unidade
mínima) e, no upsell, o prazo para aceitar (5 a 60 minutos; padrão sugerido 15). Busque os
identificadores com `big_bang_list_products`; se o produto oferecido não existe, ofereça criar com
`gerenciar-produtos`. Se o produto oferecido tem variante ativa, peça `offeredVariantId` (uma
variante ativa). O preço cobrado continua o especial; a variante escolhe o estoque, que é reservado
quando o pedido é gerado e devolvido se o pedido expira sem pagamento ou é reembolsado. Produto sem
variante não leva `offeredVariantId`.

- Order bump: `big_bang_create_order_bump`, com título curto e persuasivo (até 80) e descrição
  (até 200). Escreva-os se o usuário não der, e mostre antes de criar.
- Upsell: `big_bang_create_upsell_offer`.

Mostre o preço normal ao lado do especial ("de R$ 97,00 por R$ 47,00") para o usuário conferir.

### Upsell numa página do lojista (outro site)

Se o lojista quer mostrar o upsell numa página dele (WordPress, Elementor, Webflow, Wix, HTML
próprio), passe `externalUrl` (https) em `big_bang_create_upsell_offer` ou
`big_bang_update_upsell_offer`. Para voltar a oferta para dentro do checkout, passe `null`.
Depois do pagamento, o checkout leva o comprador para essa página com `bb_accept` e `bb_decline`
na query. Os botões da página voltam ao checkout, onde o comprador confirma com um clique. O link
sozinho nunca cobra. Passe ao lojista este passo a passo, que também aparece na tela Upsell do
painel ao escolher "Numa página minha (outro site)":

1. A página mostra o produto e o mesmo preço especial da oferta, que é o valor cobrado. Ela não
   pede dados do cartão.
2. Marque os botões. Num construtor de páginas, coloque a classe CSS `bb-accept` no botão de
   aceitar e `bb-decline` no de recusar. Em HTML, use os atributos `data-bb-accept` e
   `data-bb-decline`.
3. Cole este código antes de `</body>` (num construtor, use um bloco de HTML personalizado no fim
   da página):

   ```html
   <script>
   (function () {
     var params = new URLSearchParams(window.location.search);
     function backUrl(name) {
       var value = params.get(name);
       if (!value) return null;
       try {
         var url = new URL(value);
         return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
       } catch (error) {
         return null;
       }
     }
     var targets = { accept: backUrl('bb_accept'), decline: backUrl('bb_decline') };
     function bind() {
       ['accept', 'decline'].forEach(function (action) {
         var url = targets[action];
         if (!url) return;
         var nodes = document.querySelectorAll('[data-bb-' + action + '], .bb-' + action);
         Array.prototype.forEach.call(nodes, function (node) {
           var link = node.tagName === 'A' ? node : node.querySelector('a');
           if (link) link.href = url;
           node.addEventListener('click', function (event) {
             event.preventDefault();
             window.location.href = url;
           });
         });
       });
     }
     if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
     else bind();
   })();
   </script>
   ```

4. Para testar, use o botão "Testar minha página" no formulário da oferta, no painel. Ele abre a
   página como o checkout abriria, e cada botão deve levar a uma tela de confirmação do teste.

A volta só funciona no mesmo navegador da compra. Se o prazo da oferta já acabou, o comprador vai
direto para a página de obrigado. A página externa recebe só o id da oferta (`bb_offer`), sem
dados do comprador nem do pedido.

## Listar, ordenar, ajustar

- `big_bang_list_order_bumps` / `big_bang_list_upsell_offers`: mostre na ordem, com disparadores,
  produto oferecido, preços e se está ativa.
- `big_bang_update_order_bump` / `big_bang_update_upsell_offer`: preço, textos, ordem, ativa.
- Para desempenho (exibições, aceites, taxa de aceite, valor gerado), use `ver-metricas` com o
  recorte de order bump ou upsell.

## Promoções automáticas

Desconto que o checkout aplica sozinho, sem código, quando o carrinho atinge a faixa. Aparece no
checkout com o título público e, na loja virtual, nos cards, na página do produto e na seção de
promoções da página inicial.

| Tipo | Exemplo | Faixas |
|---|---|---|
| `quantity_pay` | Compre 3, pague 2 | leva N, paga M (ex.: 3→2, 6→4); os itens mais baratos saem de graça, repetível |
| `quantity_percent` | 10% a partir de 5 itens (atacado) | a partir de N itens, X% |
| `subtotal_percent` | 15% acima de R$ 300 | a partir de um valor por moeda, X%; moeda sem valor não recebe |

- Vale a melhor faixa que o carrinho alcança, e só a melhor promoção do carrinho.
- **Escopo**: a loja toda, ou só alguns produtos, categorias ou coleções. Só os itens do escopo
  contam e recebem o desconto; order bump e upsell nunca entram.
- **Com cupom**: por padrão não somam, e o comprador fica com o maior desconto entre cupom e
  promoção. Somando (`combinesWithCoupons`), o cupom é calculado sobre o valor já com a promoção.
- **Validade**: início e fim opcionais; sem fim, vale até pausar.
- Percentual em pontos-base (10% = 1000) e valores na unidade mínima da moeda: converta e mostre
  de volta formatado.

Fluxo: `big_bang_list_automatic_discounts`; `big_bang_save_automatic_discount` cria (sem
`automaticDiscountId`) ou **substitui por inteiro** (com ele: mande todos os campos, partindo do
que a lista devolveu). Escreva o título público se o lojista não der e mostre nome, título,
faixas, escopo e validade antes de salvar. Para pausar, salve com `active: false`; apagar é
`big_bang_delete_automatic_discount`, depois de confirmar (pedidos feitos mantêm o desconto que
tiveram). No painel: Ofertas › Promoções automáticas (`big_bang_abrir_minha_loja` com a seção
`promotions`).

## Embalagem de presente

Opção que o comprador marca no checkout, com mensagem opcional (até 200 caracteres), cobrada como
taxa à parte. Fica na loja: `big_bang_update_store` com `giftWrap` (ligada, preço por moeda na
unidade mínima, `0` = grátis, e o texto da opção, traduzível). Moeda sem preço não oferece a
embalagem. `null` desliga e apaga. No painel: Minha loja › Loja virtual › Embalagem de presente.

## Erros

| Código | O que fazer |
|---|---|
| `PRODUCT_NOT_FOUND` | Conferir os produtos da loja. |
| `ORDER_BUMP_NOT_FOUND` / `UPSELL_OFFER_NOT_FOUND` | Listar e usar uma oferta existente. |
| `CURRENCY_NOT_ACCEPTED` | A loja não aceita a moeda do preço especial. |
| `INVALID_ORDER_BUMP_RULE` / `INVALID_UPSELL_RULE` | Ler a mensagem (produto oferecido igual ao disparador, prazo fora da faixa etc.) e ajustar. |
| `STORE_NOT_FOUND` | Listar lojas e escolher uma existente. |
| `AUTOMATIC_DISCOUNT_NOT_FOUND` | Listar as promoções e usar uma existente. |
| `INVALID_AUTOMATIC_DISCOUNT_RULE` | Ler a mensagem (limite de promoções da loja, categoria que não é da loja, fim antes do início) e ajustar. |
