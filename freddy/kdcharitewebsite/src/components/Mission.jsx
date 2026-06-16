import { Fuel, Church, HandHeart, Globe } from 'lucide-react';
import { RevealGroup, Reveal, scaleIn } from '../lib/anim.jsx';
import { SectionHeader } from './ui.jsx';

const PILLARS = [
  { icon: Fuel,      color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', title: 'Fuel Micro-Donations', desc: '2% opt-in at POS terminals across our partner network. No app. No account needed.' },
  { icon: Church,    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',     title: 'Faith-Based Giving',   desc: 'Digitizing Sunday collections and amplifying their reach into verified local programs.' },
  { icon: HandHeart, color: 'text-emerald-300', bg: 'bg-emerald-400/10 border-emerald-400/20', title: 'Verified Impact',      desc: 'Every dollar tracked, every outcome reported. Donors see the precise change they made.' },
  { icon: Globe,     color: 'text-amber-300',   bg: 'bg-amber-400/10 border-amber-400/20',     title: 'City-Scale Change',    desc: 'We think in neighborhoods, act in cities. Our model scales without losing local context.' },
];

export default function Mission() {
  return (
    <section id="about" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          title={<>Why <span className="text-gradient">KDCharité</span> Works</>}
          sub="Most people want to give. They just need the friction removed and the trust established."
        />
        <RevealGroup gap={0.1} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PILLARS.map((p) => (
            <Reveal
              key={p.title}
              variants={scaleIn}
              whileHover={{ y: -6 }}
              className="glass rounded-2xl p-6 group hover:border-emerald-500/25 transition-colors duration-300"
            >
              <div className={`w-11 h-11 rounded-xl border ${p.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <p.icon size={20} className={p.color} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{p.title}</h3>
              <p className="text-sm text-white/45 leading-relaxed">{p.desc}</p>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
