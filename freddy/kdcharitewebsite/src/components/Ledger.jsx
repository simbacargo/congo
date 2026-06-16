import { useState, useEffect, useRef } from 'react';
import {
  Activity, Fuel, Church, MapPin, Clock, Shield, Lock, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { INITIAL_LEDGER, NEW_DONATIONS } from '../data.js';
import { SectionHeader } from './ui.jsx';

export default function Ledger({ showHeader = true }) {
  const [entries, setEntries] = useState(INITIAL_LEDGER);
  const nextId = useRef(100);
  const donorIdx = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      const donor = NEW_DONATIONS[donorIdx.current % NEW_DONATIONS.length];
      donorIdx.current += 1;
      const entry = { id: nextId.current++, ...donor, time: 0 };
      setEntries((prev) =>
        [entry, ...prev.slice(0, 7)].map((e, i) => ({ ...e, time: i === 0 ? 0 : (e.time || 0) + 1 }))
      );
    }, 4500);
    return () => clearInterval(t);
  }, []);

  const fmtTime = (mins) => {
    if (mins === 0) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <section id="ledger" className="py-28 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/15 to-transparent pointer-events-none" />
      <div className="max-w-4xl mx-auto relative">
        {showHeader && (
          <SectionHeader
            badge="Transparency Ledger"
            badgeIcon={Activity}
            title={<>Every Cent, <span className="text-gradient">Publicly Visible</span></>}
            sub="Radical transparency isn't a feature — it's our foundation. Watch the network breathe in real time."
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-3xl overflow-hidden border-glow"
        >
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-amber-500/70" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <span className="text-xs text-white/40 font-medium">kdcharite.org / live-ledger</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE STREAM
            </div>
          </div>

          <div className="grid grid-cols-12 px-6 py-3 text-[11px] text-white/25 uppercase tracking-widest border-b border-white/5">
            <span className="col-span-1">Type</span>
            <span className="col-span-4">Source</span>
            <span className="col-span-3">Location</span>
            <span className="col-span-2 text-right">Amount</span>
            <span className="col-span-2 text-right">Time</span>
          </div>

          <div className="min-h-[420px]">
            <AnimatePresence initial={false}>
              {entries.map((entry) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, height: 0, backgroundColor: 'rgba(16,185,129,0.10)' }}
                  animate={{ opacity: 1, height: 'auto', backgroundColor: 'rgba(16,185,129,0)' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-12 items-center px-6 py-4 border-b border-white/5 hover:bg-white/[0.025]"
                >
                  <div className="col-span-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${entry.type === 'fuel' ? 'bg-emerald-500/15 border border-emerald-500/25' : 'bg-amber-500/15 border border-amber-500/25'}`}>
                      {entry.type === 'fuel' ? <Fuel size={13} className="text-emerald-400" /> : <Church size={13} className="text-amber-400" />}
                    </div>
                  </div>
                  <div className="col-span-4 pl-1">
                    <div className="text-sm font-semibold text-white/90 leading-tight">{entry.source}</div>
                    <div className={`text-[11px] font-medium mt-0.5 ${entry.type === 'fuel' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {entry.type === 'fuel' ? '2% Opt-in' : 'Weekly Tithe'}
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center gap-1.5">
                    <MapPin size={11} className="text-white/25 flex-shrink-0" />
                    <span className="text-sm text-white/45 truncate">{entry.location}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className={`text-sm font-bold ${entry.amount < 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      +${entry.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-[11px] text-white/30 flex items-center justify-end gap-1">
                      <Clock size={10} />{fmtTime(entry.time)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="px-6 py-4 bg-white/[0.02] flex items-center justify-between">
            <span className="text-xs text-white/30">Showing latest transactions · All amounts verified on-chain</span>
            <button className="text-xs text-emerald-400 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              Full ledger <ArrowRight size={11} />
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {[
            { icon: Shield, label: 'Audited Annually', sub: 'Independent CPA review' },
            { icon: Lock, label: '256-bit Encrypted', sub: 'Bank-grade security' },
            { icon: CheckCircle2, label: '501(c)(3) Registered', sub: 'EIN 88-0123456' },
          ].map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-xl p-4 flex items-center gap-3"
            >
              <b.icon size={18} className="text-emerald-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-white/80">{b.label}</div>
                <div className="text-[11px] text-white/35">{b.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
