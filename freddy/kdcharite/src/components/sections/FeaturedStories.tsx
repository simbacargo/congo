"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Tag } from "lucide-react";
import { staggerContainer, fadeInUp, cardHover } from "@/lib/animations";
import Badge from "@/components/ui/Badge";

const stories = [
  {
    id: 1,
    category: "Clean Water",
    title: "How 89 Litres of Fuel Built a Well for 400 Families",
    excerpt:
      "In Dodoma's semi-arid heartland, one fuel station's 2% program accumulated enough in three months to dig a borehole that changed 400 families' daily lives forever.",
    location: "Dodoma, Tanzania",
    readTime: "4 min read",
    date: "May 2025",
    imageGradient: "from-[#0d1f35] via-[#0a3a2a] to-[#041209]",
    accentBg15: "bg-brand-green/15",
    accentBg20: "bg-brand-green/20",
    accentBg8: "bg-brand-green/8",
    accentText: "text-brand-green",
    accentBorder30: "border-brand-green/30",
    accentBg: "bg-brand-green",
    tag: "Water & Sanitation",
  },
  {
    id: 2,
    category: "Education",
    title: "The Church in Nairobi That Put 200 Orphans Through Primary School",
    excerpt:
      "St. Paul's Community Church integrated KDCharite into their weekly offering in January 2024. By year end, 200 children had full scholarships — paid entirely through congregation giving.",
    location: "Nairobi, Kenya",
    readTime: "6 min read",
    date: "Apr 2025",
    imageGradient: "from-[#1a1005] via-[#2a1e00] to-[#0f0a00]",
    accentBg15: "bg-brand-gold/15",
    accentBg20: "bg-brand-gold/20",
    accentBg8: "bg-brand-gold/8",
    accentText: "text-brand-gold",
    accentBorder30: "border-brand-gold/30",
    accentBg: "bg-brand-gold",
    tag: "Education",
  },
  {
    id: 3,
    category: "Food Security",
    title: "2.4 Million Meals: The Story of Micro-Donations at Scale",
    excerpt:
      "What happens when 89 fuel stations each donate 2% across 12 months? 2.4 million meals. This is the story of how small acts of everyday generosity multiply into something extraordinary.",
    location: "East Africa",
    readTime: "8 min read",
    date: "Mar 2025",
    imageGradient: "from-[#07111F] via-[#0d1a30] to-[#040c15]",
    accentBg15: "bg-brand-green/15",
    accentBg20: "bg-brand-green/20",
    accentBg8: "bg-brand-green/8",
    accentText: "text-brand-green",
    accentBorder30: "border-brand-green/30",
    accentBg: "bg-brand-green",
    tag: "Food Programs",
  },
];

export default function FeaturedStories() {
  return (
    <section className="relative py-24 lg:py-32 bg-navy overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-15" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-16"
        >
          <div>
            <motion.div variants={fadeInUp} className="mb-4">
              <Badge variant="green">Real Stories</Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="font-jakarta font-extrabold text-4xl sm:text-5xl text-warm-white tracking-tight"
            >
              Impact you can{" "}
              <span className="gradient-text">feel</span>
            </motion.h2>
          </div>
          <motion.div variants={fadeInUp}>
            <Link
              href="/blog"
              className="flex items-center gap-2 text-sm text-muted hover:text-brand-green transition-colors group"
            >
              View all stories
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {stories.map((story, i) => (
            <motion.article
              key={story.id}
              variants={fadeInUp}
              custom={i}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3 }}
              className="group relative glass rounded-3xl overflow-hidden border border-white/8 hover:border-brand-green/25 transition-all duration-300 cursor-pointer"
            >
              {/* Image Placeholder */}
              <div className={`relative h-52 bg-gradient-to-br ${story.imageGradient} overflow-hidden`}>
                <div className="absolute inset-0 grid-pattern opacity-30" />

                {/* Category illustration */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-20 h-20 rounded-full ${story.accentBg15} flex items-center justify-center`}>
                    <div className={`w-12 h-12 rounded-full ${story.accentBg20} flex items-center justify-center`}>
                      <Tag className={`w-6 h-6 ${story.accentText}`} />
                    </div>
                  </div>
                </div>

                {/* Overlay gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-navy-dark to-transparent" />

                {/* Category badge */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${story.accentBg20} ${story.accentText} border ${story.accentBorder30}`}>
                    {story.category}
                  </span>
                </div>

                {/* Read time */}
                <div className="absolute bottom-4 right-4 flex items-center gap-1 text-xs text-muted">
                  <Clock className="w-3 h-3" />
                  {story.readTime}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-1.5 text-xs text-muted mb-3">
                  <MapPin className="w-3 h-3 text-brand-green" />
                  {story.location}
                  <span className="mx-1">·</span>
                  {story.date}
                </div>

                <h3 className="font-jakarta font-bold text-lg text-warm-white leading-tight mb-3 group-hover:text-brand-green transition-colors duration-200">
                  {story.title}
                </h3>

                <p className="text-muted text-sm leading-relaxed mb-5 line-clamp-3">
                  {story.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-lg text-xs ${story.accentBg8} ${story.accentText}`}>
                    {story.tag}
                  </span>
                  <span className={`flex items-center gap-1 text-xs ${story.accentText} font-medium group-hover:gap-2 transition-all`}>
                    Read story
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Bottom accent line */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${story.accentBg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
