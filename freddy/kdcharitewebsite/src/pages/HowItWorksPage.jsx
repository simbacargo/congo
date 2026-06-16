import { Workflow } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Page, { PageHero } from '../components/Page.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import Calculator from '../components/Calculator.jsx';
import { CrossCTA, Rich } from '../components/ui.jsx';

export default function HowItWorksPage() {
  const { t } = useTranslation();
  return (
    <Page title={t('pages.howItWorks.docTitle')}>
      <PageHero
        badge={t('pages.howItWorks.badge')}
        badgeIcon={Workflow}
        title={<Rich k="pages.howItWorks.title" />}
        sub={t('pages.howItWorks.sub')}
      />
      <HowItWorks />
      <Calculator />
      <CrossCTA
        title={t('pages.howItWorks.ctaTitle')}
        sub={t('pages.howItWorks.ctaSub')}
        primary={{ to: '/impact', label: t('pages.howItWorks.ctaPrimary') }}
        secondary={{ to: '/donate', label: t('pages.howItWorks.ctaSecondary') }}
      />
    </Page>
  );
}
