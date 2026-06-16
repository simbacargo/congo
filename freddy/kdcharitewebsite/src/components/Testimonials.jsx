import { useState, useEffect, useCallback } from 'react';
import { Quote, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TESTIMONIALS } from '../data.js';
import { SectionHeader, Rich } from './ui.jsx';

const variants = {
  enter: (dir) => ({ x: dir > 0 ? 120 : -120, opacity: 0, scale: 0.95 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir) => ({ x: dir > 0 ? -120 : 120, opacity: 0, scale: 0.95 }),
};

export default function Testimonials({ showHeader = true }) {
  const { t } = useTranslation();
  const [[index, dir], setState] = useState([0, 0]);
  const count = TESTIMONIALS.length;
  const items = t('testimonials.items', { returnObjects: true });

  const paginate = useCallback((d) => {
    setState(([i]) => [(i + d + count) % count, d]);
  }, [count]);

  // Auto-advance, pausing isn't critical for a marketing carousel.
  useEffect(() => {
    const t = setInterval(() => paginate(1), 6000);
    return () => clearInterval(t);
  }, [paginate]);

  const person = TESTIMONIALS[index];
  const story = items[index];

  return (
    <section id="stories" className="py-28 px-4 relative">
      <div className="max-w-4xl mx-auto">
        {showHeader && (
          <SectionHeader
            badge={t('testimonials.badge')}
            badgeIcon={MessageCircle}
            title={<Rich k="testimonials.title" />}
            sub={t('testimonials.sub')}
          />
        )}

        <div className="relative glass rounded-3xl p-8 md:p-12 border-glow overflow-hidden min-h-[340px] flex flex-col">
          <Quote size={120} className="absolute -top-4 -left-2 text-red-500/[0.05]" />

          <div className="relative flex-1 flex items-center">
            <AnimatePresence custom={dir} mode="wait">
              <motion.div
                key={index}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, info) => {
                  if (info.offset.x < -80) paginate(1);
                  else if (info.offset.x > 80) paginate(-1);
                }}
                className="cursor-grab active:cursor-grabbing"
              >
                <p className="text-xl md:text-2xl text-white/85 font-medium leading-relaxed mb-8">
                  "{story.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl glass-red flex items-center justify-center text-2xl">{person.avatar}</div>
                  <div>
                    <div className="text-sm font-bold text-white">{person.name}</div>
                    <div className="text-xs text-white/45">{story.role}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative flex items-center justify-between mt-8 pt-6 border-t border-white/10">
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setState([i, i > index ? 1 : -1])}
                  aria-label={t('testimonials.goToStory', { n: i + 1 })}
                  className={`h-2 rounded-full transition-all duration-300 ${i === index ? 'w-8 bg-red-400' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {[[-1, ChevronLeft], [1, ChevronRight]].map(([d, Icon]) => (
                <button
                  key={d}
                  onClick={() => paginate(d)}
                  aria-label={d > 0 ? t('testimonials.next') : t('testimonials.prev')}
                  className="w-10 h-10 glass rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:border-red-500/40 transition-colors"
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
