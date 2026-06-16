import { useState } from 'react';
import { Heart, ArrowRight, Mail, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSpring as useRSpring, animated } from '@react-spring/web';
import { useTranslation } from 'react-i18next';
import { Rich } from './ui.jsx';

const AMOUNTS = [5, 10, 25, 50];

export default function CTA() {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(25);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // React Spring: the highlighted total springs whenever the amount changes.
  const { n } = useRSpring({ n: amount, config: { tension: 220, friction: 18 } });

  const submit = (e) => {
    e.preventDefault();
    if (email.includes('@')) setSubscribed(true);
  };

  return (
    <section id="donate" className="py-28 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-slate-950 to-amber-950/20" />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 7 }}
        className="absolute -top-20 left-1/3 w-96 h-96 bg-emerald-600/15 rounded-full blur-[130px]"
      />

      <div className="max-w-5xl mx-auto relative grid lg:grid-cols-2 gap-8 items-stretch">
        {/* Donate card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-emerald rounded-3xl p-8 md:p-10 border-glow flex flex-col"
        >
          <Heart size={28} className="text-emerald-400 mb-5" fill="currentColor" />
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-3">
            <Rich k="cta.donateTitle" />
          </h2>
          <p className="text-white/55 leading-relaxed mb-7">
            {t('cta.donateBody')}
          </p>

          <div className="grid grid-cols-4 gap-2 mb-5">
            {AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={`relative py-3 rounded-xl text-sm font-bold transition-colors ${
                  amount === a ? 'text-white' : 'text-white/50 glass hover:text-white/80'
                }`}
              >
                {amount === a && (
                  <motion.span layoutId="amt" className="absolute inset-0 rounded-xl bg-emerald-600 shadow-lg shadow-emerald-900/50" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
                <span className="relative z-10">${a}</span>
              </button>
            ))}
          </div>

          <a
            href="#"
            className="mt-auto group flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-7 py-4 rounded-2xl transition-all shadow-xl shadow-emerald-900/50 hover:-translate-y-0.5"
          >
            <Heart size={17} fill="currentColor" />
            <animated.span>{n.to((v) => t('cta.donateNow', { amount: Math.round(v) }))}</animated.span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>

        {/* Newsletter / partner card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          id="partner"
          className="glass rounded-3xl p-8 md:p-10 flex flex-col"
        >
          <Mail size={28} className="text-amber-400 mb-5" />
          <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-3">
            {t('cta.partnerTitle')}
          </h3>
          <p className="text-white/55 leading-relaxed mb-7">
            {t('cta.partnerBody')}
          </p>

          {subscribed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-auto flex items-center gap-3 glass-emerald rounded-2xl px-5 py-4 text-emerald-400"
            >
              <CheckCircle2 size={20} />
              <span className="text-sm font-semibold">{t('cta.subscribed')}</span>
            </motion.div>
          ) : (
            <form onSubmit={submit} className="mt-auto space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('cta.emailPlaceholder')}
                className="w-full glass rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/30 outline-none focus:border-amber-500/40 transition-colors"
              />
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-7 py-3.5 rounded-xl transition-colors"
              >
                {t('cta.requestAccess')} <ArrowRight size={16} />
              </button>
              <p className="text-[11px] text-white/30 text-center">{t('cta.noSpam')}</p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
