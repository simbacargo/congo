import { Heart, Phone, Mail, MapPin, Share2, Rss, Send, Link2 } from 'lucide-react';
import { motion } from 'framer-motion';

const COLS = [
  { title: 'Programs', links: ['Fuel Network', 'Faith Network', 'Community Grants', 'Impact Reports', 'Apply for Funding'] },
  { title: 'Partners', links: ['Fuel Station Partners', 'Church Partners', 'Corporate Partners', 'Become a Partner', 'Partner Portal'] },
  { title: 'Organization', links: ['About KDCharité', 'Leadership Team', 'Annual Report', 'Press & Media', 'Careers'] },
];

const CONTACT = [
  { icon: Phone, text: '+255 747 92 929 92 },
  { icon: Mail, text: 'impact@kdcharite.org' },
  { icon: MapPin, text: '742 Philanthropy Way, Mwanza City, MC 90210' },
];

const SOCIAL = [
  { icon: Share2, label: 'Facebook' },
  { icon: Rss, label: 'Twitter/X' },
  { icon: Send, label: 'Instagram' },
  { icon: Link2, label: 'LinkedIn' },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative pt-20 pb-10 px-4 border-t border-white/10">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-950/20 pointer-events-none" />
      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-5 gap-12 mb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-900/50">
                <Heart size={16} className="text-white" fill="white" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                KD<span className="text-emerald-400">Charité</span>
              </span>
            </div>
            <p className="text-sm text-white/45 leading-relaxed mb-7 max-w-xs">
              Turning the world's everyday transactions into a continuous engine of community relief — 2 cents at a time, at scale.
            </p>
            <div className="space-y-3 mb-7">
              {CONTACT.map((c) => (
                <div key={c.text} className="flex items-start gap-3">
                  <c.icon size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-white/50 whitespace-pre-line leading-relaxed">{c.text}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {SOCIAL.map((s) => (
                <motion.button
                  key={s.label}
                  whileHover={{ y: -3 }}
                  aria-label={s.label}
                  className="w-9 h-9 glass rounded-xl flex items-center justify-center hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-colors group"
                >
                  <s.icon size={14} className="text-white/40 group-hover:text-emerald-400 transition-colors" />
                </motion.button>
              ))}
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-5">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-white/40 hover:text-emerald-400 transition-colors duration-200">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-white/25 text-center md:text-left">
            © {year} KDCharité, Inc. All rights reserved. · Registered 501(c)(3) · EIN 88-0123456
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs text-white/25">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Accessibility'].map((l) => (
              <a key={l} href="#" className="hover:text-white/50 transition-colors">{l}</a>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-white/15 mt-4 leading-relaxed max-w-2xl">
          Disclaimer: KDCharité operates as a registered 501(c)(3) nonprofit. All fuel station 2% opt-in programs are subject to participating merchant agreements. Donations are non-refundable and tax-deductible to the extent permitted by law. Individual impact equivalencies are illustrative estimates based on program average costs. Past performance of community impact does not guarantee future results.
        </p>
      </div>
    </footer>
  );
}
