"use client";

import { motion } from "framer-motion";
import { Target, Eye, Heart, Shield, Users, Globe, Star, Award } from "lucide-react";
import { staggerContainer, fadeInUp, fadeInLeft, fadeInRight } from "@/lib/animations";
import Badge from "@/components/ui/Badge";
import CTASection from "@/components/sections/CTASection";

const values = [
  { icon: Shield, title: "Radical Transparency", description: "Every shilling tracked publicly. No exceptions, no excuses.", color: "text-brand-green", bg: "bg-brand-green/10" },
  { icon: Heart, title: "Human Dignity", description: "We serve with empathy, not charity as a transaction.", color: "text-brand-gold", bg: "bg-brand-gold/10" },
  { icon: Globe, title: "Pan-African Vision", description: "Built for Africa, by Africans, with the world watching.", color: "text-brand-green", bg: "bg-brand-green/10" },
  { icon: Star, title: "Excellence First", description: "Premium standards in everything we build and deliver.", color: "text-brand-gold", bg: "bg-brand-gold/10" },
  { icon: Users, title: "Community Power", description: "Collective micro-giving that scales into macro-impact.", color: "text-brand-green", bg: "bg-brand-green/10" },
  { icon: Award, title: "Accountability", description: "Donor trust is sacred. We earn it every single day.", color: "text-brand-gold", bg: "bg-brand-gold/10" },
];

const timeline = [
  { year: "2021", title: "Foundation", desc: "KDCharite was founded in Dar es Salaam with a simple question: what if charity was as easy as filling your tank?" },
  { year: "2022", title: "First Partnership", desc: "Partnered with 3 fuel stations and 12 churches across Tanzania. First 50 families reached." },
  { year: "2023", title: "Regional Expansion", desc: "Expanded to Kenya, Uganda and Rwanda. 30,000 meals funded. 18 wells built. 500 children in school." },
  { year: "2024", title: "Scale", desc: "89 fuel stations, 156 churches, 7 countries. $4.2M raised. 3,200+ children supported directly." },
  { year: "2025", title: "Next Chapter", desc: "Targeting $10M annual impact, launching digital giving platform, and scaling to 15 African nations." },
];

const team = [
  { name: "Emmanuel Charite", role: "Founder & CEO", initials: "EC", color: "#00B67A" },
  { name: "Amina Ndosi", role: "Chief Impact Officer", initials: "AN", color: "#FFB703" },
  { name: "David Kimani", role: "Head of Partnerships", initials: "DK", color: "#00B67A" },
  { name: "Grace Mwangi", role: "Director of Programs", initials: "GM", color: "#FFB703" },
  { name: "Baraka Osei", role: "CTO", initials: "BO", color: "#00B67A" },
  { name: "Fatuma Hassan", role: "Head of Finance", initials: "FH", color: "#FFB703" },
];

export default function AboutPage() {
  return (
    <div className="bg-navy min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 dot-pattern opacity-25" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-green/5 blur-[100px] animate-blob" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeInUp} className="mb-5">
              <Badge variant="green">Our Story</Badge>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="font-jakarta font-extrabold text-5xl sm:text-6xl lg:text-7xl text-warm-white mb-6 tracking-tight"
            >
              Built on the belief that{" "}
              <span className="gradient-text block">every act counts</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-muted text-xl max-w-3xl mx-auto leading-relaxed">
              KDCharite was born from a simple observation: millions of people in East Africa are
              generous, but giving is too complicated. We built the infrastructure to make charity
              effortless — invisible, even — and the impact has been transformational.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Founder Story */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeInLeft} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="relative">
                <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-brand-green/20 via-navy-light to-navy-dark border border-brand-green/20 overflow-hidden">
                  <div className="absolute inset-0 dot-pattern opacity-30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-green to-brand-green-dark mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-white">EC</div>
                      <p className="text-warm-white font-semibold text-lg">Emmanuel Charite</p>
                      <p className="text-muted text-sm">Founder & CEO</p>
                    </div>
                  </div>
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-6 -right-6 glass rounded-2xl p-4 border border-brand-gold/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center">
                      <Star className="w-5 h-5 text-brand-gold" />
                    </div>
                    <div>
                      <p className="text-warm-white font-bold text-sm">12,000+</p>
                      <p className="text-muted text-xs">Lives Changed</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInRight} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <Badge variant="gold" className="mb-5">Founder's Story</Badge>
              <h2 className="font-jakarta font-extrabold text-4xl text-warm-white mb-6 leading-tight">
                &ldquo;What if giving was as easy as breathing?&rdquo;
              </h2>
              <div className="space-y-4 text-muted leading-relaxed">
                <p>
                  Emmanuel Charite grew up in Dar es Salaam watching his mother walk 3km each day
                  to collect water for the family. He knew that across the street, people were
                  spending money on fuel, food, and everyday transactions — with no mechanism to
                  connect their purchasing power to his family&apos;s need.
                </p>
                <p>
                  After a decade in fintech, Emmanuel returned to Tanzania with one goal: build
                  the infrastructure that would make African generosity scalable. KDCharite was
                  registered in 2021 with three pilot fuel stations and one church.
                </p>
                <p>
                  Today, KDCharite is East Africa&apos;s most transparent charity platform — tracking
                  every shilling from donor to beneficiary, with real-time reporting that builds
                  trust and inspires continued giving.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-navy-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: Target,
                label: "Our Mission",
                title: "Make giving effortless and transparent",
                body: "To integrate charitable giving seamlessly into everyday African transactions — fuel purchases, church offerings, retail — creating a transparent, high-impact charity ecosystem that touches millions of lives.",
                badgeVariant: "green" as const,
                borderColor: "border-brand-green/20",
                gradientFrom: "from-brand-green/5",
                iconBg: "bg-brand-green/10",
                iconColor: "text-brand-green",
              },
              {
                icon: Eye,
                label: "Our Vision",
                title: "Africa's largest digital charity network",
                body: "To become the continent's most trusted, innovative, and impactful charity platform — where every transaction in East Africa carries the potential to change a life, and every donor can see exactly how.",
                badgeVariant: "gold" as const,
                borderColor: "border-brand-gold/20",
                gradientFrom: "from-brand-gold/5",
                iconBg: "bg-brand-gold/10",
                iconColor: "text-brand-gold",
              },
            ].map((item) => (
              <motion.div
                key={item.label}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className={`glass rounded-3xl p-10 border ${item.borderColor} relative overflow-hidden group`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradientFrom} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className={`w-14 h-14 rounded-2xl ${item.iconBg} flex items-center justify-center mb-6`}>
                  <item.icon className={`w-7 h-7 ${item.iconColor}`} />
                </div>
                <Badge variant={item.badgeVariant} className="mb-4">{item.label}</Badge>
                <h3 className="font-jakarta font-bold text-2xl text-warm-white mb-4">{item.title}</h3>
                <p className="text-muted leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.div variants={fadeInUp} className="mb-5"><Badge variant="green">Our Journey</Badge></motion.div>
            <motion.h2 variants={fadeInUp} className="font-jakarta font-extrabold text-4xl sm:text-5xl text-warm-white">
              From idea to <span className="gradient-text">movement</span>
            </motion.h2>
          </motion.div>

          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-brand-green/50 via-brand-gold/30 to-transparent" />
            <div className="space-y-8">
              {timeline.map((item, i) => (
                <motion.div
                  key={item.year}
                  variants={fadeInLeft}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative pl-20"
                >
                  <div className="absolute left-5 top-3 w-6 h-6 rounded-full bg-brand-green border-4 border-navy flex items-center justify-center" style={{ zIndex: 1 }} />
                  <div className="glass rounded-2xl p-6 border border-white/8 hover:border-brand-green/20 transition-colors">
                    <div className="flex items-start gap-4">
                      <span className="font-jakarta font-black text-2xl text-brand-green shrink-0">{item.year}</span>
                      <div>
                        <h3 className="font-jakarta font-bold text-lg text-warm-white mb-2">{item.title}</h3>
                        <p className="text-muted text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-navy-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.div variants={fadeInUp} className="mb-5"><Badge variant="gold">Our Values</Badge></motion.div>
            <motion.h2 variants={fadeInUp} className="font-jakarta font-extrabold text-4xl sm:text-5xl text-warm-white">
              What we stand <span className="gradient-text">for</span>
            </motion.h2>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                variants={fadeInUp}
                custom={i}
                className="glass rounded-2xl p-7 border border-white/8 hover:border-brand-green/20 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className={`w-12 h-12 rounded-xl ${v.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <v.icon className={`w-6 h-6 ${v.color}`} />
                </div>
                <h3 className="font-jakarta font-bold text-lg text-warm-white mb-2">{v.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{v.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.div variants={fadeInUp} className="mb-5"><Badge variant="green">Leadership</Badge></motion.div>
            <motion.h2 variants={fadeInUp} className="font-jakarta font-extrabold text-4xl sm:text-5xl text-warm-white">
              The people behind the <span className="gradient-text">purpose</span>
            </motion.h2>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                variants={fadeInUp}
                custom={i}
                className="glass rounded-2xl p-6 text-center border border-white/8 hover:border-brand-green/20 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-lg font-bold text-white group-hover:scale-110 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${member.color}40, ${member.color}20)`, border: `1px solid ${member.color}30` }}
                >
                  {member.initials}
                </div>
                <p className="font-jakarta font-semibold text-sm text-warm-white mb-1">{member.name}</p>
                <p className="text-muted text-xs">{member.role}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <CTASection />
    </div>
  );
}
