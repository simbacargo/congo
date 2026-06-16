import { Workflow } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGsap, gsap } from '../lib/anim.jsx';
import { STEPS } from '../data.js';
import { Badge, Rich } from './ui.jsx';

// GSAP ScrollTrigger: the panel column is pinned while the steps advance
// horizontally, and a progress rail fills as you scroll through.

export default function HowItWorks() {
  const { t } = useTranslation();
  const steps = t('howItWorks.steps', { returnObjects: true });
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
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-red-950/20 to-slate-950" />

      <div className="relative h-full flex flex-col justify-center max-w-7xl mx-auto px-4 w-full">
        <div className="mb-10">
          <div className="mb-4"><Badge icon={Workflow}>{t('howItWorks.badge')}</Badge></div>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            <Rich k="howItWorks.title" />
          </h2>
          <p className="text-white/45 mt-3 max-w-md">{t('howItWorks.sub')}</p>
        </div>

        {/* Progress rail */}
        <div className="relative h-px w-full bg-white/10 mb-10 overflow-hidden">
          <div data-progress className="absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-red-500 to-amber-400" />
        </div>

        {/* Horizontal track */}
        <div className="overflow-hidden">
          <div data-track className="flex gap-6 w-max">
            {STEPS.map((s, i) => (
              <article
                key={s.n}
                data-panel
                className={`w-[80vw] md:w-[440px] flex-shrink-0 glass rounded-3xl p-9 border ${
                  s.accent === 'red' ? 'border-red-500/20' : 'border-amber-500/20'
                }`}
              >
                <div className={`text-7xl font-black mb-6 ${s.accent === 'red' ? 'text-red-500/30' : 'text-amber-500/30'}`}>
                  {s.n}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{steps[i].title}</h3>
                <p className="text-white/55 leading-relaxed">{steps[i].body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
