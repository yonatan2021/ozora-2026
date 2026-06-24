# Offline Camp Pinning & Compass Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to pin their camp coordinates locally with high accuracy via dynamic GPS calibration, and navigate back to it completely offline using the Leaflet map and/or the existing Compass/Radar view.

**Architecture:** We will create a GPS calibration utility that collects and averages GPS coordinates while discarding outliers. We will inject the pinned camp into a stateful POIs list in the map, so it naturally renders on the map and in the Nearby list. Finally, we will add quick-access UI entry points (Map FAB, Header icon, and Nearby list card) to trigger the existing `CompassCard` navigation modal.

**Tech Stack:** React 19, Vitest, Leaflet, Lucide React, Vanilla CSS.

---

### Task 1: GPS Calibration Utility & Unit Tests

**Files:**
- Create: `src/utils/gpsCalibration.js`
- Create: `src/utils/gpsCalibration.spec.js`

- [ ] **Step 1: Write the failing tests**
  Create `src/utils/gpsCalibration.spec.js` with tests for coordinate averaging, outlier filtering, and the complete calibration flow:
  ```javascript
  import { describe, it, expect } from 'vitest';
  import { calculateMean, calibrateGPS } from './gpsCalibration';

  describe('GPS Calibration', () => {
    it('should calculate the mean correctly', () => {
      const samples = [
        { lat: 10, lng: 20, accuracy: 5 },
        { lat: 12, lng: 22, accuracy: 5 }
      ];
      const mean = calculateMean(samples);
      expect(mean).toEqual({ lat: 11, lng: 21 });
    });

    it('should filter outliers and average remaining samples', () => {
      const samples = [
        { lat: 46.7710, lng: 18.4340, accuracy: 5 },
        { lat: 46.7711, lng: 18.4341, accuracy: 6 },
        { lat: 46.7712, lng: 18.4339, accuracy: 4 },
        // Outlier coordinate (far away)
        { lat: 46.7900, lng: 18.4500, accuracy: 5 },
        // High inaccuracy coordinate
        { lat: 46.7715, lng: 18.4345, accuracy: 99 }
      ];

      const result = calibrateGPS(samples, 25);
      
      // The outlier at lat 46.79 and high inaccuracy sample (99) should be filtered out
      expect(result.lat).toBeLessThan(46.772);
      expect(result.lat).toBeGreaterThan(46.770);
      expect(result.accuracy).toBeLessThan(10);
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**
  Run: `npm run test src/utils/gpsCalibration.spec.js`
  Expected: FAIL (files do not exist or exports are undefined)

- [ ] **Step 3: Implement the GPS calibration logic**
  Create `src/utils/gpsCalibration.js` with the following content:
  ```javascript
  export function calculateMean(samples) {
    if (!samples || samples.length === 0) return null;
    let latSum = 0;
    let lngSum = 0;
    samples.forEach(s => {
      latSum += s.lat;
      lngSum += s.lng;
    });
    return {
      lat: latSum / samples.length,
      lng: lngSum / samples.length,
    };
  }

  export function calculateStandardDeviation(samples, mean) {
    if (!samples || samples.length <= 1) return { latDev: 0, lngDev: 0 };
    let latVarSum = 0;
    let lngVarSum = 0;
    samples.forEach(s => {
      latVarSum += Math.pow(s.lat - mean.lat, 2);
      lngVarSum += Math.pow(s.lng - mean.lng, 2);
    });
    return {
      latDev: Math.sqrt(latVarSum / (samples.length - 1)),
      lngDev: Math.sqrt(lngVarSum / (samples.length - 1)),
    };
  }

  export function filterOutliers(samples, mean, deviation, thresholdFactor = 1.5) {
    if (!samples || samples.length <= 2) return samples;
    const MIN_DEV = 0.00001; // ~1 meter latitude
    const latLimit = Math.max(deviation.latDev * thresholdFactor, MIN_DEV);
    const lngLimit = Math.max(deviation.lngDev * thresholdFactor, MIN_DEV);

    return samples.filter(s => {
      const latDiff = Math.abs(s.lat - mean.lat);
      const lngDiff = Math.abs(s.lng - mean.lng);
      return latDiff <= latLimit && lngDiff <= lngLimit;
    });
  }

  export function calibrateGPS(samples, maxAccuracyThreshold = 25) {
    if (!samples || samples.length === 0) return null;

    // 1. Filter out points with poor accuracy
    let usableSamples = samples.filter(s => s.accuracy <= maxAccuracyThreshold);
    
    // Fallback if all samples have poor accuracy
    if (usableSamples.length === 0) {
      usableSamples = samples;
    }

    if (usableSamples.length <= 2) {
      const simpleMean = calculateMean(usableSamples);
      const maxAcc = Math.max(...usableSamples.map(s => s.accuracy));
      return { ...simpleMean, accuracy: maxAcc };
    }

    // 2. Initial mean calculation
    const initialMean = calculateMean(usableSamples);

    // 3. Calculate deviation and filter outliers
    const deviation = calculateStandardDeviation(usableSamples, initialMean);
    const filteredSamples = filterOutliers(usableSamples, initialMean, deviation, 1.5);

    // 4. Recalculate final mean of filtered samples
    const finalMean = calculateMean(filteredSamples);
    
    // Calculate average accuracy
    const avgAccuracy = filteredSamples.reduce((sum, s) => sum + s.accuracy, 0) / filteredSamples.length;

    return {
      lat: finalMean.lat,
      lng: finalMean.lng,
      accuracy: avgAccuracy,
    };
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**
  Run: `npm run test src/utils/gpsCalibration.spec.js`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/utils/gpsCalibration.js src/utils/gpsCalibration.spec.js
  git commit -m "feat: add GPS calibration utility and unit tests"
  ```

---

### Task 2: Pinned Camp POI Injection in VenueMap

**Files:**
- Modify: `src/components/VenueMap.jsx`

- [ ] **Step 1: Declare state and inject Pinned Camp into POIs**
  Modify `src/components/VenueMap.jsx` to load `ozora_my_camp` from localStorage and inject it into a stateful `pois` list.
  
  Inside `VenueMap` component definition (near line 364):
  ```javascript
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

  // Function to refresh POIs when camp is updated or deleted
  const refreshPois = useCallback(() => {
    const savedCamp = localStorage.getItem('ozora_my_camp');
    if (savedCamp) {
      try {
        const camp = JSON.parse(savedCamp);
        // Remove old camp if exists and append new one
        const basePois = venueMapData.pois.filter(p => p.id !== 'my-camp');
        setPois([...basePois, camp]);
        return;
      } catch (e) {
        console.error("Error updating camp POI", e);
      }
    }
    setPois(venueMapData.pois);
  }, []);
  ```

- [ ] **Step 2: Replace static `venueMapData.pois` references**
  Update the following hooks/variables in `VenueMap.jsx` to use the stateful `pois` instead of `venueMapData.pois`:
  - `markerIcons` (line 387):
    ```javascript
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
    ```
  - `flyToCoords` (line 450):
    ```javascript
    const flyToCoords = useMemo(() => {
      if (!flyToStageId) return null;
      const poi = pois.find(
        p => p.stageName === flyToStageId || p.id === flyToStageId
      );
      return poi ? poi.coords : null;
    }, [flyToStageId, pois]);
    ```
  - `filteredPois` (line 494):
    ```javascript
    const filteredPois = useMemo(
      () => pois.filter(poi => activeCategories.has(poi.type)),
      [activeCategories, pois]
    );
    ```
  - `nearbyByCategory` (line 499):
    ```javascript
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
    ```

- [ ] **Step 3: Handle automatic fly-to / compass opening for camp**
  Add a `useEffect` inside `VenueMap.jsx` that listens to `flyToStageId`. If it equals `'my-camp'`, fly map to camp and open its compass:
  ```javascript
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
  ```

- [ ] **Step 4: Commit**
  ```bash
  git commit -am "feat: inject pinned camp POI into stateful VenueMap lists"
  ```

---

### Task 3: Calibration Modal Component

**Files:**
- Create: `src/components/CalibrationModal.jsx`

- [ ] **Step 1: Write CalibrationModal implementation**
  Create `src/components/CalibrationModal.jsx` representing the glassmorphic modal with a rotating sacred geometry loader and countdown logic:
  ```jsx
  import { useState, useEffect, useRef } from 'react';
  import { X, Navigation } from 'lucide-react';
  import { startLocationWatch, stopLocationWatch } from '../utils/navigationPermissions';
  import { calibrateGPS } from '../utils/gpsCalibration';

  const DURATION_SECONDS = 7;

  export default function CalibrationModal({ lang, onClose, onComplete }) {
    const isHe = lang === 'he';
    const [progress, setProgress] = useState(0);
    const [samples, setSamples] = useState([]);
    const [currentAccuracy, setCurrentAccuracy] = useState(null);
    const samplesRef = useRef([]);

    useEffect(() => {
      samplesRef.current = [];
      let startTime = Date.now();

      const watchId = startLocationWatch(
        navigator.geolocation,
        (pos) => {
          const sample = { lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy };
          samplesRef.current.push(sample);
          setSamples([...samplesRef.current]);
          setCurrentAccuracy(pos.accuracy);
        },
        (err) => {
          console.error("GPS Watch error during calibration", err);
        }
      );

      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const pct = Math.min((elapsed / DURATION_SECONDS) * 100, 100);
        setProgress(pct);

        if (elapsed >= DURATION_SECONDS) {
          clearInterval(interval);
          stopLocationWatch(navigator.geolocation, watchId);
          
          // Run calibration
          const finalCoord = calibrateGPS(samplesRef.current);
          if (finalCoord) {
            onComplete(finalCoord);
          } else {
            alert(isHe ? "שגיאה: לא התקבלו דגימות GPS תקינות." : "Error: No valid GPS samples received.");
            onClose();
          }
        }
      }, 100);

      return () => {
        clearInterval(interval);
        stopLocationWatch(navigator.geolocation, watchId);
      };
    }, [onComplete, onClose, isHe]);

    return (
      <div className="calibration-overlay">
        <div className="calibration-card">
          <button className="calibration-close" onClick={onClose}>
            <X size={18} />
          </button>
          
          <div className="calibration-header">
            <Navigation className="calibration-icon animate-pulse" size={24} />
            <h3>{isHe ? 'כיול מיקום האוהל שלי' : 'Calibrating My Camp Location'}</h3>
          </div>

          <div className="calibration-body">
            <div className="sacred-geometry-loader">
              {/* Rotating sacred geometry fractal SVG overlay */}
              <svg viewBox="0 0 100 100" className="sacred-svg">
                <circle cx="50" cy="50" r="40" stroke="var(--primary)" strokeWidth="1" fill="none" opacity="0.3" />
                <circle cx="50" cy="50" r="30" stroke="var(--primary)" strokeWidth="0.7" fill="none" opacity="0.5" />
                <circle cx="50" cy="50" r="20" stroke="var(--primary)" strokeWidth="0.5" fill="none" opacity="0.7" />
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => (
                  <line
                    key={deg}
                    x1="50" y1="10" x2="50" y2="90"
                    stroke="var(--primary)"
                    strokeWidth="0.3"
                    transform={`rotate(${deg}, 50, 50)`}
                    opacity="0.3"
                  />
                ))}
              </svg>
            </div>

            <p className="calibration-tip">
              {isHe ? 'נא לעמוד ללא תנועה ליד האוהל שלך...' : 'Please stand still near your tent...'}
            </p>

            <div className="calibration-stats">
              <div className="stat-row">
                <span>{isHe ? 'דגימות שנאספו:' : 'Samples collected:'}</span>
                <strong>{samples.length}</strong>
              </div>
              <div className="stat-row">
                <span>{isHe ? 'דיוק נוכחי:' : 'Current accuracy:'}</span>
                <strong className={currentAccuracy && currentAccuracy < 15 ? 'good-signal' : 'poor-signal'}>
                  {currentAccuracy ? `±${Math.round(currentAccuracy)}m` : (isHe ? 'מחפש לווין...' : 'Searching satellite...')}
                </strong>
              </div>
            </div>

            <div className="calibration-progress-bar">
              <div className="calibration-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add src/components/CalibrationModal.jsx
  git commit -m "feat: add CalibrationModal component for GPS calibration"
  ```

---

### Task 4: Map & Nearby List UI Integration

**Files:**
- Modify: `src/components/VenueMap.jsx`
- Modify: `src/index.css`

- [ ] **Step 1: Add "Pin My Camp" FAB to Leaflet Map**
  Modify `src/components/VenueMap.jsx` (near line 765, near the other FAB):
  Import `Tent` from `lucide-react` at the top of the file.
  Render the floating action button:
  ```jsx
  {/* Tent FAB */}
  {viewMode === 'map' && (
    <button
      className={`map-fab map-fab-camp ${pois.some(p => p.id === 'my-camp') ? 'has-camp' : ''}`}
      onClick={() => {
        const camp = pois.find(p => p.id === 'my-camp');
        if (camp) {
          // Center on camp
          mapRef.current.flyTo(camp.coords, 17, { animate: true, duration: 0.3 });
          // Trigger compass or open marker
          setCompassTarget(camp);
          requestNavigationLocation();
        } else {
          // Start calibration
          setIsCalibrating(true);
        }
      }}
      aria-label={isHe ? 'האוהל שלי' : 'My Camp'}
    >
      <Tent size={22} />
    </button>
  )}
  ```
  Also define `const [isCalibrating, setIsCalibrating] = useState(false)` state and import `CalibrationModal` at the top.
  Render the `CalibrationModal` inside `VenueMap`'s return layout:
  ```jsx
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
      }}
    />
  )}
  ```

- [ ] **Step 2: Add Special Pinned Card to the Camps Nearby list**
  Modify the `nearby-list` section in `VenueMap.jsx` (near line 596).
  If the `nearbyCategory` is `'camping'`, render the custom camp pinning CTA or navigation details card at the very top of the list:
  ```jsx
  {nearbyCategory === 'camping' && (() => {
    const camp = pois.find(p => p.id === 'my-camp');
    if (!camp) {
      return (
        <div className="nearby-camp-card cta-card">
          <div className="nearby-camp-header">
            <Tent className="pulsing-camp-icon" size={24} />
            <h4>{isHe ? 'מיקום האוהל שלי' : 'My Camp Location'}</h4>
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
            onClick={() => {
              if (confirm(isHe ? 'האם למחוק את מיקום האוהל?' : 'Delete camp location?')) {
                localStorage.removeItem('ozora_my_camp');
                refreshPois();
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
  ```

- [ ] **Step 3: Append CSS rules to index.css**
  Append the styling at the end of `src/index.css`:
  ```css
  /* Offline Camp Pinning Styles */
  .map-fab-camp {
    bottom: 140px; /* Positioned above center-on-me button */
    border-color: #ecc94b !important;
    color: var(--text-muted) !important;
  }
  .map-fab-camp.has-camp {
    color: #ecc94b !important;
    background: rgba(236, 201, 75, 0.1) !important;
    box-shadow: 0 0 10px rgba(236, 201, 75, 0.3) !important;
  }

  .calibration-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(11, 7, 19, 0.7);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 1.5rem;
  }

  .calibration-card {
    background: var(--card-bg, #181424);
    border: 1px solid var(--border-strong, #322b46);
    border-radius: 16px;
    padding: 2rem 1.5rem;
    width: 100%;
    max-width: 380px;
    position: relative;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    text-align: center;
  }

  .calibration-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
  }

  .calibration-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .calibration-header h3 {
    font-size: 1.2rem;
    color: var(--text-primary);
  }

  .calibration-icon {
    color: #ecc94b;
  }

  .sacred-geometry-loader {
    width: 120px;
    height: 120px;
    margin: 0 auto 1.5rem auto;
    position: relative;
  }

  .sacred-svg {
    width: 100%;
    height: 100%;
    animation: spin-geometry 20s linear infinite;
  }

  @keyframes spin-geometry {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .calibration-tip {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
  }

  .calibration-stats {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    margin-bottom: 0.25rem;
  }
  .stat-row:last-child {
    margin-bottom: 0;
  }

  .good-signal {
    color: #48bb78;
  }
  .poor-signal {
    color: #e53e3e;
  }

  .calibration-progress-bar {
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
  }

  .calibration-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #ecc94b, #ed8936);
    transition: width 0.1s linear;
  }

  /* Nearby Pinned Camp Card */
  .nearby-camp-card {
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1rem;
    background: var(--card-bg, #181424);
    border: 1px solid var(--border, #2d263f);
  }

  .nearby-camp-card.cta-card {
    border: 1px dashed rgba(236, 201, 75, 0.4);
    box-shadow: 0 0 12px rgba(236, 201, 75, 0.05);
  }

  .nearby-camp-card.active-card {
    border: 1px solid #ecc94b;
    box-shadow: 0 0 15px rgba(236, 201, 75, 0.08);
  }

  .nearby-camp-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .nearby-camp-header h4 {
    font-size: 1.05rem;
    color: var(--text-primary);
    margin: 0;
  }

  .nearby-camp-header .title-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .pulsing-camp-icon {
    color: var(--text-muted);
    animation: pulse-glow 2s ease-in-out infinite;
  }

  .active-camp-icon {
    color: #ecc94b;
    filter: drop-shadow(0 0 4px rgba(236, 201, 75, 0.5));
  }

  @keyframes pulse-glow {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  .nearby-camp-card p {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.4;
    margin: 0 0 1rem 0;
  }

  .pin-camp-btn {
    width: 100%;
    background: linear-gradient(90deg, #ecc94b, #ed8936);
    color: #12100e;
    border: none;
    border-radius: 8px;
    padding: 0.6rem;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .delete-camp-btn {
    background: none;
    border: none;
    color: #e53e3e;
    font-size: 0.8rem;
    cursor: pointer;
    font-weight: 600;
  }

  .camp-dist-info {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
  .camp-dist-info strong {
    color: #ecc94b;
  }
  .camp-dist-info span {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .camp-card-actions {
    display: flex;
    gap: 0.5rem;
  }

  .camp-nav-action-btn {
    flex: 2;
    background: #ecc94b;
    color: #12100e;
    border: none;
    border-radius: 6px;
    padding: 0.5rem;
    font-size: 0.85rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    cursor: pointer;
  }

  .camp-recalibrate-btn {
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-strong, #322b46);
    color: var(--text-secondary);
    border-radius: 6px;
    padding: 0.5rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
  }
  
  .camp-shortcut-btn {
    background: none;
    border: none;
    color: #ecc94b;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    filter: drop-shadow(0 0 3px rgba(236, 201, 75, 0.3));
    border-radius: 50%;
    transition: background-color 0.2s;
  }
  .camp-shortcut-btn:hover {
    background: rgba(236, 201, 75, 0.1);
  }
  ```

- [ ] **Step 4: Commit**
  ```bash
  git commit -am "feat: add map FAB, nearby camps card, and styles for offline camp pinning"
  ```

---

### Task 5: Header Icon & App Navigation Integration

**Files:**
- Modify: `src/components/Header.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Add quick-access button to Header**
  Modify `src/components/Header.jsx`:
  Import `Tent` from `lucide-react` at the top of the file.
  Add `hasCamp` and `onCampClick` props to `Header` parameters.
  Render the shortcut button inside `<div className="header-actions">` (near line 68):
  ```jsx
  {hasCamp && (
    <button 
      className="camp-shortcut-btn" 
      onClick={onCampClick}
      title={isHe ? 'ניווט לאוהל שלי' : 'Navigate to my camp'}
    >
      <Tent size={18} />
    </button>
  )}
  ```

- [ ] **Step 2: Track camp existence and handle shortcut clicks in App.jsx**
  Modify `src/App.jsx`:
  Add state to track if a camp is pinned:
  ```javascript
  const [hasCamp, setHasCamp] = useState(() => !!localStorage.getItem('ozora_my_camp'));

  // Refresh status when storage changes or on mount
  useEffect(() => {
    const handleStorage = () => {
      setHasCamp(!!localStorage.getItem('ozora_my_camp'));
    };
    window.addEventListener('storage', handleStorage);
    // Periodically poll since storage events don't fire in the same tab
    const interval = setInterval(handleStorage, 2000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);
  ```
  Pass `hasCamp` and `onCampClick` to `<Header>`:
  ```jsx
  <Header
    lang={lang}
    setLang={setLang}
    timetableData={timetableData}
    favorites={childFavorites}
    toggleFavorite={toggleFavorite}
    onSelectSet={handleSelectSetFromSearch}
    activeTab={activeTab}
    setActiveTab={setActiveTab}
    hasCamp={hasCamp}
    onCampClick={() => {
      setActiveTab('map');
      setFlyToStageId('my-camp');
    }}
  />
  ```

- [ ] **Step 3: Run full verification suite**
  Run: `npm run test`
  Expected: All tests pass.

- [ ] **Step 4: Commit**
  ```bash
  git commit -am "feat: integrate camp shortcut header button and verify full system"
  ```
