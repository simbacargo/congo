import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { Workflow, Globe, BarChart3, MessageCircle, ArrowRight } from 'lucide-react';
import Page from '../components/Page.jsx';
import Hero from '../components/Hero.jsx';
import Marquee from '../components/Marquee.jsx';
import Mission from '../components/Mission.jsx';
import { RevealGroup, Reveal, fadeUp } from '../lib/anim.jsx';
import { SectionHeader } from '../components/ui.jsx';

// Three.js is heavy and the globe sits below the fold — load it in its own
// chunk so the initial page stays lean.
const NetworkGlobe = lazy(() => import('../components/Globe.jsx'));

const EXPLORE = [
  { to: '/how-it-works', icon: Workflow,      title: 'How It Works', desc: 'Follow a single 2-cent gift from the pump to the street.', tone: 'emerald' },
  { to: '/programs',     icon: Globe,         title: 'Our Programs', desc: 'The Fuel Network and the Faith Network, side by side.',   tone: 'amber' },
  { to: '/impact',       icon: BarChart3,     title: 'Live Impact',  desc: 'Verified outcomes and a public, real-time ledger.',       tone: 'emerald' },
  { to: '/stories',      icon: MessageCircle, title: 'Stories',      desc: 'The drivers, pastors, and neighbors behind the 2%.',      tone: 'amber' },
];

function ExploreCards() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          title={<>Explore the <span className="text-gradient">network</span></>}
          sub="Four ways into the story. Start anywhere."
        />
        <RevealGroup gap={0.1} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {EXPLORE.map((c) => (
            <Reveal key={c.to} variants={fadeUp}>
              <Link
                to={c.to}
                className="block h-full glass rounded-2xl p-6 group hover:border-emerald-500/30 hover:-translate-y-1.5 transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${c.tone === 'emerald' ? 'glass-emerald' : 'glass-amber'} group-hover:scale-110 transition-transform`}>
                  <c.icon size={20} className={c.tone === 'emerald' ? 'text-emerald-400' : 'text-amber-400'} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{c.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed mb-4">{c.desc}</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:gap-2 transition-all">
                  Explore <ArrowRight size={12} />
                </span>
              </Link>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Page title="Small Changes. Massive Impact.">
      <Hero />
      <Marquee />
      <Mission />
      <Suspense fallback={<div className="h-[560px]" />}>
        <NetworkGlobe />
      </Suspense>
      <ExploreCards />
    </Page>
  );
}
