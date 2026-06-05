"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, ArrowRight, Fuel, Church, Droplets } from "lucide-react";
import { staggerContainer, fadeInUp } from "@/lib/animations";

export default function CTASection() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden bg-navy-dark">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-green/8 via-transparent to-brand-gold/6" />
      <div className="absolute inset-0 grid-pattern opacity-30" />

      {/* Animated blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full bg-brand-green/8 blur-[80px] animate-blob" />
        <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] rounded-full bg-brand-gold/6 blur-[80px] animate-blob-delayed" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Icon cluster */}
          <motion.div variants={fadeInUp} className="flex items-center justify-center gap-4 mb-10">
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-14 h-14 rounded-2xl bg-brand-gold/15 border border-brand-gold/25 flex items-center justify-center"
            >
              <Fuel className="w-7 h-7 text-brand-gold" />
            </motion.div>
            <motion.div
              animate={{ y: [6, -6, 6] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="w-16 h-16 rounded-2xl bg-brand-green/15 border border-brand-green/25 flex items-center justify-center"
            >
              <Droplets className="w-8 h-8 text-brand-green" />
            </motion.div>
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="w-14 h-14 rounded-2xl bg-brand-gold/15 border border-brand-gold/25 flex items-center justify-center"
            >
              <Church className="w-7 h-7 text-brand-gold" />
            </motion.div>
          </motion.div>

          {/* Headline */}
          <motion.h2
            variants={fadeInUp}
            className="font-jakarta font-black text-5xl sm:text-6xl lg:text-7xl text-warm-white leading-[0.95] tracking-tight mb-8"
          >
            Every{" "}
            <span className="text-brand-gold">litre.</span>
            <br />
            Every{" "}
            <span className="text-brand-green">prayer.</span>
            <br />
            Every{" "}
            <span className="gradient-text">coin matters.</span>
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="text-muted text-xl max-w-2xl mx-auto leading-relaxed mb-12"
          >
            You don&apos;t need to change your lifestyle to change a life. The next
            time you fill up or give at church, your transaction quietly becomes
            someone else&apos;s miracle.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link
              href="/donate"
              className="group relative flex items-center gap-2.5 px-8 py-4 bg-brand-green hover:bg-brand-green-light text-navy font-bold text-base rounded-2xl transition-all duration-300 shadow-xl hover:shadow-brand-green/40 hover:-translate-y-1 animate-glow"
            >
              <Heart className="w-5 h-5" />
              Donate Now
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/church-partnerships"
              className="flex items-center gap-2.5 px-8 py-4 bg-transparent hover:bg-white/5 text-warm-white font-semibold text-base rounded-2xl border border-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1"
            >
              <Church className="w-5 h-5 text-brand-gold" />
              Partner Your Church
            </Link>

            <Link
              href="/fuel-partnerships"
              className="flex items-center gap-2.5 px-8 py-4 bg-transparent hover:bg-white/5 text-warm-white font-semibold text-base rounded-2xl border border-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1"
            >
              <Fuel className="w-5 h-5 text-brand-gold" />
              Partner Your Station
            </Link>
          </motion.div>

          {/* Trust metrics */}
          <motion.div
            variants={fadeInUp}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {[
              { value: "100%", label: "Transparent" },
              { value: "0%", label: "Hidden Fees" },
              { value: "98/100", label: "Trust Score" },
              { value: "4.9★", label: "Donor Rating" },
            ].map((item) => (
              <div
                key={item.label}
                className="glass rounded-2xl p-4 border border-white/8 text-center"
              >
                <div className="font-jakarta font-black text-xl text-brand-green mb-1">{item.value}</div>
                <div className="text-xs text-muted">{item.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
