import { memo } from 'react';

function SacredGeometry({ themeClass }) {
  const isDark = themeClass === 'theme-night' || themeClass === 'theme-sunset' || themeClass === 'theme-sunrise';
  const strokeColor = isDark ? 'oklch(0.70 0.15 280 / 0.06)' : 'oklch(0.45 0.12 300 / 0.04)';
  const glowColor = isDark ? 'oklch(0.65 0.20 300 / 0.08)' : 'oklch(0.50 0.15 330 / 0.05)';

  const flowerOfLifeCircles = [];
  const r = 60;
  const cx = 250;
  const cy = 250;

  flowerOfLifeCircles.push({ x: cx, y: cy });
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60) * Math.PI / 180;
    flowerOfLifeCircles.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60) * Math.PI / 180;
    flowerOfLifeCircles.push({
      x: cx + r * 2 * Math.cos(angle),
      y: cy + r * 2 * Math.sin(angle),
    });
  }
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 + 30) * Math.PI / 180;
    flowerOfLifeCircles.push({
      x: cx + r * Math.sqrt(3) * Math.cos(angle),
      y: cy + r * Math.sqrt(3) * Math.sin(angle),
    });
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Top-right flower of life */}
      <svg
        viewBox="0 0 500 500"
        className="sacred-geo sacred-geo-1"
        style={{
          position: 'absolute',
          top: '-5%',
          right: '-5%',
          width: 'clamp(300px, 35vw, 500px)',
          height: 'clamp(300px, 35vw, 500px)',
        }}
      >
        <defs>
          <filter id="geo-glow-1">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#geo-glow-1)">
          {flowerOfLifeCircles.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={r}
              fill="none"
              stroke={i < 7 ? glowColor : strokeColor}
              strokeWidth={i === 0 ? 1 : 0.6}
            />
          ))}
        </g>
      </svg>

      {/* Bottom-left metatron-style */}
      <svg
        viewBox="0 0 400 400"
        className="sacred-geo sacred-geo-2"
        style={{
          position: 'absolute',
          bottom: '5%',
          left: '-8%',
          width: 'clamp(250px, 28vw, 420px)',
          height: 'clamp(250px, 28vw, 420px)',
        }}
      >
        <defs>
          <filter id="geo-glow-2">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#geo-glow-2)">
          {/* Outer hexagon */}
          <polygon
            points={Array.from({ length: 6 }, (_, i) => {
              const angle = (i * 60 - 30) * Math.PI / 180;
              return `${200 + 150 * Math.cos(angle)},${200 + 150 * Math.sin(angle)}`;
            }).join(' ')}
            fill="none"
            stroke={strokeColor}
            strokeWidth="0.6"
          />
          {/* Inner hexagon */}
          <polygon
            points={Array.from({ length: 6 }, (_, i) => {
              const angle = (i * 60) * Math.PI / 180;
              return `${200 + 80 * Math.cos(angle)},${200 + 80 * Math.sin(angle)}`;
            }).join(' ')}
            fill="none"
            stroke={glowColor}
            strokeWidth="0.8"
          />
          {/* Connecting lines (star tetrahedron) */}
          <polygon
            points={Array.from({ length: 3 }, (_, i) => {
              const angle = (i * 120 - 90) * Math.PI / 180;
              return `${200 + 140 * Math.cos(angle)},${200 + 140 * Math.sin(angle)}`;
            }).join(' ')}
            fill="none"
            stroke={strokeColor}
            strokeWidth="0.5"
          />
          <polygon
            points={Array.from({ length: 3 }, (_, i) => {
              const angle = (i * 120 + 30) * Math.PI / 180;
              return `${200 + 140 * Math.cos(angle)},${200 + 140 * Math.sin(angle)}`;
            }).join(' ')}
            fill="none"
            stroke={strokeColor}
            strokeWidth="0.5"
          />
          <circle cx="200" cy="200" r="150" fill="none" stroke={strokeColor} strokeWidth="0.4" />
          <circle cx="200" cy="200" r="80" fill="none" stroke={strokeColor} strokeWidth="0.4" />
          <circle cx="200" cy="200" r="40" fill="none" stroke={glowColor} strokeWidth="0.6" />
        </g>
      </svg>
    </div>
  );
}

export default memo(SacredGeometry);
