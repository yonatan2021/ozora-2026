import { useRef, useEffect, useCallback } from 'react';

const BLOB_COUNT = 6;
const BASE_RADIUS = 180;

function hslToString(h, s, l, a = 1) {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

export default function PsychedelicBackground({ themeClass }) {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const blobs = useRef([]);
  const animFrame = useRef(null);
  const isDark = themeClass === 'theme-night' || themeClass === 'theme-sunset' || themeClass === 'theme-sunrise';

  const initBlobs = useCallback((w, h) => {
    const hues = [0, 60, 120, 180, 270, 330];
    blobs.current = hues.map((hue, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      baseHue: hue,
      hueShift: 0,
      radius: BASE_RADIUS + Math.random() * 80,
      phase: (i / BLOB_COUNT) * Math.PI * 2,
    }));
  }, []);

  useEffect(() => {
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

      blobs.current.forEach((blob) => {
        const dx = mx - blob.x;
        const dy = my - blob.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pull = Math.min(dist, 300) / 300;

        blob.vx += dx * 0.00012 * pull;
        blob.vy += dy * 0.00012 * pull;

        blob.vx *= 0.988;
        blob.vy *= 0.988;

        blob.x += blob.vx + Math.sin(time + blob.phase) * 0.6;
        blob.y += blob.vy + Math.cos(time * 0.7 + blob.phase) * 0.6;

        if (blob.x < -200) blob.x = w + 200;
        if (blob.x > w + 200) blob.x = -200;
        if (blob.y < -200) blob.y = h + 200;
        if (blob.y > h + 200) blob.y = -200;

        blob.hueShift = Math.sin(time * 0.5 + blob.phase) * 40;

        const hue = (blob.baseHue + blob.hueShift + time * 15) % 360;
        const breathe = 1 + Math.sin(time * 1.2 + blob.phase) * 0.15;
        const r = blob.radius * breathe;
        const saturation = isDark ? 85 : 95;
        const lightness = isDark ? 55 : 60;
        const alpha = isDark ? 0.22 : 0.25;

        const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, r);
        grad.addColorStop(0, hslToString(hue, saturation, lightness, alpha));
        grad.addColorStop(0.5, hslToString((hue + 30) % 360, saturation - 10, lightness - 5, alpha * 0.6));
        grad.addColorStop(1, hslToString(hue, saturation, lightness, 0));

        ctx.beginPath();
        ctx.arc(blob.x, blob.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
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
