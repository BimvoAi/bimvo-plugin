import type { StorefrontTheme } from '@bigbang/page-kit/storefront';

// Tema da loja (specs/046): o lojista escolhe cores, fontes, arredondamento, logo e ícone no
// painel; a página aplica como variáveis --bb-* (index.css) na abertura, sem publicar de novo.

const RADIUS: Record<NonNullable<StorefrontTheme['radius']>, string> = {
  none: '0px',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  full: '1.5rem',
};

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const FONT = /^[A-Za-z0-9 ]{1,40}$/;

function setVar(name: string, value: string | null) {
  const style = document.documentElement.style;
  if (value) style.setProperty(name, value);
  else style.removeProperty(name);
}

function color(value: string | null) {
  return value && HEX.test(value) ? value : null;
}

function loadFonts(names: string[]) {
  const families = [...new Set(names.filter((name) => FONT.test(name)))];
  const id = 'bb-theme-fonts';
  document.getElementById(id)?.remove();
  if (families.length === 0) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${families
    .map(
      (family) =>
        `family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@400;500;600;700`,
    )
    .join('&')}&display=swap`;
  document.head.appendChild(link);
}

function setFavicon(url: string | null) {
  if (!url) return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = url;
}

/** Aplica o tema da loja; sem tema (API antiga ou loja sem escolha), fica o padrão do index.css. */
export function applyTheme(theme: StorefrontTheme | undefined) {
  const colors = theme?.colors;
  setVar('--bb-primary', color(colors?.primary ?? null));
  setVar('--bb-primary-text', color(colors?.primaryText ?? null));
  setVar('--bb-background', color(colors?.background ?? null));
  setVar('--bb-text', color(colors?.text ?? null));
  setVar('--bb-accent', color(colors?.accent ?? null));
  setVar('--bb-muted', color(colors?.muted ?? null));
  setVar('--bb-radius', theme?.radius ? RADIUS[theme.radius] : null);
  const heading = theme?.fonts.heading ?? null;
  const body = theme?.fonts.body ?? null;
  setVar(
    '--bb-font-heading',
    heading && FONT.test(heading) ? `'${heading}', serif` : null,
  );
  setVar(
    '--bb-font-body',
    body && FONT.test(body) ? `'${body}', ui-sans-serif, sans-serif` : null,
  );
  loadFonts([heading, body].filter((name): name is string => Boolean(name)));
  setFavicon(theme?.faviconUrl ?? null);
}
