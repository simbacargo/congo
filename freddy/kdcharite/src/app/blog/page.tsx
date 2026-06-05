"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, ArrowRight, Tag, Search } from "lucide-react";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import Badge from "@/components/ui/Badge";

const categories = ["All", "Clean Water", "Education", "Food Security", "Medical Aid", "Emergency Relief", "Orphan Support"];

const posts = [
  { id: 1, category: "Clean Water", title: "How 89 Litres of Fuel Built a Well for 400 Families in Dodoma", excerpt: "In the semi-arid heartland of central Tanzania, one fuel station's 2% program accumulated enough over three months to dig a borehole that changed 400 families' daily lives forever.", location: "Dodoma, Tanzania", readTime: "4 min read", date: "May 12, 2025", featured: true },
  { id: 2, category: "Education", title: "The Church in Nairobi That Put 200 Orphans Through Primary School", excerpt: "St. Paul's Community Church integrated KDCharite into their weekly offering in January 2024. By year end, 200 children had full scholarships.", location: "Nairobi, Kenya", readTime: "6 min read", date: "Apr 28, 2025", featured: true },
  { id: 3, category: "Food Security", title: "2.4 Million Meals: The Story of Micro-Donations at Scale", excerpt: "What happens when 89 fuel stations each donate 2% across 12 months? This is the mathematics of generosity.", location: "East Africa", readTime: "8 min read", date: "Mar 15, 2025", featured: false },
  { id: 4, category: "Medical Aid", title: "A Mobile Clinic That Reaches 1,200 Patients Every Quarter", excerpt: "Funded entirely through church giving in Rwanda, our mobile medical unit now serves 4 remote districts.", location: "Rwanda", readTime: "5 min read", date: "Mar 5, 2025", featured: false },
  { id: 5, category: "Emergency Relief", title: "Responding to the Floods: KDCharite's 72-Hour Emergency Protocol", excerpt: "When floods hit the Lake Victoria basin in February, our emergency reserves meant we were distributing aid within 72 hours.", location: "Uganda & Tanzania", readTime: "7 min read", date: "Feb 20, 2025", featured: false },
  { id: 6, category: "Orphan Support", title: "From the Street to the Classroom: Amara's Story", excerpt: "Amara, 11, was living on the streets of Dar es Salaam until our partner church identified him and enrolled him in our full-sponsorship program.", location: "Dar es Salaam, TZ", readTime: "5 min read", date: "Feb 10, 2025", featured: false },
  { id: 7, category: "Clean Water", title: "The Women Who Walk 8 Hours: Why Clean Water Changes Everything", excerpt: "In rural Mara, women spend 8 hours a day collecting water. Our new borehole project is changing this — and everything downstream.", location: "Mara, Tanzania", readTime: "6 min read", date: "Jan 30, 2025", featured: false },
  { id: 8, category: "Education", title: "Partnering with 5 Universities to Train the Next Generation of NGO Leaders", excerpt: "Our new fellowship program places young East Africans inside KDCharite operations — paid — to learn charity management from the inside.", location: "Multi-country", readTime: "4 min read", date: "Jan 18, 2025", featured: false },
];

const categoryColors: Record<string, { text: string; bg10: string; bg15: string; border25: string }> = {
  "Clean Water":      { text: "text-brand-green", bg10: "bg-brand-green/10", bg15: "bg-brand-green/15", border25: "border-brand-green/25" },
  "Education":        { text: "text-brand-gold",  bg10: "bg-brand-gold/10",  bg15: "bg-brand-gold/15",  border25: "border-brand-gold/25" },
  "Food Security":    { text: "text-brand-green", bg10: "bg-brand-green/10", bg15: "bg-brand-green/15", border25: "border-brand-green/25" },
  "Medical Aid":      { text: "text-brand-gold",  bg10: "bg-brand-gold/10",  bg15: "bg-brand-gold/15",  border25: "border-brand-gold/25" },
  "Emergency Relief": { text: "text-brand-green", bg10: "bg-brand-green/10", bg15: "bg-brand-green/15", border25: "border-brand-green/25" },
  "Orphan Support":   { text: "text-brand-gold",  bg10: "bg-brand-gold/10",  bg15: "bg-brand-gold/15",  border25: "border-brand-gold/25" },
};

export default function BlogPage() {
  const featuredPosts = posts.filter((p) => p.featured);
  const regularPosts = posts.filter((p) => !p.featured);

  return (
    <div className="bg-navy min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 dot-pattern opacity-25" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={fadeInUp} className="mb-5"><Badge variant="green">Stories & Impact</Badge></motion.div>
            <motion.h1 variants={fadeInUp} className="font-jakarta font-extrabold text-5xl sm:text-6xl text-warm-white mb-4 tracking-tight">
              Stories that{" "}
              <span className="gradient-text">move the world</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-muted text-lg max-w-2xl mx-auto mb-8">
              Real impact stories, transparency reports, and field dispatches from
              the frontlines of charitable transformation across East Africa.
            </motion.p>
            {/* Search */}
            <motion.div variants={fadeInUp} className="relative max-w-sm mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input type="text" placeholder="Search stories..." className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-warm-white placeholder-muted focus:outline-none focus:border-brand-green/50 transition-colors" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-4 border-b border-white/5 bg-navy-dark sticky top-16 lg:top-20 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${cat === "All" ? "bg-brand-green text-navy" : "bg-white/5 text-muted hover:bg-white/10 hover:text-warm-white"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-jakarta font-bold text-xl text-warm-white mb-8">Featured Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredPosts.map((post, i) => {
              const color = categoryColors[post.category] || categoryColors["Clean Water"];
              return (
                <motion.article
                  key={post.id}
                  variants={fadeInUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="group glass rounded-3xl overflow-hidden border border-white/8 hover:border-brand-green/25 transition-all cursor-pointer"
                >
                  <div className={`h-56 bg-gradient-to-br from-navy-light via-navy-dark to-navy-dark relative`}>
                    <div className="absolute inset-0 dot-pattern opacity-30" />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color.bg15} ${color.text} border ${color.border25}`}>
                        {post.category}
                      </span>
                    </div>
                    <div className="absolute bottom-4 right-4 flex items-center gap-1 text-xs text-muted">
                      <Clock className="w-3 h-3" />{post.readTime}
                    </div>
                    <div className={`absolute inset-0 flex items-center justify-center`}>
                      <div className={`w-20 h-20 rounded-full ${color.bg10} flex items-center justify-center`}>
                        <Tag className={`w-8 h-8 ${color.text}`} />
                      </div>
                    </div>
                  </div>
                  <div className="p-7">
                    <div className="flex items-center gap-2 text-xs text-muted mb-3">
                      <MapPin className="w-3 h-3 text-brand-green" />{post.location} · {post.date}
                    </div>
                    <h3 className="font-jakarta font-bold text-xl text-warm-white mb-3 leading-tight group-hover:text-brand-green transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-muted text-sm leading-relaxed mb-4 line-clamp-2">{post.excerpt}</p>
                    <span className={`flex items-center gap-1 text-sm ${color.text} font-medium`}>
                      Read full story <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* All Stories */}
      <section className="pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-jakarta font-bold text-xl text-warm-white mb-8">All Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {regularPosts.map((post, i) => {
              const color = categoryColors[post.category] || categoryColors["Clean Water"];
              return (
                <motion.article
                  key={post.id}
                  variants={fadeInUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -3 }}
                  className="group glass rounded-2xl p-6 border border-white/8 hover:border-brand-green/20 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${color.bg10} ${color.text}`}>
                      {post.category}
                    </span>
                    <span className="text-xs text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />{post.readTime}
                    </span>
                  </div>
                  <h3 className="font-jakarta font-bold text-base text-warm-white mb-3 leading-snug group-hover:text-brand-green transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-muted text-xs leading-relaxed mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted flex items-center gap-1"><MapPin className="w-3 h-3" />{post.location}</span>
                    <span className="text-xs text-muted">{post.date}</span>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
