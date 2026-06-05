"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import {
  Heart,
  Handshake,
  ChevronDown,
  Fuel,
  Church,
  Users,
  Droplets,
  TrendingUp,
} from "lucide-react";
import { staggerContainer, fadeInUp, heroTextVariants, floatingAnimation } from "@/lib/animations";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import Badge from "@/components/ui/Badge";

const stats = [
  {
    icon: Fuel,
    value: 2480000,
    suffix: "",
    prefix: "",
    label: "Meals Funded",
    delay: 0,
    formatter: (v: number) => `${(v / 1000).toFixed(0)}K+`,
    iconBg: "bg-brand-green/10",
    iconHoverBg: "group-hover:bg-brand-green/20",
    iconColor: "text-brand-green",
  },
  {
    icon: Droplets,
    value: 47,
    suffix: "",
    prefix: "",
    label: "Wells Built",
    delay: 0.15,
    formatter: undefined,
    iconBg: "bg-brand-gold/10",
    iconHoverBg: "group-hover:bg-brand-gold/20",
    iconColor: "text-brand-gold",
  },
  {
    icon: Users,
    value: 3200,
    suffix: "+",
    prefix: "",
    label: "Children Supported",
    delay: 0.3,
    formatter: undefined,
    iconBg: "bg-brand-green/10",
    iconHoverBg: "group-hover:bg-brand-green/20",
    iconColor: "text-brand-green",
  },
  {
    icon: Church,
    value: 156,
    suffix: "",
    prefix: "",
    label: "Partner Churches",
    delay: 0.45,
    formatter: undefined,
    iconBg: "bg-brand-gold/10",
    iconHoverBg: "group-hover:bg-brand-gold/20",
    iconColor: "text-brand-gold",
  },
];

export default function HeroSection() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 0.3], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-hero-gradient">
      {/* Grid Pattern */}
      <div className="absolute inset-0 grid-pattern opacity-40" />

      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-brand-green/6 blur-[120px] animate-blob" />
        <div className="absolute top-1/3 -right-1/4 w-[500px] h-[500px] rounded-full bg-brand-gold/5 blur-[100px] animate-blob-delayed" />
        <div className="absolute -bottom-1/4 left-1/3 w-[700px] h-[700px] rounded-full bg-brand-green/4 blur-[140px] animate-blob-slow" />
      </div>

      {/* Radial Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,17,31,0.7)_100%)] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <motion.div
          style={{ y, opacity }}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center"
        >
          {/* Badge */}
          <motion.div variants={fadeInUp} className="mb-8">
            <Badge variant="green">Turning Transactions Into Impact</Badge>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            variants={heroTextVariants}
            className="font-jakarta font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-8 max-w-5xl"
          >
            <span className="text-warm-white block">Small</span>
            <span className="block gradient-text">Contributions.</span>
            <span className="text-warm-white block">Massive Impact.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeInUp}
            className="text-muted text-lg sm:text-xl md:text-2xl max-w-2xl leading-relaxed mb-12"
          >
            Every litre of fuel purchased at our partner stations, every
            church offering — automatically transformed into{" "}
            <span className="text-brand-green font-medium">
              food, clean water, education, and hope
            </span>{" "}
            for communities across East Africa.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center gap-4 mb-20"
          >
            <Link
              href="/donate"
              className="group relative flex items-center gap-2.5 px-8 py-4 bg-brand-green hover:bg-brand-green-light text-navy font-bold text-base rounded-2xl transition-all duration-300 shadow-xl hover:shadow-brand-green/40 hover:-translate-y-1"
            >
              <Heart className="w-5 h-5" />
              Donate Now
              <span className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              href="/church-partnerships"
              className="group flex items-center gap-2.5 px-8 py-4 bg-white/5 hover:bg-white/10 text-warm-white font-semibold text-base rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
            >
              <Handshake className="w-5 h-5 text-brand-green" />
              Become a Partner
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap items-center justify-center gap-6 mb-20 text-xs text-muted"
          >
            {[
              "100% Transparent",
              "NGO Registered",
              "East Africa Certified",
              "Real-time Reporting",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green/60" />
                {item}
              </span>
            ))}
          </motion.div>

          {/* Floating Stats Cards */}
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                custom={i}
                animate={{
                  y: [0, -8, 0],
                  transition: {
                    duration: 4 + i * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: stat.delay * 2,
                  },
                }}
              >
                <div className="glass rounded-2xl p-5 border border-white/8 hover:border-brand-green/30 transition-colors duration-300 group cursor-default">
                  <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${stat.iconBg} ${stat.iconHoverBg} transition-colors`}>
                    <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  <div className="font-jakarta font-bold text-2xl text-warm-white mb-1">
                    <AnimatedCounter
                      to={stat.value}
                      duration={2.5}
                      suffix={stat.suffix}
                      prefix={stat.prefix}
                      formatter={stat.formatter}
                    />
                  </div>
                  <p className="text-xs text-muted leading-tight">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted text-xs"
      >
        <span className="tracking-widest uppercase text-[10px]">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDown className="w-5 h-5 text-brand-green" />
        </motion.div>
      </motion.div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 80L48 72C96 64 192 48 288 42.7C384 37.3 480 42.7 576 48C672 53.3 768 58.7 864 56C960 53.3 1056 42.7 1152 37.3C1248 32 1344 32 1392 32L1440 32V80H1392C1344 80 1248 80 1152 80C1056 80 960 80 864 80C768 80 672 80 576 80C480 80 384 80 288 80C192 80 96 80 48 80H0Z"
            fill="#07111F"
          />
        </svg>
      </div>
    </section>
  );
}
