import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { Workflow, Globe, BarChart3, MessageCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Page from '../components/Page.jsx';
import Hero from '../components/Hero.jsx';
import Marquee from '../components/Marquee.jsx';
import Mission from '../components/Mission.jsx';
import { RevealGroup, Reveal, fadeUp } from '../lib/anim.jsx';
import { SectionHeader, Rich } from '../components/ui.jsx';

// Three.js is heavy and the globe sits below the fold — load it in its own
// chunk so the initial page stays lean.
const NetworkGlobe = lazy(() => import('../components/Globe.jsx'));

// Style/destination per card; title + desc come from home.cards[i].
const EXPLORE = [
  { to: '/how-it-works', icon: Workflow,      tone: 'red' },
  { to: '/programs',     icon: Globe,         tone: 'amber' },
  { to: '/impact',       icon: BarChart3,     tone: 'red' },
  { to: '/stories',      icon: MessageCircle, tone: 'amber' },
];

function ExploreCards() {
  const { t } = useTranslation();
  const cards = t('home.cards', { returnObjects: true });
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          title={<Rich k="home.exploreTitle" />}
          sub={t('home.exploreSub')}
        />
        <RevealGroup gap={0.1} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {EXPLORE.map((c, i) => (
            <Reveal key={c.to} variants={fadeUp}>
              <Link
                to={c.to}
                className="block h-full glass rounded-2xl p-6 group hover:border-red-500/30 hover:-translate-y-1.5 transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${c.tone === 'red' ? 'glass-red' : 'glass-amber'} group-hover:scale-110 transition-transform`}>
                  <c.icon size={20} className={c.tone === 'red' ? 'text-red-400' : 'text-amber-400'} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{cards[i].title}</h3>
                <p className="text-sm text-white/45 leading-relaxed mb-4">{cards[i].desc}</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 group-hover:gap-2 transition-all">
                  {t('home.explore')} <ArrowRight size={12} />
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
  const { t } = useTranslation();
  return (
    <Page title={t('pages.home.docTitle')}>
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
