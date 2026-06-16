import { useState } from 'react';
import {
  Fuel, Church, Globe, Zap, Shield, BarChart3,
  HandHeart, Eye, Lock, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { STATIONS_GRID, CHURCHES } from '../data.js';
import { SectionHeader, Rich } from './ui.jsx';

const FUEL_ICONS = [Zap, Shield, BarChart3];
const FAITH_ICONS = [HandHeart, Eye, Lock];

const panel = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
};

export default function Ecosystem({ showHeader = true }) {
  const { t } = useTranslation();
  const [active, setActive] = useState('fuel');
  const activeCount = STATIONS_GRID.filter((s) => s.status === 'active').length;
  const fuelFeatures = t('ecosystem.fuel.features', { returnObjects: true });
  const faithFeatures = t('ecosystem.faith.features', { returnObjects: true });

  return (
    <section id="ecosystem" className="py-28 px-4">
      <div className="max-w-6xl mx-auto">
        {showHeader && (
          <SectionHeader
            badge={t('ecosystem.badge')}
            badgeIcon={Globe}
            title={<Rich k="ecosystem.title" />}
            sub={t('ecosystem.sub')}
          />
        )}

        {/* Tabs with sliding indicator */}
        <div className="flex gap-2 glass rounded-2xl p-1.5 w-fit mx-auto mb-12">
          {[
            { key: 'fuel',  label: t('ecosystem.tabFuel'),  icon: Fuel },
            { key: 'faith', label: t('ecosystem.tabFaith'), icon: Church },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`relative flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors duration-300 ${
                active === tab.key ? 'text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {active === tab.key && (
                <motion.span
                  layoutId="eco-tab"
                  className="absolute inset-0 rounded-xl bg-red-600 shadow-lg shadow-red-900/50"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <tab.icon size={15} className="relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {active === 'fuel' ? (
            <motion.div key="fuel" variants={panel} initial="hidden" animate="show" exit="exit" className="grid md:grid-cols-2 gap-10 items-start">
              <div>
                <h3 className="text-3xl font-bold text-white mb-5 leading-tight">
                  {t('ecosystem.fuel.heading')}
                </h3>
                <p className="text-white/55 leading-relaxed mb-7">
                  <Rich k="ecosystem.fuel.body" />
                </p>
                <div className="space-y-4">
                  {FUEL_ICONS.map((Icon, i) => (
                    <div key={i} className="flex gap-4 glass rounded-xl p-4 hover:border-red-500/30 transition-all">
                      <div className="w-10 h-10 rounded-xl glass-red flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon size={16} className="text-red-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white mb-0.5">{fuelFeatures[i].title}</div>
                        <div className="text-xs text-white/45 leading-relaxed">{fuelFeatures[i].desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-white/40 uppercase tracking-widest">{t('ecosystem.fuel.livePartners')}</span>
                  <span className="text-xs text-red-400 font-semibold">{t('ecosystem.fuel.active', { count: activeCount })}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {STATIONS_GRID.map((s, i) => (
                    <motion.div
                      key={s.name}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      whileHover={{ scale: 1.06 }}
                      className={`glass rounded-xl p-3 text-center ${s.status === 'active' ? 'border-red-500/20' : 'opacity-50'}`}
                    >
                      <div className={`w-2 h-2 rounded-full mx-auto mb-2 ${s.status === 'active' ? 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]' : 'bg-amber-400'}`} />
                      <div className="text-[11px] font-semibold text-white/80 leading-tight">{s.name}</div>
                      <div className="text-[10px] text-white/35 mt-0.5">{s.city}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="flex gap-4 mt-4 text-xs text-white/35">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> {t('ecosystem.fuel.legendActive')}</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {t('ecosystem.fuel.legendOnboarding')}</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="faith" variants={panel} initial="hidden" animate="show" exit="exit" className="grid md:grid-cols-2 gap-10 items-start">
              <div>
                <h3 className="text-3xl font-bold text-white mb-5 leading-tight">
                  {t('ecosystem.faith.heading')}
                </h3>
                <p className="text-white/55 leading-relaxed mb-7">
                  {t('ecosystem.faith.body')}
                </p>
                <div className="space-y-4">
                  {FAITH_ICONS.map((Icon, i) => (
                    <div key={i} className="flex gap-4 glass rounded-xl p-4 hover:border-amber-500/25 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon size={16} className="text-amber-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white mb-0.5">{faithFeatures[i].title}</div>
                        <div className="text-xs text-white/45 leading-relaxed">{faithFeatures[i].desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-3xl p-7">
                <div className="text-xs text-white/40 uppercase tracking-widest mb-6">{t('ecosystem.faith.partnerCommunities')}</div>
                <div className="space-y-3">
                  {CHURCHES.map((c) => (
                    <motion.div
                      key={c.name}
                      whileHover={{ x: 4 }}
                      className="flex items-center gap-3 glass rounded-xl p-3 hover:border-amber-500/20 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-base">✝️</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{c.name}</div>
                        <div className="text-xs text-white/35">{t(`denominations.${c.denom}`)} · {c.members.toLocaleString()} {t('ecosystem.faith.members')}</div>
                      </div>
                      <div className="text-sm font-bold text-amber-400 text-right">
                        {c.raised}
                        <div className="text-[10px] text-white/30 font-normal">{t('ecosystem.faith.raisedYTD')}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs text-white/40">{t('ecosystem.faith.moreCommunities')}</span>
                  <button className="text-xs text-amber-400 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                    {t('ecosystem.faith.join')} <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
