import { BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Page, { PageHero } from '../components/Page.jsx';
import ImpactShowcase from '../components/ImpactShowcase.jsx';
import Ledger from '../components/Ledger.jsx';
import { CrossCTA, Rich } from '../components/ui.jsx';

export default function Impact() {
  const { t } = useTranslation();
  return (
    <Page title={t('pages.impact.docTitle')}>
      <PageHero
        badge={t('pages.impact.badge')}
        badgeIcon={BarChart3}
        title={<Rich k="pages.impact.title" />}
        sub={t('pages.impact.sub')}
      />
      <ImpactShowcase />
      <Ledger showHeader={false} />
      <CrossCTA
        title={t('pages.impact.ctaTitle')}
        sub={t('pages.impact.ctaSub')}
        primary={{ to: '/donate', label: t('pages.impact.ctaPrimary') }}
        secondary={{ to: '/stories', label: t('pages.impact.ctaSecondary') }}
      />
    </Page>
  );
}
