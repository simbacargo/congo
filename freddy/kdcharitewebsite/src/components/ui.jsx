// ─── SHARED UI PRIMITIVES ────────────────────────────────────────────────────

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { Reveal, fadeUp } from '../lib/anim.jsx';

// Renders a translation string that contains inline markup. Locale values use
// <g> for the gradient highlight, <e>/<eb> for emerald emphasis, <em> for the
// pump-prompt italics, and <br/> for line breaks — keeping styling in code while
// translators only handle text.
const RICH_COMPONENTS = {
  g: <span className="text-gradient" />,
  e: <span className="text-emerald-400 font-semibold" />,
  eb: <span className="text-emerald-400 font-bold" />,
  em: <em className="text-emerald-400 not-italic font-semibold" />,
  br: <br />,
};

export function Rich({ k, values }) {
  return <Trans i18nKey={k} values={values} components={RICH_COMPONENTS} />;
}

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

// Slim cross-page CTA banner — ties sub-pages back to a primary action. Copy
// falls back to the shared crossCTA translation when a page passes no overrides.
export function CrossCTA({
  title,
  sub,
  primary = { to: '/donate' },
  secondary = { to: '/programs' },
}) {
  const { t } = useTranslation();
  const primaryLabel = primary.label || t('crossCTA.primary');
  const secondaryLabel = secondary && (secondary.label || t('crossCTA.secondary'));
  return (
    <section className="py-20 px-4">
      <Reveal className="max-w-4xl mx-auto glass-emerald rounded-3xl p-8 md:p-12 border-glow text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-3">{title || t('crossCTA.title')}</h2>
        <p className="text-white/55 max-w-xl mx-auto mb-7">{sub || t('crossCTA.sub')}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to={primary.to}
            className="group flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-emerald-900/50 hover:-translate-y-0.5"
          >
            {primaryLabel}
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          {secondary && (
            <Link
              to={secondary.to}
              className="flex items-center gap-2 glass hover:border-emerald-500/40 text-white font-semibold px-6 py-3 rounded-2xl transition-all hover:-translate-y-0.5"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </Reveal>
    </section>
  );
}
