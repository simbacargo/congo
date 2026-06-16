import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Page, { PageHero } from '../components/Page.jsx';
import Mission from '../components/Mission.jsx';
import Timeline from '../components/Timeline.jsx';
import Team from '../components/Team.jsx';
import { CrossCTA, Rich } from '../components/ui.jsx';

export default function About() {
  const { t } = useTranslation();
  return (
    <Page title={t('pages.about.docTitle')}>
      <PageHero
        badge={t('pages.about.badge')}
        badgeIcon={Heart}
        title={<Rich k="pages.about.title" />}
        sub={t('pages.about.sub')}
      />
      <Mission />
      <Timeline />
      <Team />
      <CrossCTA
        title={t('pages.about.ctaTitle')}
        sub={t('pages.about.ctaSub')}
        primary={{ to: '/donate', label: t('pages.about.ctaPrimary') }}
        secondary={{ to: '/faq', label: t('pages.about.ctaSecondary') }}
      />
    </Page>
  );
}
