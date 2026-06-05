"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Camera, X, Briefcase, Send, CheckCircle2, MessageSquare } from "lucide-react";
import { staggerContainer, fadeInUp, fadeInLeft, fadeInRight } from "@/lib/animations";
import Badge from "@/components/ui/Badge";

const contactInfo = [
  {
    icon: MapPin,
    label: "Headquarters",
    lines: ["KDCharite Foundation Centre", "45 Umoja Avenue", "Dar es Salaam, Tanzania"],
    iconBg: "bg-brand-green/10",
    iconColor: "text-brand-green",
    hoverText: "hover:text-brand-green",
  },
  {
    icon: Phone,
    label: "Phone",
    lines: ["+255 742 555 901", "+255 754 222 118"],
    iconBg: "bg-brand-gold/10",
    iconColor: "text-brand-gold",
    hoverText: "hover:text-brand-gold",
    links: ["tel:+255742555901", "tel:+255754222118"],
  },
  {
    icon: Mail,
    label: "Email",
    lines: ["info@kdcharite.org", "partners@kdcharite.org", "support@kdcharite.org"],
    iconBg: "bg-brand-green/10",
    iconColor: "text-brand-green",
    hoverText: "hover:text-brand-green",
    links: ["mailto:info@kdcharite.org", "mailto:partners@kdcharite.org", "mailto:support@kdcharite.org"],
  },
];

const socials = [
  { icon: Camera, label: "Instagram", handle: "@KDCharite", color: "#E1306C" },
  { icon: X, label: "Twitter / X", handle: "@KDChariteAfrica", color: "#1DA1F2" },
  { icon: Briefcase, label: "LinkedIn", handle: "KDCharite Foundation", color: "#0077B5" },
];

const departments = [
  "General Inquiry",
  "Donation Support",
  "Church Partnerships",
  "Fuel Station Partnerships",
  "Volunteer Program",
  "Media & Press",
  "Technical Support",
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="bg-navy min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 dot-pattern opacity-25" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeInUp} className="mb-5"><Badge variant="green">Get in Touch</Badge></motion.div>
            <motion.h1 variants={fadeInUp} className="font-jakarta font-extrabold text-5xl sm:text-6xl text-warm-white mb-4 tracking-tight">
              We&apos;d love to{" "}
              <span className="gradient-text">hear from you</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-muted text-lg max-w-xl mx-auto">
              Whether you want to donate, partner, volunteer, or just learn more —
              our team typically responds within one business day.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Contact Info — 2 cols */}
            <motion.div
              variants={fadeInLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="lg:col-span-2 space-y-5"
            >
              {contactInfo.map((info) => (
                <div key={info.label} className="glass rounded-2xl p-6 border border-white/8">
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl ${info.iconBg} flex items-center justify-center shrink-0`}>
                      <info.icon className={`w-5 h-5 ${info.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-warm-white font-semibold text-sm mb-2">{info.label}</p>
                      {info.lines.map((line, i) =>
                        info.links?.[i] ? (
                          <a key={line} href={info.links[i]} className={`block text-sm text-muted ${info.hoverText} transition-colors`}>{line}</a>
                        ) : (
                          <p key={line} className="text-sm text-muted">{line}</p>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Socials */}
              <div className="glass rounded-2xl p-6 border border-white/8">
                <p className="text-warm-white font-semibold text-sm mb-4">Follow Us</p>
                <div className="space-y-3">
                  {socials.map((s) => (
                    <a key={s.label} href="#" className="flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-lg border border-white/10 group-hover:border-white/25 flex items-center justify-center transition-colors" style={{ background: `${s.color}10` }}>
                        <s.icon className="w-4 h-4" style={{ color: s.color }} />
                      </div>
                      <div>
                        <p className="text-sm text-warm-white font-medium">{s.label}</p>
                        <p className="text-xs text-muted">{s.handle}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Response time */}
              <div className="glass rounded-2xl p-5 border border-brand-green/15">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse-soft" />
                  <span className="text-brand-green text-xs font-medium">Team is online</span>
                </div>
                <p className="text-muted text-xs leading-relaxed">
                  Average response time is under 4 hours during business hours
                  (Mon–Fri, 8am–6pm EAT).
                </p>
              </div>
            </motion.div>

            {/* Form — 3 cols */}
            <motion.div
              variants={fadeInRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="lg:col-span-3"
            >
              {!sent ? (
                <div className="glass rounded-3xl p-8 border border-white/8">
                  <h2 className="font-jakarta font-bold text-2xl text-warm-white mb-6 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-brand-green" />
                    Send us a message
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-muted mb-1.5">First Name</label>
                        <input type="text" placeholder="Emmanuel" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs text-muted mb-1.5">Last Name</label>
                        <input type="text" placeholder="Charite" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1.5">Email Address</label>
                      <input type="email" placeholder="you@example.com" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1.5">Phone (Optional)</label>
                      <input type="tel" placeholder="+255 700 000 000" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1.5">Department</label>
                      <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-muted focus:outline-none focus:border-brand-green/50 transition-colors">
                        <option value="">Select a department</option>
                        {departments.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1.5">Subject</label>
                      <input type="text" placeholder="How can we help?" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1.5">Message</label>
                      <textarea rows={6} placeholder="Tell us more about your inquiry..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors resize-none" />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSent(true)}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-brand-green hover:bg-brand-green-light text-navy font-bold rounded-2xl transition-all shadow-lg hover:shadow-brand-green/30"
                    >
                      <Send className="w-5 h-5" />
                      Send Message
                    </motion.button>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="glass rounded-3xl p-12 border border-brand-green/20 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-brand-green/15 flex items-center justify-center mx-auto mb-6 animate-glow">
                    <CheckCircle2 className="w-10 h-10 text-brand-green" />
                  </div>
                  <h3 className="font-jakarta font-bold text-2xl text-warm-white mb-3">Message sent!</h3>
                  <p className="text-muted text-sm mb-6">We&apos;ll get back to you within one business day.</p>
                  <button onClick={() => setSent(false)} className="px-6 py-2.5 bg-brand-green/10 hover:bg-brand-green/20 text-brand-green text-sm font-semibold rounded-xl border border-brand-green/20 transition-colors">
                    Send Another
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
