import { HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Page, { PageHero } from '../components/Page.jsx';
import FAQ from '../components/FAQ.jsx';
import { CrossCTA, Rich } from '../components/ui.jsx';

export default function FAQPage() {
  const { t } = useTranslation();
  return (
    <Page title={t('pages.faq.docTitle')}>
      <PageHero
        badge={t('pages.faq.badge')}
        badgeIcon={HelpCircle}
        title={<Rich k="pages.faq.title" />}
        sub={t('pages.faq.sub')}
      />
      <FAQ showHeader={false} />
      <CrossCTA
        title={t('pages.faq.ctaTitle')}
        sub={t('pages.faq.ctaSub')}
        primary={{ to: '/donate', label: t('pages.faq.ctaPrimary') }}
        secondary={{ to: '/programs', label: t('pages.faq.ctaSecondary') }}
      />
    </Page>
  );
}
