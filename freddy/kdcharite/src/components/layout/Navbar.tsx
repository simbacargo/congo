"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Heart, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  {
    label: "About",
    children: [
      { href: "/about", label: "Our Story" },
      { href: "/impact", label: "Our Impact" },
      { href: "/transparency", label: "Transparency" },
    ],
  },
  {
    label: "Partners",
    children: [
      { href: "/church-partnerships", label: "Church Partners" },
      { href: "/fuel-partnerships", label: "Fuel Stations" },
    ],
  },
  { href: "/blog", label: "Stories" },
  { href: "/volunteer", label: "Volunteer" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "glass border-b border-white/5 shadow-xl"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9">
                <div className="absolute inset-0 rounded-xl bg-brand-green/20 group-hover:bg-brand-green/30 transition-colors duration-300" />
                <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-brand-green to-brand-green-dark flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-brand-gold animate-pulse-soft" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-jakarta font-bold text-lg text-warm-white tracking-tight">
                  KD<span className="text-brand-green">Charite</span>
                </span>
                <span className="text-[10px] text-muted tracking-widest uppercase">
                  Foundation
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                if (link.children) {
                  return (
                    <div
                      key={link.label}
                      className="relative"
                      onMouseEnter={() => setActiveDropdown(link.label)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-muted hover:text-warm-white transition-colors duration-200 rounded-lg hover:bg-white/5">
                        {link.label}
                        <ChevronDown
                          className={cn(
                            "w-3.5 h-3.5 transition-transform duration-200",
                            activeDropdown === link.label && "rotate-180"
                          )}
                        />
                      </button>
                      <AnimatePresence>
                        {activeDropdown === link.label && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-0 mt-1 w-52 glass rounded-2xl border border-white/8 overflow-hidden shadow-2xl"
                          >
                            {link.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  "block px-4 py-3 text-sm transition-all duration-200 hover:bg-brand-green/10 hover:text-brand-green",
                                  pathname === child.href
                                    ? "text-brand-green bg-brand-green/5"
                                    : "text-muted"
                                )}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href!}
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg hover:bg-white/5",
                      pathname === link.href
                        ? "text-brand-green"
                        : "text-muted hover:text-warm-white"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/donate"
                className="group relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-brand-green hover:bg-brand-green-light text-navy rounded-xl transition-all duration-200 shadow-lg hover:shadow-brand-green/40 hover:-translate-y-0.5"
              >
                <Heart className="w-4 h-4" />
                Donate Now
                <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-muted hover:text-warm-white hover:bg-white/5 transition-all duration-200"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {mobileOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-navy/95 backdrop-blur-xl" onClick={() => setMobileOpen(false)} />
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-navy-light border-l border-white/5 p-6 pt-20 flex flex-col gap-1 overflow-y-auto"
            >
              {navLinks.map((link, i) => {
                if (link.children) {
                  return (
                    <div key={link.label}>
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === link.label ? null : link.label)}
                        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-muted hover:text-warm-white transition-colors rounded-lg hover:bg-white/5"
                      >
                        {link.label}
                        <ChevronDown className={cn("w-4 h-4 transition-transform", activeDropdown === link.label && "rotate-180")} />
                      </button>
                      <AnimatePresence>
                        {activeDropdown === link.label && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden ml-4"
                          >
                            {link.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                className="block px-4 py-2.5 text-sm text-muted hover:text-brand-green transition-colors"
                              >
                                {child.label}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href!}
                      className={cn(
                        "block px-4 py-3 text-sm font-medium transition-colors rounded-lg hover:bg-white/5",
                        pathname === link.href ? "text-brand-green" : "text-muted hover:text-warm-white"
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}

              <div className="mt-6 pt-6 border-t border-white/5">
                <Link
                  href="/donate"
                  className="flex items-center justify-center gap-2 w-full px-5 py-3 text-sm font-semibold bg-brand-green hover:bg-brand-green-light text-navy rounded-xl transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  Donate Now
                </Link>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
