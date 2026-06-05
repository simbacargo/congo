"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Shield, CheckCircle2, Activity, TrendingUp, Globe, Lock, Eye, Download, ExternalLink } from "lucide-react";
import { staggerContainer, fadeInUp, fadeInLeft, fadeInRight } from "@/lib/animations";
import Badge from "@/components/ui/Badge";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

const monthlyData = [
  { month: "Aug", raised: 280000, distributed: 250000 },
  { month: "Sep", raised: 320000, distributed: 290000 },
  { month: "Oct", raised: 290000, distributed: 270000 },
  { month: "Nov", raised: 410000, distributed: 380000 },
  { month: "Dec", raised: 560000, distributed: 520000 },
  { month: "Jan", raised: 380000, distributed: 350000 },
  { month: "Feb", raised: 430000, distributed: 400000 },
  { month: "Mar", raised: 510000, distributed: 470000 },
  { month: "Apr", raised: 480000, distributed: 450000 },
  { month: "May", raised: 620000, distributed: 580000 },
];

const allocationPie = [
  { name: "Food Programs", value: 32, color: "#00B67A" },
  { name: "Clean Water", value: 24, color: "#FFB703" },
  { name: "Education", value: 22, color: "#00d490" },
  { name: "Medical Aid", value: 14, color: "#ffc836" },
  { name: "Operations", value: 8, color: "#8892A4" },
];

const countryData = [
  { country: "Tanzania", amount: 1420000, percent: 34 },
  { country: "Kenya", amount: 980000, percent: 23 },
  { country: "Uganda", amount: 760000, percent: 18 },
  { country: "Rwanda", amount: 540000, percent: 13 },
  { country: "Ethiopia", amount: 280000, percent: 7 },
  { country: "Zambia", amount: 220000, percent: 5 },
];

const recentActivity = [
  { type: "Distribution", desc: "Food packages — Dodoma District", amount: "+$12,400", time: "2h ago", positive: true },
  { type: "Donation", desc: "Fuel station batch — Nairobi", amount: "+$8,200", time: "4h ago", positive: true },
  { type: "Distribution", desc: "School supplies — Kampala", amount: "-$6,800", time: "8h ago", positive: false },
  { type: "Distribution", desc: "Well completion — Mwanza", amount: "-$45,000", time: "1d ago", positive: false },
  { type: "Donation", desc: "Church offering batch — Tanzania", amount: "+$34,100", time: "1d ago", positive: true },
  { type: "Distribution", desc: "Medical supplies — Rwanda", amount: "-$9,200", time: "2d ago", positive: false },
];

export default function TransparencyPage() {
  return (
    <div className="bg-navy min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 dot-pattern opacity-25" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeInUp} className="mb-5">
              <Badge variant="green">Full Transparency</Badge>
            </motion.div>
            <motion.h1 variants={fadeInUp} className="font-jakarta font-extrabold text-5xl sm:text-6xl text-warm-white mb-4 tracking-tight">
              The most transparent charity{" "}
              <span className="gradient-text">in East Africa</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-muted text-lg max-w-2xl mx-auto">
              Every transaction, every distribution, every shilling — publicly tracked and
              permanently recorded. Scroll to explore your impact in real-time.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { label: "Total Raised (2024)", value: 4200000, formatter: (v: number) => `$${(v/1000000).toFixed(1)}M`, icon: TrendingUp, borderColor: "border-brand-green/20", iconBg: "bg-brand-green/10", iconColor: "text-brand-green", textColor: "text-brand-green" },
              { label: "Funds Distributed", value: 3800000, formatter: (v: number) => `$${(v/1000000).toFixed(1)}M`, icon: Globe, borderColor: "border-brand-gold/20", iconBg: "bg-brand-gold/10", iconColor: "text-brand-gold", textColor: "text-brand-gold" },
              { label: "Transparency Score", value: 98, formatter: (v: number) => `${v.toFixed(0)}/100`, icon: Shield, borderColor: "border-brand-green/20", iconBg: "bg-brand-green/10", iconColor: "text-brand-green", textColor: "text-brand-green" },
              { label: "Donors Active", value: 4821, formatter: undefined, icon: Activity, borderColor: "border-brand-gold/20", iconBg: "bg-brand-gold/10", iconColor: "text-brand-gold", textColor: "text-brand-gold" },
            ].map((kpi, i) => (
              <motion.div
                key={kpi.label}
                variants={fadeInUp}
                custom={i}
                className={`glass rounded-2xl p-6 border ${kpi.borderColor}`}
              >
                <div className={`w-10 h-10 rounded-xl ${kpi.iconBg} flex items-center justify-center mb-4`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
                </div>
                <div className={`font-jakarta font-black text-3xl ${kpi.textColor} mb-1`}>
                  <AnimatedCounter to={kpi.value} formatter={kpi.formatter} duration={2.5} />
                </div>
                <p className="text-muted text-xs">{kpi.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Charts */}
      <section className="py-10 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Area Chart */}
          <motion.div
            variants={fadeInLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="lg:col-span-2 glass rounded-3xl p-7 border border-white/8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-jakarta font-bold text-lg text-warm-white">Raised vs. Distributed</h3>
                <p className="text-muted text-xs mt-1">Aug 2024 — May 2025</p>
              </div>
              <button className="flex items-center gap-1.5 text-xs text-muted hover:text-brand-green transition-colors">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00B67A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00B67A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFB703" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FFB703" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: "#8892A4", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8892A4", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "#0d1f35", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }}
                  formatter={(value) => [`$${(Number(value)/1000).toFixed(0)}K`]}
                />
                <Area type="monotone" dataKey="raised" stroke="#00B67A" strokeWidth={2} fill="url(#greenGrad)" name="Raised" />
                <Area type="monotone" dataKey="distributed" stroke="#FFB703" strokeWidth={2} fill="url(#goldGrad)" name="Distributed" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Pie Chart */}
          <motion.div
            variants={fadeInRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="glass rounded-3xl p-7 border border-white/8"
          >
            <h3 className="font-jakarta font-bold text-lg text-warm-white mb-2">Fund Allocation</h3>
            <p className="text-muted text-xs mb-5">How donations are distributed</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={allocationPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {allocationPie.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0d1f35", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} formatter={(value) => [`${Number(value)}%`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {allocationPie.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-xs text-muted">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-warm-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Geographic distribution + Activity feed */}
      <section className="py-10 px-4 pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Country */}
          <motion.div
            variants={fadeInLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="glass rounded-3xl p-7 border border-white/8"
          >
            <h3 className="font-jakarta font-bold text-lg text-warm-white mb-6">Distribution by Country</h3>
            <div className="space-y-4">
              {countryData.map((c) => (
                <div key={c.country}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-muted">{c.country}</span>
                    <span className="text-sm font-semibold text-warm-white">${(c.amount/1000).toFixed(0)}K</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${c.percent}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #00B67A, #FFB703)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Activity Feed */}
          <motion.div
            variants={fadeInRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="glass rounded-3xl p-7 border border-white/8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-jakarta font-bold text-lg text-warm-white">Transaction Ledger</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse-soft" />
                <span className="text-xs text-brand-green">Live</span>
              </div>
            </div>
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5"
                >
                  <div className={`w-2 h-8 rounded-full shrink-0 ${item.positive ? "bg-brand-green" : "bg-brand-gold"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-warm-white">{item.type}</p>
                    <p className="text-xs text-muted truncate">{item.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${item.positive ? "text-brand-green" : "text-brand-gold"}`}>{item.amount}</p>
                    <p className="text-xs text-muted">{item.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-muted">Showing 6 of 12,847 transactions</span>
              <button className="flex items-center gap-1 text-xs text-brand-green hover:underline">
                View full ledger <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Transparency Certifications */}
        <div className="max-w-7xl mx-auto mt-6">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="glass rounded-3xl p-8 border border-brand-green/15"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
              <div className="md:col-span-2">
                <Badge variant="green" className="mb-4">Certifications</Badge>
                <h3 className="font-jakarta font-bold text-2xl text-warm-white mb-3">
                  Audited, verified, trusted
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  Our financials are independently audited quarterly. Full audit reports available
                  for public download. We hold the highest transparency rating in East African NGO space.
                </p>
              </div>
              {[
                { icon: Shield, label: "NGO Board Tanzania", sub: "Registered 2021" },
                { icon: CheckCircle2, label: "Annual Audit 2024", sub: "Clean Report" },
                { icon: Lock, label: "ISO 27001", sub: "Data Security" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-brand-green" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-warm-white">{label}</p>
                    <p className="text-xs text-muted">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
