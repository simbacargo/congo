// Seamless infinite logo marquee. The track is duplicated and translated -50%
// via the `.marquee-track` keyframe so the loop is perfectly continuous.

const BRANDS = [
  'Shell', 'BP', 'TotalEnergies', 'Chevron', 'ExxonMobil', 'Valero',
  'Mobil', 'Grace Fellowship', "St. Matthew's", 'New Life Cathedral', 'Harvest Community',
];

export default function Marquee() {
  const row = [...BRANDS, ...BRANDS];
  return (
    <section className="py-10 border-y border-white/5 overflow-hidden relative">
      {/* Edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-[#0a0f0d] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-[#0a0f0d] to-transparent pointer-events-none" />
      <div className="marquee-track">
        {row.map((b, i) => (
          <span
            key={i}
            className="mx-8 text-lg font-bold text-white/15 hover:text-emerald-400/60 transition-colors tracking-widest uppercase whitespace-nowrap"
          >
            {b}
          </span>
        ))}
      </div>
    </section>
  );
}
