// ─── CONTENT / DATA ──────────────────────────────────────────────────────────
// Structural seed data for the marketing site. Display copy lives in the locale
// files (src/locales/*.json) and is zipped in by index inside each component;
// only language-neutral data (numbers, emojis, ids, proper nouns) stays here.

// Impact tiers for the calculator. `id` maps to calculator.impact.<id> in the
// locales; `count` computes the interpolated number the sentence needs.
export const IMPACT_THRESHOLDS = [
  { min: 0,   max: 0.5,  emoji: '❤️',  id: 'seed',        count: () => 0 },
  { min: 0.5, max: 1,    emoji: '💧',  id: 'water',       count: (v) => Math.round(v * 14) },
  { min: 1,   max: 2,    emoji: '🍽️',  id: 'meals',       count: (v) => Math.round(v * 2) },
  { min: 2,   max: 4,    emoji: '🍽️',  id: 'mealsSchool', count: (v) => Math.round(v * 2) },
  { min: 4,   max: 8,    emoji: '🏥',  id: 'clinic',      count: () => 0 },
  { min: 8,   max: 15,   emoji: '🌱',  id: 'trees',       count: (v) => Math.round(v * 3) },
  { min: 15,  max: 9999, emoji: '✨',  id: 'families',    count: (v) => Math.round(v / 2) },
];

export const getImpact = (donation) =>
  IMPACT_THRESHOLDS.find((t) => donation >= t.min && donation < t.max) || IMPACT_THRESHOLDS.at(-1);

// Ledger entries — Lubumbashi (DR Congo) stations, churches and quartiers.
// Proper nouns and USD figures stay as-is; UI labels are localized.
export const INITIAL_LEDGER = [
  { id: 1,  source: 'TotalEnergies #402',              type: 'fuel',   amount: 1.14,   time: 2,   location: 'Kampemba' },
  { id: 2,  source: 'Église Méthodiste Unie',          type: 'church', amount: 450.00, time: 12,  location: 'Katuba' },
  { id: 3,  source: 'Engen #187',                      type: 'fuel',   amount: 0.82,   time: 18,  location: 'Kenya' },
  { id: 4,  source: 'Nouvelle Cité de David',          type: 'church', amount: 125.00, time: 34,  location: 'Kamalondo' },
  { id: 5,  source: 'Puma #055',                       type: 'fuel',   amount: 2.36,   time: 41,  location: 'Ruashi' },
  { id: 6,  source: 'Cathédrale Saints Pierre et Paul',type: 'church', amount: 880.00, time: 53,  location: 'Centre-ville' },
  { id: 7,  source: 'Cobil #91',                       type: 'fuel',   amount: 0.64,   time: 67,  location: 'Golf' },
  { id: 8,  source: 'Centre Évangélique Shalom',       type: 'church', amount: 210.00, time: 78,  location: 'Bel-Air' },
];

export const NEW_DONATIONS = [
  { source: 'TotalEnergies #512',       type: 'fuel',   amount: 1.44, location: 'Gambela' },
  { source: 'Église Kimbanguiste',      type: 'church', amount: 175,  location: 'Annexe' },
  { source: 'Engen #290',               type: 'fuel',   amount: 0.96, location: 'Kigoma' },
  { source: 'Centre Évangélique Shalom',type: 'church', amount: 540,  location: 'Makomeno' },
  { source: 'Puma #112',                type: 'fuel',   amount: 2.08, location: 'Industriel' },
  { source: 'Assemblée de Dieu',        type: 'church', amount: 230,  location: 'Ruashi' },
];

export const STATIONS_GRID = [
  { name: 'TotalEnergies #402', status: 'active',  city: 'Kampemba' },
  { name: 'Engen #187',         status: 'active',  city: 'Katuba' },
  { name: 'Puma #055',          status: 'active',  city: 'Kenya' },
  { name: 'Cobil #91',          status: 'active',  city: 'Kamalondo' },
  { name: 'SEP Congo #228',     status: 'active',  city: 'Ruashi' },
  { name: 'TotalEnergies #512', status: 'active',  city: 'Golf' },
  { name: 'Engen #290',         status: 'pending', city: 'Bel-Air' },
  { name: 'Puma #112',          status: 'active',  city: 'Gambela' },
  { name: 'Cobil #337',         status: 'active',  city: 'Kigoma' },
  { name: 'TotalEnergies #611', status: 'pending', city: 'Industriel' },
  { name: 'Mining Oil #44',     status: 'active',  city: 'Annexe' },
  { name: 'Engen #503',         status: 'active',  city: 'Makomeno' },
];

// `denom` is a key into the `denominations` map in the locales.
export const CHURCHES = [
  { name: 'Cathédrale Saints Pierre et Paul', denom: 'Catholic',    members: 2800, raised: '$91,200' },
  { name: 'Église Méthodiste Unie',           denom: 'Methodist',   members: 1200, raised: '$28,400' },
  { name: 'Nouvelle Cité de David',           denom: 'Pentecostal', members: 900,  raised: '$17,650' },
  { name: 'Église Kimbanguiste Lubumbashi',   denom: 'Kimbanguist', members: 650,  raised: '$14,100' },
  { name: 'Centre Évangélique Shalom',        denom: 'Evangelical', members: 1800, raised: '$44,000' },
];

// How-it-works steps — copy comes from howItWorks.steps[i]; accent is style only.
export const STEPS = [
  { n: '01', accent: 'red' },
  { n: '02', accent: 'amber' },
  { n: '03', accent: 'red' },
  { n: '04', accent: 'amber' },
];

// Impact metrics — labels come from impactShowcase.metrics[i].
export const IMPACT_METRICS = [
  { value: 482000,  fmt: (n) => Math.round(n).toLocaleString() },
  { value: 1900000, fmt: (n) => Math.round(n).toLocaleString() },
  { value: 38400,   fmt: (n) => Math.round(n).toLocaleString() },
  { value: 126500,  fmt: (n) => Math.round(n).toLocaleString() },
];

// Testimonials — quote + role come from testimonials.items[i].
export const TESTIMONIALS = [
  { name: 'Patrick Mwamba',       avatar: '🚗' },
  { name: 'Pasteur Esther Numbi', avatar: '✝️' },
  { name: 'Joseph Kabwe',         avatar: '⛽' },
  { name: 'Grâce Mujinga',        avatar: '💚' },
];

// Timeline milestones — title + body come from timeline.items[i].
export const MILESTONES = [
  { year: '2022' },
  { year: '2023' },
  { year: '2024' },
  { year: '2025' },
  { year: '2026' },
];

// Team — role + bio come from team.members[i].
export const TEAM = [
  { name: 'Kalala Daniella', avatar: '👩🏾‍💼' },
  { name: 'Patrick Ilunga',  avatar: '👨🏿‍💻' },
  { name: 'Esther Banza',    avatar: '👩🏿‍💼' },
  { name: 'David Tshibangu', avatar: '👨🏿‍🔬' },
];
