import { HelpCircle } from 'lucide-react';
import Page, { PageHero } from '../components/Page.jsx';
import FAQ from '../components/FAQ.jsx';
import { CrossCTA } from '../components/ui.jsx';

export default function FAQPage() {
  return (
    <Page title="FAQ">
      <PageHero
        badge="Answers"
        badgeIcon={HelpCircle}
        title={<>Everything you <span className="text-gradient">might ask</span></>}
        sub="Transparency starts with answering the hard questions plainly. Still curious? Reach us at impact@kdcharite.org."
      />
      <FAQ showHeader={false} />
      <CrossCTA
        title="Didn't find your answer?"
        sub="Our team is happy to walk you through anything before you commit."
        primary={{ to: '/donate', label: 'Talk to us' }}
        secondary={{ to: '/programs', label: 'Explore programs' }}
      />
    </Page>
  );
}
