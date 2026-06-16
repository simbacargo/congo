import { Globe } from 'lucide-react';
import Page, { PageHero } from '../components/Page.jsx';
import Ecosystem from '../components/Ecosystem.jsx';
import { CrossCTA } from '../components/ui.jsx';

export default function Programs() {
  return (
    <Page title="Programs">
      <PageHero
        badge="Our Programs"
        badgeIcon={Globe}
        title={<>Two networks, <span className="text-gradient">one mission</span></>}
        sub="KDCharité bridges commerce and faith — turning routine fuel purchases and Sunday offerings into a single, transparent engine of community relief."
      />
      <Ecosystem showHeader={false} />
      <CrossCTA
        title="Run a station or lead a congregation?"
        sub="Onboard your community to the network in under a week."
        primary={{ to: '/donate', label: 'Partner with us' }}
        secondary={{ to: '/about', label: 'Meet the team' }}
      />
    </Page>
  );
}
