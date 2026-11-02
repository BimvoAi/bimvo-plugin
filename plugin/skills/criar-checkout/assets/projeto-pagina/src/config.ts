import type { PageConfig } from '@bigbang/page-kit/page';

// Configuração da página, gravada ao criar o projeto. Tudo aqui é público.
// kind é o tipo da loja: checkout (página de checkout) ou ecommerce (loja virtual).
// products vazio: o produto vem de ?product=<productId> (ou ?produto=). Sem o parâmetro,
// a página avisa que o link não indica o produto — não lista o catálogo.
// Preencha só para prender a página de checkout a um carrinho fixo.
// Preço, nome, descrição e estoque nunca ficam aqui: vêm da API do big-bang.
// storeId vazio no build (modelos do catálogo): a página lê loja, tipo e apiUrl do
// bigbang-page.json ao abrir (loadRuntimeConfig, do kit @bigbang/page-kit).

export const config: PageConfig = {
  apiUrl: '',
  storeId: '',
  kind: 'checkout',
  products: [],
  locale: 'pt-BR',
  // Moeda inicial; sem ela, a moeda padrão da loja.
  currency: undefined,
  // Página de obrigado externa só desta página (opcional). Sem ela, vale a da loja
  // (big_bang_update_store thankYouUrl) e, sem nenhuma, a padrão em /obrigado/<pedido>.
  thankYouUrl: undefined,
};
