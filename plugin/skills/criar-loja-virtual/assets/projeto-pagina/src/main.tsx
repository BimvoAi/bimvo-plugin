import { render } from 'preact';
import { App } from './app';
import { config } from './config';
import { loadRuntimeConfig } from '@bigbang/page-kit/page';
import './index.css';

const root = document.getElementById('app') as HTMLElement;

// Modelos do catálogo são montados sem loja: a configuração chega antes de desenhar a página.
void loadRuntimeConfig(config).then((ready) => {
  if (ready) {
    render(<App />, root);
    return;
  }
  root.innerHTML =
    '<main style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;color:#525252"><p>Página indisponível no momento.</p></main>';
});
