import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Page, { PageHero } from '../components/Page.jsx';
import Ecosystem from '../components/Ecosystem.jsx';
import { CrossCTA, Rich } from '../components/ui.jsx';

export default function Programs() {
  const { t } = useTranslation();
  return (
    <Page title={t('pages.programs.docTitle')}>
      <PageHero
        badge={t('pages.programs.badge')}
        badgeIcon={Globe}
        title={<Rich k="pages.programs.title" />}
        sub={t('pages.programs.sub')}
      />
      <Ecosystem showHeader={false} />
      <CrossCTA
        title={t('pages.programs.ctaTitle')}
        sub={t('pages.programs.ctaSub')}
        primary={{ to: '/donate', label: t('pages.programs.ctaPrimary') }}
        secondary={{ to: '/about', label: t('pages.programs.ctaSecondary') }}
      />
    </Page>
  );
}
