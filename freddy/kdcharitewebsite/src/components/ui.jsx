// ─── SHARED UI PRIMITIVES ────────────────────────────────────────────────────

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Reveal, fadeUp } from '../lib/anim.jsx';

export function Badge({ icon: Icon, children, tone = 'emerald' }) {
  const tones = {
    emerald: 'glass-emerald text-emerald-400',
    amber: 'glass-amber text-amber-400',
  };
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest ${tones[tone]}`}
    >
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}

// Animated section header — badge + title + subtitle, revealed on scroll.
export function SectionHeader({ badge, badgeIcon, badgeTone, title, sub, className = '' }) {
  return (
    <div className={`text-center mb-14 ${className}`}>
      {badge && (
        <Reveal variants={fadeUp} className="mb-5">
          <Badge icon={badgeIcon} tone={badgeTone}>{badge}</Badge>
        </Reveal>
      )}
      <Reveal
        as="h2"
        variants={fadeUp}
        className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4"
      >
        {title}
      </Reveal>
      {sub && (
        <Reveal
          as="p"
          variants={fadeUp}
          className="text-white/55 text-lg max-w-xl mx-auto"
        >
          {sub}
        </Reveal>
      )}
    </div>
  );
}

// Slim cross-page CTA banner — ties sub-pages back to a primary action.
export function CrossCTA({
  title = 'Ready to turn small change into big change?',
  sub = 'Join the network in under a week — no app, no hardware, no fees.',
  primary = { to: '/donate', label: 'Start Giving' },
  secondary = { to: '/programs', label: 'See the programs' },
}) {
  return (
    <section className="py-20 px-4">
      <Reveal className="max-w-4xl mx-auto glass-emerald rounded-3xl p-8 md:p-12 border-glow text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-3">{title}</h2>
        <p className="text-white/55 max-w-xl mx-auto mb-7">{sub}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to={primary.to}
            className="group flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-emerald-900/50 hover:-translate-y-0.5"
          >
            {primary.label}
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          {secondary && (
            <Link
              to={secondary.to}
              className="flex items-center gap-2 glass hover:border-emerald-500/40 text-white font-semibold px-6 py-3 rounded-2xl transition-all hover:-translate-y-0.5"
            >
              {secondary.label}
            </Link>
          )}
        </div>
      </Reveal>
    </section>
  );
}
