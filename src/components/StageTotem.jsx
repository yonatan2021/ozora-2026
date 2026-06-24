import { memo } from 'react';

function StageTotem({ stage, size = 28, className = '' }) {
  const getSvgContent = () => {
    switch (stage) {
      case 'OZORA STAGE':
        return (
          <g className="totem-ozora" stroke="currentColor" fill="none" strokeWidth="1.5">
            {/* The Third Eye */}
            <path d="M 2 12 C 6 6, 18 6, 22 12 C 18 18, 6 18, 2 12 Z" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            {/* Radiating Rays */}
            <line x1="12" y1="2" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="22" />
            <line x1="2" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="22" y2="12" />
            {/* Spiritual spirals */}
            <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />
          </g>
        );
      case 'PUMPUI':
        return (
          <g className="totem-pumpui" stroke="currentColor" fill="none" strokeWidth="1.5" id="pumpui-speaker">
            {/* Pulsing Speaker Mandala */}
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="7" />
            <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.2" />
            <polygon points="12,5 18,17 6,17" strokeWidth="1" strokeDasharray="2 1" />
            <polygon points="12,19 18,7 6,7" strokeWidth="1" strokeDasharray="2 1" />
          </g>
        );
      case 'THE DOME':
        return (
          <g className="totem-dome" stroke="currentColor" fill="none" strokeWidth="1.5">
            {/* Geodesic Dome */}
            <path d="M 2 20 A 10 10 0 0 1 22 20 Z" />
            <line x1="2" y1="20" x2="22" y2="20" />
            <line x1="12" y1="10" x2="12" y2="20" />
            <line x1="12" y1="10" x2="2" y2="20" />
            <line x1="12" y1="10" x2="22" y2="20" />
            <line x1="6" y1="15" x2="18" y2="15" />
            <circle cx="12" cy="10" r="1.5" fill="currentColor" />
          </g>
        );
      case 'DRAGON NEST / COOKING GROOVE':
      case 'DRAGON NEST':
        return (
          <g className="totem-dragon" stroke="currentColor" fill="none" strokeWidth="1.5">
            {/* Tribal Leaf & Fire Spiral */}
            <path d="M 12 2 C 18 8, 18 16, 12 22 C 6 16, 6 8, 12 2 Z" />
            <path d="M 12 6 C 14 9, 14 13, 12 18" />
            <path d="M 12 18 C 10 15, 10 11, 12 6" />
            {/* Swirling energy */}
            <path d="M 12 10 Q 15 12, 12 14 T 12 10" fill="currentColor" fillOpacity="0.3" />
          </g>
        );
      case 'VISIUM GARDEN':
        return (
          <g className="totem-visium" stroke="currentColor" fill="none" strokeWidth="1.5">
            {/* Prism Tetrahedron */}
            <polygon points="12,2 22,18 2,18" />
            <line x1="12" y1="2" x2="12" y2="12" />
            <line x1="22" y1="18" x2="12" y2="12" />
            <line x1="2" y1="18" x2="12" y2="12" />
            <circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.4" />
          </g>
        );
      case 'TEK ZERO (2000s Trance)':
      case 'TEK ZERO':
        return (
          <g className="totem-tekzero" stroke="currentColor" fill="none" strokeWidth="1.5">
            {/* Cosmic Retro Portal / Star */}
            <circle cx="12" cy="12" r="9" />
            <polygon points="12,3 15,9 21,12 15,15 12,21 9,15 3,12 9,9" fill="currentColor" fillOpacity="0.1" />
            <circle cx="12" cy="12" r="3" />
          </g>
        );
      default:
        return (
          <g className="totem-all" stroke="currentColor" fill="none" strokeWidth="1.5">
            {/* Flower of Life Central Motif */}
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="7" r="5" />
            <circle cx="12" cy="17" r="5" />
            <circle cx="7" cy="12" r="5" />
            <circle cx="17" cy="12" r="5" />
          </g>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`stage-totem-svg ${className}`}
      aria-hidden="true"
    >
      {getSvgContent()}
    </svg>
  );
}

export default memo(StageTotem);
