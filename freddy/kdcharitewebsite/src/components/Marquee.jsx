// Seamless infinite logo marquee. The track is duplicated and translated -50%
// via the `.marquee-track` keyframe so the loop is perfectly continuous.

const BRANDS = [
  'TotalEnergies', 'Engen', 'Puma Energy', 'Cobil', 'SEP Congo', 'Mining Oil',
  'Cathédrale Saints Pierre et Paul', 'Église Méthodiste Unie', 'Nouvelle Cité de David',
  'Centre Évangélique Shalom', 'Église Kimbanguiste',
];

export default function Marquee() {
  const row = [...BRANDS, ...BRANDS];
  return (
    <section className="py-10 border-y border-white/5 overflow-hidden relative">
      {/* Edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-[#0f0a0a] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-[#0f0a0a] to-transparent pointer-events-none" />
      <div className="marquee-track">
        {row.map((b, i) => (
          <span
            key={i}
            className="mx-8 text-lg font-bold text-white/15 hover:text-red-400/60 transition-colors tracking-widest uppercase whitespace-nowrap"
          >
            {b}
          </span>
        ))}
      </div>
    </section>
  );
}
