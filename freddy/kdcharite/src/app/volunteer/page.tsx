"use client";

import { motion } from "framer-motion";
import { Users, Calendar, MapPin, ArrowRight, Heart, Globe, Zap, Star, CheckCircle2 } from "lucide-react";
import { staggerContainer, fadeInUp, fadeInLeft, fadeInRight } from "@/lib/animations";
import Badge from "@/components/ui/Badge";
import CTASection from "@/components/sections/CTASection";

const opportunities = [
  { title: "Field Coordinator", location: "Dar es Salaam, Tanzania", type: "Full-time", commitment: "6 months", description: "Lead on-the-ground project delivery for food and water programs.", skills: ["Project Management", "Swahili", "Community Relations"] },
  { title: "Tech Volunteer", location: "Remote", type: "Part-time", commitment: "Flexible", description: "Help build and maintain the KDCharite digital platform and mobile tools.", skills: ["React", "TypeScript", "Backend Development"] },
  { title: "Data Analyst", location: "Remote / Nairobi", type: "Part-time", commitment: "10 hrs/week", description: "Analyze impact data and create compelling visualization reports.", skills: ["Python", "Data Visualization", "NGO Reporting"] },
  { title: "Community Fundraiser", location: "Your City", type: "Volunteer", commitment: "Flexible", description: "Organize local fundraising events and church partnership drives.", skills: ["Communication", "Event Planning", "Networking"] },
  { title: "Content Creator", location: "Remote", type: "Part-time", commitment: "5 hrs/week", description: "Craft compelling stories, videos and social content about our impact.", skills: ["Writing", "Video Editing", "Social Media"] },
  { title: "Medical Volunteer", location: "Field Deployments", type: "Volunteer", commitment: "2-week deployments", description: "Join quarterly medical outreach missions across rural East Africa.", skills: ["Medical Degree", "First Aid", "Field Experience"] },
];

const events = [
  { title: "Volunteer Orientation — Nairobi", date: "June 15, 2025", location: "Nairobi, Kenya", type: "In-person", spots: 20 },
  { title: "Fundraising Drive — Church Partners", date: "June 22, 2025", location: "Dar es Salaam, TZ", type: "In-person", spots: 50 },
  { title: "Virtual Info Session", date: "June 28, 2025", location: "Online", type: "Virtual", spots: 200 },
  { title: "Field Trip — Dodoma Well Project", date: "July 5, 2025", location: "Dodoma, Tanzania", type: "In-person", spots: 10 },
];

const testimonials = [
  { name: "Amara Diop", role: "Field Coordinator", quote: "Six months in Tanzania changed how I see the world. The KDCharite family is unlike any NGO I've worked with — transparent, professional, and deeply mission-driven.", country: "Senegal" },
  { name: "James Chen", role: "Tech Volunteer", quote: "I gave 5 hours a week to help build the impact dashboard. Seeing real donations flow through a system I helped create is one of the proudest moments of my career.", country: "Singapore" },
];

export default function VolunteerPage() {
  return (
    <div className="bg-navy min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 dot-pattern opacity-25" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeInUp} className="mb-5"><Badge variant="green">Volunteer</Badge></motion.div>
            <motion.h1 variants={fadeInUp} className="font-jakarta font-extrabold text-5xl sm:text-6xl text-warm-white mb-4 tracking-tight">
              Give your time,{" "}
              <span className="gradient-text">change a continent</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-muted text-xl max-w-2xl mx-auto leading-relaxed mb-10">
              Whether you&apos;re a developer, doctor, storyteller or fundraiser — KDCharite has a role for your passion. Join 340+ active volunteers across East Africa.
            </motion.p>
            <motion.a variants={fadeInUp} href="#opportunities" className="inline-flex items-center gap-2 px-8 py-4 bg-brand-green hover:bg-brand-green-light text-navy font-bold rounded-2xl transition-all hover:-translate-y-0.5 shadow-xl">
              <Users className="w-5 h-5" />
              Browse Opportunities
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 bg-navy-dark">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "340+", label: "Active Volunteers" },
              { value: "18", label: "Countries Represented" },
              { value: "42K", label: "Hours Contributed" },
              { value: "4.9★", label: "Volunteer Satisfaction" },
            ].map((s, i) => (
              <motion.div key={s.label} variants={fadeInUp} custom={i} className="glass rounded-2xl p-5 border border-white/8 text-center">
                <div className="font-jakarta font-black text-2xl text-brand-green mb-1">{s.value}</div>
                <p className="text-muted text-xs">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Opportunities */}
      <section id="opportunities" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.div variants={fadeInUp} className="mb-5"><Badge variant="gold">Open Roles</Badge></motion.div>
            <motion.h2 variants={fadeInUp} className="font-jakarta font-extrabold text-4xl sm:text-5xl text-warm-white">
              Find your <span className="gradient-text">opportunity</span>
            </motion.h2>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {opportunities.map((opp, i) => (
              <motion.div key={opp.title} variants={fadeInUp} custom={i} className="glass rounded-2xl p-7 border border-white/8 hover:border-brand-green/20 transition-all hover:-translate-y-1 group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-jakarta font-bold text-lg text-warm-white mb-1">{opp.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <MapPin className="w-3 h-3" />{opp.location}
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg text-xs font-medium bg-brand-green/10 text-brand-green border border-brand-green/20">{opp.type}</span>
                </div>
                <p className="text-muted text-sm mb-4 leading-relaxed">{opp.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {opp.skills.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-md text-xs bg-white/5 text-muted border border-white/8">{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">{opp.commitment}</span>
                  <button className="flex items-center gap-1 text-xs text-brand-green group-hover:gap-2 transition-all font-medium">
                    Apply <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Events */}
      <section className="py-16 px-4 bg-navy-dark">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <motion.div variants={fadeInUp} className="mb-5"><Badge variant="green">Events</Badge></motion.div>
            <motion.h2 variants={fadeInUp} className="font-jakarta font-extrabold text-4xl text-warm-white">
              Upcoming <span className="gradient-text">events</span>
            </motion.h2>
          </motion.div>
          <div className="space-y-4">
            {events.map((event, i) => (
              <motion.div key={event.title} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="glass rounded-2xl p-6 border border-white/8 hover:border-brand-green/20 transition-colors flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 text-brand-green" />
                  </div>
                  <div>
                    <h3 className="font-jakarta font-bold text-warm-white">{event.title}</h3>
                    <div className="flex items-center gap-3 text-muted text-xs mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.date}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${event.type === "Virtual" ? "bg-brand-gold/10 text-brand-gold" : "bg-brand-green/10 text-brand-green"} border border-current/20`}>{event.type}</span>
                  <span className="text-xs text-muted">{event.spots} spots</span>
                  <button className="px-4 py-2 bg-brand-green/10 hover:bg-brand-green/20 text-brand-green text-xs font-semibold rounded-xl border border-brand-green/20 transition-colors">Register</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
            <motion.div variants={fadeInUp} className="mb-5"><Badge variant="green">Apply</Badge></motion.div>
            <motion.h2 variants={fadeInUp} className="font-jakarta font-extrabold text-4xl text-warm-white">
              Join our <span className="gradient-text">team</span>
            </motion.h2>
          </motion.div>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="glass rounded-3xl p-8 border border-brand-green/15">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="First Name" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
                <input type="text" placeholder="Last Name" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
              </div>
              <input type="email" placeholder="Email address" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
              <input type="text" placeholder="Country / City" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
              <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-muted focus:outline-none focus:border-brand-green/50 transition-colors">
                <option value="">Preferred Role</option>
                {opportunities.map((o) => <option key={o.title}>{o.title}</option>)}
              </select>
              <input type="text" placeholder="Primary Skills" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
              <input type="text" placeholder="Hours available per week" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
              <textarea rows={4} placeholder="Why do you want to volunteer with KDCharite?" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors resize-none" />
              <button className="w-full flex items-center justify-center gap-2 py-4 bg-brand-green hover:bg-brand-green-light text-navy font-bold rounded-2xl transition-all hover:-translate-y-0.5 shadow-xl">
                <Heart className="w-5 h-5" />
                Submit Volunteer Application
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <CTASection />
    </div>
  );
}
