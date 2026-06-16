import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { SpringNumber, RevealGroup, Reveal, scaleIn } from '../lib/anim.jsx';
import { IMPACT_METRICS } from '../data.js';
import { SectionHeader, Rich } from './ui.jsx';

export default function ImpactShowcase() {
  const { t } = useTranslation();
  const labels = t('impactShowcase.metrics', { returnObjects: true });
  return (
    <section id="impact" className="py-28 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/25 to-transparent pointer-events-none" />
      {/* ambient glow blobs */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ repeat: Infinity, duration: 8 }}
        className="absolute top-10 left-1/4 w-72 h-72 bg-red-600/10 rounded-full blur-[120px]"
      />
      <div className="max-w-6xl mx-auto relative">
        <SectionHeader
          badge={t('impactShowcase.badge')}
          badgeIcon={Sparkles}
          title={<Rich k="impactShowcase.title" />}
          sub={t('impactShowcase.sub')}
        />

        <RevealGroup gap={0.12} className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {IMPACT_METRICS.map((m, i) => (
            <Reveal
              key={i}
              variants={scaleIn}
              whileHover={{ y: -6 }}
              className="glass rounded-2xl p-7 text-center border-glow group"
            >
              <div className="text-4xl md:text-5xl font-black text-gradient mb-2 tracking-tight">
                <SpringNumber value={m.value} format={m.fmt} />
              </div>
              <div className="text-sm font-semibold text-white/70">{labels[i]}</div>
              <div className="mt-4 h-1 w-12 mx-auto rounded-full bg-gradient-to-r from-red-500 to-amber-400 opacity-50 group-hover:w-20 group-hover:opacity-100 transition-all duration-500" />
            </Reveal>
          ))}
        </RevealGroup>

        <Reveal className="mt-12 glass rounded-3xl p-8 md:p-10 text-center max-w-3xl mx-auto border-glow">
          <p className="text-xl md:text-2xl text-white/80 font-medium leading-relaxed">
            <Rich k="impactShowcase.quote" />
          </p>
          <div className="text-sm text-white/40 mt-5">{t('impactShowcase.attribution')}</div>
        </Reveal>
      </div>
    </section>
  );
}
