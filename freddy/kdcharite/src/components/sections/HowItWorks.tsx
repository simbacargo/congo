"use client";

import { motion } from "framer-motion";
import { Fuel, Shield, Heart, ArrowRight, Smartphone, Building2, Zap } from "lucide-react";
import { staggerContainer, fadeInUp, fadeInLeft, fadeInRight } from "@/lib/animations";
import Badge from "@/components/ui/Badge";

const steps = [
  {
    step: "01",
    icon: Fuel,
    title: "Fuel or Church Donation",
    description:
      "A customer fills up at a partner fuel station and opts to add 2% to charity. Or a church member makes their weekly offering through our integrated giving system.",
    highlights: ["2% micro-donation", "Weekly church giving", "100% opt-in"],
    color: "brand-gold",
    gradient: "from-brand-gold/20 to-brand-gold/5",
    iconBg: "bg-brand-gold/10",
    iconColor: "text-brand-gold",
    borderColor: "border-brand-gold/20",
  },
  {
    step: "02",
    icon: Shield,
    title: "Secure Processing",
    description:
      "Every transaction is encrypted, verified, and logged on our transparent ledger. Funds are aggregated from all partners and allocated to active charitable programs.",
    highlights: ["Bank-grade security", "Real-time verification", "Full audit trail"],
    color: "brand-green",
    gradient: "from-brand-green/20 to-brand-green/5",
    iconBg: "bg-brand-green/10",
    iconColor: "text-brand-green",
    borderColor: "border-brand-green/20",
  },
  {
    step: "03",
    icon: Heart,
    title: "Impact Reaches Communities",
    description:
      "Funds are disbursed to vetted programs — orphan support, food banks, school scholarships, well construction, and medical relief across East Africa.",
    highlights: ["Verified programs", "GPS-tracked delivery", "Beneficiary reports"],
    color: "brand-gold",
    gradient: "from-brand-gold/20 to-brand-gold/5",
    iconBg: "bg-brand-gold/10",
    iconColor: "text-brand-gold",
    borderColor: "border-brand-gold/20",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative py-24 lg:py-32 bg-navy-dark overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-25" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

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
            <Badge variant="gold">How It Works</Badge>
          </motion.div>
          <motion.h2
            variants={fadeInUp}
            className="font-jakarta font-extrabold text-4xl sm:text-5xl lg:text-6xl text-warm-white mb-6 tracking-tight"
          >
            Effortless giving,{" "}
            <span className="gradient-text">real impact</span>
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-muted text-lg max-w-2xl mx-auto"
          >
            Three simple steps transform everyday transactions into life-changing
            charitable impact — no apps required, no extra effort needed.
          </motion.p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting Line — desktop */}
          <div className="hidden lg:block absolute top-[88px] left-[16.67%] right-[16.67%] h-px">
            <div className="w-full h-full bg-gradient-to-r from-brand-gold/30 via-brand-green/50 to-brand-gold/30" />
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
              className="absolute inset-0 origin-left bg-gradient-to-r from-brand-gold via-brand-green to-brand-gold"
              style={{ height: "2px", top: "-0.5px" }}
            />
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6"
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                variants={fadeInUp}
                custom={i}
                className="relative group"
              >
                {/* Arrow between cards — mobile */}
                {i < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center my-4 text-muted">
                    <ArrowRight className="w-5 h-5 rotate-90" />
                  </div>
                )}

                <div className={`relative glass rounded-3xl p-8 border ${step.borderColor} hover:scale-[1.02] transition-all duration-300 overflow-hidden h-full`}>
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-50`} />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer pointer-events-none" />

                  <div className="relative z-10">
                    {/* Step number */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-jakarta font-black text-5xl text-white/5 select-none leading-none">
                        {step.step}
                      </span>
                      <div className={`w-14 h-14 rounded-2xl ${step.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <step.icon className={`w-7 h-7 ${step.iconColor}`} />
                      </div>
                    </div>

                    <h3 className="font-jakarta font-bold text-xl text-warm-white mb-4 leading-tight">
                      {step.title}
                    </h3>

                    <p className="text-muted text-sm leading-relaxed mb-6">
                      {step.description}
                    </p>

                    <ul className="space-y-2">
                      {step.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-2 text-xs">
                          <Zap className={`w-3.5 h-3.5 ${step.iconColor} shrink-0`} />
                          <span className="text-muted">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 glass rounded-2xl p-6 border border-white/8">
            <div className="flex -space-x-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-green to-brand-green-dark border-2 border-navy flex items-center justify-center text-xs font-bold text-white"
                  style={{ zIndex: 5 - i }}
                >
                  {["A", "B", "K", "M", "T"][i]}
                </div>
              ))}
            </div>
            <div className="text-left">
              <p className="text-warm-white font-semibold text-sm">
                Join 12,000+ contributors today
              </p>
              <p className="text-muted text-xs">
                Already making a difference through everyday spending
              </p>
            </div>
            <a
              href="/donate"
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-green hover:bg-brand-green-light text-navy font-semibold text-sm rounded-xl transition-all duration-200 whitespace-nowrap"
            >
              Start Giving <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
