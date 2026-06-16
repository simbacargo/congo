import { useState, useCallback } from 'react';
import { Zap, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring as useRSpring, animated } from '@react-spring/web';
import { useTranslation } from 'react-i18next';
import { getImpact } from '../data.js';
import { SectionHeader, Rich } from './ui.jsx';

// React Spring animated currency value.
function SpringMoney({ value }) {
  const { n } = useRSpring({ n: value, config: { tension: 180, friction: 22 } });
  return <animated.span>{n.to((v) => `$${v.toFixed(2)}`)}</animated.span>;
}

export default function Calculator() {
  const { t } = useTranslation();
  const [spending, setSpending] = useState(80);

  const donation = +(spending * 0.02).toFixed(2);
  const monthly  = +(spending * 4 * 0.02).toFixed(2);
  const yearly   = +(spending * 52 * 0.02).toFixed(2);
  const impact   = getImpact(donation);
  const pct      = ((spending - 20) / (200 - 20)) * 100;

  const handleChange = useCallback((e) => setSpending(Number(e.target.value)), []);

  const rows = [
    { label: t('calculator.perFillup'), value: donation, highlight: true },
    { label: t('calculator.monthly'),   value: monthly },
    { label: t('calculator.annual'),    value: yearly },
  ];

  return (
    <section id="calculator" className="py-28 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/20 to-transparent pointer-events-none" />
      <div className="max-w-5xl mx-auto relative">
        <SectionHeader
          badge={t('calculator.badge')}
          badgeIcon={Zap}
          title={<Rich k="calculator.title" />}
          sub={t('calculator.sub')}
        />

        <div className="grid md:grid-cols-2 gap-8">
          {/* Slider Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="glass rounded-3xl p-8 border-glow"
          >
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-white/60 text-sm font-medium">{t('calculator.weeklySpend')}</span>
              <span className="text-3xl font-bold text-white">${spending}</span>
            </div>

            <div className="relative mb-8">
              <div
                className="absolute top-0 left-0 h-[6px] rounded-l-full bg-gradient-to-r from-emerald-600 to-emerald-400 pointer-events-none"
                style={{ width: `${pct}%` }}
              />
              <input
                type="range" min={20} max={200} step={5}
                value={spending} onChange={handleChange}
                className="w-full relative z-10"
              />
              <div className="flex justify-between text-xs text-white/30 mt-2">
                <span>$20</span><span>$200</span>
              </div>
            </div>

            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className={`flex justify-between items-center rounded-xl px-4 py-3 ${
                    row.highlight ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-white/[0.03]'
                  }`}
                >
                  <span className="text-sm text-white/60">{row.label}</span>
                  <span className={`text-lg font-bold ${row.highlight ? 'text-emerald-400' : 'text-white'}`}>
                    <SpringMoney value={row.value} />
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-white/30">
              <CheckCircle2 size={12} className="text-emerald-500" />
              {t('calculator.optIn')}
            </div>
          </motion.div>

          {/* Impact Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="glass-emerald rounded-3xl p-8 flex flex-col justify-between"
          >
            <div>
              <div className="text-xs text-emerald-400 uppercase tracking-widest font-semibold mb-6">
                {t('calculator.translatesTo', { amount: donation.toFixed(2) })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={impact.id}
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.97 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="text-6xl mb-5">{impact.emoji}</div>
                  <p className="text-2xl font-bold text-white leading-snug mb-4">
                    {t(`calculator.impact.${impact.id}`, { count: impact.count(donation) })}
                  </p>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {t('calculator.flowText')}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="text-xs text-white/40 mb-3">{t('calculator.cityJoined')}</div>
              <div className="flex items-end gap-1 h-[50px]">
                {[30, 45, 55, 70, 80, 95, 100].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h * 0.5}px` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
                    className="flex-1 rounded-sm bg-gradient-to-t from-emerald-700 to-emerald-400 opacity-80"
                  />
                ))}
              </div>
              <div className="text-xs text-emerald-400 font-semibold mt-2">
                {t('calculator.cityRaised')}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
