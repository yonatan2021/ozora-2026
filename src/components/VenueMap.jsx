import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import venueMapData from '../data/venueMap.json';
import { translations } from '../utils/lang';
import { isCacheComplete, calculateTileURLs, prefetchTiles } from '../utils/mapCache';
import { Crosshair, Navigation, List, MapPin } from 'lucide-react';

const FESTIVAL_WALK_SPEED = 67; // meters per minute (~4 km/h)

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

function formatWalkTime(meters) {
  const minutes = Math.ceil(meters / FESTIVAL_WALK_SPEED);
  return `~${minutes} min`;
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
  simTime,
  isSimulated,
  activeStatusMap,
  flyToStageId,
  onFlyToComplete,
  onViewInTimetable,
  savedViewState
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
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'nearby'

  const categoryMap = useMemo(() => {
    const m = {};
    venueMapData.categories.forEach(c => { m[c.id] = c; });
    return m;
  }, []);

  const markerIcons = useMemo(() => {
    const icons = {};
    venueMapData.pois.forEach(poi => {
      const cat = categoryMap[poi.type];
      icons[poi.id] = createMarkerIcon(
        { ...cat, color: poi.color || cat?.color },
        poi.type === 'stage'
      );
    });
    return icons;
  }, [categoryMap]);

  // GPS watch
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError(true);
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setGpsError(false);
      },
      () => setGpsError(true),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // flyTo logic
  const flyToCoords = useMemo(() => {
    if (!flyToStageId) return null;
    const poi = venueMapData.pois.find(
      p => p.stageName === flyToStageId || p.id === flyToStageId
    );
    return poi ? poi.coords : null;
  }, [flyToStageId]);

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
    () => venueMapData.pois.filter(poi => activeCategories.has(poi.type)),
    [activeCategories]
  );

  const nearbyPois = useMemo(() => {
    if (!userPosition) return filteredPois;
    return [...filteredPois]
      .map(poi => ({
        ...poi,
        distance: haversineDistance(userPosition.lat, userPosition.lng, poi.coords[0], poi.coords[1])
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [filteredPois, userPosition]);

  const initialCenter = savedViewState?.center || venueMapData.center;
  const initialZoom = savedViewState?.zoom || venueMapData.defaultZoom;

  return (
    <div className="venue-map-container">
      {/* Category filter bar */}
      <div className="map-filter-bar">
        <button
          className={`map-view-toggle ${viewMode === 'map' ? 'active' : ''}`}
          onClick={() => setViewMode('map')}
          aria-label="Map view"
        >
          <MapPin size={14} />
        </button>
        <button
          className={`map-view-toggle ${viewMode === 'nearby' ? 'active' : ''}`}
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

      {/* Nearby list view */}
      {viewMode === 'nearby' && (
        <div className="nearby-list">
          {!userPosition && (
            <div className="nearby-no-gps">{t.gpsUnavailable}</div>
          )}
          {nearbyPois.map((poi, idx) => {
            const poiName = isHe ? poi.nameHe : poi.name;
            const cat = categoryMap[poi.type];
            const color = poi.color || cat?.color || '#888';
            const isStage = poi.type === 'stage';
            let stageInfo = null;
            if (isStage) {
              stageInfo = getStageNowPlaying(poi.stageName);
            }
            return (
              <button
                key={poi.id}
                className="nearby-item"
                onClick={() => {
                  setViewMode('map');
                  setNavTarget(poi.coords);
                  if (mapRef.current) {
                    mapRef.current.flyTo(poi.coords, 17, { animate: true, duration: 0.4 });
                  }
                }}
              >
                <span className="nearby-rank">{idx + 1}</span>
                <span className="nearby-dot" style={{ background: color }} />
                <div className="nearby-info">
                  <span className="nearby-name" style={{ color }}>{poiName}</span>
                  {isStage && stageInfo?.now && (
                    <span className="nearby-playing">{stageInfo.now.artist}</span>
                  )}
                  <span className="nearby-category">{isHe ? cat?.labelHe : cat?.label}</span>
                </div>
                {poi.distance != null && (
                  <div className="nearby-dist">
                    <span className="nearby-dist-value">{formatDistance(poi.distance)}</span>
                    <span className="nearby-dist-walk">{formatWalkTime(poi.distance)}</span>
                  </div>
                )}
              </button>
            );
          })}
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

        {/* POI markers */}
        {filteredPois.map(poi => {
          const isStage = poi.type === 'stage';
          const poiName = isHe ? poi.nameHe : poi.name;
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
                      <span className="popup-walk">{formatWalkTime(distInfo)} {t.walkTime}</span>
                    </div>
                  )}

                  {distInfo !== null && (
                    <button
                      className="popup-btn popup-nav-btn"
                      onClick={() => setNavTarget(poi.coords)}
                    >
                      <Navigation size={14} />
                      {t.navigate}
                    </button>
                  )}
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
        {navTarget && userPosition && (
          <Polyline
            positions={[
              [userPosition.lat, userPosition.lng],
              navTarget
            ]}
            pathOptions={{ color: '#e040a0', weight: 3, dashArray: '8, 8', opacity: 0.8 }}
          />
        )}
      </MapContainer>}

      {/* GPS center FAB */}
      {viewMode === 'map' && userPosition && !gpsError && (
        <button
          className="map-fab"
          onClick={centerOnMe}
          aria-label={t.centerOnMe}
        >
          <Crosshair size={22} />
        </button>
      )}

      {/* Tile cache progress */}
      <TileCacheOverlay lang={lang} />
    </div>
  );
}
