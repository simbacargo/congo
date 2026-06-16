import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RevealGroup, Reveal, fadeUp } from '../lib/anim.jsx';
import { TEAM } from '../data.js';
import { SectionHeader, Rich } from './ui.jsx';

export default function Team() {
  const { t } = useTranslation();
  const members = t('team.members', { returnObjects: true });
  return (
    <section id="team" className="py-28 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          badge={t('team.badge')}
          badgeIcon={Users}
          title={<Rich k="team.title" />}
          sub={t('team.sub')}
        />
        <RevealGroup gap={0.1} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TEAM.map((p, i) => (
            <Reveal
              key={p.name}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="glass rounded-2xl p-6 text-center group hover:border-emerald-500/25 transition-colors"
            >
              <div className="w-20 h-20 rounded-2xl glass-emerald mx-auto flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform">
                {p.avatar}
              </div>
              <h3 className="text-base font-bold text-white">{p.name}</h3>
              <div className="text-xs text-emerald-400 font-semibold mb-3">{members[i].role}</div>
              <p className="text-xs text-white/45 leading-relaxed">{members[i].bio}</p>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
