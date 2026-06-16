import { Heart } from 'lucide-react';
import Page, { PageHero } from '../components/Page.jsx';
import CTA from '../components/CTA.jsx';
import FAQ from '../components/FAQ.jsx';

export default function Donate() {
  return (
    <Page title="Donate & Partner">
      <PageHero
        badge="Get Involved"
        badgeIcon={Heart}
        badgeTone="emerald"
        title={<>Give once. <span className="text-gradient">Change a block.</span></>}
        sub="Donate directly to the community fund, or bring the 2% to your own city as a station or congregation. 100% reaches the community — tracked on the same public ledger."
      />
      <CTA />
      <FAQ showHeader />
    </Page>
  );
}
