import { useState, useEffect } from 'react';
import { Heart, Menu, X } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher.jsx';

const LINKS = [
  { key: 'howItWorks', to: '/how-it-works' },
  { key: 'programs',   to: '/programs' },
  { key: 'impact',     to: '/impact' },
  { key: 'stories',    to: '/stories' },
  { key: 'about',      to: '/about' },
  { key: 'faq',        to: '/faq' },
];

export default function Navbar() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Framer-driven reading progress bar across the top of the viewport.
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-dark py-3 shadow-xl shadow-black/20' : 'bg-transparent py-5'
      }`}
    >
      <motion.div
        className="absolute bottom-0 left-0 h-[2px] origin-left bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400"
        style={{ scaleX: progress, width: '100%' }}
      />

      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <motion.div
            whileHover={{ rotate: -12, scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-900/50"
          >
            <Heart size={15} className="text-white" fill="white" />
          </motion.div>
          <span className="text-lg font-bold text-white tracking-tight">
            KD<span className="text-emerald-400">Charité</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `relative text-sm transition-colors duration-200 group ${
                  isActive ? 'text-white' : 'text-white/55 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {t(`nav.${l.key}`)}
                  <span
                    className={`absolute -bottom-1 left-0 h-px bg-emerald-400 transition-all duration-300 ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <Link to="/donate" className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2">
            {t('nav.partner')}
          </Link>
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/donate"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-lg shadow-emerald-900/40"
            >
              <Heart size={13} fill="currentColor" /> {t('nav.donateNow')}
            </Link>
          </motion.div>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <LanguageSwitcher compact />
          <button
            className="text-white/60 hover:text-white p-1"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={t('nav.toggleMenu')}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden glass-dark border-t border-white/10"
          >
            <div className="px-6 py-5 space-y-1">
              {LINKS.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <NavLink
                    to={l.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `block text-sm py-2.5 ${isActive ? 'text-emerald-400' : 'text-white/70 hover:text-white'}`
                    }
                  >
                    {t(`nav.${l.key}`)}
                  </NavLink>
                </motion.div>
              ))}
              <Link
                to="/donate"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl w-fit mt-3"
              >
                <Heart size={13} fill="currentColor" /> {t('nav.donateNow')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
