import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Circle, Polyline, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import venueMapData from '../data/venueMap.json';
import { translations } from '../utils/lang';
import { isCacheComplete, calculateTileURLs, prefetchTiles } from '../utils/mapCache';
import {
  requestCurrentPosition,
  startLocationWatch,
  stopLocationWatch,
} from '../utils/navigationPermissions';
import { Crosshair, Navigation, List, MapPin, X, Tent, Sliders } from 'lucide-react';
import CalibrationModal from './CalibrationModal';
import venueTrailsData from '../data/venueTrails.json';
import { calculateBearing, doesSegmentCrossPolygon } from '../utils/mapMath';

const FESTIVAL_WALK_SPEED = 67; // meters per minute (~4 km/h)

const NEARBY_CATEGORIES = [
  { id: 'food', icon: '🍴', label: 'BARS', labelHe: 'אוכל ובר', color: '#ed8936' },
  { id: 'water', icon: '💧', label: 'WATER', labelHe: 'מים', color: '#4299e1' },
  { id: 'toilet', icon: '🚻', label: 'TOILETS', labelHe: 'שירותים', color: '#a0aec0' },
  { id: 'shower', icon: '🚿', label: 'SHOWERS', labelHe: 'מקלחות', color: '#76e4f7' },
  { id: 'camping', icon: '⛺', label: 'CAMPS', labelHe: 'קמפינג', color: '#48bb78' },
  { id: 'stage', icon: '🎵', label: 'STAGES', labelHe: 'במות', color: '#e040a0' },
  { id: 'medical', icon: '➕', label: 'MEDICAL', labelHe: 'עזרה', color: '#e53e3e' },
];

const CATEGORY_SVG = {
  music: '<path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="2" fill="none"/>',
  cross: '<path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="2.5" fill="none"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" stroke="currentColor" stroke-width="2" fill="none"/>',
  droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" stroke="currentColor" stroke-width="2" fill="none"/>',
  'circle-dot': '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  tent: '<path d="M3.5 21 14 3M20.5 21 10 3M2 21h20M8 21l4-10 4 10" stroke="currentColor" stroke-width="2" fill="none"/>',
  'log-in': '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" stroke-width="2" fill="none"/>',
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 9H6l-2.5 2.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="7" cy="17" r="2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="17" cy="17" r="2" stroke="currentColor" stroke-width="2" fill="none"/>',
  info: '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" fill="none"/>'
};

function createMarkerIcon(category, isStage) {
  const size = isStage ? 36 : 26;
  const color = category?.color || '#e040a0';
  const svgPath = CATEGORY_SVG[category?.icon] || CATEGORY_SVG.info;

  return L.divIcon({
    className: 'map-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `<div class="marker-dot ${isStage ? 'marker-stage' : ''}" style="width:${size}px;height:${size}px;background:${color}20;border:2px solid ${color};border-radius:50%;display:flex;align-items:center;justify-content:center;">
      <svg viewBox="0 0 24 24" width="${size * 0.55}" height="${size * 0.55}" style="color:${color}">${svgPath}</svg>
    </div>`
  });
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function formatWalkTime(meters, isHe) {
  const minutes = Math.ceil(meters / FESTIVAL_WALK_SPEED);
  if (minutes > 120) return isHe ? 'רחוק מהפסטיבל' : 'Far from festival';
  return `~${minutes} min`;
}

function isAtFestival(meters) {
  return meters != null && meters < 8000;
}



function useDeviceOrientation() {
  const [heading, setHeading] = useState(null);
  const [permissionState, setPermissionState] = useState('unknown');
  const [calibrating, setCalibrating] = useState(false);

  const requestPermission = useCallback(async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const result = await DeviceOrientationEvent.requestPermission();
        setPermissionState(result);
        if (result === 'granted') setCalibrating(true);
        return result === 'granted';
      } catch {
        setPermissionState('denied');
        return false;
      }
    }
    setPermissionState('granted');
    setCalibrating(true);
    return true;
  }, []);

  useEffect(() => {
    if (permissionState !== 'granted') return;

    let sampleCount = 0;
    const handler = (e) => {
      let h = null;
      if (e.webkitCompassHeading != null) {
        h = e.webkitCompassHeading;
      } else if (e.alpha != null) {
        h = (360 - e.alpha) % 360;
      }
      if (h != null) {
        sampleCount++;
        if (sampleCount > 5) setCalibrating(false);
        setHeading(h);
      }
    };

    window.addEventListener('deviceorientation', handler, true);
    return () => window.removeEventListener('deviceorientation', handler, true);
  }, [permissionState]);

  return { heading, permissionState, calibrating, requestPermission };
}

function CompassCard({
  target,
  userPosition,
  locationStatus,
  lang,
  onClose,
  onRequestLocation,
  pois,
}) {
  const { heading, permissionState, calibrating, requestPermission } = useDeviceOrientation();
  const isHe = lang === 'he';

  const [compassOffset, setCompassOffset] = useState(() => {
    const saved = localStorage.getItem('ozora_compass_offset');
    return saved ? parseFloat(saved) : 0;
  });
  const [showCalPanel, setShowCalPanel] = useState(false);
  const [selectedPoiId, setSelectedPoiId] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const distance = userPosition
    ? haversineDistance(userPosition.lat, userPosition.lng, target.coords[0], target.coords[1])
    : null;

  const bearing = userPosition
    ? calculateBearing(userPosition.lat, userPosition.lng, target.coords[0], target.coords[1])
    : 0;

  const adjustedHeading = heading != null ? (heading + compassOffset + 360) % 360 : null;
  const needleRotation = adjustedHeading != null ? bearing - adjustedHeading : 0;

  const alignmentOptions = useMemo(() => {
    if (!userPosition || !pois) return [];
    return pois
      .map(poi => {
        const dist = haversineDistance(userPosition.lat, userPosition.lng, poi.coords[0], poi.coords[1]);
        const name = poi.id === 'my-camp' 
          ? (isHe ? 'האוהל שלי' : 'My Camp')
          : (poi.type === 'stage' ? poi.name : (isHe ? poi.nameHe : poi.name));
        const bearingToPoi = calculateBearing(userPosition.lat, userPosition.lng, poi.coords[0], poi.coords[1]);
        return { ...poi, name, dist, bearing: bearingToPoi };
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 6);
  }, [userPosition, pois, isHe]);

  useEffect(() => {
    if (alignmentOptions.length > 0 && !selectedPoiId) {
      setSelectedPoiId(alignmentOptions[0].id);
    }
  }, [alignmentOptions, selectedPoiId]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const handleAlign = () => {
    if (heading == null) return;
    const selectedPoi = alignmentOptions.find(p => p.id === selectedPoiId);
    if (!selectedPoi) return;
    const targetBearing = selectedPoi.bearing;
    const newOffset = (targetBearing - heading + 360) % 360;
    setCompassOffset(newOffset);
    localStorage.setItem('ozora_compass_offset', newOffset.toString());
    const displayOffset = Math.round(newOffset > 180 ? newOffset - 360 : newOffset);
    setSuccessMsg(isHe 
      ? `כיוון! היסט של ${displayOffset}° הוחל.` 
      : `Aligned! Offset of ${displayOffset}° applied.`
    );
  };

  const handleReset = () => {
    setCompassOffset(0);
    localStorage.removeItem('ozora_compass_offset');
    setSuccessMsg(isHe ? 'היסט המצפן אופס' : 'Compass offset reset');
  };
  const targetName = target.type === 'stage' ? target.name : (isHe ? target.nameHe : target.name);
  const atFestival = isAtFestival(distance);
  const compassActive = heading != null;
  const needsLocation = !userPosition;

  const locationMessage = (() => {
    if (!needsLocation) return null;
    if (locationStatus === 'requesting') {
      return isHe ? 'מחפש את המיקום שלך...' : 'Finding your location...';
    }
    if (locationStatus === 'denied') {
      return isHe
        ? 'צריך לאפשר מיקום מדויק כדי לחשב מרחק וכיוון.'
        : 'Allow precise location to calculate distance and direction.';
    }
    if (locationStatus === 'unavailable') {
      return isHe
        ? 'המכשיר או הדפדפן לא מספקים מיקום כרגע.'
        : 'Location is not available on this device or browser.';
    }
    return isHe
      ? 'אפשר מיקום כדי לנווט אל היעד גם באופליין.'
      : 'Allow location to navigate to this spot offline.';
  })();

  return (
    <div className={`compass-card ${compassActive ? 'compass-active' : ''}`}>
      <div className="compass-card-header">
        <div className="compass-card-title">
          <Navigation size={16} className="compass-card-icon" />
          <span>{targetName}</span>
        </div>
        <button className="compass-card-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </div>

      <div className={`compass-card-body ${!userPosition ? 'compass-no-gps' : ''}`}>
        <div className="compass-dial">
          <svg viewBox="0 0 160 160" className="compass-dial-svg">
            <defs>
              <radialGradient id="compass-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.12" />
                <stop offset="70%" stopColor="var(--primary)" stopOpacity="0.04" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </radialGradient>
              <filter id="needle-glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {compassActive && <circle cx="80" cy="80" r="72" fill="url(#compass-glow)" />}

            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => (
              <line
                key={deg}
                x1="80" y1={deg % 90 === 0 ? 14 : 18}
                x2="80" y2={deg % 90 === 0 ? 24 : 22}
                stroke={deg % 90 === 0 ? 'var(--text-secondary)' : 'var(--border-strong)'}
                strokeWidth={deg % 90 === 0 ? 2 : 1}
                strokeLinecap="round"
                transform={`rotate(${deg}, 80, 80)`}
                opacity={deg % 90 === 0 ? 0.8 : 0.4}
              />
            ))}

            <circle cx="80" cy="80" r="68" fill="none" stroke="var(--border-strong)" strokeWidth="1" opacity="0.5" />
            <circle cx="80" cy="80" r="46" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.2" />

            <text x="80" y="36" textAnchor="middle" fill="var(--primary)" fontSize="11" fontWeight="800" fontFamily="'Exo 2', sans-serif">N</text>
            <text x="80" y="138" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="600" fontFamily="'Exo 2', sans-serif">S</text>
            <text x="138" y="84" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="600" fontFamily="'Exo 2', sans-serif">E</text>
            <text x="22" y="84" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="600" fontFamily="'Exo 2', sans-serif">W</text>

            {compassActive ? (
              <g transform={`rotate(${needleRotation}, 80, 80)`} className="compass-needle-group">
                <line x1="80" y1="80" x2="80" y2="30" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" filter="url(#needle-glow)" />
                <polygon points="80,26 76,38 84,38" fill="var(--primary)" filter="url(#needle-glow)" />
                <line x1="80" y1="80" x2="80" y2="120" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
                <circle cx="80" cy="80" r="5" fill="var(--primary)" opacity="0.9" />
                <circle cx="80" cy="80" r="2.5" fill="var(--bg)" />
              </g>
            ) : (
              <g opacity="0.2">
                <line x1="80" y1="32" x2="80" y2="128" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="80" cy="80" r="4" fill="var(--text-muted)" />
              </g>
            )}
          </svg>
        </div>

        <div className="compass-info">
          {distance != null && (
            <div className="compass-distance-row">
              <span className="compass-distance-value">{formatDistance(distance)}</span>
              {atFestival && userPosition && (
                <span className="compass-accuracy">±{Math.round(userPosition.accuracy)}m</span>
              )}
            </div>
          )}
          {distance != null && (
            <div className={`compass-walk-time ${!atFestival ? 'compass-far' : ''}`}>
              {formatWalkTime(distance, isHe)}
            </div>
          )}

          {locationMessage && (
            <p className={`compass-location-status ${locationStatus === 'requesting' ? 'is-loading' : ''}`}>
              {locationMessage}
            </p>
          )}

          {needsLocation && locationStatus !== 'requesting' && locationStatus !== 'unavailable' && (
            <button className="compass-enable-btn" onClick={onRequestLocation}>
              <MapPin size={14} />
              <span>{isHe ? 'אפשר מיקום' : 'Allow location'}</span>
            </button>
          )}

          {!needsLocation && permissionState !== 'granted' && (
            <button className="compass-enable-btn" onClick={requestPermission}>
              <Navigation size={14} />
              <span>{isHe ? 'הפעל מצפן' : 'Enable compass'}</span>
            </button>
          )}
          {calibrating && (
            <p className="compass-calibrating">
              {isHe ? 'מכייל מצפן...' : 'Calibrating...'}
            </p>
          )}
          {compassActive && !calibrating && atFestival && (
            <div className="compass-status-active">
              <span className="compass-status-dot" />
              {isHe ? 'מצפן פעיל' : 'Compass active'}
            </div>
          )}
        </div>

        {compassActive && (
          <button 
            className="compass-cal-toggle-btn"
            onClick={() => setShowCalPanel(!showCalPanel)}
          >
            <Sliders size={12} />
            <span>{isHe ? 'כייל מצפן' : 'Calibrate Compass'}</span>
          </button>
        )}

        {showCalPanel && (
          <div className="compass-cal-panel">
            <div className="compass-cal-step">
              <div className="compass-cal-step-title">
                {isHe ? 'שלב 1: כיול חיישן פיזי' : 'Step 1: Physical Sensor Calibration'}
              </div>
              <p className="compass-cal-instructions">
                {isHe 
                  ? 'הנף את המכשיר בתנועת שמיניה באוויר כדי לאפס את מצפן המכשיר.' 
                  : 'Wave your device in a figure-8 pattern to calibrate your phone\'s compass.'}
              </p>
              <svg viewBox="0 0 100 40" className="figure8-svg">
                <path d="M 20 20 C 20 10, 35 10, 50 20 C 65 30, 80 30, 80 20 C 80 10, 65 10, 50 20 C 35 30, 20 30, 20 20 Z" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray="6, 6" />
                <circle r="4" fill="var(--accent)">
                  <animateMotion dur="3s" repeatCount="indefinite" path="M 20 20 C 20 10, 35 10, 50 20 C 65 30, 80 30, 80 20 C 80 10, 65 10, 50 20 C 35 30, 20 30, 20 20 Z" />
                </circle>
              </svg>
            </div>

            <div className="compass-cal-step">
              <div className="compass-cal-step-title">
                {isHe ? 'שלב 2: יישור לפי ציוני דרך' : 'Step 2: Landmark Alignment'}
              </div>
              {!userPosition ? (
                <p className="compass-cal-no-gps">
                  {isHe ? 'כיול לפי ציוני דרך דורש קליטת GPS פעילה.' : 'Landmark alignment requires active GPS.'}
                </p>
              ) : (
                <>
                  <p className="compass-cal-instructions">
                    {isHe 
                      ? 'עמוד מול ציון דרך מוכר, בחר אותו ולחץ על "כיוון".' 
                      : 'Face a known landmark, select it, and click "Align".'}
                  </p>
                  <select 
                    className="compass-cal-select"
                    value={selectedPoiId}
                    onChange={(e) => setSelectedPoiId(e.target.value)}
                  >
                    {alignmentOptions.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.name} ({Math.round(option.dist)}m)
                      </option>
                    ))}
                  </select>
                  <div className="compass-cal-buttons">
                    <button className="compass-cal-btn align-btn" onClick={handleAlign}>
                      {isHe ? 'כיוון' : 'Align'}
                    </button>
                    <button className="compass-cal-btn reset-btn" onClick={handleReset}>
                      {isHe ? 'איפוס' : 'Reset'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {successMsg && (
              <div className="compass-cal-success-msg">
                {successMsg}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MapController({ flyToCoords, onFlyComplete }) {
  const map = useMap();
  useEffect(() => {
    if (flyToCoords) {
      map.flyTo(flyToCoords, 17, { animate: true, duration: 0.5 });
      const timer = setTimeout(() => onFlyComplete?.(), 600);
      return () => clearTimeout(timer);
    }
  }, [flyToCoords, map, onFlyComplete]);
  return null;
}

function MapStateTracker({ onStateChange }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const handleMoveEnd = () => {
      onStateChange?.({
        center: [map.getCenter().lat, map.getCenter().lng],
        zoom: map.getZoom()
      });
    };
    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, onStateChange]);
  return null;
}

function TileCacheOverlay({ lang }) {
  const [progress, setProgress] = useState(null);
  const [done, setDone] = useState(isCacheComplete());
  const attempted = useRef(false);
  const t = translations[lang];

  useEffect(() => {
    if (done || attempted.current) return;
    attempted.current = true;

    const urls = calculateTileURLs(venueMapData.bounds, venueMapData.zoomRange);
    setProgress({ current: 0, total: urls.length });

    prefetchTiles(urls, (current, total) => {
      setProgress({ current, total });
    }).then(() => {
      setDone(true);
      setProgress(null);
    });
  }, [done]);

  if (done || !progress) return null;

  const pct = Math.round((progress.current / progress.total) * 100);
  return (
    <div className="map-download-overlay">
      <div className="map-download-content">
        <p>{t.downloadingMap}</p>
        <div className="map-download-bar">
          <div className="map-download-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="map-download-pct">{pct}%</span>
      </div>
    </div>
  );
}

export default function VenueMap({
  lang,
  timetableData,
  activeStatusMap,
  flyToStageId,
  onFlyToComplete,
  onViewInTimetable,
  savedViewState,
  onViewStateChange,
  onCampChange
}) {
  const t = translations[lang];
  const isHe = lang === 'he';
  const mapRef = useRef(null);

  const [activeCategories, setActiveCategories] = useState(
    () => new Set(venueMapData.categories.map(c => c.id))
  );
  const [userPosition, setUserPosition] = useState(null);
  const [navTarget, setNavTarget] = useState(null);
  const [gpsError, setGpsError] = useState(false);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [locationTracking, setLocationTracking] = useState(false);
  const [viewMode, setViewMode] = useState('nearby'); // 'map' | 'nearby'
  const [nearbyCategory, setNearbyCategory] = useState('food');
  const [compassTarget, setCompassTarget] = useState(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [pois, setPois] = useState(() => {
    const savedCamp = localStorage.getItem('ozora_my_camp');
    if (savedCamp) {
      try {
        const camp = JSON.parse(savedCamp);
        return [...venueMapData.pois, camp];
      } catch (e) {
        console.error("Error loading camp location", e);
      }
    }
    return venueMapData.pois;
  });

  const refreshPois = useCallback(() => {
    const savedCamp = localStorage.getItem('ozora_my_camp');
    if (savedCamp) {
      try {
        const camp = JSON.parse(savedCamp);
        const basePois = venueMapData.pois.filter(p => p.id !== 'my-camp');
        setPois([...basePois, camp]);
        return;
      } catch (e) {
        console.error("Error updating camp POI", e);
      }
    }
    setPois(venueMapData.pois);
  }, []);

  const categoryMap = useMemo(() => {
    const m = {};
    venueMapData.categories.forEach(c => { m[c.id] = c; });
    return m;
  }, []);

  const markerIcons = useMemo(() => {
    const icons = {};
    pois.forEach(poi => {
      const cat = categoryMap[poi.type];
      icons[poi.id] = createMarkerIcon(
        { ...cat, color: poi.color || cat?.color },
        poi.type === 'stage'
      );
    });
    return icons;
  }, [categoryMap, pois]);

  const handlePosition = useCallback((position) => {
    setUserPosition(position);
    setLocationStatus('granted');
    setGpsError(false);
    setShowOnboarding(false);
  }, []);

  useEffect(() => {
    if (!locationTracking) return undefined;
    if (!navigator.geolocation) return undefined;

    const watchId = startLocationWatch(
      navigator.geolocation,
      handlePosition,
      () => {
        setGpsError(true);
        setLocationStatus('denied');
      }
    );

    return () => stopLocationWatch(navigator.geolocation, watchId);
  }, [handlePosition, locationTracking]);

  const requestNavigationLocation = useCallback(async () => {
    setLocationStatus('requesting');
    setGpsError(false);

    try {
      const position = await requestCurrentPosition(navigator.geolocation);
      handlePosition(position);
      setLocationTracking(true);
      return true;
    } catch {
      const nextStatus = navigator.geolocation ? 'denied' : 'unavailable';
      setGpsError(true);
      setLocationStatus(nextStatus);
      setShowOnboarding(true);
      return false;
    }
  }, [handlePosition]);

  const selectCompassTarget = useCallback((poi) => {
    const nextTarget = compassTarget?.id === poi.id ? null : poi;
    setCompassTarget(nextTarget);
    if (nextTarget) {
      setNavTarget(null);
      requestNavigationLocation();
    }
  }, [compassTarget, requestNavigationLocation]);

  const startMapNavigation = useCallback((poi) => {
    setNavTarget(poi.coords);
    setCompassTarget(poi);
    requestNavigationLocation();
  }, [requestNavigationLocation]);

  useEffect(() => {
    // Attempt automatic request on map tab activation
    requestNavigationLocation();
  }, [requestNavigationLocation]);

  useEffect(() => {
    if (flyToStageId && flyToStageId !== 'my-camp') {
      setViewMode('map');
    }
  }, [flyToStageId]);

  // flyTo logic
  const flyToCoords = useMemo(() => {
    if (!flyToStageId) return null;
    const poi = pois.find(
      p => p.stageName === flyToStageId || p.id === flyToStageId
    );
    return poi ? poi.coords : null;
  }, [flyToStageId, pois]);

  useEffect(() => {
    if (flyToStageId === 'my-camp') {
      const campPoi = pois.find(p => p.id === 'my-camp');
      if (campPoi) {
        setCompassTarget(campPoi);
        requestNavigationLocation();
        onFlyToComplete?.();
      }
    }
  }, [flyToStageId, pois, onFlyToComplete, requestNavigationLocation]);

  const toggleCategory = useCallback((catId) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }, []);

  const showAll = useCallback(() => {
    setActiveCategories(new Set(venueMapData.categories.map(c => c.id)));
  }, []);

  const centerOnMe = useCallback(() => {
    if (userPosition && mapRef.current) {
      mapRef.current.flyTo([userPosition.lat, userPosition.lng], 17, { animate: true, duration: 0.3 });
    }
  }, [userPosition]);

  const getStageNowPlaying = useCallback((stageName) => {
    if (!timetableData || !activeStatusMap) return { now: null, next: null };

    const stageSets = timetableData.filter(s => s.stage === stageName);
    const now = stageSets.find(s => activeStatusMap[s.id] === 'active');
    const futureSets = stageSets
      .filter(s => activeStatusMap[s.id] === 'future')
      .sort((a, b) => {
        const aTime = new Date(`${a.date}T${a.start}`).getTime();
        const bTime = new Date(`${b.date}T${b.start}`).getTime();
        return aTime - bTime;
      });
    const next = futureSets[0] || null;

    return { now, next };
  }, [timetableData, activeStatusMap]);

  const filteredPois = useMemo(
    () => pois.filter(poi => activeCategories.has(poi.type)),
    [activeCategories, pois]
  );

  const nearbyByCategory = useMemo(() => {
    const categoryPois = pois.filter(p => p.type === nearbyCategory);
    if (!userPosition) return categoryPois;
    return categoryPois
      .map(poi => ({
        ...poi,
        distance: haversineDistance(userPosition.lat, userPosition.lng, poi.coords[0], poi.coords[1])
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [nearbyCategory, userPosition, pois]);

  const crossedZone = useMemo(() => {
    if (!userPosition) return null;

    const distToCenter = haversineDistance(
      userPosition.lat,
      userPosition.lng,
      venueMapData.center[0],
      venueMapData.center[1]
    );
    if (!isAtFestival(distToCenter)) return null;

    const userPt = [userPosition.lat, userPosition.lng];
    let targetPt = null;

    if (compassTarget) {
      targetPt = compassTarget.coords;
    } else if (navTarget) {
      targetPt = navTarget;
    }

    if (!targetPt) return null;

    for (const zone of venueTrailsData.restrictedZones) {
      if (doesSegmentCrossPolygon(userPt, targetPt, zone.coords)) {
        return zone;
      }
    }
    return null;
  }, [userPosition, compassTarget, navTarget]);

  const initialCenter = savedViewState?.center || venueMapData.center;
  const initialZoom = savedViewState?.zoom || venueMapData.defaultZoom;

  return (
    <div className={`venue-map-container ${viewMode === 'nearby' ? 'venue-map-nearby-mode' : ''}`}>
      {viewMode === 'map' && crossedZone && (
        <div className="map-warning-banner">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">
            {isHe 
              ? `שים לב: קו הניווט הישר חוצה את "${crossedZone.nameHe}". מומלץ לעקוף דרך השבילים המוזהבים.`
              : `Warning: Direct path crosses "${crossedZone.name}". Please bypass via the gold paths.`
            }
          </span>
        </div>
      )}
      {/* Category filter bar — map mode only */}
      {viewMode === 'map' && (
        <div className="map-filter-bar">
          <button
            className={`map-view-toggle ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => setViewMode('map')}
            aria-label="Map view"
          >
            <MapPin size={14} />
          </button>
          <button
            className="map-view-toggle"
            onClick={() => setViewMode('nearby')}
            aria-label="Nearby list"
          >
            <List size={14} />
          </button>
          <span className="filter-divider" />
          {venueMapData.categories.map(cat => (
            <button
              key={cat.id}
              className={`map-filter-chip ${activeCategories.has(cat.id) ? 'active' : ''}`}
              style={{ '--chip-color': cat.color }}
              onClick={() => toggleCategory(cat.id)}
              aria-pressed={activeCategories.has(cat.id)}
              aria-label={isHe ? cat.labelHe : cat.label}
            >
              <span className="chip-dot" style={{ background: cat.color }} />
              <span>{isHe ? cat.labelHe : cat.label}</span>
            </button>
          ))}
          <button className="map-filter-chip show-all" onClick={showAll}>
            {t.showAll}
          </button>
        </div>
      )}

      {/* Nearby view — no inner scroll, flows with page */}
      {viewMode === 'nearby' && (
        <div className="nearby-view">
          <div className="nearby-top-bar">
            <button
              className="nearby-mode-btn"
              onClick={() => setViewMode('map')}
            >
              <MapPin size={14} />
              <span>{isHe ? 'מפה' : 'Map'}</span>
            </button>
          </div>

          {crossedZone && (
            <div className="nearby-warning-banner">
              <span className="warning-icon">⚠️</span>
              <span className="warning-text">
                {isHe 
                  ? `שים לב: קו הניווט הישר חוצה את "${crossedZone.nameHe}". מומלץ לעקוף דרך השבילים המוזהבים.`
                  : `Warning: Direct path crosses "${crossedZone.name}". Please bypass via the gold paths.`
                }
              </span>
            </div>
          )}

          {compassTarget && (
            <CompassCard
              target={compassTarget}
              userPosition={userPosition}
              locationStatus={locationStatus}
              lang={lang}
              onClose={() => setCompassTarget(null)}
              onRequestLocation={requestNavigationLocation}
              pois={pois}
            />
          )}

          <div className="nearby-section-label">{isHe ? 'בקרבת מקום' : 'NEARBY'}</div>

          <div className="nearby-category-bar">
            {NEARBY_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`nearby-cat-chip ${nearbyCategory === cat.id ? 'active' : ''}`}
                style={{ '--cat-color': cat.color }}
                onClick={() => { setNearbyCategory(cat.id); setCompassTarget(null); }}
              >
                <span className="nearby-cat-icon">{cat.icon}</span>
                {isHe ? cat.labelHe : cat.label}
              </button>
            ))}
          </div>

          {!userPosition && (showOnboarding || locationStatus === 'requesting' || locationStatus === 'denied' || locationStatus === 'unavailable' || gpsError) && (
            <div className="gps-onboarding-card">
              <div className="gps-onboarding-header">
                <span className="gps-glow-icon">🔮</span>
                <h3>{isHe ? 'למצוא את הדרך באורות אוזורה' : 'Unlock the Ozora Lights Map'}</h3>
              </div>
              <p>
                {isHe 
                  ? 'בשטחי הגבעות של דאדפושטה ובמיוחד בחושך באופליין, ה-GPS חיוני כדי למצוא את האוהל שלך, מקורות מים ולנווט בבטחה בין הבמות.' 
                  : 'In the hills of Dádpuszta and especially in the dark offline, GPS is crucial for finding your tent, water, and stages safely.'}
              </p>
              
              {locationStatus === 'requesting' ? (
                <div className="gps-requesting-spinner">
                  <div className="spinner-ring"></div>
                  <span>{isHe ? 'מחפש לווינים...' : 'Searching satellites...'}</span>
                </div>
              ) : (
                <button className="gps-grant-btn" onClick={requestNavigationLocation}>
                  {isHe ? 'אפשר גישת מיקום (GPS)' : 'Allow Location Access'}
                </button>
              )}

              {gpsError && (
                <div className="gps-troubleshoot">
                  <details>
                    <summary>{isHe ? 'כיצד לאפשר מיקום ידנית?' : 'How to enable location manually?'}</summary>
                    <div className="troubleshoot-content">
                      <p><strong>Safari:</strong> {isHe ? 'הגדרות -> פרטיות -> שירותי מיקום -> דפדפן ספארי -> אפשר תמיד' : 'Settings -> Privacy -> Location Services -> Safari -> Allow'}</p>
                      <p><strong>Chrome:</strong> {isHe ? 'לחץ על מנעול האבטחה בשורת הכתובת -> הרשאות אתר -> מיקום -> אפשר' : 'Tap site settings icon in url bar -> Site Settings -> Location -> Allow'}</p>
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}

          <div className="nearby-list">
            {nearbyCategory === 'camping' && (() => {
              const camp = pois.find(p => p.id === 'my-camp');
              if (!camp) {
                return (
                  <div className="nearby-camp-card cta-card">
                    <div className="nearby-camp-header">
                      <div className="title-section">
                        <Tent className="pulsing-camp-icon" size={24} />
                        <h4>{isHe ? 'מיקום האוהל שלי' : 'My Camp Location'}</h4>
                      </div>
                    </div>
                    <p>{isHe ? 'לא סימנת את מיקום האוהל שלך עדיין. נעץ אותו עכשיו כדי למצוא אותו בקלות בחושך באופליין.' : 'You haven\'t pinned your tent location yet. Pin it now to easily find it in the dark offline.'}</p>
                    <button className="pin-camp-btn" onClick={() => setIsCalibrating(true)}>
                      {isHe ? 'נעץ את האוהל שלי' : 'Pin My Camp'}
                    </button>
                  </div>
                );
              }

              const campDist = userPosition ? haversineDistance(userPosition.lat, userPosition.lng, camp.coords[0], camp.coords[1]) : null;
              return (
                <div className="nearby-camp-card active-card">
                  <div className="nearby-camp-header">
                    <div className="title-section">
                      <Tent className="active-camp-icon" size={20} />
                      <h4>{isHe ? 'האוהל שלי' : 'My Camp'}</h4>
                    </div>
                    <button 
                      className="delete-camp-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(isHe ? 'האם למחוק את מיקום האוהל?' : 'Delete camp location?')) {
                          localStorage.removeItem('ozora_my_camp');
                          refreshPois();
                          onCampChange?.();
                        }
                      }}
                    >
                      {isHe ? 'מחק' : 'Delete'}
                    </button>
                  </div>
                  
                  {campDist != null ? (
                    <div className="camp-dist-info">
                      <strong>{formatDistance(campDist)}</strong>
                      <span>· {formatWalkTime(campDist, isHe)}</span>
                    </div>
                  ) : (
                    <p className="no-gps-alert">{isHe ? 'אפשר GPS כדי לראות מרחק' : 'Enable GPS to see distance'}</p>
                  )}

                  <div className="camp-card-actions">
                    <button className="camp-nav-action-btn" onClick={() => selectCompassTarget(camp)}>
                      <Navigation size={14} />
                      <span>{isHe ? 'נווט במצפן' : 'Navigate with Compass'}</span>
                    </button>
                    <button className="camp-recalibrate-btn" onClick={() => setIsCalibrating(true)}>
                      {isHe ? 'כייל מחדש' : 'Recalibrate'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {nearbyByCategory
              .filter(poi => poi.id !== 'my-camp')
              .map((poi, idx) => {
                const poiName = poi.type === 'stage' ? poi.name : (isHe ? poi.nameHe : poi.name);
                const cat = categoryMap[poi.type];
                const isSelected = compassTarget?.id === poi.id;
                const catColor = poi.color || cat?.color || 'var(--primary)';
                return (
                  <button
                    key={poi.id}
                    className={`nearby-item ${isSelected ? 'selected' : ''}`}
                    style={{ '--item-color': catColor }}
                    onClick={() => selectCompassTarget(poi)}
                  >
                    <span className="nearby-rank-badge" style={{ background: catColor }}>
                      {idx + 1}
                    </span>
                    <div className="nearby-info">
                      <span className="nearby-name">{poiName}</span>
                      <span className="nearby-meta">
                        {poi.distance != null ? (
                          <>
                            <span className="nearby-dist">{formatDistance(poi.distance)}</span>
                            <span className="nearby-dot">·</span>
                            <span>{formatWalkTime(poi.distance, isHe)}</span>
                          </>
                        ) : (
                          <>{isHe ? cat?.labelHe : cat?.label}</>
                        )}
                      </span>
                    </div>
                    <span className={`nearby-arrow ${isSelected ? 'nearby-arrow-active' : ''}`}>
                      <Navigation size={14} />
                    </span>
                  </button>
                );
              })}
            {nearbyByCategory.filter(poi => poi.id !== 'my-camp').length === 0 && nearbyCategory !== 'camping' && (
              <div className="nearby-no-gps">
                {isHe ? 'אין פריטים בקטגוריה זו' : 'No items in this category'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map view */}
      {viewMode === 'map' && <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        maxBounds={venueMapData.bounds}
        maxBoundsViscosity={1.0}
        zoomControl={false}
        className="venue-leaflet-map"
        ref={mapRef}
        attributionControl={false}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          minZoom={venueMapData.zoomRange[0]}
          maxZoom={venueMapData.zoomRange[1]}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />

        <MapController flyToCoords={flyToCoords} onFlyComplete={onFlyToComplete} />
        <MapStateTracker onStateChange={onViewStateChange} />

        {/* POI markers */}
        {filteredPois.map(poi => {
          const isStage = poi.type === 'stage';
          const poiName = poi.type === 'stage' ? poi.name : (isHe ? poi.nameHe : poi.name);
          const distInfo = userPosition
            ? haversineDistance(userPosition.lat, userPosition.lng, poi.coords[0], poi.coords[1])
            : null;

          return (
            <Marker
              key={poi.id}
              position={poi.coords}
              icon={markerIcons[poi.id]}
              eventHandlers={{
                click: () => setNavTarget(null)
              }}
            >
              <Popup className="map-popup" maxWidth={260}>
                <div className="map-popup-content">
                  <h3 className="popup-title" style={{ color: poi.color || categoryMap[poi.type]?.color }}>
                    {poiName}
                  </h3>

                  {isStage && (() => {
                    const { now, next } = getStageNowPlaying(poi.stageName);
                    return (
                      <div className="popup-stage-info">
                        {now ? (
                          <div className="popup-now">
                            <span className="popup-label">{t.nowPlaying}:</span>
                            <strong>{now.artist}</strong>
                            <span className="popup-time">{now.start}–{now.end}</span>
                          </div>
                        ) : (
                          <div className="popup-closed">{t.stageClosed}</div>
                        )}
                        {next && (
                          <div className="popup-next">
                            <span className="popup-label">{t.nextUp}:</span>
                            <span>{next.artist}</span>
                            <span className="popup-time">{next.start}</span>
                          </div>
                        )}
                        {now && onViewInTimetable && (
                          <button
                            className="popup-btn popup-timetable-btn"
                            onClick={() => onViewInTimetable(now)}
                          >
                            {t.viewInTimetable}
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {distInfo !== null && (
                    <div className="popup-distance">
                      <span>{formatDistance(distInfo)} {t.distance}</span>
                      <span className="popup-walk">{formatWalkTime(distInfo, isHe)} {t.walkTime}</span>
                    </div>
                  )}

                  <button
                    className="popup-btn popup-nav-btn"
                    onClick={() => startMapNavigation(poi)}
                  >
                    <Navigation size={14} />
                    {t.navigate}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* GPS user position */}
        {userPosition && (
          <>
            <Circle
              center={[userPosition.lat, userPosition.lng]}
              radius={userPosition.accuracy}
              pathOptions={{ color: '#4299e1', fillColor: '#4299e1', fillOpacity: 0.1, weight: 1 }}
            />
            <CircleMarker
              center={[userPosition.lat, userPosition.lng]}
              radius={8}
              pathOptions={{ color: '#fff', fillColor: '#4299e1', fillOpacity: 1, weight: 3 }}
              className="gps-dot"
            />
          </>
        )}

        {/* Navigation line */}
        {(navTarget || compassTarget) && userPosition && (
          <Polyline
            positions={[
              [userPosition.lat, userPosition.lng],
              compassTarget ? compassTarget.coords : navTarget
            ]}
            pathOptions={{ color: '#e040a0', weight: 3, dashArray: '8, 8', opacity: 0.8 }}
          />
        )}

        {/* Render trails */}
        {venueTrailsData.trails.map(t => (
          <Polyline
            key={t.id}
            positions={t.coords}
            pathOptions={{
              color: t.type === 'main' ? '#ecc94b' : '#9f7aea',
              weight: t.type === 'main' ? 4 : 2,
              dashArray: t.type === 'main' ? null : '5, 5',
              opacity: 0.7
            }}
          />
        ))}

        {/* Render restricted zones */}
        {venueTrailsData.restrictedZones.map(z => (
          <Polygon
            key={z.id}
            positions={z.coords}
            pathOptions={{
              color: '#e53e3e',
              fillColor: '#e53e3e',
              fillOpacity: 0.15,
              weight: 1.5,
              dashArray: '3, 6'
            }}
          />
        ))}
      </MapContainer>}

      {/* Tent FAB */}
      {viewMode === 'map' && (
        <button
          className={`map-fab map-fab-camp ${pois.some(p => p.id === 'my-camp') ? 'has-camp' : ''}`}
          onClick={() => {
            const camp = pois.find(p => p.id === 'my-camp');
            if (camp) {
              if (mapRef.current) {
                mapRef.current.flyTo(camp.coords, 17, { animate: true, duration: 0.3 });
              }
              setCompassTarget(camp);
              requestNavigationLocation();
            } else {
              setIsCalibrating(true);
            }
          }}
          aria-label={isHe ? 'האוהל שלי' : 'My Camp'}
        >
          <Tent size={22} />
        </button>
      )}

      {/* GPS Status / Center FAB */}
      {viewMode === 'map' && (
        <button
          className={`map-fab ${!userPosition ? 'gps-warning' : ''}`}
          onClick={userPosition ? centerOnMe : requestNavigationLocation}
          aria-label={userPosition ? t.centerOnMe : (isHe ? 'בקש גישת מיקום' : 'Request location access')}
        >
          {userPosition ? <Crosshair size={22} /> : <MapPin size={22} className="warning-pulse" />}
        </button>
      )}

      {/* Tile cache progress */}
      <TileCacheOverlay lang={lang} />

      {/* Calibration Modal */}
      {isCalibrating && (
        <CalibrationModal
          lang={lang}
          onClose={() => setIsCalibrating(false)}
          onComplete={(calibratedCoords) => {
            const newCamp = {
              id: 'my-camp',
              name: 'My Camp',
              nameHe: 'האוהל שלי',
              type: 'camping',
              coords: [calibratedCoords.lat, calibratedCoords.lng],
              color: '#ecc94b',
              accuracy: calibratedCoords.accuracy,
              pinnedAt: Date.now()
            };
            localStorage.setItem('ozora_my_camp', JSON.stringify(newCamp));
            refreshPois();
            setIsCalibrating(false);
            onCampChange?.();
          }}
        />
      )}
    </div>
  );
}
