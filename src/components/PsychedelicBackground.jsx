import { useRef, useEffect, useCallback } from 'react';

const BLOB_COUNT = 7;
const BASE_RADIUS = 180;
const PARTICLE_COUNT = 50;

function hslToString(h, s, l, a = 1) {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

function initParticles(w, h) {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4 - 0.1,
    size: 1.5 + Math.random() * 3,
    hue: Math.random() * 360,
    twinklePhase: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.4 + Math.random() * 1.8,
  }));
}

export default function PsychedelicBackground({ themeClass }) {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const blobs = useRef([]);
  const particles = useRef([]);
  const animFrame = useRef(null);
  const isDark = themeClass === 'theme-night' || themeClass === 'theme-sunset' || themeClass === 'theme-sunrise';

  const initBlobs = useCallback((w, h) => {
    const hues = [0, 50, 120, 180, 240, 300, 30];
    blobs.current = hues.map((hue, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      baseHue: hue,
      hueShift: 0,
      radius: BASE_RADIUS + Math.random() * 100,
      phase: (i / BLOB_COUNT) * Math.PI * 2,
    }));
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (blobs.current.length === 0) {
        initBlobs(window.innerWidth, window.innerHeight);
      }
      if (particles.current.length === 0) {
        particles.current = initParticles(window.innerWidth, window.innerHeight);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const onPointerMove = (e) => {
      const touch = e.touches ? e.touches[0] : e;
      mouse.current.x = touch.clientX / window.innerWidth;
      mouse.current.y = touch.clientY / window.innerHeight;
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: true });

    let time = 0;

    const draw = () => {
      time += 0.008;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mx = mouse.current.x * w;
      const my = mouse.current.y * h;

      ctx.clearRect(0, 0, w, h);

      // --- Blobs layer (vivid, psychedelic) ---
      blobs.current.forEach((blob) => {
        const dx = mx - blob.x;
        const dy = my - blob.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pull = Math.min(dist, 300) / 300;

        blob.vx += dx * 0.00015 * pull;
        blob.vy += dy * 0.00015 * pull;
        blob.vx *= 0.985;
        blob.vy *= 0.985;
        blob.x += blob.vx + Math.sin(time + blob.phase) * 0.7;
        blob.y += blob.vy + Math.cos(time * 0.7 + blob.phase) * 0.7;

        if (blob.x < -250) blob.x = w + 250;
        if (blob.x > w + 250) blob.x = -250;
        if (blob.y < -250) blob.y = h + 250;
        if (blob.y > h + 250) blob.y = -250;

        blob.hueShift = Math.sin(time * 0.5 + blob.phase) * 40;

        const hue = (blob.baseHue + blob.hueShift + time * 15) % 360;
        const breathe = 1 + Math.sin(time * 1.2 + blob.phase) * 0.18;
        const r = blob.radius * breathe;
        const saturation = isDark ? 85 : 90;
        const lightness = isDark ? 55 : 60;
        const alpha = isDark ? 0.22 : 0.20;

        const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, r);
        grad.addColorStop(0, hslToString(hue, saturation, lightness, alpha));
        grad.addColorStop(0.4, hslToString((hue + 30) % 360, saturation - 10, lightness - 5, alpha * 0.6));
        grad.addColorStop(1, hslToString(hue, saturation, lightness, 0));

        ctx.beginPath();
        ctx.arc(blob.x, blob.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // --- Particles layer (fireflies / stars) ---
      particles.current.forEach((p) => {
        const pdx = mx - p.x;
        const pdy = my - p.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);

        if (pdist < 180) {
          const repel = (180 - pdist) / 180;
          p.vx -= (pdx / pdist) * repel * 0.1;
          p.vy -= (pdy / pdist) * repel * 0.1;
        }

        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx + Math.sin(time * 0.6 + p.twinklePhase) * 0.2;
        p.y += p.vy + Math.cos(time * 0.35 + p.twinklePhase) * 0.12;

        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        const twinkle = 0.3 + Math.sin(time * p.twinkleSpeed + p.twinklePhase) * 0.35 + 0.35;
        const pHue = (p.hue + time * 10) % 360;
        const pAlpha = isDark ? twinkle * 0.85 : twinkle * 0.5;
        const glowSize = p.size * (isDark ? 4 : 2.5);

        const pGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
        pGrad.addColorStop(0, hslToString(pHue, 95, isDark ? 80 : 70, pAlpha));
        pGrad.addColorStop(0.3, hslToString(pHue, 85, isDark ? 65 : 55, pAlpha * 0.5));
        pGrad.addColorStop(1, hslToString(pHue, 70, 50, 0));

        ctx.beginPath();
        ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = pGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = hslToString(pHue, 100, isDark ? 92 : 85, pAlpha * 1.4);
        ctx.fill();
      });

      animFrame.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrame.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
    };
  }, [isDark, initBlobs]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        mixBlendMode: isDark ? 'screen' : 'normal',
      }}
      aria-hidden="true"
    />
  );
}
