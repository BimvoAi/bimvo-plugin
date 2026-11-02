import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Só para rodar o template no repositório (`pnpm install && pnpm dev` nesta pasta). No servidor,
// o build usa a configuração do cloud-agent e os pacotes instalados nele, nas mesmas versões de
// devDependencies: este arquivo não roda lá e a página não instala nada.
export default defineConfig({
  // Caminhos a partir da raiz, como no build do servidor: as rotas da loja virtual
  // (/produto/<slug>) carregam os mesmos arquivos.
  base: '/',
  plugins: [preact(), tailwindcss()],
  // A lógica de pagamento vem do kit, ao lado no repositório (no servidor, o build usa o dele).
  resolve: {
    alias: {
      '@bigbang/page-kit': fileURLToPath(
        new URL('../page-kit/src', import.meta.url),
      ),
    },
    dedupe: ['preact'],
  },
});
