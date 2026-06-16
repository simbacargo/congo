import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScrollTrigger } from '../lib/anim.jsx';
import { Badge } from './ui.jsx';

// ─── SCROLL MANAGER ──────────────────────────────────────────────────────────
// On every route change: jump to top and tell GSAP ScrollTrigger to recalc,
// since each page has a different height (and some pin/scrub the viewport).

export function ScrollManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    // Let the incoming page paint, then refresh trigger positions.
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);
  return null;
}

// ─── PAGE WRAPPER ────────────────────────────────────────────────────────────
// Opacity-only enter/exit transition (no transform — a transformed ancestor
// would break GSAP's pinned sections). Also sets the document title.

export default function Page({ title, children }) {
  useEffect(() => {
    if (title) document.title = `${title} · KDCharité`;
    return () => { document.title = 'KDCharité — Small Changes. Massive Impact.'; };
  }, [title]);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
    >
      {children}
    </motion.main>
  );
}

// ─── INNER-PAGE HERO ─────────────────────────────────────────────────────────
// Compact banner for sub-pages: ambient glow, badge, gradient title, subtitle.

export function PageHero({ badge, badgeIcon, badgeTone, title, sub, children }) {
  return (
    <section className="relative pt-40 pb-16 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-slate-950 to-transparent" />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.55, 0.3] }}
        transition={{ repeat: Infinity, duration: 9 }}
        className="absolute -top-10 left-1/2 -translate-x-1/2 w-[36rem] h-72 bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none"
      />
      <div className="relative max-w-4xl mx-auto text-center">
        {badge && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
            <Badge icon={badgeIcon} tone={badgeTone}>{badge}</Badge>
          </motion.div>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl md:text-6xl font-black text-white leading-[1.08] tracking-tight mb-5"
        >
          {title}
        </motion.h1>
        {sub && (
          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.6 }}
            className="text-lg text-white/55 max-w-2xl mx-auto leading-relaxed"
          >
            {sub}
          </motion.p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
