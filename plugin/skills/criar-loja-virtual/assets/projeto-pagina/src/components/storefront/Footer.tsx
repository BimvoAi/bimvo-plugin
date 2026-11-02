import { href } from '@bigbang/page-kit/router';
import type { Shop } from './shop';

const POLICY_PATH = {
  returns: '/politicas/trocas',
  privacy: '/politicas/privacidade',
};

/** Quem vende, como falar com a loja e as políticas, em todas as páginas da loja virtual. */
export function Footer({ shop }: { shop: Shop }) {
  const { view, t } = shop;
  const seller = view.seller;
  return (
    <footer class="mt-16 border-t border-neutral-200 py-8 text-sm text-neutral-600">
      <div class="grid gap-6 sm:grid-cols-3">
        {seller ? (
          <div class="space-y-1">
            <p class="font-medium text-neutral-900">{t('soldBy')}</p>
            <p>{seller.legalName}</p>
            <p>
              {seller.documentType.toUpperCase()} {seller.document}
            </p>
          </div>
        ) : null}
        {seller ? (
          <address class="space-y-1 not-italic">
            <p class="font-medium text-neutral-900">{t('address')}</p>
            <p>
              {seller.address.street}, {seller.address.number}
              {seller.address.complement
                ? ` – ${seller.address.complement}`
                : ''}
            </p>
            <p>
              {seller.address.district} · {seller.address.city}/
              {seller.address.state}
            </p>
            <p>
              {seller.address.postalCode} · {seller.address.country}
            </p>
          </address>
        ) : null}
        <div class="space-y-1">
          {view.supportEmail ? (
            <>
              <p class="font-medium text-neutral-900">{t('contact')}</p>
              <p>
                <a class="underline" href={`mailto:${view.supportEmail}`}>
                  {view.supportEmail}
                </a>
              </p>
            </>
          ) : null}
          <ul class="space-y-1 pt-2">
            {view.policies.map((policy) => (
              <li key={policy.kind}>
                <a class="underline" href={href(POLICY_PATH[policy.kind])}>
                  {policy.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p class="mt-6">© {view.name}</p>
    </footer>
  );
}
