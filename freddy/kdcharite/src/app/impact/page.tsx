"use client";

import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Utensils, Droplets, GraduationCap, Heart, Home, Shield, MapPin } from "lucide-react";
import { staggerContainer, fadeInUp, fadeInLeft, fadeInRight } from "@/lib/animations";
import Badge from "@/components/ui/Badge";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import CTASection from "@/components/sections/CTASection";

const programs = [
  { icon: Utensils, name: "Food Security", description: "2.4M+ meals distributed through partner food banks and school feeding programs.", value: 2400000, suffix: "M+ meals", color: "#00B67A", gradient: "from-brand-green/10 to-transparent" },
  { icon: Droplets, name: "Clean Water", description: "47 boreholes and wells constructed in underserved communities.", value: 47, suffix: " wells", color: "#FFB703", gradient: "from-brand-gold/10 to-transparent" },
  { icon: GraduationCap, name: "Education", description: "3,200+ children funded through school fees, uniforms and supplies.", value: 3200, suffix: "+ children", color: "#00B67A", gradient: "from-brand-green/10 to-transparent" },
  { icon: Heart, name: "Medical Aid", description: "18,000+ medical consultations and $480K of medications distributed.", value: 18000, suffix: "+ consultations", color: "#FFB703", gradient: "from-brand-gold/10 to-transparent" },
  { icon: Home, name: "Emergency Relief", description: "6 disaster responses including floods, drought, and displacement support.", value: 6, suffix: " responses", color: "#00B67A", gradient: "from-brand-green/10 to-transparent" },
  { icon: Shield, name: "Orphan Support", description: "1,200 orphans receiving full sponsorship including housing and education.", value: 1200, suffix: " orphans", color: "#FFB703", gradient: "from-brand-gold/10 to-transparent" },
];

const yearlyGrowth = [
  { year: "2022", meals: 180000, children: 120, wells: 4 },
  { year: "2023", meals: 580000, children: 680, wells: 18 },
  { year: "2024", meals: 1640000, children: 2400, wells: 47 },
];

const featuredProjects = [
  { title: "Borehole — Kondoa District, Tanzania", status: "Completed", amount: "$48,000", beneficiaries: "420 families", date: "March 2025" },
  { title: "School Feeding Program — Nairobi East", status: "Active", amount: "$12,000/month", beneficiaries: "800 children", date: "Ongoing" },
  { title: "Orphan Home — Kampala", status: "Active", amount: "$85,000", beneficiaries: "60 children", date: "Ongoing" },
  { title: "Medical Outreach — Mwanza Rural", status: "Completed", amount: "$22,000", beneficiaries: "1,200 patients", date: "Feb 2025" },
];

export default function ImpactPage() {
  return (
    <div className="bg-navy min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 dot-pattern opacity-25" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeInUp} className="mb-5"><Badge variant="green">Impact Report 2025</Badge></motion.div>
            <motion.h1 variants={fadeInUp} className="font-jakarta font-extrabold text-5xl sm:text-6xl text-warm-white mb-4 tracking-tight">
              Our impact,{" "}
              <span className="gradient-text">by the numbers</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-muted text-lg max-w-2xl mx-auto">
              Real data. Real people. Real transformation. Every figure represents a
              human life touched through the power of collective micro-giving.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {programs.map((p, i) => (
              <motion.div key={p.name} variants={fadeInUp} custom={i} className={`glass rounded-3xl p-8 border border-white/8 hover:border-brand-green/20 bg-gradient-to-br ${p.gradient} transition-all hover:-translate-y-1 group`}>
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${p.color}15` }}>
                    <p.icon className="w-7 h-7" style={{ color: p.color }} />
                  </div>
                  <div>
                    <h3 className="font-jakarta font-bold text-lg text-warm-white">{p.name}</h3>
                    <p className="font-jakarta font-black text-2xl" style={{ color: p.color }}>
                      <AnimatedCounter to={p.value} duration={2.5} suffix={p.suffix} formatter={p.name === "Food Security" ? (v) => `${(v/1000000).toFixed(1)}M+ meals` : undefined} />
                    </p>
                  </div>
                </div>
                <p className="text-muted text-sm leading-relaxed">{p.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Growth Chart */}
      <section className="py-16 px-4 bg-navy-dark">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <motion.div variants={fadeInUp} className="mb-5"><Badge variant="green">Growth</Badge></motion.div>
            <motion.h2 variants={fadeInUp} className="font-jakarta font-extrabold text-4xl text-warm-white">
              Year-over-year <span className="gradient-text">growth</span>
            </motion.h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={fadeInLeft} initial="hidden" whileInView="visible" viewport={{ once: true }} className="glass rounded-3xl p-7 border border-white/8">
              <h3 className="font-jakarta font-bold text-lg text-warm-white mb-5">Meals Funded</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={yearlyGrowth}>
                  <XAxis dataKey="year" tick={{ fill: "#8892A4", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#8892A4", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ background: "#0d1f35", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} formatter={(v) => [`${(Number(v)/1000).toFixed(0)}K meals`]} />
                  <Bar dataKey="meals" fill="#00B67A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
            <motion.div variants={fadeInRight} initial="hidden" whileInView="visible" viewport={{ once: true }} className="glass rounded-3xl p-7 border border-white/8">
              <h3 className="font-jakarta font-bold text-lg text-warm-white mb-5">Children Supported</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={yearlyGrowth}>
                  <defs>
                    <linearGradient id="goldGradImpact" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFB703" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FFB703" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" tick={{ fill: "#8892A4", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#8892A4", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0d1f35", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                  <Area type="monotone" dataKey="children" stroke="#FFB703" strokeWidth={2} fill="url(#goldGradImpact)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <motion.div variants={fadeInUp} className="mb-5"><Badge variant="gold">Projects</Badge></motion.div>
            <motion.h2 variants={fadeInUp} className="font-jakarta font-extrabold text-4xl text-warm-white">
              Featured <span className="gradient-text">projects</span>
            </motion.h2>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-4">
            {featuredProjects.map((project, i) => (
              <motion.div key={project.title} variants={fadeInUp} custom={i} className="glass rounded-2xl p-6 border border-white/8 hover:border-brand-green/20 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5 text-brand-green" />
                    </div>
                    <div>
                      <h3 className="font-jakarta font-bold text-warm-white">{project.title}</h3>
                      <p className="text-muted text-sm">{project.beneficiaries} · {project.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-brand-green font-semibold text-sm">{project.amount}</p>
                      <p className="text-muted text-xs">Allocated</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${project.status === "Completed" ? "bg-brand-green/10 text-brand-green border border-brand-green/20" : "bg-brand-gold/10 text-brand-gold border border-brand-gold/20"}`}>
                      {project.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <CTASection />
    </div>
  );
}
