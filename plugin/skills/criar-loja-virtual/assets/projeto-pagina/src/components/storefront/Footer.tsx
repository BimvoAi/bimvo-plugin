import { href, policyPath } from '@bigbang/page-kit/router';
import { KitSlot } from '@bigbang/page-kit/slots';
import { NewsletterForm } from './Capture';
import { linkProps, type Shop } from './shop';

/**
 * Rodapé: grupos de links do painel, páginas de conteúdo, políticas, newsletter, quem vende e
 * como falar com a loja, em todas as páginas da loja virtual.
 */
export function Footer({ shop }: { shop: Shop }) {
  const { view, t } = shop;
  const seller = view.seller;
  const groups = view.storefront?.menus.footer ?? [];
  const policies = view.allPolicies ?? view.policies;
  const pages = view.pages ?? [];
  // A newsletter do rodapé aparece quando a loja usa as configurações da vitrine.
  const newsletter = Boolean(view.storefront);
  return (
    <footer class="mt-16 border-t border-neutral-200 py-10 text-sm text-muted">
      {newsletter ? (
        <div class="mb-10 grid gap-4 rounded-theme bg-neutral-50 p-6 text-neutral-900 sm:grid-cols-2 sm:items-center">
          <p class="font-heading text-lg font-semibold">
            {t('newsletterTitle')}
          </p>
          <NewsletterForm shop={shop} source="footer" />
        </div>
      ) : null}
      <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group, index) => (
          <div key={index} class="space-y-2">
            <p class="font-medium text-ink">{group.title}</p>
            <ul class="space-y-1">
              {group.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <a {...linkProps(item.link)} class="hover:underline">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {pages.length > 0 ? (
          <div class="space-y-2">
            <p class="font-medium text-ink">{t('institutional')}</p>
            <ul class="space-y-1">
              {pages.map((page) => (
                <li key={page.slug}>
                  <a
                    class="hover:underline"
                    href={href(`/p/${encodeURIComponent(page.slug)}`)}
                  >
                    {page.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div class="space-y-2">
          <p class="font-medium text-ink">{t('help')}</p>
          <ul class="space-y-1">
            {view.storefront ? (
              <>
                <li>
                  <a class="hover:underline" href={href('/rastreio')}>
                    {t('lookupTitle')}
                  </a>
                </li>
                <li>
                  <a class="hover:underline" href={href('/conta')}>
                    {t('account')}
                  </a>
                </li>
              </>
            ) : null}
            {policies.map((policy) => (
              <li key={policy.kind}>
                <a class="hover:underline" href={href(policyPath(policy.kind))}>
                  {policy.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div class="space-y-1">
          {view.supportEmail ? (
            <>
              <p class="font-medium text-ink">{t('contact')}</p>
              <p>
                <a class="underline" href={`mailto:${view.supportEmail}`}>
                  {view.supportEmail}
                </a>
              </p>
            </>
          ) : null}
        </div>
      </div>
      {seller ? (
        <div class="mt-10 grid gap-6 border-t border-neutral-200 pt-6 sm:grid-cols-2">
          <div class="space-y-1">
            <p class="font-medium text-ink">{t('soldBy')}</p>
            <p>{seller.legalName}</p>
            <p>
              {seller.documentType.toUpperCase()} {seller.document}
            </p>
          </div>
          <address class="space-y-1 not-italic">
            <p class="font-medium text-ink">{t('address')}</p>
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
        </div>
      ) : null}
      <KitSlot place="store.footer" view={view} />
      <p class="mt-6">© {view.name}</p>
    </footer>
  );
}
