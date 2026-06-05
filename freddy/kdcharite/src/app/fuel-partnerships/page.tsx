"use client";

import { motion } from "framer-motion";
import { Fuel, TrendingUp, Users, CheckCircle2, ArrowRight, Star, Zap, Shield, BarChart3, Heart } from "lucide-react";
import { staggerContainer, fadeInUp, fadeInLeft, fadeInRight } from "@/lib/animations";
import Badge from "@/components/ui/Badge";
import CTASection from "@/components/sections/CTASection";

const benefits = [
  { icon: TrendingUp, title: "Customer Loyalty Boost", description: "Customers who donate at the pump return 28% more frequently and spend more per visit on average." },
  { icon: Shield, title: "CSR Leadership", description: "Demonstrate credible Corporate Social Responsibility with verified, real-time impact reporting." },
  { icon: Users, title: "Brand Association", description: "Feature as a proud KDCharite partner on all marketing materials, platforms and the annual impact report." },
  { icon: BarChart3, title: "Detailed Analytics", description: "Access your station's giving dashboard — see totals, trends, and the communities your customers are serving." },
  { icon: Zap, title: "Plug-and-Play Integration", description: "Integrated into your existing POS system. No new hardware, no disruption to operations." },
  { icon: Heart, title: "Staff Engagement", description: "Your staff become ambassadors for impact. We provide training, materials and recognition certificates." },
];

const howItWorks = [
  { step: "1", title: "Initial consultation", desc: "Our partnerships team assesses your POS infrastructure and discusses integration options." },
  { step: "2", title: "Technical integration", desc: "Our engineers integrate the 2% prompt into your payment flow. Takes 48 hours maximum." },
  { step: "3", title: "Staff training", desc: "Brief 30-minute training for cashiers on communicating the program to customers." },
  { step: "4", title: "Launch day", desc: "Announce to customers with our branded display materials and begin generating impact." },
];

const fuelStats = [
  { value: "89", label: "Partner Stations", sub: "Across 7 countries" },
  { value: "2.1M", label: "Transactions Processed", sub: "Since launch" },
  { value: "28%", label: "Loyalty Increase", sub: "Average across partners" },
  { value: "$2.1M", label: "Raised via Fuel", sub: "From pump donations" },
];

export default function FuelPartnershipsPage() {
  return (
    <div className="bg-navy min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 dot-pattern opacity-25" />
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] rounded-full bg-brand-gold/5 blur-[100px] animate-blob" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.div variants={fadeInUp} className="mb-5">
                <Badge variant="gold">Fuel Station Partners</Badge>
              </motion.div>
              <motion.h1 variants={fadeInUp} className="font-jakarta font-extrabold text-5xl sm:text-6xl text-warm-white mb-6 tracking-tight">
                Every litre pumped,{" "}
                <span className="gradient-text">a life touched</span>
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-muted text-xl leading-relaxed mb-10">
                Partner your fuel stations with KDCharite and turn everyday fuel sales into a
                verified, transparent stream of charitable impact — while building unmatched
                customer loyalty.
              </motion.p>
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
                <a href="#apply" className="flex items-center justify-center gap-2 px-7 py-4 bg-brand-gold hover:bg-brand-gold-light text-navy font-bold rounded-2xl transition-all hover:-translate-y-0.5 shadow-xl hover:shadow-brand-gold/30">
                  <Fuel className="w-5 h-5" />
                  Partner Your Station
                </a>
                <a href="#how" className="flex items-center justify-center gap-2 px-7 py-4 border border-white/15 hover:border-white/30 text-warm-white font-semibold rounded-2xl transition-all hover:-translate-y-0.5">
                  See How It Works <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>
            </motion.div>

            {/* Visual Panel */}
            <motion.div variants={fadeInRight} initial="hidden" animate="visible">
              <div className="glass rounded-3xl p-8 border border-brand-gold/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/5 to-transparent" />
                <div className="relative">
                  {/* Pump visual */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-brand-gold/15 flex items-center justify-center">
                      <Fuel className="w-8 h-8 text-brand-gold" />
                    </div>
                    <div>
                      <p className="text-warm-white font-jakarta font-bold text-lg">Customer Pays TZS 50,000</p>
                      <p className="text-muted text-sm">For 20 litres of fuel</p>
                    </div>
                  </div>
                  <div className="relative h-px bg-gradient-to-r from-brand-gold/50 to-brand-green/50 my-6">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-navy-light px-3 text-xs text-muted">+2% opt-in</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-brand-green/15 flex items-center justify-center">
                      <Heart className="w-8 h-8 text-brand-green" />
                    </div>
                    <div>
                      <p className="text-warm-white font-jakarta font-bold text-lg">TZS 1,000 to Charity</p>
                      <p className="text-muted text-sm">Instantly allocated to active causes</p>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="font-jakarta font-black text-2xl text-brand-gold">$0</p>
                      <p className="text-muted text-xs">Station cost</p>
                    </div>
                    <div className="text-center">
                      <p className="font-jakarta font-black text-2xl text-brand-green">28%</p>
                      <p className="text-muted text-xs">Loyalty increase</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-navy-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fuelStats.map((s, i) => (
              <motion.div key={s.label} variants={fadeInUp} custom={i} className="glass rounded-2xl p-6 border border-brand-gold/15 text-center">
                <div className="font-jakarta font-black text-3xl text-brand-gold mb-1">{s.value}</div>
                <p className="text-warm-white font-semibold text-sm">{s.label}</p>
                <p className="text-muted text-xs">{s.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.div variants={fadeInUp} className="mb-5"><Badge variant="gold">Why Partner</Badge></motion.div>
            <motion.h2 variants={fadeInUp} className="font-jakarta font-extrabold text-4xl sm:text-5xl text-warm-white">
              Benefits for your <span className="gradient-text">business</span>
            </motion.h2>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((b, i) => (
              <motion.div key={b.title} variants={fadeInUp} custom={i} className="glass rounded-2xl p-7 border border-white/8 hover:border-brand-gold/20 transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-xl bg-brand-gold/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <b.icon className="w-6 h-6 text-brand-gold" />
                </div>
                <h3 className="font-jakarta font-bold text-lg text-warm-white mb-2">{b.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{b.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 bg-navy-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.div variants={fadeInUp} className="mb-5"><Badge variant="green">Process</Badge></motion.div>
            <motion.h2 variants={fadeInUp} className="font-jakarta font-extrabold text-4xl sm:text-5xl text-warm-white">
              Live in <span className="gradient-text">48 hours</span>
            </motion.h2>
          </motion.div>
          <div className="space-y-4">
            {howItWorks.map((step, i) => (
              <motion.div key={step.step} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-start gap-6 glass rounded-2xl p-7 border border-white/8 hover:border-brand-gold/20 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center shrink-0">
                  <span className="font-jakarta font-black text-lg text-brand-gold">{step.step}</span>
                </div>
                <div>
                  <h3 className="font-jakarta font-bold text-lg text-warm-white mb-2">{step.title}</h3>
                  <p className="text-muted text-sm">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Application */}
      <section id="apply" className="py-20">
        <div className="max-w-2xl mx-auto px-4">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
            <motion.div variants={fadeInUp} className="mb-5"><Badge variant="gold">Apply Now</Badge></motion.div>
            <motion.h2 variants={fadeInUp} className="font-jakarta font-extrabold text-4xl text-warm-white">
              Partner your <span className="gradient-text">stations</span>
            </motion.h2>
          </motion.div>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="glass rounded-3xl p-8 border border-brand-gold/15">
            <div className="space-y-4">
              <input type="text" placeholder="Company / Station Name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-gold/50 transition-colors" />
              <input type="text" placeholder="Contact Person Name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-gold/50 transition-colors" />
              <input type="email" placeholder="Business Email" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-gold/50 transition-colors" />
              <input type="tel" placeholder="Phone Number" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-gold/50 transition-colors" />
              <input type="number" placeholder="Number of stations" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-gold/50 transition-colors" />
              <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-muted focus:outline-none focus:border-brand-gold/50 transition-colors">
                <option value="">POS System Type</option>
                <option>Oracle Simphony</option>
                <option>Revel</option>
                <option>Toast</option>
                <option>Custom / Other</option>
              </select>
              <textarea rows={3} placeholder="Any additional notes about your stations..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-gold/50 transition-colors resize-none" />
              <button className="w-full flex items-center justify-center gap-2 py-4 bg-brand-gold hover:bg-brand-gold-light text-navy font-bold rounded-2xl transition-all hover:-translate-y-0.5 shadow-xl hover:shadow-brand-gold/30">
                <Fuel className="w-5 h-5" />
                Submit Partnership Application
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <CTASection />
    </div>
  );
}
