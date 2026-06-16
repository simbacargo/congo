import { MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Page, { PageHero } from '../components/Page.jsx';
import Testimonials from '../components/Testimonials.jsx';
import ImpactShowcase from '../components/ImpactShowcase.jsx';
import { CrossCTA, Rich } from '../components/ui.jsx';

export default function Stories() {
  const { t } = useTranslation();
  return (
    <Page title={t('pages.stories.docTitle')}>
      <PageHero
        badge={t('pages.stories.badge')}
        badgeIcon={MessageCircle}
        title={<Rich k="pages.stories.title" />}
        sub={t('pages.stories.sub')}
      />
      <Testimonials showHeader={false} />
      <ImpactShowcase />
      <CrossCTA
        title={t('pages.stories.ctaTitle')}
        sub={t('pages.stories.ctaSub')}
        primary={{ to: '/donate', label: t('pages.stories.ctaPrimary') }}
        secondary={{ to: '/how-it-works', label: t('pages.stories.ctaSecondary') }}
      />
    </Page>
  );
}
