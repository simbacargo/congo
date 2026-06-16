import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Page, { PageHero } from '../components/Page.jsx';
import CTA from '../components/CTA.jsx';
import FAQ from '../components/FAQ.jsx';
import { Rich } from '../components/ui.jsx';

export default function Donate() {
  const { t } = useTranslation();
  return (
    <Page title={t('pages.donate.docTitle')}>
      <PageHero
        badge={t('pages.donate.badge')}
        badgeIcon={Heart}
        badgeTone="emerald"
        title={<Rich k="pages.donate.title" />}
        sub={t('pages.donate.sub')}
      />
      <CTA />
      <FAQ showHeader />
    </Page>
  );
}
