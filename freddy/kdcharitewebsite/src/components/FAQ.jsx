import { useState } from 'react';
import { HelpCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FAQS } from '../data.js';
import { SectionHeader } from './ui.jsx';
import { Reveal } from '../lib/anim.jsx';

function Item({ q, a, isOpen, onToggle }) {
  return (
    <Reveal className="glass rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span className={`text-base font-semibold transition-colors ${isOpen ? 'text-emerald-400' : 'text-white group-hover:text-white/80'}`}>
          {q}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0 w-7 h-7 rounded-lg glass-emerald flex items-center justify-center text-emerald-400"
        >
          <Plus size={15} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm text-white/55 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Reveal>
  );
}

export default function FAQ({ showHeader = true }) {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="py-28 px-4">
      <div className="max-w-3xl mx-auto">
        {showHeader && (
          <SectionHeader
            badge="Questions"
            badgeIcon={HelpCircle}
            title={<>Everything you <span className="text-gradient">might ask</span></>}
            sub="Transparency starts with answering the hard questions plainly."
          />
        )}
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <Item key={f.q} {...f} isOpen={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
