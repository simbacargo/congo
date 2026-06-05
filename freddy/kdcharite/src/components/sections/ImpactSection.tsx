"use client";

import { motion } from "framer-motion";
import {
  Utensils,
  Droplets,
  GraduationCap,
  Church,
  Fuel,
  Heart,
  TrendingUp,
  Globe,
} from "lucide-react";
import { staggerContainer, fadeInUp, fadeIn } from "@/lib/animations";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import Badge from "@/components/ui/Badge";

const metrics = [
  {
    icon: Utensils,
    value: 2480000,
    formatter: (v: number) => `${(v / 1000000).toFixed(1)}M+`,
    label: "Meals Funded",
    description: "Nutritious meals delivered to vulnerable families",
    color: "#00B67A",
    bg: "bg-brand-green/10",
    border: "border-brand-green/20",
    iconColor: "text-brand-green",
  },
  {
    icon: Droplets,
    value: 47,
    formatter: undefined,
    label: "Wells Built",
    description: "Clean water sources across rural communities",
    color: "#FFB703",
    bg: "bg-brand-gold/10",
    border: "border-brand-gold/20",
    iconColor: "text-brand-gold",
  },
  {
    icon: GraduationCap,
    value: 3200,
    formatter: (v: number) => `${(v / 1000).toFixed(1)}K+`,
    label: "Children in School",
    description: "Scholarships and school supplies provided",
    color: "#00B67A",
    bg: "bg-brand-green/10",
    border: "border-brand-green/20",
    iconColor: "text-brand-green",
  },
  {
    icon: Church,
    value: 156,
    formatter: undefined,
    label: "Partner Churches",
    description: "Faith communities driving collective giving",
    color: "#FFB703",
    bg: "bg-brand-gold/10",
    border: "border-brand-gold/20",
    iconColor: "text-brand-gold",
  },
  {
    icon: Fuel,
    value: 89,
    formatter: undefined,
    label: "Fuel Stations",
    description: "Pumps turning transactions into transformation",
    color: "#00B67A",
    bg: "bg-brand-green/10",
    border: "border-brand-green/20",
    iconColor: "text-brand-green",
  },
  {
    icon: Heart,
    value: 12800,
    formatter: (v: number) => `${(v / 1000).toFixed(1)}K+`,
    label: "Lives Changed",
    description: "Individuals directly impacted by our programs",
    color: "#FFB703",
    bg: "bg-brand-gold/10",
    border: "border-brand-gold/20",
    iconColor: "text-brand-gold",
  },
  {
    icon: Globe,
    value: 7,
    formatter: undefined,
    label: "Countries",
    description: "Nations across East Africa reached",
    color: "#00B67A",
    bg: "bg-brand-green/10",
    border: "border-brand-green/20",
    iconColor: "text-brand-green",
  },
  {
    icon: TrendingUp,
    value: 4200000,
    formatter: (v: number) => `$${(v / 1000000).toFixed(1)}M`,
    label: "Total Donated",
    description: "Funds transparently tracked and distributed",
    color: "#FFB703",
    bg: "bg-brand-gold/10",
    border: "border-brand-gold/20",
    iconColor: "text-brand-gold",
  },
];

export default function ImpactSection() {
  return (
    <section className="relative py-24 lg:py-32 bg-navy overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-20" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-green/30 to-transparent" />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-green/4 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-20"
        >
          <motion.div variants={fadeInUp} className="mb-5">
            <Badge variant="green">Live Impact Dashboard</Badge>
          </motion.div>
          <motion.h2
            variants={fadeInUp}
            className="font-jakarta font-extrabold text-4xl sm:text-5xl lg:text-6xl text-warm-white mb-6 tracking-tight"
          >
            Numbers that{" "}
            <span className="gradient-text">speak for themselves</span>
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-muted text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Real metrics updated in real-time. Every figure represents a real
            human life transformed through the power of collective micro-giving.
          </motion.p>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6"
        >
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              variants={fadeInUp}
              custom={i}
              className={`group relative glass rounded-2xl p-6 border ${metric.border} hover:scale-105 transition-all duration-300 cursor-default overflow-hidden`}
            >
              {/* Shimmer on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer pointer-events-none" />

              <div className={`w-12 h-12 rounded-xl ${metric.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <metric.icon className={`w-6 h-6 ${metric.iconColor}`} />
              </div>

              <div className="font-jakarta font-black text-3xl lg:text-4xl text-warm-white mb-1.5" style={{ color: metric.color }}>
                <AnimatedCounter
                  to={metric.value}
                  duration={2.8}
                  formatter={metric.formatter}
                />
              </div>

              <p className="text-warm-white font-semibold text-sm mb-2">{metric.label}</p>
              <p className="text-muted text-xs leading-relaxed">{metric.description}</p>

              {/* Bottom accent */}
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${metric.color}, transparent)` }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Total raised bar */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-12 glass rounded-2xl p-8 border border-brand-green/15"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <div>
              <p className="text-muted text-sm mb-1">2024 Annual Goal Progress</p>
              <h3 className="font-jakarta font-bold text-2xl text-warm-white">
                $4.2M raised of{" "}
                <span className="text-brand-green">$6M goal</span>
              </h3>
            </div>
            <div className="text-right">
              <span className="font-jakarta font-black text-4xl text-brand-green">70%</span>
              <p className="text-muted text-xs mt-1">Goal Achieved</p>
            </div>
          </div>

          <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "70%" }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: "linear-gradient(90deg, #00B67A, #00d490, #FFB703)" }}
            />
          </div>

          <div className="flex justify-between mt-2 text-xs text-muted">
            <span>$0</span>
            <span className="text-brand-green">$4.2M Current</span>
            <span>$6M Goal</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
