import { Fuel, Church, HandHeart, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RevealGroup, Reveal, scaleIn } from '../lib/anim.jsx';
import { SectionHeader, Rich } from './ui.jsx';

// Visual style per pillar; titles/descriptions come from mission.pillars[i].
const PILLAR_STYLES = [
  { icon: Fuel,      color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { icon: Church,    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  { icon: HandHeart, color: 'text-emerald-300', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  { icon: Globe,     color: 'text-amber-300',   bg: 'bg-amber-400/10 border-amber-400/20' },
];

export default function Mission() {
  const { t } = useTranslation();
  const pillars = t('mission.pillars', { returnObjects: true });
  return (
    <section id="about" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          title={<Rich k="mission.title" />}
          sub={t('mission.sub')}
        />
        <RevealGroup gap={0.1} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PILLAR_STYLES.map((p, i) => (
            <Reveal
              key={i}
              variants={scaleIn}
              whileHover={{ y: -6 }}
              className="glass rounded-2xl p-6 group hover:border-emerald-500/25 transition-colors duration-300"
            >
              <div className={`w-11 h-11 rounded-xl border ${p.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <p.icon size={20} className={p.color} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{pillars[i].title}</h3>
              <p className="text-sm text-white/45 leading-relaxed">{pillars[i].desc}</p>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
