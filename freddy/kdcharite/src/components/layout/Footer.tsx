"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  Mail,
  Phone,
  MapPin,
  Camera,
  X,
  Briefcase,
  Droplets,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { fadeInUp, staggerContainer } from "@/lib/animations";

const footerLinks = {
  organization: [
    { href: "/about", label: "About KDCharite" },
    { href: "/impact", label: "Our Impact" },
    { href: "/transparency", label: "Transparency Report" },
    { href: "/blog", label: "Stories & News" },
  ],
  getInvolved: [
    { href: "/donate", label: "Donate Now" },
    { href: "/volunteer", label: "Volunteer" },
    { href: "/church-partnerships", label: "Church Partnerships" },
    { href: "/fuel-partnerships", label: "Fuel Station Partners" },
  ],
  causes: [
    { href: "#", label: "Orphan Support" },
    { href: "#", label: "Food Programs" },
    { href: "#", label: "School Funding" },
    { href: "#", label: "Clean Water" },
    { href: "#", label: "Medical Aid" },
    { href: "#", label: "Emergency Relief" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative bg-navy-dark border-t border-white/5 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 dot-pattern opacity-30" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-green/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Newsletter CTA */}
      <div className="relative border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="font-jakarta font-bold text-2xl text-warm-white mb-2">
                Stay updated on our{" "}
                <span className="gradient-text">impact</span>
              </h3>
              <p className="text-muted text-sm">
                Monthly stories, transparency reports, and updates from the field.
              </p>
            </div>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex w-full md:w-auto gap-2"
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors"
              />
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-3 bg-brand-green hover:bg-brand-green-light text-navy font-semibold text-sm rounded-xl transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
              >
                Subscribe <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-6 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-green to-brand-green-dark flex items-center justify-center">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-jakarta font-bold text-xl text-warm-white">
                  KD<span className="text-brand-green">Charite</span>
                </span>
                <span className="text-[10px] text-muted tracking-widest uppercase">
                  Foundation
                </span>
              </div>
            </Link>

            <p className="text-muted text-sm leading-relaxed mb-6 max-w-sm">
              East Africa&apos;s most transparent digital charity ecosystem. Turning everyday
              fuel purchases and church giving into life-changing impact across communities.
            </p>

            {/* Social Links */}
            <div className="flex gap-3 mb-8">
              {[
                { icon: Camera, href: "#", label: "Instagram" },
                { icon: X, href: "#", label: "Twitter" },
                { icon: Briefcase, href: "#", label: "LinkedIn" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-brand-green/20 border border-white/8 hover:border-brand-green/30 flex items-center justify-center text-muted hover:text-brand-green transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <a href="mailto:info@kdcharite.org" className="flex items-center gap-2.5 text-sm text-muted hover:text-brand-green transition-colors group">
                <Mail className="w-4 h-4 text-brand-green/60 group-hover:text-brand-green transition-colors" />
                info@kdcharite.org
              </a>
              <a href="tel:+255742555901" className="flex items-center gap-2.5 text-sm text-muted hover:text-brand-green transition-colors group">
                <Phone className="w-4 h-4 text-brand-green/60 group-hover:text-brand-green transition-colors" />
                +255 742 555 901
              </a>
              <div className="flex items-start gap-2.5 text-sm text-muted">
                <MapPin className="w-4 h-4 text-brand-green/60 mt-0.5 shrink-0" />
                <span>45 Umoja Avenue, Dar es Salaam, Tanzania</span>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="text-warm-white font-semibold text-sm mb-5 font-jakarta">
              Organization
            </h4>
            <ul className="space-y-3">
              {footerLinks.organization.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted hover:text-brand-green transition-colors flex items-center gap-1 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-brand-green/40 group-hover:bg-brand-green transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-warm-white font-semibold text-sm mb-5 font-jakarta">
              Get Involved
            </h4>
            <ul className="space-y-3">
              {footerLinks.getInvolved.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted hover:text-brand-green transition-colors flex items-center gap-1 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-brand-green/40 group-hover:bg-brand-green transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-warm-white font-semibold text-sm mb-5 font-jakarta">
              Our Causes
            </h4>
            <ul className="space-y-3">
              {footerLinks.causes.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted hover:text-brand-green transition-colors flex items-center gap-1 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-brand-green/40 group-hover:bg-brand-green transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted text-center sm:text-left">
            © {new Date().getFullYear()} KDCharite Foundation. All rights reserved. Registered NGO — Tanzania.
          </p>
          <div className="flex items-center gap-1 text-xs text-muted">
            <span>Made with</span>
            <Heart className="w-3 h-3 text-brand-green mx-0.5" />
            <span>for East Africa</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-xs text-muted hover:text-warm-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-xs text-muted hover:text-warm-white transition-colors">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
