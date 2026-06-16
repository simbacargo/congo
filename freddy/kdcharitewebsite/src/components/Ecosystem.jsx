import { useState } from 'react';
import {
  Fuel, Church, Globe, Zap, Shield, BarChart3,
  HandHeart, Eye, Lock, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { STATIONS_GRID, CHURCHES } from '../data.js';
import { SectionHeader } from './ui.jsx';

const FUEL_FEATURES = [
  { icon: Zap,       title: 'Real-Time POS Integration', desc: 'Native SDK embedded in major pump management systems — no hardware changes needed.' },
  { icon: Shield,    title: 'Zero-Fee Model',            desc: '100% of every 2% reaches the community fund. KDCharité operations are grant-funded.' },
  { icon: BarChart3, title: 'Monthly Impact Reports',    desc: 'Every participating station receives a branded impact summary for community display.' },
];

const FAITH_FEATURES = [
  { icon: HandHeart, title: 'Digital Tithe Portal',    desc: 'Mobile-friendly giving pages, QR codes, and Sunday offering digitization — all under your church brand.' },
  { icon: Eye,       title: 'Donor Impact Dashboard',  desc: 'Every congregant has a personal dashboard showing exactly how their giving has moved the needle.' },
  { icon: Lock,      title: 'Compliance & Trust Layer', desc: 'Automated 990-ready reporting. Auditable by your board, your donors, and the public.' },
];

const panel = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
};

export default function Ecosystem({ showHeader = true }) {
  const [active, setActive] = useState('fuel');
  const activeCount = STATIONS_GRID.filter((s) => s.status === 'active').length;

  return (
    <section id="ecosystem" className="py-28 px-4">
      <div className="max-w-6xl mx-auto">
        {showHeader && (
          <SectionHeader
            badge="Our Ecosystem"
            badgeIcon={Globe}
            title={<>Two Networks.<br /><span className="text-gradient">One Mission.</span></>}
            sub="KDCharité bridges the intersection of commerce and faith — turning routine transactions into recurring acts of generosity."
          />
        )}

        {/* Tabs with sliding indicator */}
        <div className="flex gap-2 glass rounded-2xl p-1.5 w-fit mx-auto mb-12">
          {[
            { key: 'fuel',  label: 'The Fuel Network',  icon: Fuel },
            { key: 'faith', label: 'The Faith Network', icon: Church },
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
                  className="absolute inset-0 rounded-xl bg-emerald-600 shadow-lg shadow-emerald-900/50"
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
                  Frictionless giving at the pump — no app, no wallet.
                </h3>
                <p className="text-white/55 leading-relaxed mb-7">
                  When drivers pay at a KDCharité-integrated terminal, a single screen prompt asks: <em className="text-emerald-400 not-italic font-semibold">"Add 2% to help your community?"</em> One tap. Done. The micro-donation is processed with the transaction — transparent, instant, and verifiable on our public ledger.
                </p>
                <div className="space-y-4">
                  {FUEL_FEATURES.map((f) => (
                    <div key={f.title} className="flex gap-4 glass rounded-xl p-4 hover:border-emerald-500/30 transition-all">
                      <div className="w-10 h-10 rounded-xl glass-emerald flex items-center justify-center flex-shrink-0 mt-0.5">
                        <f.icon size={16} className="text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white mb-0.5">{f.title}</div>
                        <div className="text-xs text-white/45 leading-relaxed">{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-white/40 uppercase tracking-widest">Live Partner Stations</span>
                  <span className="text-xs text-emerald-400 font-semibold">{activeCount} Active</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {STATIONS_GRID.map((s, i) => (
                    <motion.div
                      key={s.name}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      whileHover={{ scale: 1.06 }}
                      className={`glass rounded-xl p-3 text-center ${s.status === 'active' ? 'border-emerald-500/20' : 'opacity-50'}`}
                    >
                      <div className={`w-2 h-2 rounded-full mx-auto mb-2 ${s.status === 'active' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-amber-400'}`} />
                      <div className="text-[11px] font-semibold text-white/80 leading-tight">{s.name}</div>
                      <div className="text-[10px] text-white/35 mt-0.5">{s.city}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="flex gap-4 mt-4 text-xs text-white/35">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Active</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Onboarding</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="faith" variants={panel} initial="hidden" animate="show" exit="exit" className="grid md:grid-cols-2 gap-10 items-start">
              <div>
                <h3 className="text-3xl font-bold text-white mb-5 leading-tight">
                  Amplifying ancient generosity with modern accountability.
                </h3>
                <p className="text-white/55 leading-relaxed mb-7">
                  Traditional tithing is powerful — but often opaque. KDCharité gives every congregation a digital platform to collect, allocate, and publicly report exactly how their community's faith-giving flows into tangible local outcomes. Members see the full story.
                </p>
                <div className="space-y-4">
                  {FAITH_FEATURES.map((f) => (
                    <div key={f.title} className="flex gap-4 glass rounded-xl p-4 hover:border-amber-500/25 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <f.icon size={16} className="text-amber-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white mb-0.5">{f.title}</div>
                        <div className="text-xs text-white/45 leading-relaxed">{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-3xl p-7">
                <div className="text-xs text-white/40 uppercase tracking-widest mb-6">Partner Faith Communities</div>
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
                        <div className="text-xs text-white/35">{c.denom} · {c.members.toLocaleString()} members</div>
                      </div>
                      <div className="text-sm font-bold text-amber-400 text-right">
                        {c.raised}
                        <div className="text-[10px] text-white/30 font-normal">raised YTD</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs text-white/40">+ 307 more communities</span>
                  <button className="text-xs text-amber-400 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                    Join the network <ArrowRight size={12} />
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
