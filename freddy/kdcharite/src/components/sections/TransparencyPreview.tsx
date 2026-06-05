"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  TrendingUp,
  Utensils,
  Droplets,
  GraduationCap,
  Heart,
  Shield,
  CheckCircle2,
  ArrowRight,
  Activity,
} from "lucide-react";
import { staggerContainer, fadeInUp, fadeInLeft, fadeInRight } from "@/lib/animations";
import Badge from "@/components/ui/Badge";

const allocationData = [
  { label: "Food Programs", percent: 32, color: "#00B67A", icon: Utensils },
  { label: "Clean Water", percent: 24, color: "#FFB703", icon: Droplets },
  { label: "Education", percent: 22, color: "#00d490", icon: GraduationCap },
  { label: "Medical Aid", percent: 14, color: "#FFB703", icon: Heart },
  { label: "Operations", percent: 8, color: "#8892A4", icon: Shield },
];

const recentDonations = [
  { amount: "TZS 4,200", source: "Fuel Station — Dar es Salaam", time: "2 min ago", type: "fuel" },
  { amount: "KES 1,800", source: "Church Offering — Nairobi", time: "8 min ago", type: "church" },
  { amount: "TZS 7,500", source: "Fuel Station — Arusha", time: "15 min ago", type: "fuel" },
  { amount: "UGX 45,000", source: "Church Offering — Kampala", time: "22 min ago", type: "church" },
  { amount: "TZS 2,100", source: "Fuel Station — Mwanza", time: "31 min ago", type: "fuel" },
];

export default function TransparencyPreview() {
  return (
    <section className="relative py-24 lg:py-32 bg-navy overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-20" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-brand-green/4 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <motion.div variants={fadeInUp} className="mb-5">
            <Badge variant="green">Full Transparency</Badge>
          </motion.div>
          <motion.h2
            variants={fadeInUp}
            className="font-jakarta font-extrabold text-4xl sm:text-5xl lg:text-6xl text-warm-white mb-6 tracking-tight"
          >
            Every coin,{" "}
            <span className="gradient-text">accounted for</span>
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-muted text-lg max-w-2xl mx-auto"
          >
            Our open ledger means you always know where your money goes.
            Real-time reporting. Zero hidden fees. 100% accountability.
          </motion.p>
        </motion.div>

        {/* Dashboard Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Allocation */}
          <motion.div
            variants={fadeInLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="glass rounded-3xl p-7 border border-white/8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-jakarta font-bold text-lg text-warm-white">Fund Allocation</h3>
                <p className="text-muted text-xs mt-0.5">Where your donations go</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-brand-green/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-brand-green" />
              </div>
            </div>

            {/* Donut placeholder + bars */}
            <div className="space-y-4">
              {allocationData.map((item, i) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                      <span className="text-sm text-muted">{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-warm-white">{item.percent}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.percent}%` }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 1.2,
                        ease: [0.22, 1, 0.36, 1],
                        delay: i * 0.1 + 0.3,
                      }}
                      className="h-full rounded-full"
                      style={{ background: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Transparency Score */}
            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-green" />
                <span className="text-sm text-muted">Transparency Score</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="font-jakarta font-bold text-xl text-brand-green">98/100</div>
                <CheckCircle2 className="w-4 h-4 text-brand-green" />
              </div>
            </div>
          </motion.div>

          {/* Right: Live Feed */}
          <motion.div
            variants={fadeInRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="glass rounded-3xl p-7 border border-white/8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-jakarta font-bold text-lg text-warm-white">Live Donation Feed</h3>
                <p className="text-muted text-xs mt-0.5">Real-time incoming donations</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse-soft" />
                <span className="text-xs text-brand-green font-medium">Live</span>
              </div>
            </div>

            {/* Recent Donations */}
            <div className="space-y-3">
              {recentDonations.map((donation, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.2, duration: 0.4 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/3 border border-white/5 hover:border-brand-green/15 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${donation.type === "fuel" ? "bg-brand-gold/10" : "bg-brand-green/10"}`}>
                    {donation.type === "fuel" ? (
                      <Activity className="w-4 h-4 text-brand-gold" />
                    ) : (
                      <Heart className="w-4 h-4 text-brand-green" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-warm-white">{donation.amount}</p>
                    <p className="text-xs text-muted truncate">{donation.source}</p>
                  </div>
                  <span className="text-xs text-muted whitespace-nowrap">{donation.time}</span>
                </motion.div>
              ))}
            </div>

            {/* Monthly Summary */}
            <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-3 gap-4">
              {[
                { label: "This Month", value: "$182K" },
                { label: "Avg. Daily", value: "$6.1K" },
                { label: "Donors Active", value: "4,821" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="font-jakarta font-bold text-lg text-brand-green">{s.value}</div>
                  <div className="text-xs text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* CTA to full dashboard */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <Link
            href="/transparency"
            className="inline-flex items-center gap-2 text-brand-green hover:text-brand-green-light font-medium text-sm transition-colors group"
          >
            View full transparency dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
