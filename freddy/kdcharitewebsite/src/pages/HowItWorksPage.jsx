import { Workflow } from 'lucide-react';
import Page, { PageHero } from '../components/Page.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import Calculator from '../components/Calculator.jsx';
import { CrossCTA } from '../components/ui.jsx';

export default function HowItWorksPage() {
  return (
    <Page title="How It Works">
      <PageHero
        badge="The Mechanism"
        badgeIcon={Workflow}
        title={<>One tap at the pump, <span className="text-gradient">city-wide relief</span></>}
        sub="No app. No account. No friction. Here's exactly how a 2% opt-in becomes a meal, a clinic visit, or a well — and how to picture your own impact."
      />
      <HowItWorks />
      <Calculator />
      <CrossCTA
        title="Curious where the money lands?"
        sub="Every cent is traceable on our public, real-time ledger."
        primary={{ to: '/impact', label: 'See live impact' }}
        secondary={{ to: '/donate', label: 'Give now' }}
      />
    </Page>
  );
}
