import { BarChart3 } from 'lucide-react';
import Page, { PageHero } from '../components/Page.jsx';
import ImpactShowcase from '../components/ImpactShowcase.jsx';
import Ledger from '../components/Ledger.jsx';
import { CrossCTA } from '../components/ui.jsx';

export default function Impact() {
  return (
    <Page title="Impact">
      <PageHero
        badge="Radical Transparency"
        badgeIcon={BarChart3}
        title={<>Every cent, <span className="text-gradient">publicly visible</span></>}
        sub="We measure success in meals served, wells dug, and clinics opened — and we let anyone check our math, in real time."
      />
      <ImpactShowcase />
      <Ledger showHeader={false} />
      <CrossCTA
        title="Want to add your transaction to the ledger?"
        sub="Give directly, or bring the 2% to your own city."
        primary={{ to: '/donate', label: 'Donate now' }}
        secondary={{ to: '/stories', label: 'Read the stories' }}
      />
    </Page>
  );
}
