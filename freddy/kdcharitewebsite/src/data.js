// ─── CONTENT / DATA ──────────────────────────────────────────────────────────
// All static copy and seed data for the marketing site lives here so sections
// stay presentational.

import {
  Heart, Droplets, Utensils, Activity, Leaf, Sparkles,
} from 'lucide-react';

export const IMPACT_THRESHOLDS = [
  { min: 0,   max: 0.5,  emoji: '❤️',  icon: Heart,    text: () => `Sparks the first step — your change seeds hope.` },
  { min: 0.5, max: 1,    emoji: '💧',  icon: Droplets, text: (v) => `${Math.round(v * 14)} days of clean water for a child in need.` },
  { min: 1,   max: 2,    emoji: '🍽️',  icon: Utensils, text: (v) => `${Math.round(v * 2)} hot meals served to a struggling family.` },
  { min: 2,   max: 4,    emoji: '🍽️',  icon: Utensils, text: (v) => `${Math.round(v * 2)} hot meals + 1 day of school supplies for a child.` },
  { min: 4,   max: 8,    emoji: '🏥',  icon: Activity, text: () => `One mobile clinic consultation for an uninsured patient.` },
  { min: 8,   max: 15,   emoji: '🌱',  icon: Leaf,     text: (v) => `Plants ${Math.round(v * 3)} trees through our reforestation micro-grants.` },
  { min: 15,  max: 9999, emoji: '✨',  icon: Sparkles, text: (v) => `Funds a full week of community meals for ${Math.round(v / 2)} families.` },
];

export const getImpact = (donation) =>
  IMPACT_THRESHOLDS.find((t) => donation >= t.min && donation < t.max) || IMPACT_THRESHOLDS.at(-1);

export const INITIAL_LEDGER = [
  { id: 1,  source: 'Shell Station #402',        type: 'fuel',   amount: 1.14,   time: 2,   location: 'Downtown' },
  { id: 2,  source: 'Grace Fellowship Church',   type: 'church', amount: 450.00, time: 12,  location: 'Westside' },
  { id: 3,  source: 'BP Station #187',           type: 'fuel',   amount: 0.82,   time: 18,  location: 'Northgate' },
  { id: 4,  source: 'Redeemer Community Church', type: 'church', amount: 125.00, time: 34,  location: 'Midtown' },
  { id: 5,  source: 'TotalEnergies #055',        type: 'fuel',   amount: 2.36,   time: 41,  location: 'Harbor Blvd' },
  { id: 6,  source: "St. Matthew's Parish",      type: 'church', amount: 880.00, time: 53,  location: 'East Quarter' },
  { id: 7,  source: 'Chevron Station #91',       type: 'fuel',   amount: 0.64,   time: 67,  location: 'Sunrise Ave' },
  { id: 8,  source: 'New Life Cathedral',        type: 'church', amount: 210.00, time: 78,  location: 'Central Park' },
];

export const NEW_DONATIONS = [
  { source: 'Shell Station #512',      type: 'fuel',   amount: 1.44, location: 'Uptown' },
  { source: 'Anointed Word Church',    type: 'church', amount: 175,  location: 'South End' },
  { source: 'BP Station #290',         type: 'fuel',   amount: 0.96, location: 'Riverside' },
  { source: 'Harvest Community',       type: 'church', amount: 540,  location: 'West Park' },
  { source: 'TotalEnergies #112',      type: 'fuel',   amount: 2.08, location: 'Old Town' },
  { source: 'Living Water Fellowship', type: 'church', amount: 230,  location: 'Valley Crest' },
];

export const STATIONS_GRID = [
  { name: 'Shell #402',         status: 'active',  city: 'Downtown' },
  { name: 'BP #187',            status: 'active',  city: 'Northgate' },
  { name: 'TotalEnergies #55',  status: 'active',  city: 'Harbor' },
  { name: 'Chevron #91',        status: 'active',  city: 'Sunrise' },
  { name: 'ExxonMobil #228',    status: 'active',  city: 'Metro South' },
  { name: 'Shell #512',         status: 'active',  city: 'Uptown' },
  { name: 'BP #290',            status: 'pending', city: 'Riverside' },
  { name: 'TotalEnergies #112', status: 'active',  city: 'Old Town' },
  { name: 'Mobil #337',         status: 'active',  city: 'Bay Area' },
  { name: 'Shell #611',         status: 'pending', city: 'Eastside' },
  { name: 'Valero #44',         status: 'active',  city: 'Lakeshore' },
  { name: 'BP #503',            status: 'active',  city: 'Midtown' },
];

export const CHURCHES = [
  { name: 'Grace Fellowship',     denom: 'Evangelical',  members: 1200, raised: '$28,400' },
  { name: "St. Matthew's Parish", denom: 'Catholic',     members: 2800, raised: '$91,200' },
  { name: 'New Life Cathedral',   denom: 'Pentecostal',  members: 900,  raised: '$17,650' },
  { name: 'Redeemer Community',   denom: 'Presbyterian', members: 650,  raised: '$14,100' },
  { name: 'Harvest Community',    denom: 'Non-Denom',    members: 1800, raised: '$44,000' },
];

// ─── HOW IT WORKS (GSAP pinned steps) ────────────────────────────────────────
export const STEPS = [
  {
    n: '01',
    title: 'A driver fills up',
    body: 'At any KDCharité-integrated pump, the terminal asks a single question: "Add 2% to help your community?" One tap. No app, no account, no friction.',
    accent: 'emerald',
  },
  {
    n: '02',
    title: 'The levy is verified',
    body: 'Each micro-donation is timestamped, hashed, and written to our public ledger the instant the transaction settles — verifiable by anyone, instantly.',
    accent: 'amber',
  },
  {
    n: '03',
    title: 'Funds pool city-wide',
    body: 'Thousands of 2-cent gifts merge with digitized church tithes into a transparent community fund, allocated to vetted local programs every month.',
    accent: 'emerald',
  },
  {
    n: '04',
    title: 'Impact reaches the street',
    body: 'Food banks restock, mobile clinics roll out, wells get dug. Every donor sees the precise outcome their generosity produced, down to the neighborhood.',
    accent: 'amber',
  },
];

// ─── IMPACT SHOWCASE METRICS ─────────────────────────────────────────────────
export const IMPACT_METRICS = [
  { label: 'Meals served',         value: 482000, suffix: '',  fmt: (n) => Math.round(n).toLocaleString() },
  { label: 'Liters of clean water', value: 1900000, suffix: '', fmt: (n) => Math.round(n).toLocaleString() },
  { label: 'Clinic visits funded', value: 38400,  suffix: '',  fmt: (n) => Math.round(n).toLocaleString() },
  { label: 'Trees planted',        value: 126500, suffix: '',  fmt: (n) => Math.round(n).toLocaleString() },
];

// ─── TESTIMONIALS (Framer carousel) ──────────────────────────────────────────
export const TESTIMONIALS = [
  {
    quote: "I never used to give — I always meant to, but the moment never came. Now every time I fill up, I give. It's automatic, it's tiny, and somehow it adds up to something I'm proud of.",
    name: 'Marcus Adeyemi',
    role: 'Daily commuter, Downtown',
    avatar: '🚗',
  },
  {
    quote: 'Our congregation could never see where the offering went. With KDCharité, every member opens their phone and watches their tithe turn into clinic visits two streets over. Trust changed everything.',
    name: 'Pastor Elaine Boateng',
    role: 'New Life Cathedral',
    avatar: '✝️',
  },
  {
    quote: 'As a station owner I worried it would slow the line. It added zero seconds. My customers love seeing our station on the public board — it became the thing the neighborhood talks about.',
    name: 'Ravi Patel',
    role: 'Owner, Shell #402',
    avatar: '⛽',
  },
  {
    quote: 'The mobile clinic that KDCharité funds caught my daughter\'s pneumonia early. Two cents at a time, from people I\'ll never meet, kept her healthy. I cry thinking about it.',
    name: 'Grace Mwila',
    role: 'Community member, Eastside',
    avatar: '💚',
  },
];

// ─── TIMELINE / MILESTONES (GSAP ScrollTrigger) ──────────────────────────────
export const MILESTONES = [
  { year: '2022', title: 'The first 2%', body: 'KDCharité launches with three pilot stations and one partner church in a single metro neighborhood.' },
  { year: '2023', title: 'The ledger goes public', body: 'We open-source the transparency ledger. Donations cross $250K as 40 stations join the network.' },
  { year: '2024', title: 'Faith network forms', body: 'The digital tithe portal launches; 120 congregations digitize their giving in the first quarter.' },
  { year: '2025', title: 'City-scale', body: '1,800+ stations and 300+ churches across 28 metro regions. The fund clears $1M raised.' },
  { year: '2026', title: 'Open platform', body: 'KDCharité opens its API so any merchant or cause can plug into the micro-donation rail.' },
];

// ─── TEAM ────────────────────────────────────────────────────────────────────
export const TEAM = [
  { name: 'Kalala Daniella', role: 'Founder & Executive Director', avatar: '👩🏾‍💼', bio: 'Former community health organizer who believed generosity just needed less friction.' },
  { name: 'Jonah Reyes',     role: 'Head of Engineering',          avatar: '👨🏽‍💻', bio: 'Built the public ledger and the POS integration SDK from the ground up.' },
  { name: 'Amara Okonkwo',   role: 'Director of Partnerships',     avatar: '👩🏿‍🤝‍👨🏽', bio: 'Brings the fuel networks and faith communities to the same table.' },
  { name: 'Thomas Vermeer',  role: 'Head of Impact & Reporting',   avatar: '👨🏼‍🔬', bio: 'Turns raw donation flows into verified, neighborhood-level outcomes.' },
];

// ─── FAQ (Framer accordion) ──────────────────────────────────────────────────
export const FAQS = [
  { q: 'Is the 2% mandatory?', a: 'Never. It is always opt-in, prompted once per transaction with a single tap. Drivers can decline with no penalty and no nagging.' },
  { q: 'Where does my money actually go?', a: '100% of every donation reaches the community fund — KDCharité\'s own operations are grant-funded. The fund is allocated monthly to independently vetted local programs, and every cent is traceable on our public ledger.' },
  { q: 'How do I know it\'s real?', a: 'Each donation is hashed and written to a public, append-only ledger the moment it settles. We undergo an annual independent CPA audit and publish 990-ready reports anyone can inspect.' },
  { q: 'Can my church join?', a: 'Yes. Any congregation can request access to the digital tithe portal — mobile giving pages, QR codes, and a per-member impact dashboard, all under your own brand. Onboarding takes under a week.' },
  { q: 'Is my donation tax-deductible?', a: 'KDCharité is a registered 501(c)(3). Donations are tax-deductible to the extent permitted by law, and you receive an annual consolidated receipt.' },
  { q: 'What does it cost a fuel station to participate?', a: 'Nothing. The SDK embeds into major pump management systems with no hardware changes, and there are no fees. Stations receive a branded monthly impact report for community display.' },
];
