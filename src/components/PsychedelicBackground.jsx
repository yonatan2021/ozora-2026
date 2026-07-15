import { useRef, useEffect, useCallback } from 'react';

const BLOB_COUNT = 7;
const BASE_RADIUS = 180;
const PARTICLE_COUNT = 50;

function hslToString(h, s, l, a = 1) {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

function initParticles(w, h, count = 120) {
  return Array.from({ length: count }, () => ({
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

export default function PsychedelicBackground({ themeClass, selectedStage = 'ALL' }) {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const blobs = useRef([]);
  const particles = useRef([]);
  const animFrame = useRef(null);
  const isDark = themeClass === 'theme-night' || themeClass === 'theme-sunset' || themeClass === 'theme-sunrise';

  const stageRef = useRef(selectedStage);
  const isDarkRef = useRef(isDark);

  stageRef.current = selectedStage;
  isDarkRef.current = isDark;

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
        particles.current = initParticles(window.innerWidth, window.innerHeight, 120);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const onPointerMove = (e) => {
      const touch = e.touches ? e.touches[0] : e;
      if (!touch || !window.innerWidth || !window.innerHeight) return;
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
      if (!w || !h) {
        animFrame.current = requestAnimationFrame(draw);
        return;
      }
      const mx = mouse.current.x * w;
      const my = mouse.current.y * h;

      const currentStage = stageRef.current;
      const currentIsDark = isDarkRef.current;

      ctx.clearRect(0, 0, w, h);

      // Define stage configurations inside draw loop
      let particleMultiplier = 1;
      let particleSpeedMultiplier = 1;
      let activeSaturation = currentIsDark ? 85 : 90;
      let activeLightness = currentIsDark ? 55 : 60;
      let activeAlpha = currentIsDark ? 0.22 : 0.20;

      // Adjust visuals per stage
      if (currentStage === 'OZORA STAGE') {
        activeAlpha = currentIsDark ? 0.35 : 0.28;
        activeSaturation = 100;
        particleMultiplier = 2;
        particleSpeedMultiplier = 2.2;
      } else if (currentStage === 'PUMPUI') {
        activeAlpha = currentIsDark ? 0.28 : 0.22;
        particleSpeedMultiplier = 1.5;
      } else if (currentStage === 'THE DOME') {
        activeAlpha = currentIsDark ? 0.16 : 0.12;
        particleSpeedMultiplier = 0.3;
      } else if (currentStage === 'DRAGON NEST / COOKING GROOVE' || currentStage === 'DRAGON NEST') {
        activeAlpha = currentIsDark ? 0.30 : 0.25;
        particleSpeedMultiplier = 0.8;
      }

      // Draw grid elements for PUMPUI
      if (currentStage === 'PUMPUI') {
        ctx.strokeStyle = currentIsDark ? 'rgba(0, 255, 200, 0.04)' : 'rgba(0, 200, 150, 0.03)';
        ctx.lineWidth = 0.8;
        const gridSize = 40;
        ctx.beginPath();
        for (let x = 0; x < w; x += gridSize) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
        }
        for (let y = 0; y < h; y += gridSize) {
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
        }
        ctx.stroke();
      }

      // Draw scanlines for TEK ZERO
      if (currentStage === 'TEK ZERO (2000s Trance)' || currentStage === 'TEK ZERO') {
        ctx.strokeStyle = currentIsDark ? 'rgba(255, 0, 255, 0.05)' : 'rgba(200, 0, 200, 0.03)';
        ctx.lineWidth = 1;
        const scanlineSpacing = 8;
        const offset = Math.floor(time * 20) % scanlineSpacing;
        ctx.beginPath();
        for (let y = offset; y < h; y += scanlineSpacing) {
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
        }
        ctx.stroke();
      }

      // --- Blobs layer (vivid, psychedelic) ---
      const blobsLength = blobs.current.length;
      for (let i = 0; i < blobsLength; i++) {
        const blob = blobs.current[i];
        if (!blob) continue;

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

        let hue = (blob.baseHue + blob.hueShift + time * 5) % 360;

        // Stage color overwrites
        if (currentStage === 'OZORA STAGE') {
          hue = (310 + Math.sin(time * 0.33 + blob.phase) * 40) % 360;
        } else if (currentStage === 'PUMPUI') {
          hue = (145 + Math.sin(time * 0.33 + blob.phase) * 35) % 360;
        } else if (currentStage === 'THE DOME') {
          hue = (210 + Math.sin(time * 0.33 + blob.phase) * 20) % 360;
        } else if (currentStage === 'DRAGON NEST / COOKING GROOVE' || currentStage === 'DRAGON NEST') {
          hue = (35 + Math.cos(time * 0.33 + blob.phase) * 25) % 360;
        } else if (currentStage === 'VISIUM GARDEN') {
          hue = (70 + Math.sin(time * 0.33 + blob.phase) * 30) % 360;
        } else if (currentStage === 'TEK ZERO (2000s Trance)' || currentStage === 'TEK ZERO') {
          hue = (280 + Math.sin(time * 0.33 + blob.phase) * 40) % 360;
        }

        const breathe = 1 + Math.sin(time * 1.2 + blob.phase) * 0.18;
        const r = blob.radius * breathe;

        const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, r);
        grad.addColorStop(0, hslToString(hue, activeSaturation, activeLightness, activeAlpha));
        grad.addColorStop(0.4, hslToString((hue + 30) % 360, activeSaturation - 10, activeLightness - 5, activeAlpha * 0.6));
        grad.addColorStop(1, hslToString(hue, activeSaturation, activeLightness, 0));

        ctx.beginPath();
        ctx.arc(blob.x, blob.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // --- Particles layer (fireflies / stars) ---
      const activeParticleCount = Math.min(120, Math.floor(PARTICLE_COUNT * particleMultiplier));
      for (let i = 0; i < activeParticleCount; i++) {
        const p = particles.current[i];
        if (!p) continue;

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

        let dyDrift = 0;
        if (currentStage === 'DRAGON NEST / COOKING GROOVE' || currentStage === 'DRAGON NEST') {
          dyDrift = -0.3; // embers drift upwards
        }

        p.x += (p.vx + Math.sin(time * 0.6 + p.twinklePhase) * 0.2) * particleSpeedMultiplier;
        p.y += (p.vy + Math.cos(time * 0.35 + p.twinklePhase) * 0.12 + dyDrift) * particleSpeedMultiplier;

        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        const twinkle = 0.3 + Math.sin(time * p.twinkleSpeed + p.twinklePhase) * 0.35 + 0.35;
        let pHue = (p.hue + time * 3) % 360;

        if (currentStage === 'OZORA STAGE') {
          pHue = 50; // golden sparks
        } else if (currentStage === 'DRAGON NEST / COOKING GROOVE' || currentStage === 'DRAGON NEST') {
          pHue = (15 + Math.sin(time * 1 + p.twinklePhase) * 10) % 360; // embers
        }

        const pAlpha = currentIsDark ? twinkle * 0.85 : twinkle * 0.5;
        const glowSize = p.size * (currentIsDark ? 4 : 2.5);

        const pGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
        pGrad.addColorStop(0, hslToString(pHue, 95, currentIsDark ? 80 : 70, pAlpha));
        pGrad.addColorStop(0.3, hslToString(pHue, 85, currentIsDark ? 65 : 55, pAlpha * 0.5));
        pGrad.addColorStop(1, hslToString(pHue, 70, 50, 0));

        ctx.beginPath();
        ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = pGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = hslToString(pHue, 100, currentIsDark ? 92 : 85, pAlpha * 1.4);
        ctx.fill();
      }

      animFrame.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrame.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
    };
  }, [initBlobs]);

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
