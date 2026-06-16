import { Workflow } from 'lucide-react';
import { useGsap, gsap } from '../lib/anim.jsx';
import { STEPS } from '../data.js';
import { Badge } from './ui.jsx';

// GSAP ScrollTrigger: the panel column is pinned while the steps advance
// horizontally, and a progress rail fills as you scroll through.

export default function HowItWorks() {
  const scope = useGsap((self, root) => {
    const track = self.selector('[data-track]')[0];
    const panels = self.selector('[data-panel]');
    if (!track || !panels.length) return;

    const totalShift = track.scrollWidth - track.offsetWidth;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: () => `+=${track.scrollWidth}`,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    tl.to(track, { x: -totalShift, ease: 'none' }, 0);
    tl.to('[data-progress]', { scaleX: 1, ease: 'none' }, 0);

    // Fade each panel up to full opacity as it reaches center.
    panels.forEach((p, i) => {
      gsap.fromTo(
        p,
        { opacity: 0.35, scale: 0.94 },
        {
          opacity: 1,
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: () => `top+=${(i / panels.length) * track.scrollWidth - 200} top`,
            end: () => `top+=${(i / panels.length) * track.scrollWidth + 200} top`,
            scrub: true,
          },
        }
      );
    });
  }, []);

  return (
    <section ref={scope} id="how" className="relative h-screen overflow-hidden grain">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-emerald-950/20 to-slate-950" />

      <div className="relative h-full flex flex-col justify-center max-w-7xl mx-auto px-4 w-full">
        <div className="mb-10">
          <div className="mb-4"><Badge icon={Workflow}>How It Works</Badge></div>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            From one tap to <span className="text-gradient">tangible change</span>
          </h2>
          <p className="text-white/45 mt-3 max-w-md">Scroll to follow a single 2-cent donation on its journey through the network.</p>
        </div>

        {/* Progress rail */}
        <div className="relative h-px w-full bg-white/10 mb-10 overflow-hidden">
          <div data-progress className="absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-emerald-500 to-amber-400" />
        </div>

        {/* Horizontal track */}
        <div className="overflow-hidden">
          <div data-track className="flex gap-6 w-max">
            {STEPS.map((s) => (
              <article
                key={s.n}
                data-panel
                className={`w-[80vw] md:w-[440px] flex-shrink-0 glass rounded-3xl p-9 border ${
                  s.accent === 'emerald' ? 'border-emerald-500/20' : 'border-amber-500/20'
                }`}
              >
                <div className={`text-7xl font-black mb-6 ${s.accent === 'emerald' ? 'text-emerald-500/30' : 'text-amber-500/30'}`}>
                  {s.n}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{s.title}</h3>
                <p className="text-white/55 leading-relaxed">{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
