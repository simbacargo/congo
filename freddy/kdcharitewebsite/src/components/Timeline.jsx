import { Milestone } from 'lucide-react';
import { useGsap, gsap } from '../lib/anim.jsx';
import { MILESTONES } from '../data.js';
import { SectionHeader } from './ui.jsx';

// GSAP ScrollTrigger: the vertical spine draws itself as you scroll, and each
// milestone slides in from its side when it enters the viewport.

export default function Timeline() {
  const scope = useGsap((self) => {
    gsap.fromTo(
      self.selector('[data-spine]')[0],
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: self.selector('[data-list]')[0], start: 'top 70%', end: 'bottom 80%', scrub: 1 },
      }
    );

    self.selector('[data-item]').forEach((item) => {
      const fromX = item.dataset.side === 'left' ? -60 : 60;
      gsap.fromTo(
        item,
        { opacity: 0, x: fromX },
        {
          opacity: 1,
          x: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: item, start: 'top 82%' },
        }
      );
    });
  }, []);

  return (
    <section ref={scope} id="journey" className="py-28 px-4 relative">
      <div className="max-w-5xl mx-auto">
        <SectionHeader
          badge="Our Journey"
          badgeIcon={Milestone}
          title={<>From one pump to <span className="text-gradient">a movement</span></>}
          sub="Four years of compounding 2-cent gifts. Here's how the network grew."
        />

        <div data-list className="relative pl-12 md:pl-0">
          {/* Spine */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px md:-translate-x-1/2 bg-white/10">
            <div data-spine className="absolute inset-0 origin-top bg-gradient-to-b from-emerald-500 via-emerald-400 to-amber-400" />
          </div>

          <div className="space-y-10">
            {MILESTONES.map((m, i) => {
              const side = i % 2 === 0 ? 'left' : 'right';
              return (
                <div
                  key={m.year}
                  data-item
                  data-side={side}
                  className={`relative md:w-1/2 ${side === 'right' ? 'md:ml-auto md:pl-10' : 'md:pr-10 md:text-right'}`}
                >
                  {/* Node */}
                  <div
                    className={`absolute top-1.5 -left-[34px] md:left-auto ${side === 'right' ? 'md:-left-[9px]' : 'md:-right-[9px]'} w-4 h-4 rounded-full bg-emerald-400 border-4 border-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.8)]`}
                  />
                  <div className="glass rounded-2xl p-6 hover:border-emerald-500/25 transition-colors">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{m.year}</span>
                    <h3 className="text-lg font-bold text-white mt-1 mb-2">{m.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{m.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
