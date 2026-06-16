import { useState, useEffect, useRef } from 'react';
import {
  Heart, ChevronRight, ChevronDown, Sparkles, DollarSign, Church, Fuel,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSpring as useRSpring, animated } from '@react-spring/web';
import { Trans, useTranslation } from 'react-i18next';
import { useGsap, gsap, SpringNumber, stagger, fadeUp } from '../lib/anim.jsx';

// React-spring-animated router link, used by the magnetic CTA below.
const AnimatedLink = animated(Link);

// ─── LIVE COUNTERS (React Spring physics numbers) ────────────────────────────

function LiveCounters() {
  const { t } = useTranslation();
  const [funds, setFunds]       = useState(1_284_532);
  const [churches, setChurches] = useState(312);
  const [stations, setStations] = useState(1_847);

  useEffect(() => {
    const id = setInterval(() => {
      setFunds((f) => f + Math.floor(Math.random() * 85 + 15));
      if (Math.random() < 0.04) setChurches((c) => c + 1);
      if (Math.random() < 0.06) setStations((s) => s + 1);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  const stats = [
    { label: t('hero.stats.fundsLabel'), value: funds, icon: DollarSign, color: 'text-emerald-400', glow: 'rgba(16,185,129,0.25)', sub: t('hero.stats.fundsSub'), fmt: (n) => '$' + Math.round(n).toLocaleString() },
    { label: t('hero.stats.churchesLabel'), value: churches, icon: Church, color: 'text-amber-400', glow: 'rgba(251,191,36,0.22)', sub: t('hero.stats.churchesSub'), fmt: (n) => Math.round(n).toLocaleString() + '+' },
    { label: t('hero.stats.stationsLabel'), value: stations, icon: Fuel, color: 'text-emerald-300', glow: 'rgba(110,231,183,0.2)', sub: t('hero.stats.stationsSub'), fmt: (n) => Math.round(n).toLocaleString() },
  ];

  return (
    <motion.div
      variants={stagger(0.12, 0.3)}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-3 gap-5"
    >
      {stats.map((s) => (
        <motion.div
          key={s.label}
          variants={fadeUp}
          whileHover={{ y: -4 }}
          className="glass rounded-2xl p-6 group hover:border-emerald-500/30 transition-colors duration-300 relative overflow-hidden"
          style={{ boxShadow: `0 0 32px ${s.glow}` }}
        >
          <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 pointer-events-none" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl glass-emerald flex items-center justify-center">
              <s.icon size={18} className={s.color} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium uppercase tracking-widest">{t('hero.live')}</span>
            </div>
          </div>
          <div className={`text-3xl font-bold tracking-tight ${s.color} mb-1`}>
            <SpringNumber value={s.value} format={s.fmt} />
          </div>
          <div className="text-sm font-semibold text-white/80 mb-1">{s.label}</div>
          <div className="text-xs text-white/40">{s.sub}</div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── MAGNETIC CTA (React Spring) ─────────────────────────────────────────────
// Button drifts toward the cursor with a spring, snapping back on leave.

function MagneticButton({ children, to, className }) {
  const [spring, api] = useRSpring(() => ({ x: 0, y: 0, config: { tension: 300, friction: 18 } }));
  const ref = useRef(null);

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    api.start({ x: x * 0.3, y: y * 0.3 });
  };
  const onLeave = () => api.start({ x: 0, y: 0 });

  return (
    <AnimatedLink
      ref={ref}
      to={to}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={spring}
      className={className}
    >
      {children}
    </AnimatedLink>
  );
}

// ─── HERO ────────────────────────────────────────────────────────────────────

export default function Hero() {
  const { t } = useTranslation();
  // GSAP: scroll parallax on the ambient orbs + ring, and a mouse-driven drift.
  const scope = useGsap((self, root) => {
    const orbs = self.selector('[data-orb]');
    orbs.forEach((orb, i) => {
      gsap.to(orb, {
        yPercent: (i % 2 === 0 ? 1 : -1) * (30 + i * 12),
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 1 },
      });
    });

    const onMove = (e) => {
      const cx = (e.clientX / window.innerWidth - 0.5) * 2;
      const cy = (e.clientY / window.innerHeight - 0.5) * 2;
      gsap.to(orbs, {
        x: (i) => cx * (12 + i * 6),
        y: (i) => cy * (12 + i * 6),
        duration: 1,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };
    window.addEventListener('mousemove', onMove);
    self.add(() => window.removeEventListener('mousemove', onMove));
  });

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
  };

  return (
    <section ref={scope} id="top" className="relative min-h-screen flex flex-col justify-center px-4 overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950" />
      <div data-orb className="absolute top-1/4 -left-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-[100px]" />
      <div data-orb className="absolute bottom-1/4 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-[90px]" />
      <div data-orb className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-emerald-500/[0.05] rounded-full animate-spin-slow pointer-events-none" />
      <div data-orb className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-emerald-500/[0.08] rounded-full animate-spin-slow pointer-events-none" style={{ animationDuration: '14s', animationDirection: 'reverse' }} />

      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-emerald-400/40"
          style={{ top: `${15 + i * 10}%`, left: `${10 + i * 11}%`, animation: `float ${4 + i * 0.8}s ease-in-out infinite`, animationDelay: `${i * 0.6}s` }}
        />
      ))}

      <div className="relative max-w-7xl mx-auto w-full pt-32 pb-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: Copy */}
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
              <span className="glass-emerald rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                {t('hero.badge')}
              </span>
              <span className="text-xs text-white/30">{t('hero.est')}</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
              {t('hero.titleA')}<br />
              <span className="text-gradient-anim">{t('hero.titleB')}</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-xl text-white/55 leading-relaxed mb-4 max-w-lg">
              {t('hero.lead')}
            </motion.p>
            <motion.p variants={fadeUp} className="text-sm text-white/35 leading-relaxed mb-10 max-w-md">
              {t('hero.sub')}
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 mb-14">
              <MagneticButton
                to="/donate"
                className="group flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-7 py-3.5 rounded-2xl shadow-xl shadow-emerald-900/50 cursor-pointer"
              >
                <Heart size={17} fill="currentColor" />
                {t('hero.startGiving')}
                <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </MagneticButton>
              <Link
                to="/how-it-works"
                className="flex items-center gap-2.5 glass hover:border-emerald-500/40 text-white font-semibold px-7 py-3.5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
              >
                {t('hero.howItWorks')}
                <ChevronDown size={15} />
              </Link>
            </motion.div>

            <motion.div variants={fadeUp}>
              <div className="flex items-center gap-3 text-xs text-white/25 mb-3">
                <span className="h-px flex-1 bg-white/[0.08]" />
                <span>{t('hero.trustedBy')}</span>
                <span className="h-px flex-1 bg-white/[0.08]" />
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                {['TotalEnergies', 'Engen', 'Puma Energy', 'Cobil', 'SEP Congo', 'Mining Oil'].map((brand) => (
                  <span key={brand} className="text-xs font-bold text-white/20 tracking-widest uppercase whitespace-nowrap">
                    {brand}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Live counters + visual */}
          <div className="space-y-6">
            <LiveCounters />
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="glass rounded-2xl p-6 border-glow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={20} className="text-amber-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white mb-1">{t('hero.principleTitle')}</div>
                  <p className="text-xs text-white/45 leading-relaxed">
                    <Trans
                      i18nKey="hero.principleBody"
                      components={{ e: <span className="text-emerald-400 font-semibold" /> }}
                    />
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-white/25 tracking-widest uppercase">{t('hero.scroll')}</span>
        <ChevronDown size={16} className="text-white/25" />
      </motion.div>
    </section>
  );
}
