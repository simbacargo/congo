import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { SpringNumber, RevealGroup, Reveal, scaleIn } from '../lib/anim.jsx';
import { IMPACT_METRICS } from '../data.js';
import { SectionHeader } from './ui.jsx';

export default function ImpactShowcase() {
  return (
    <section id="impact" className="py-28 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/25 to-transparent pointer-events-none" />
      {/* ambient glow blobs */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ repeat: Infinity, duration: 8 }}
        className="absolute top-10 left-1/4 w-72 h-72 bg-emerald-600/10 rounded-full blur-[120px]"
      />
      <div className="max-w-6xl mx-auto relative">
        <SectionHeader
          badge="Verified Outcomes"
          badgeIcon={Sparkles}
          title={<>The numbers behind <span className="text-gradient">the mission</span></>}
          sub="Every figure below is reconciled against our public ledger and independently audited each year."
        />

        <RevealGroup gap={0.12} className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {IMPACT_METRICS.map((m) => (
            <Reveal
              key={m.label}
              variants={scaleIn}
              whileHover={{ y: -6 }}
              className="glass rounded-2xl p-7 text-center border-glow group"
            >
              <div className="text-4xl md:text-5xl font-black text-gradient mb-2 tracking-tight">
                <SpringNumber value={m.value} format={m.fmt} />
              </div>
              <div className="text-sm font-semibold text-white/70">{m.label}</div>
              <div className="mt-4 h-1 w-12 mx-auto rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 opacity-50 group-hover:w-20 group-hover:opacity-100 transition-all duration-500" />
            </Reveal>
          ))}
        </RevealGroup>

        <Reveal className="mt-12 glass rounded-3xl p-8 md:p-10 text-center max-w-3xl mx-auto border-glow">
          <p className="text-xl md:text-2xl text-white/80 font-medium leading-relaxed">
            "We measure success not in dollars raised, but in
            <span className="text-emerald-400 font-bold"> meals served, wells dug, and clinics opened</span> —
            and we let anyone check our math."
          </p>
          <div className="text-sm text-white/40 mt-5">— KDCharité 2025 Impact Report</div>
        </Reveal>
      </div>
    </section>
  );
}
