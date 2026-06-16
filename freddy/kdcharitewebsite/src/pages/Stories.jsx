import { MessageCircle } from 'lucide-react';
import Page, { PageHero } from '../components/Page.jsx';
import Testimonials from '../components/Testimonials.jsx';
import ImpactShowcase from '../components/ImpactShowcase.jsx';
import { CrossCTA } from '../components/ui.jsx';

export default function Stories() {
  return (
    <Page title="Stories">
      <PageHero
        badge="Voices"
        badgeIcon={MessageCircle}
        title={<>Generosity, <span className="text-gradient">in their words</span></>}
        sub="Drivers, pastors, station owners, and neighbors — the people who make and feel the 2% every single day."
      />
      <Testimonials showHeader={false} />
      <ImpactShowcase />
      <CrossCTA
        title="Add your own story to the movement"
        sub="It starts with a single tap at the pump."
        primary={{ to: '/donate', label: 'Start giving' }}
        secondary={{ to: '/how-it-works', label: 'How it works' }}
      />
    </Page>
  );
}
