"use client";

import { motion } from "framer-motion";
import { Church, Heart, TrendingUp, Users, CheckCircle2, ArrowRight, Star, Zap } from "lucide-react";
import { staggerContainer, fadeInUp, fadeInLeft, fadeInRight } from "@/lib/animations";
import Badge from "@/components/ui/Badge";
import CTASection from "@/components/sections/CTASection";

const benefits = [
  { icon: TrendingUp, title: "Amplify Your Giving", description: "Your congregation's offerings are pooled with others to fund larger projects that single churches cannot tackle alone." },
  { icon: CheckCircle2, title: "Total Transparency", description: "Your members receive a live dashboard showing exactly where every shilling of their giving has gone." },
  { icon: Users, title: "Community Impact Reports", description: "Monthly reports with photos, stories and GPS coordinates of projects funded by your congregation." },
  { icon: Star, title: "Recognition Programme", description: "Top giving churches feature prominently on our platform, website and annual impact gala." },
  { icon: Zap, title: "Simple Integration", description: "We plug into your existing giving system. No new apps needed. SMS-based for rural congregations." },
  { icon: Heart, title: "Spiritual Legacy", description: "Create a documented legacy of your church's generosity. Ideal for faith-led stewardship programmes." },
];

const howToJoin = [
  { step: "1", title: "Submit an expression of interest", desc: "Complete our brief online form with your church details." },
  { step: "2", title: "Partnership consultation", desc: "A KDCharite representative meets with your leadership team." },
  { step: "3", title: "Integration setup", desc: "We configure the giving link — SMS, online, or QR code." },
  { step: "4", title: "Launch & impact", desc: "Announce to your congregation and start giving. Impact begins immediately." },
];

const testimonials = [
  { name: "Pastor James Omondi", church: "Restoration Centre, Dar es Salaam", quote: "Within 3 months, our congregation had contributed enough to build two classroom blocks in Dodoma. The dashboard showing our children the impact was transformational for our youth ministry." },
  { name: "Rev. Mary Wanjiku", church: "Grace Fellowship, Mombasa", quote: "KDCharite turned our regular tithes into something our congregation can see and celebrate. The transparency is unlike anything we've experienced with traditional charity giving." },
  { name: "Bishop Emmanuel Ssali", church: "New Life Church, Kampala", quote: "Five of my pastoral network's churches joined within a month of our launch. The reporting alone has increased giving by 40% because people trust they can see the result." },
];

export default function ChurchPartnershipsPage() {
  return (
    <div className="bg-navy min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 dot-pattern opacity-25" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-gold/5 blur-[100px] animate-blob" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.div variants={fadeInUp} className="mb-5">
                <Badge variant="gold">Church Partnerships</Badge>
              </motion.div>
              <motion.h1 variants={fadeInUp} className="font-jakarta font-extrabold text-5xl sm:text-6xl text-warm-white mb-6 tracking-tight leading-tight">
                Turn your congregation&apos;s{" "}
                <span className="gradient-text">faith into action</span>
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-muted text-xl leading-relaxed mb-10">
                Partner your church with KDCharite and transform weekly offerings into a
                measurable, transparent legacy of community transformation across East Africa.
              </motion.p>
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
                <a href="#apply" className="flex items-center justify-center gap-2 px-7 py-4 bg-brand-green hover:bg-brand-green-light text-navy font-bold rounded-2xl transition-all hover:-translate-y-0.5 shadow-xl hover:shadow-brand-green/30">
                  <Church className="w-5 h-5" />
                  Partner Your Church
                </a>
                <a href="#benefits" className="flex items-center justify-center gap-2 px-7 py-4 border border-white/15 hover:border-white/30 text-warm-white font-semibold rounded-2xl transition-all hover:-translate-y-0.5">
                  Learn More <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>
            </motion.div>

            {/* Stats panel */}
            <motion.div variants={fadeInRight} initial="hidden" animate="visible" className="space-y-4">
              {[
                { value: "156", label: "Partner Churches", sub: "Across East Africa" },
                { value: "$2.1M", label: "Raised via Churches", sub: "Since 2022" },
                { value: "40%", label: "Average Giving Increase", sub: "After transparency launch" },
              ].map((stat) => (
                <div key={stat.label} className="glass rounded-2xl p-6 border border-brand-gold/15 flex items-center gap-6">
                  <div className="font-jakarta font-black text-4xl text-brand-gold">{stat.value}</div>
                  <div>
                    <p className="text-warm-white font-semibold">{stat.label}</p>
                    <p className="text-muted text-sm">{stat.sub}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 lg:py-28 bg-navy-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.div variants={fadeInUp} className="mb-5"><Badge variant="green">Why Partner</Badge></motion.div>
            <motion.h2 variants={fadeInUp} className="font-jakarta font-extrabold text-4xl sm:text-5xl text-warm-white">
              Benefits for your <span className="gradient-text">church community</span>
            </motion.h2>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((b, i) => (
              <motion.div key={b.title} variants={fadeInUp} custom={i} className="glass rounded-2xl p-7 border border-white/8 hover:border-brand-gold/20 transition-all duration-300 hover:-translate-y-1 group">
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

      {/* How to Join */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.div variants={fadeInUp} className="mb-5"><Badge variant="gold">Simple Process</Badge></motion.div>
            <motion.h2 variants={fadeInUp} className="font-jakarta font-extrabold text-4xl sm:text-5xl text-warm-white">
              Join in <span className="gradient-text">4 simple steps</span>
            </motion.h2>
          </motion.div>
          <div className="space-y-4">
            {howToJoin.map((step, i) => (
              <motion.div key={step.step} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-start gap-6 glass rounded-2xl p-7 border border-white/8 hover:border-brand-green/20 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center shrink-0">
                  <span className="font-jakarta font-black text-lg text-brand-green">{step.step}</span>
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

      {/* Testimonials */}
      <section className="py-20 bg-navy-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.div variants={fadeInUp} className="mb-5"><Badge variant="green">Testimonials</Badge></motion.div>
            <motion.h2 variants={fadeInUp} className="font-jakarta font-extrabold text-4xl sm:text-5xl text-warm-white">
              Voices from the <span className="gradient-text">pews</span>
            </motion.h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass rounded-2xl p-7 border border-white/8 hover:border-brand-gold/20 transition-colors">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-brand-gold fill-brand-gold" />)}
                </div>
                <p className="text-muted text-sm leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-gold/20 flex items-center justify-center font-bold text-brand-gold">{t.name[0]}</div>
                  <div>
                    <p className="text-warm-white font-semibold text-sm">{t.name}</p>
                    <p className="text-muted text-xs">{t.church}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="py-20">
        <div className="max-w-2xl mx-auto px-4">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
            <motion.div variants={fadeInUp} className="mb-5"><Badge variant="green">Apply Now</Badge></motion.div>
            <motion.h2 variants={fadeInUp} className="font-jakarta font-extrabold text-4xl text-warm-white">
              Start your <span className="gradient-text">partnership</span>
            </motion.h2>
          </motion.div>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="glass rounded-3xl p-8 border border-brand-green/15">
            <div className="space-y-4">
              <input type="text" placeholder="Church/Organization Name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
              <input type="text" placeholder="Pastor/Leader Name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
              <input type="email" placeholder="Contact Email" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
              <input type="tel" placeholder="Phone Number" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
              <input type="text" placeholder="City & Country" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
              <input type="number" placeholder="Approximate congregation size" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
              <textarea rows={4} placeholder="Tell us about your church and giving vision..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors resize-none" />
              <button className="w-full flex items-center justify-center gap-2 py-4 bg-brand-green hover:bg-brand-green-light text-navy font-bold rounded-2xl transition-all hover:-translate-y-0.5 shadow-xl hover:shadow-brand-green/30">
                <Church className="w-5 h-5" />
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
