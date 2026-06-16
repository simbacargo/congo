import { Heart } from 'lucide-react';
import Page, { PageHero } from '../components/Page.jsx';
import Mission from '../components/Mission.jsx';
import Timeline from '../components/Timeline.jsx';
import Team from '../components/Team.jsx';
import { CrossCTA } from '../components/ui.jsx';

export default function About() {
  return (
    <Page title="About">
      <PageHero
        badge="Who We Are"
        badgeIcon={Heart}
        title={<>Removing the friction <span className="text-gradient">between intention and impact</span></>}
        sub="Most people want to give. KDCharité is a registered 501(c)(3) built on one belief: generosity just needs to be easier, and trust needs to be earned in public."
      />
      <Mission />
      <Timeline />
      <Team />
      <CrossCTA
        title="Build the 2% movement with us"
        sub="Whether you give, partner, or join the team — there's a place for you."
        primary={{ to: '/donate', label: 'Get involved' }}
        secondary={{ to: '/faq', label: 'Read the FAQ' }}
      />
    </Page>
  );
}
