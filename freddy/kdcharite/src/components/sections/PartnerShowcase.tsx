"use client";

import { motion } from "framer-motion";
import Marquee from "react-fast-marquee";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import Badge from "@/components/ui/Badge";

const churchPartners = [
  { name: "St. Paul's Community Church", city: "Nairobi" },
  { name: "Restoration Centre", city: "Dar es Salaam" },
  { name: "Hope Cathedral", city: "Kampala" },
  { name: "Grace Fellowship", city: "Mombasa" },
  { name: "New Life Church", city: "Kigali" },
  { name: "Calvary Temple", city: "Arusha" },
  { name: "Light of the World", city: "Lusaka" },
  { name: "Bethel Community", city: "Nairobi" },
];

const fuelPartners = [
  { name: "PetroAfrica", type: "Fuel Chain" },
  { name: "TanzOil", type: "National Partner" },
  { name: "AfriPetro", type: "Fuel Chain" },
  { name: "EastFuel Co.", type: "Regional" },
  { name: "SunPetro", type: "Fuel Chain" },
  { name: "GreatLakes Fuel", type: "Regional" },
  { name: "Kisumu Stations", type: "Local Network" },
  { name: "Dodoma Fuel Ltd", type: "National Partner" },
];

const ngoPartners = [
  { name: "UNICEF East Africa", type: "UN Partner" },
  { name: "WFP Tanzania", type: "Food Security" },
  { name: "Water for People", type: "WASH" },
  { name: "Save the Children", type: "Child Welfare" },
  { name: "ActionAid Africa", type: "Development" },
  { name: "Plan International", type: "Children's Rights" },
];

function PartnerCard({ name, sub }: { name: string; sub: string }) {
  return (
    <div className="glass rounded-2xl px-6 py-4 border border-white/8 hover:border-brand-green/25 transition-all duration-200 mx-3 flex flex-col gap-1 min-w-[200px]">
      <div className="font-jakarta font-semibold text-sm text-warm-white">{name}</div>
      <div className="text-xs text-muted">{sub}</div>
    </div>
  );
}

function LogoPlaceholder({ letter, color }: { letter: string; color: string }) {
  return (
    <div
      className="mx-4 w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl border border-white/10"
      style={{ background: `linear-gradient(135deg, ${color}20, ${color}05)`, borderColor: `${color}25` }}
    >
      <span style={{ color }}>{letter}</span>
    </div>
  );
}

const logos = [
  { letter: "P", color: "#00B67A" },
  { letter: "T", color: "#FFB703" },
  { letter: "U", color: "#00B67A" },
  { letter: "W", color: "#FFB703" },
  { letter: "A", color: "#00B67A" },
  { letter: "S", color: "#FFB703" },
  { letter: "G", color: "#00B67A" },
  { letter: "E", color: "#FFB703" },
  { letter: "K", color: "#00B67A" },
  { letter: "D", color: "#FFB703" },
  { letter: "N", color: "#00B67A" },
  { letter: "R", color: "#FFB703" },
];

export default function PartnerShowcase() {
  return (
    <section className="relative py-24 lg:py-28 bg-navy-dark overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-gold/20 to-transparent" />

      <div className="relative z-10">
        {/* Header */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <motion.div variants={fadeInUp} className="mb-5">
            <Badge variant="gold">Our Partners</Badge>
          </motion.div>
          <motion.h2
            variants={fadeInUp}
            className="font-jakarta font-extrabold text-4xl sm:text-5xl text-warm-white tracking-tight mb-4"
          >
            A growing network of{" "}
            <span className="gradient-text">change-makers</span>
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-muted text-lg max-w-xl mx-auto"
          >
            156 churches, 89 fuel stations, and 24 NGOs united around one mission.
          </motion.p>
        </motion.div>

        {/* Logo Marquee Row 1 */}
        <div className="mb-4">
          <Marquee
            speed={35}
            gradient
            gradientColor="#040c15"
            gradientWidth={120}
            pauseOnHover
          >
            {logos.map((logo, i) => (
              <LogoPlaceholder key={i} {...logo} />
            ))}
          </Marquee>
        </div>

        {/* Logo Marquee Row 2 - reverse */}
        <div className="mb-12">
          <Marquee
            speed={28}
            gradient
            gradientColor="#040c15"
            gradientWidth={120}
            direction="right"
            pauseOnHover
          >
            {logos.map((logo, i) => (
              <LogoPlaceholder key={i} {...logo} />
            ))}
          </Marquee>
        </div>

        {/* Partner Cards Rows */}
        <div className="mb-4">
          <Marquee speed={40} gradient gradientColor="#040c15" gradientWidth={80} pauseOnHover>
            {churchPartners.map((p) => (
              <PartnerCard key={p.name} name={p.name} sub={p.city} />
            ))}
          </Marquee>
        </div>

        <div className="mb-12">
          <Marquee speed={32} gradient gradientColor="#040c15" gradientWidth={80} direction="right" pauseOnHover>
            {fuelPartners.map((p) => (
              <PartnerCard key={p.name} name={p.name} sub={p.type} />
            ))}
          </Marquee>
        </div>

        {/* Stats Row */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-12 max-w-3xl mx-auto px-4"
        >
          {[
            { value: "156", label: "Churches" },
            { value: "89", label: "Fuel Stations" },
            { value: "24", label: "NGO Partners" },
            { value: "7", label: "Countries" },
          ].map((stat) => (
            <motion.div key={stat.label} variants={fadeInUp} className="text-center">
              <div className="font-jakarta font-black text-4xl gradient-text mb-1">
                {stat.value}
              </div>
              <div className="text-muted text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
