import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Globe as GlobeIcon, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useSpring as useRSpring } from '@react-spring/web';
import { useTranslation } from 'react-i18next';
import { gsap } from '../lib/anim.jsx';
import { SectionHeader, Rich } from './ui.jsx';

// ─── 3D NETWORK GLOBE ────────────────────────────────────────────────────────
// One scene, four animation engines:
//   • Three.js      — the WebGL globe (point cloud + great-circle "donation" arcs)
//   • React Spring  — pointer position springs the globe's tilt with real physics
//   • GSAP/ScrollT. — scrubs the globe's spin + scale across the section scroll
//   • Framer Motion — reveals the canvas + heading on enter (see <Reveal>/motion)

const EMERALD = new THREE.Color('#34d399');
const AMBER = new THREE.Color('#fbbf24');
const RADIUS = 100;

// Evenly distribute N points on a sphere (Fibonacci lattice) → no clustering.
function fibonacciSphere(n, radius) {
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    pts.push(
      new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius),
    );
  }
  return pts;
}

// A soft round sprite so points render as glowing dots instead of hard squares.
function makeDotTexture() {
  const s = 64;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

// Great-circle arc between two surface points, bowed outward above the sphere.
function arcPoints(a, b, lift = 0.25, segments = 48) {
  const va = a.clone().normalize();
  const vb = b.clone().normalize();
  const out = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = new THREE.Vector3().copy(va).lerp(vb, t).normalize();
    // Lift the middle of the arc the most for a satellite-hop look.
    const bow = 1 + Math.sin(t * Math.PI) * lift;
    out.push(p.multiplyScalar(RADIUS * bow));
  }
  return out;
}

function buildGlobe(reduced) {
  const group = new THREE.Group();

  // — Point cloud — mostly emerald, a scatter of amber "hub" nodes.
  const surface = fibonacciSphere(2600, RADIUS);
  const positions = new Float32Array(surface.length * 3);
  const colors = new Float32Array(surface.length * 3);
  surface.forEach((p, i) => {
    positions.set([p.x, p.y, p.z], i * 3);
    const c = Math.random() < 0.12 ? AMBER : EMERALD;
    colors.set([c.r, c.g, c.b], i * 3);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const dotTex = makeDotTexture();
  const mat = new THREE.PointsMaterial({
    size: 2.4,
    map: dotTex,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  group.add(new THREE.Points(geo, mat));

  // — Wireframe shell — a faint emerald sphere for volume behind the dots.
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(RADIUS * 0.985, 3),
    new THREE.MeshBasicMaterial({
      color: EMERALD,
      wireframe: true,
      transparent: true,
      opacity: 0.04,
    }),
  );
  group.add(shell);

  // — "Donation flow" arcs — lines that draw on, hold, then reset, staggered.
  const arcs = [];
  const arcCount = reduced ? 6 : 14;
  for (let i = 0; i < arcCount; i++) {
    const a = surface[(Math.random() * surface.length) | 0];
    const b = surface[(Math.random() * surface.length) | 0];
    const pts = arcPoints(a, b, 0.18 + Math.random() * 0.22);
    const ag = new THREE.BufferGeometry().setFromPoints(pts);
    const am = new THREE.LineBasicMaterial({
      color: Math.random() < 0.5 ? EMERALD : AMBER,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const line = new THREE.Line(ag, am);
    line.geometry.setDrawRange(0, 0);
    arcs.push({ line, total: pts.length, offset: Math.random() * Math.PI * 2 });
    group.add(line);
  }

  return { group, arcs, disposables: [geo, mat, dotTex, shell.geometry, shell.material] };
}

export default function Globe() {
  const mountRef = useRef(null);
  const reduced = useReducedMotion();
  const { t } = useTranslation();

  // React Spring: pointer-driven tilt target, smoothed by spring physics.
  const [tilt, tiltApi] = useRSpring(() => ({
    x: 0,
    y: 0,
    config: { tension: 120, friction: 30 },
  }));

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 2000);
    camera.position.set(0, 0, 320);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const { group, arcs, disposables } = buildGlobe(reduced);
    group.rotation.z = 0.32; // slight axial tilt, like a real globe
    scene.add(group);

    // GSAP ScrollTrigger: a proxy whose values are scrubbed by scroll position,
    // then applied to the group each frame (kept inside a context for cleanup).
    const scrollProxy = { spin: 0, scale: 0.82 };
    const ctx = gsap.context(() => {
      gsap.to(scrollProxy, {
        spin: Math.PI * 1.1,
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: mount,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }, mount);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // Pointer → spring target (normalized -1..1 around the canvas centre).
    const onMove = (e) => {
      const r = mount.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      tiltApi.start({ x: ny * 0.35, y: nx * 0.5 });
    };
    if (!reduced) mount.addEventListener('pointermove', onMove);

    const clock = new THREE.Clock();
    let raf = 0;
    let spin = 0;

    const renderFrame = () => {
      const dt = clock.getDelta();
      const t = clock.elapsedTime;

      if (!reduced) spin += dt * 0.12;

      // Compose rotation: auto-spin + scroll scrub + spring tilt (read live).
      group.rotation.y = spin + scrollProxy.spin + tilt.y.get();
      group.rotation.x = 0.1 + tilt.x.get();
      const s = scrollProxy.scale;
      group.scale.setScalar(s);

      // Animate the arcs "drawing" — progress loops, staggered by offset.
      if (!reduced) {
        arcs.forEach((a) => {
          const phase = (Math.sin(t * 0.5 + a.offset) + 1) / 2; // 0..1
          a.line.geometry.setDrawRange(0, Math.floor(phase * a.total));
          a.line.material.opacity = 0.25 + phase * 0.45;
        });
      } else {
        arcs.forEach((a) => a.line.geometry.setDrawRange(0, a.total));
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(renderFrame);
    };
    renderFrame();

    return () => {
      cancelAnimationFrame(raf);
      ctx.revert();
      ro.disconnect();
      mount.removeEventListener('pointermove', onMove);
      arcs.forEach((a) => {
        a.line.geometry.dispose();
        a.line.material.dispose();
      });
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  return (
    <section id="network" className="relative py-28 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/15 to-transparent pointer-events-none" />
      <div className="max-w-6xl mx-auto relative">
        <SectionHeader
          badge={t('globe.badge')}
          badgeIcon={GlobeIcon}
          title={<Rich k="globe.title" />}
          sub={t('globe.sub')}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative glass rounded-3xl border-glow overflow-hidden"
        >
          {/* Three.js mounts its canvas here. */}
          <div
            ref={mountRef}
            className="w-full h-[440px] md:h-[560px] cursor-grab active:cursor-grabbing"
          />

          {/* Framer-revealed legend overlay, layered above the canvas. */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute bottom-5 left-5 flex flex-wrap items-center gap-4 text-xs pointer-events-none"
          >
            <span className="flex items-center gap-2 text-white/55">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              {t('globe.stations')}
            </span>
            <span className="flex items-center gap-2 text-white/55">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
              {t('globe.congregations')}
            </span>
            <span className="flex items-center gap-2 text-white/40">
              <Sparkles size={12} className="text-emerald-400" /> {t('globe.motion')}
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
