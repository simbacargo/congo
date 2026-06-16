import { Link } from 'react-router-dom';
import { Home, ArrowRight, Compass } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Page from '../components/Page.jsx';

// Labels reuse the nav.* keys so suggestions stay in sync with the menu.
const SUGGEST = [
  { to: '/how-it-works', key: 'nav.howItWorks' },
  { to: '/programs', key: 'nav.programs' },
  { to: '/impact', key: 'nav.impact' },
  { to: '/donate', key: 'nav.donateNow' },
];

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <Page title={t('pages.notFound.docTitle')}>
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-950" />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 8 }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-[120px]"
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
          <Compass size={32} className="text-red-400 mx-auto mb-5 animate-float" />
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">{t('pages.notFound.heading')}</h1>
          <p className="text-white/50 mb-8">
            {t('pages.notFound.body')}
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            <Link
              to="/"
              className="group flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-red-900/50 hover:-translate-y-0.5"
            >
              <Home size={16} /> {t('pages.notFound.backHome')}
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {SUGGEST.map((s) => (
              <Link
                key={s.to}
                to={s.to}
                className="text-xs glass rounded-full px-4 py-2 text-white/60 hover:text-white hover:border-red-500/40 transition-colors"
              >
                {t(s.key)}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Page>
  );
}
