import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Fuel, Church, Heart, DollarSign, Users, MapPin,
  TrendingUp, Shield, Globe, Mail, Phone, ChevronRight,
  Droplets, Utensils, Activity, Zap, Star, ArrowRight,
  Share2, Rss, Send, Link2, Leaf,
  Building2, HandHeart, Sparkles, Clock, CheckCircle2,
  BarChart3, Eye, Lock, ChevronDown, Menu, X
} from 'lucide-react';

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const IMPACT_THRESHOLDS = [
  { min: 0,   max: 0.5,  icon: Heart,    emoji: '❤️',  text: (v) => `Sparks the first step — your change seeds hope.` },
  { min: 0.5, max: 1,    icon: Droplets, emoji: '💧',  text: (v) => `${Math.round(v * 14)} days of clean water for a child in need.` },
  { min: 1,   max: 2,    icon: Utensils, emoji: '🍽️',  text: (v) => `${Math.round(v * 2)} hot meals served to a struggling family.` },
  { min: 2,   max: 4,    icon: Utensils, emoji: '🍽️',  text: (v) => `${Math.round(v * 2)} hot meals + 1 day of school supplies for a child.` },
  { min: 4,   max: 8,    icon: Activity, emoji: '🏥',  text: (v) => `One mobile clinic consultation for an uninsured patient.` },
  { min: 8,   max: 15,   icon: Leaf,     emoji: '🌱',  text: (v) => `Plants ${Math.round(v * 3)} trees through our reforestation micro-grants.` },
  { min: 15,  max: 9999, icon: Sparkles, emoji: '✨',  text: (v) => `Funds a full week of community meals for ${Math.round(v / 2)} families.` },
];

const getImpact = (donation) =>
  IMPACT_THRESHOLDS.find((t) => donation >= t.min && donation < t.max) || IMPACT_THRESHOLDS.at(-1);

const INITIAL_LEDGER = [
  { id: 1,  source: 'Shell Station #402',          type: 'fuel',    amount: 1.14,   time: 2,   location: 'Downtown' },
  { id: 2,  source: 'Grace Fellowship Church',     type: 'church',  amount: 450.00, time: 12,  location: 'Westside' },
  { id: 3,  source: 'BP Station #187',             type: 'fuel',    amount: 0.82,   time: 18,  location: 'Northgate' },
  { id: 4,  source: 'Redeemer Community Church',   type: 'church',  amount: 125.00, time: 34,  location: 'Midtown' },
  { id: 5,  source: 'TotalEnergies #055',          type: 'fuel',    amount: 2.36,   time: 41,  location: 'Harbor Blvd' },
  { id: 6,  source: "St. Matthew's Parish",        type: 'church',  amount: 880.00, time: 53,  location: 'East Quarter' },
  { id: 7,  source: 'Chevron Station #91',         type: 'fuel',    amount: 0.64,   time: 67,  location: 'Sunrise Ave' },
  { id: 8,  source: 'New Life Cathedral',          type: 'church',  amount: 210.00, time: 78,  location: 'Central Park' },
  { id: 9,  source: 'ExxonMobil #228',             type: 'fuel',    amount: 1.90,   time: 89,  location: 'Metro South' },
  { id: 10, source: 'Calvary Chapel Network',      type: 'church',  amount: 325.00, time: 104, location: 'Lakeside' },
];

const NEW_DONATIONS = [
  { source: 'Shell Station #512',     type: 'fuel',   amount: 1.44, location: 'Uptown' },
  { source: 'Anointed Word Church',   type: 'church', amount: 175, location: 'South End' },
  { source: 'BP Station #290',        type: 'fuel',   amount: 0.96, location: 'Riverside' },
  { source: 'Harvest Community',      type: 'church', amount: 540, location: 'West Park' },
  { source: 'TotalEnergies #112',     type: 'fuel',   amount: 2.08, location: 'Old Town' },
  { source: 'Living Water Fellowship',type: 'church', amount: 230, location: 'Valley Crest' },
];

const STATIONS_GRID = [
  { name: 'Shell #402',       status: 'active',  city: 'Downtown' },
  { name: 'BP #187',          status: 'active',  city: 'Northgate' },
  { name: 'TotalEnergies #55',status: 'active',  city: 'Harbor' },
  { name: 'Chevron #91',      status: 'active',  city: 'Sunrise' },
  { name: 'ExxonMobil #228',  status: 'active',  city: 'Metro South' },
  { name: 'Shell #512',       status: 'active',  city: 'Uptown' },
  { name: 'BP #290',          status: 'pending', city: 'Riverside' },
  { name: 'TotalEnergies #112', status: 'active', city: 'Old Town' },
  { name: 'Mobil #337',       status: 'active',  city: 'Bay Area' },
  { name: 'Shell #611',       status: 'pending', city: 'Eastside' },
  { name: 'Valero #44',       status: 'active',  city: 'Lakeshore' },
  { name: 'BP #503',          status: 'active',  city: 'Midtown' },
];

// ─── ANIMATED COUNTER ────────────────────────────────────────────────────────

function AnimatedCounter({ target, prefix = '', suffix = '', decimals = 0, duration = 2200 }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    let localTarget = target;
    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * localTarget);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.floor(display).toLocaleString();

  return (
    <span>
      {prefix}{formatted}{suffix}
    </span>
  );
}

// ─── LIVE COUNTERS TICKER ────────────────────────────────────────────────────

function LiveCounters() {
  const [funds, setFunds]       = useState(1_284_532);
  const [churches, setChurches] = useState(312);
  const [stations, setStations] = useState(1_847);

  useEffect(() => {
    const t = setInterval(() => {
      setFunds((f) => f + Math.floor(Math.random() * 85 + 15));
      if (Math.random() < 0.04) setChurches((c) => c + 1);
      if (Math.random() < 0.06) setStations((s) => s + 1);
    }, 1800);
    return () => clearInterval(t);
  }, []);

  const stats = [
    {
      label: 'Total Funds Raised',
      value: funds,
      prefix: '$',
      suffix: '',
      decimals: 0,
      icon: DollarSign,
      color: 'text-emerald-400',
      glow: 'rgba(16,185,129,0.25)',
      sub: 'Since January 2022',
    },
    {
      label: 'Partner Churches',
      value: churches,
      prefix: '',
      suffix: '+',
      decimals: 0,
      icon: Church,
      color: 'text-amber-400',
      glow: 'rgba(251,191,36,0.22)',
      sub: 'Across 14 denominations',
    },
    {
      label: 'Participating Fuel Stations',
      value: stations,
      prefix: '',
      suffix: '',
      decimals: 0,
      icon: Fuel,
      color: 'text-emerald-300',
      glow: 'rgba(110,231,183,0.2)',
      sub: 'In 28 metro regions',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="glass rounded-2xl p-6 group hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden"
          style={{ boxShadow: `0 0 32px ${s.glow}` }}
        >
          <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 pointer-events-none" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl glass-emerald flex items-center justify-center">
              <s.icon size={18} className={s.color} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium uppercase tracking-widest">Live</span>
            </div>
          </div>
          <div className={`text-3xl font-bold tracking-tight ${s.color} mb-1`}>
            <AnimatedCounter
              target={s.value}
              prefix={s.prefix}
              suffix={s.suffix}
              decimals={s.decimals}
              duration={2000}
            />
          </div>
          <div className="text-sm font-semibold text-white/80 mb-1">{s.label}</div>
          <div className="text-xs text-white/40">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── FUEL CALCULATOR ─────────────────────────────────────────────────────────

function FuelCalculator() {
  const [spending, setSpending] = useState(80);
  const [prevImpact, setPrevImpact] = useState(null);
  const [animKey, setAnimKey]     = useState(0);

  const donation = (spending * 0.02).toFixed(2);
  const monthly  = (spending * 4 * 0.02).toFixed(2);
  const yearly   = (spending * 52 * 0.02).toFixed(2);
  const impact   = getImpact(parseFloat(donation));

  const handleChange = useCallback((e) => {
    const val = Number(e.target.value);
    setSpending(val);
    setAnimKey((k) => k + 1);
  }, []);

  const pct = ((spending - 20) / (200 - 20)) * 100;

  return (
    <section id="calculator" className="py-28 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/20 to-transparent pointer-events-none" />
      <div className="max-w-5xl mx-auto relative">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 glass-emerald rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-5">
            <Zap size={12} /> Impact Simulator
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            See What Your Fill-Up<br />
            <span className="text-gradient">Really Fuels</span>
          </h2>
          <p className="text-white/55 text-lg max-w-xl mx-auto">
            Move the slider to match your weekly fuel spend. Watch in real-time as your optional 2% becomes something life-changing for someone nearby.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">

          {/* Slider Card */}
          <div className="glass rounded-3xl p-8 border-glow">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-white/60 text-sm font-medium">Weekly fuel spend</span>
              <span className="text-3xl font-bold text-white">${spending}</span>
            </div>

            <div className="relative mb-8">
              <div
                className="absolute top-0 left-0 h-[6px] rounded-l-full bg-gradient-to-r from-emerald-600 to-emerald-400 pointer-events-none"
                style={{ width: `${pct}%`, marginTop: '0px' }}
              />
              <input
                type="range"
                min={20}
                max={200}
                step={5}
                value={spending}
                onChange={handleChange}
                className="w-full relative z-10"
              />
              <div className="flex justify-between text-xs text-white/30 mt-2">
                <span>$20</span><span>$200</span>
              </div>
            </div>

            {/* Donation Breakdown */}
            <div className="space-y-3">
              {[
                { label: 'Per fill-up donation', value: `$${donation}`, highlight: true },
                { label: 'Monthly contribution', value: `$${monthly}` },
                { label: 'Annual impact',        value: `$${yearly}` },
              ].map((row) => (
                <div
                  key={row.label}
                  className={`flex justify-between items-center rounded-xl px-4 py-3 ${
                    row.highlight ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-white/[0.03]'
                  }`}
                >
                  <span className="text-sm text-white/60">{row.label}</span>
                  <span className={`text-lg font-bold ${row.highlight ? 'text-emerald-400' : 'text-white'}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-white/30">
              <CheckCircle2 size={12} className="text-emerald-500" />
              Opt-in at the pump. No app needed. Zero friction.
            </div>
          </div>

          {/* Impact Card */}
          <div className="glass-emerald rounded-3xl p-8 flex flex-col justify-between">
            <div>
              <div className="text-xs text-emerald-400 uppercase tracking-widest font-semibold mb-6">
                Your ${donation} translates to…
              </div>

              <div key={animKey} className="animate-slide-up-fade">
                <div className="text-6xl mb-5">{impact.emoji}</div>
                <p className="text-2xl font-bold text-white leading-snug mb-4">
                  {impact.text(parseFloat(donation))}
                </p>
                <p className="text-sm text-white/50 leading-relaxed">
                  Every 2 cents on the dollar flows directly to vetted local programs — food banks, mobile health units, and clean-water micro-projects — with full ledger transparency.
                </p>
              </div>
            </div>

            {/* Annual visual */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="text-xs text-white/40 mb-3">If the whole city joined — at avg. $60/wk</div>
              <div className="flex items-end gap-1">
                {[30,45,55,70,80,95,100].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-gradient-to-t from-emerald-700 to-emerald-400 opacity-80 transition-all duration-500"
                    style={{ height: `${h * 0.5}px` }}
                  />
                ))}
              </div>
              <div className="text-xs text-emerald-400 font-semibold mt-2">
                ~$124,000 raised per week. City-wide.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── ECOSYSTEM SECTION ────────────────────────────────────────────────────────

function Ecosystem() {
  const [active, setActive] = useState('fuel');

  return (
    <section id="ecosystem" className="py-28 px-4">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 glass-emerald rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-5">
            <Globe size={12} /> Our Ecosystem
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Two Networks.<br />
            <span className="text-gradient">One Mission.</span>
          </h2>
          <p className="text-white/55 text-lg max-w-lg mx-auto">
            KDCharité bridges the intersection of commerce and faith — turning routine transactions into recurring acts of generosity.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 glass rounded-2xl p-1.5 w-fit mx-auto mb-12">
          {[
            { key: 'fuel',   label: 'The Fuel Network',  icon: Fuel },
            { key: 'faith',  label: 'The Faith Network', icon: Church },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                active === tab.key
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {active === 'fuel' && (
          <div key="fuel" className="animate-slide-up-fade grid md:grid-cols-2 gap-10 items-start">
            <div>
              <h3 className="text-3xl font-bold text-white mb-5 leading-tight">
                Frictionless giving at the pump — no app, no wallet.
              </h3>
              <p className="text-white/55 leading-relaxed mb-7">
                When drivers pay at a KDCharité-integrated terminal, a single screen prompt asks: <em className="text-emerald-400 not-italic font-semibold">"Add 2% to help your community?"</em> One tap. Done. The micro-donation is processed with the transaction — transparent, instant, and verifiable on our public ledger.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Zap,        title: 'Real-Time POS Integration',  desc: 'Native SDK embedded in major pump management systems — no hardware changes needed.' },
                  { icon: Shield,     title: 'Zero-Fee Model',             desc: '100% of every 2% reaches the community fund. KDCharité operations are grant-funded.' },
                  { icon: BarChart3,  title: 'Monthly Impact Reports',     desc: 'Every participating station receives a branded impact summary for community display.' },
                ].map((f) => (
                  <div key={f.title} className="flex gap-4 glass rounded-xl p-4 group hover:border-emerald-500/30 transition-all">
                    <div className="w-10 h-10 rounded-xl glass-emerald flex items-center justify-center flex-shrink-0 mt-0.5">
                      <f.icon size={16} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white mb-0.5">{f.title}</div>
                      <div className="text-xs text-white/45 leading-relaxed">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Station Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-white/40 uppercase tracking-widest">Live Partner Stations</span>
                <span className="text-xs text-emerald-400 font-semibold">{STATIONS_GRID.filter(s => s.status === 'active').length} Active</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {STATIONS_GRID.map((s) => (
                  <div
                    key={s.name}
                    className={`glass rounded-xl p-3 text-center group hover:scale-105 transition-transform duration-200 ${
                      s.status === 'active' ? 'border-emerald-500/20' : 'opacity-50'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mx-auto mb-2 ${s.status === 'active' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-amber-400'}`} />
                    <div className="text-[11px] font-semibold text-white/80 leading-tight">{s.name}</div>
                    <div className="text-[10px] text-white/35 mt-0.5">{s.city}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-4 text-xs text-white/35">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Active</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Onboarding</span>
              </div>
            </div>
          </div>
        )}

        {active === 'faith' && (
          <div key="faith" className="animate-slide-up-fade grid md:grid-cols-2 gap-10 items-start">
            <div>
              <h3 className="text-3xl font-bold text-white mb-5 leading-tight">
                Amplifying ancient generosity with modern accountability.
              </h3>
              <p className="text-white/55 leading-relaxed mb-7">
                Traditional tithing is powerful — but often opaque. KDCharité gives every congregation a digital platform to collect, allocate, and publicly report exactly how their community's faith-giving flows into tangible local outcomes. Members see the full story.
              </p>

              <div className="space-y-4">
                {[
                  { icon: HandHeart,  title: 'Digital Tithe Portal',     desc: 'Mobile-friendly giving pages, QR codes, and Sunday offering digitization — all under your church brand.' },
                  { icon: Eye,        title: 'Donor Impact Dashboard',    desc: 'Every congregant has a personal dashboard showing exactly how their giving has moved the needle.' },
                  { icon: Lock,       title: 'Compliance & Trust Layer',  desc: 'Automated 990-ready reporting. Auditable by your board, your donors, and the public.' },
                ].map((f) => (
                  <div key={f.title} className="flex gap-4 glass rounded-xl p-4 hover:border-amber-500/25 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <f.icon size={16} className="text-amber-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white mb-0.5">{f.title}</div>
                      <div className="text-xs text-white/45 leading-relaxed">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Church Stats */}
            <div className="glass rounded-3xl p-7">
              <div className="text-xs text-white/40 uppercase tracking-widest mb-6">Partner Faith Communities</div>
              <div className="space-y-3">
                {[
                  { name: 'Grace Fellowship',      denom: 'Evangelical',     members: 1200, raised: '$28,400' },
                  { name: "St. Matthew's Parish", denom: 'Catholic',        members: 2800, raised: '$91,200' },
                  { name: 'New Life Cathedral',    denom: 'Pentecostal',     members: 900,  raised: '$17,650' },
                  { name: 'Redeemer Community',    denom: 'Presbyterian',    members: 650,  raised: '$14,100' },
                  { name: 'Harvest Community',     denom: 'Non-Denom',       members: 1800, raised: '$44,000' },
                ].map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3 glass rounded-xl p-3 hover:border-amber-500/20 transition-all group">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-base">
                      ✝️
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{c.name}</div>
                      <div className="text-xs text-white/35">{c.denom} · {c.members.toLocaleString()} members</div>
                    </div>
                    <div className="text-sm font-bold text-amber-400 text-right">
                      {c.raised}
                      <div className="text-[10px] text-white/30 font-normal">raised YTD</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-5 border-t border-white/10 flex justify-between items-center">
                <span className="text-xs text-white/40">+ 307 more communities</span>
                <button className="text-xs text-amber-400 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                  Join the network <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── LIVE DONATION LEDGER ────────────────────────────────────────────────────

function DonationLedger() {
  const [entries, setEntries] = useState(INITIAL_LEDGER);
  const [nextId, setNextId]   = useState(100);
  const nextDonorRef          = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      const donor = NEW_DONATIONS[nextDonorRef.current % NEW_DONATIONS.length];
      nextDonorRef.current += 1;
      setNextId((id) => {
        const newEntry = {
          id,
          ...donor,
          time: 0,
          isNew: true,
        };
        setEntries((prev) => {
          const updated = [newEntry, ...prev.slice(0, 11)].map((e, i) => ({
            ...e,
            time: i === 0 ? 0 : e.time,
            isNew: i === 0 && e.id === newEntry.id,
          }));
          return updated;
        });
        return id + 1;
      });
    }, 4500);
    return () => clearInterval(t);
  }, []);

  const fmtTime = (mins) => {
    if (mins === 0) return 'just now';
    if (mins < 60)  return `${mins} min ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <section id="ledger" className="py-28 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/15 to-transparent pointer-events-none" />
      <div className="max-w-4xl mx-auto relative">

        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 glass-emerald rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-5">
            <Activity size={12} /> Transparency Ledger
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Every Cent, <span className="text-gradient">Publicly Visible</span>
          </h2>
          <p className="text-white/55 text-lg max-w-lg mx-auto">
            Radical transparency isn't a feature — it's our foundation. Watch the network breathe in real time.
          </p>
        </div>

        <div className="glass rounded-3xl overflow-hidden border-glow">
          {/* Header bar */}
          <div className="px-6 py-4 border-b border-white/08 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-amber-500/70" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <span className="text-xs text-white/40 font-medium">kdcharite.org / live-ledger</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE STREAM
            </div>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-12 px-6 py-3 text-[11px] text-white/25 uppercase tracking-widest border-b border-white/05">
            <span className="col-span-1">Type</span>
            <span className="col-span-4">Source</span>
            <span className="col-span-3">Location</span>
            <span className="col-span-2 text-right">Amount</span>
            <span className="col-span-2 text-right">Time</span>
          </div>

          {/* Entries */}
          <div className="max-h-[460px] overflow-y-auto">
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className={`grid grid-cols-12 items-center px-6 py-4 border-b border-white/05 transition-all duration-500 hover:bg-white/[0.025] ${
                  entry.isNew ? 'animate-ledger-slide bg-emerald-500/05' : ''
                }`}
              >
                {/* Type icon */}
                <div className="col-span-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    entry.type === 'fuel'
                      ? 'bg-emerald-500/15 border border-emerald-500/25'
                      : 'bg-amber-500/15 border border-amber-500/25'
                  }`}>
                    {entry.type === 'fuel'
                      ? <Fuel size={13} className="text-emerald-400" />
                      : <Church size={13} className="text-amber-400" />}
                  </div>
                </div>

                {/* Source */}
                <div className="col-span-4 pl-1">
                  <div className="text-sm font-semibold text-white/90 leading-tight">{entry.source}</div>
                  <div className={`text-[11px] font-medium mt-0.5 ${entry.type === 'fuel' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {entry.type === 'fuel' ? '2% Opt-in' : 'Weekly Tithe'}
                  </div>
                </div>

                {/* Location */}
                <div className="col-span-3 flex items-center gap-1.5">
                  <MapPin size={11} className="text-white/25 flex-shrink-0" />
                  <span className="text-sm text-white/45 truncate">{entry.location}</span>
                </div>

                {/* Amount */}
                <div className="col-span-2 text-right">
                  <span className={`text-sm font-bold ${entry.amount < 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    +${entry.amount.toFixed(2)}
                  </span>
                </div>

                {/* Time */}
                <div className="col-span-2 text-right">
                  <span className="text-[11px] text-white/30 flex items-center justify-end gap-1">
                    <Clock size={10} />
                    {fmtTime(entry.time)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white/[0.02] flex items-center justify-between">
            <span className="text-xs text-white/30">Showing last 12 transactions · All amounts verified on-chain</span>
            <button className="text-xs text-emerald-400 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              Full ledger <ArrowRight size={11} />
            </button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            { icon: Shield,     label: 'Audited Annually',    sub: 'Independent CPA review' },
            { icon: Lock,       label: '256-bit Encrypted',   sub: 'Bank-grade security' },
            { icon: CheckCircle2, label: '501(c)(3) Registered', sub: 'EIN 88-0123456' },
          ].map((b) => (
            <div key={b.label} className="glass rounded-xl p-4 flex items-center gap-3">
              <b.icon size={18} className="text-emerald-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-white/80">{b.label}</div>
                <div className="text-[11px] text-white/35">{b.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const links = [
    { label: 'How It Works', href: '#ecosystem' },
    { label: 'Calculator',   href: '#calculator' },
    { label: 'Live Ledger',  href: '#ledger' },
    { label: 'About',        href: '#about' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'glass-dark py-3 shadow-xl shadow-black/20' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-900/50">
            <Heart size={15} className="text-white" fill="white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            KD<span className="text-emerald-400">Charité</span>
          </span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-white/55 hover:text-white transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a href="#partner" className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2">
            Partner With Us
          </a>
          <a
            href="#donate"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-900/40 hover:shadow-emerald-900/60 hover:-translate-y-0.5"
          >
            <Heart size={13} fill="currentColor" /> Donate Now
          </a>
        </div>

        <button
          className="md:hidden text-white/60 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden glass-dark border-t border-white/08 px-6 py-5 space-y-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block text-sm text-white/70 hover:text-white py-1"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#donate"
            className="flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl w-fit"
          >
            <Heart size={13} fill="currentColor" /> Donate Now
          </a>
        </div>
      )}
    </nav>
  );
}

// ─── HERO SECTION ────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center px-4 overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950" />
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-[100px] animate-float" />
      <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-[90px] animate-float" style={{ animationDelay: '3s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-emerald-500/05 rounded-full animate-spin-slow pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-emerald-500/08 rounded-full animate-spin-slow pointer-events-none" style={{ animationDuration: '14s', animationDirection: 'reverse' }} />

      {/* Floating micro-circles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-emerald-400/40"
          style={{
            top:  `${15 + i * 10}%`,
            left: `${10 + i * 11}%`,
            animation: `float ${4 + i * 0.8}s ease-in-out infinite`,
            animationDelay: `${i * 0.6}s`,
          }}
        />
      ))}

      <div className="relative max-w-7xl mx-auto w-full pt-32 pb-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: Copy */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="glass-emerald rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                A New Model of Giving
              </span>
              <span className="text-xs text-white/30">Est. 2022</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
              Small Changes.<br />
              <span className="text-gradient">Massive Impact.</span>
            </h1>

            <p className="text-xl text-white/55 leading-relaxed mb-4 max-w-lg">
              Turning everyday fuel purchases and Sunday offerings into city-wide community relief — through a seamless 2% micro-donation at the point of sale.
            </p>
            <p className="text-sm text-white/35 leading-relaxed mb-10 max-w-md">
              Zero friction. Full transparency. Powered by churches, fuel stations, and the quiet generosity of ordinary people.
            </p>

            <div className="flex flex-wrap gap-4 mb-14">
              <a
                href="#donate"
                className="group flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-7 py-3.5 rounded-2xl transition-all duration-200 shadow-xl shadow-emerald-900/50 hover:shadow-emerald-900/70 hover:-translate-y-0.5"
              >
                <Heart size={17} fill="currentColor" />
                Start Giving
                <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#ecosystem"
                className="flex items-center gap-2.5 glass hover:border-emerald-500/40 text-white font-semibold px-7 py-3.5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
              >
                How It Works
                <ChevronDown size={15} />
              </a>
            </div>

            {/* Partner logos ticker */}
            <div className="flex items-center gap-3 text-xs text-white/25 mb-3">
              <span className="h-px flex-1 bg-white/08" />
              <span>Trusted by</span>
              <span className="h-px flex-1 bg-white/08" />
            </div>
            <div className="flex items-center gap-6 overflow-hidden">
              {['Shell', 'BP', 'TotalEnergies', 'Chevron', 'ExxonMobil', 'Valero'].map((brand) => (
                <span key={brand} className="text-xs font-bold text-white/20 tracking-widest uppercase whitespace-nowrap flex-shrink-0">
                  {brand}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Live counters + visual */}
          <div className="space-y-6">
            <LiveCounters />

            {/* Mini mission card */}
            <div className="glass rounded-2xl p-6 border-glow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={20} className="text-amber-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white mb-1">The 2% Principle</div>
                  <p className="text-xs text-white/45 leading-relaxed">
                    If just 10,000 drivers in a metro area donate 2% of their weekly $60 fill-up, that's <span className="text-emerald-400 font-semibold">$624,000 per year</span> — enough to feed 3,000 families for an entire month.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-float">
        <span className="text-xs text-white/25 tracking-widest uppercase">Scroll to explore</span>
        <ChevronDown size={16} className="text-white/25" />
      </div>
    </section>
  );
}

// ─── ABOUT / MISSION STRIP ──────────────────────────────────────────────────

function MissionStrip() {
  const pillars = [
    { icon: Fuel,       color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', title: 'Fuel Micro-Donations', desc: '2% opt-in at POS terminals across our partner network. No app. No account needed.' },
    { icon: Church,     color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',    title: 'Faith-Based Giving',   desc: 'Digitizing Sunday collections and amplifying their reach into verified local programs.' },
    { icon: HandHeart,  color: 'text-emerald-300', bg: 'bg-emerald-400/10 border-emerald-400/20', title: 'Verified Impact',       desc: 'Every dollar tracked, every outcome reported. Donors see the precise change they made.' },
    { icon: Globe,      color: 'text-amber-300',   bg: 'bg-amber-400/10 border-amber-400/20',    title: 'City-Scale Change',     desc: 'We think in neighborhoods, act in cities. Our model scales without losing local context.' },
  ];

  return (
    <section id="about" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Why <span className="text-gradient">KDCharité</span> Works
          </h2>
          <p className="text-white/50 text-lg max-w-lg mx-auto">
            Most people want to give. They just need the friction removed and the trust established.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="glass rounded-2xl p-6 group hover:border-emerald-500/25 hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-11 h-11 rounded-xl border ${p.bg} flex items-center justify-center mb-5`}>
                <p.icon size={20} className={p.color} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{p.title}</h3>
              <p className="text-sm text-white/45 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────

function Footer() {
  const year = new Date().getFullYear();

  const cols = [
    {
      title: 'Programs',
      links: ['Fuel Network', 'Faith Network', 'Community Grants', 'Impact Reports', 'Apply for Funding'],
    },
    {
      title: 'Partners',
      links: ['Fuel Station Partners', 'Church Partners', 'Corporate Partners', 'Become a Partner', 'Partner Portal'],
    },
    {
      title: 'Organization',
      links: ['About KDCharité', 'Leadership Team', 'Annual Report', 'Press & Media', 'Careers'],
    },
  ];

  return (
    <footer className="relative pt-20 pb-10 px-4 border-t border-white/08">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-950/20 pointer-events-none" />
      <div className="max-w-7xl mx-auto relative">

        <div className="grid lg:grid-cols-5 gap-12 mb-16">
          {/* Brand col */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-900/50">
                <Heart size={16} className="text-white" fill="white" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                KD<span className="text-emerald-400">Charité</span>
              </span>
            </div>
            <p className="text-sm text-white/45 leading-relaxed mb-7 max-w-xs">
              Turning the world's everyday transactions into a continuous engine of community relief — 2 cents at a time, at scale.
            </p>

            {/* Contact */}
            <div className="space-y-3 mb-7">
              {[
                { icon: Phone, text: '+1 (555) 019-2834' },
                { icon: Mail,  text: 'impact@kdcharite.org' },
                { icon: MapPin, text: '742 Philanthropy Way, Suite 200\nMetro City, MC 90210' },
              ].map((c) => (
                <div key={c.text} className="flex items-start gap-3">
                  <c.icon size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-white/50 whitespace-pre-line leading-relaxed">{c.text}</span>
                </div>
              ))}
            </div>

            {/* Social */}
            <div className="flex gap-2">
              {[
                { icon: Share2, label: 'Facebook' },
                { icon: Rss,    label: 'Twitter/X' },
                { icon: Send,   label: 'Instagram' },
                { icon: Link2,  label: 'LinkedIn' },
              ].map((s) => (
                <button
                  key={s.label}
                  aria-label={s.label}
                  className="w-9 h-9 glass rounded-xl flex items-center justify-center hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all duration-200 group"
                >
                  <s.icon size={14} className="text-white/40 group-hover:text-emerald-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-5">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-white/40 hover:text-emerald-400 transition-colors duration-200">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/08 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-white/25 text-center md:text-left">
            © {year} KDCharité, Inc. All rights reserved. · Registered 501(c)(3) · EIN 88-0123456
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs text-white/25">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Accessibility'].map((l) => (
              <a key={l} href="#" className="hover:text-white/50 transition-colors">{l}</a>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-white/15 mt-4 leading-relaxed max-w-2xl">
          Disclaimer: KDCharité operates as a registered 501(c)(3) nonprofit. All fuel station 2% opt-in programs are subject to participating merchant agreements. Donations are non-refundable and tax-deductible to the extent permitted by law. Individual impact equivalencies are illustrative estimates based on program average costs. Past performance of community impact does not guarantee future results.
        </p>
      </div>
    </footer>
  );
}

// ─── ROOT APP ────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0f0d]">
      <Navbar />
      <Hero />
      <MissionStrip />
      <FuelCalculator />
      <Ecosystem />
      <DonationLedger />
      <Footer />
    </div>
  );
}
