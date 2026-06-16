import { Link } from 'react-router-dom';
import { Home, ArrowRight, Compass } from 'lucide-react';
import { motion } from 'framer-motion';
import Page from '../components/Page.jsx';

const SUGGEST = [
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/programs', label: 'Programs' },
  { to: '/impact', label: 'Impact' },
  { to: '/donate', label: 'Donate' },
];

export default function NotFound() {
  return (
    <Page title="Page Not Found">
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950/30 to-slate-950" />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 8 }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-600/15 rounded-full blur-[120px]"
        />
        <div className="relative text-center max-w-lg">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-8xl md:text-9xl font-black text-gradient-anim mb-4"
          >
            404
          </motion.div>
          <Compass size={32} className="text-emerald-400 mx-auto mb-5 animate-float" />
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">This page took a wrong turn</h1>
          <p className="text-white/50 mb-8">
            The page you're looking for isn't here — but the mission still is. Let's get you back on the road.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            <Link
              to="/"
              className="group flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-emerald-900/50 hover:-translate-y-0.5"
            >
              <Home size={16} /> Back home
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {SUGGEST.map((s) => (
              <Link
                key={s.to}
                to={s.to}
                className="text-xs glass rounded-full px-4 py-2 text-white/60 hover:text-white hover:border-emerald-500/40 transition-colors"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Page>
  );
}
