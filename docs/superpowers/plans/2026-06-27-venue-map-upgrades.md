# Venue Map Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the Ozora 2026 venue map with GPS onboarding, landmark compass calibration, and trail/restricted zone overlays with route warning banners.

**Architecture:** Create a new math utility module `mapMath.js` for geometric calculations. Set up trail and restricted polygon coordinate data in `venueTrails.json`. Incorporate vector rendering (Polyline, Polygon) in `VenueMap.jsx` and display a warning banner if the line of sight to a target intersects a restricted polygon. Implement a two-stage calibration UI in `CompassCard` and a designed onboarding view when GPS is disabled.

**Tech Stack:** React 19, Leaflet 1.9, React-Leaflet 5.0, Vitest 4.1.

---

### Task 1: Create Map Math Utility and Tests

**Files:**
- Create: `src/utils/mapMath.js`
- Test: `src/utils/mapMath.spec.js`

- [ ] **Step 1: Create map math utility file**

Write the geometric calculation functions in `src/utils/mapMath.js`:
```javascript
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function ccw(A, B, C) {
  return (C[0] - A[0]) * (B[1] - A[1]) > (B[0] - A[0]) * (C[1] - A[1]);
}

export function intersect(A, B, C, D) {
  return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);
}

export function doesSegmentCrossPolygon(p1, p2, polygonCoords) {
  if (!polygonCoords || polygonCoords.length < 3) return false;
  for (let i = 0; i < polygonCoords.length; i++) {
    const nextIdx = (i + 1) % polygonCoords.length;
    const sideStart = polygonCoords[i];
    const sideEnd = polygonCoords[nextIdx];
    if (intersect(p1, p2, sideStart, sideEnd)) {
      return true;
    }
  }
  return false;
}
```

- [ ] **Step 2: Create unit tests for map math**

Write unit tests in `src/utils/mapMath.spec.js` verifying the math:
```javascript
import { describe, it, expect } from 'vitest';
import { calculateBearing, intersect, doesSegmentCrossPolygon } from './mapMath';

describe('mapMath utility tests', () => {
  it('should calculate bearing correctly', () => {
    // Bearing from (0,0) to (1,0) (due North)
    const bearing = calculateBearing(0, 0, 1, 0);
    expect(bearing).toBeCloseTo(0, 1);
  });

  it('should detect segment intersections correctly', () => {
    // Intersecting segments
    expect(intersect([0, 0], [10, 10], [0, 10], [10, 0])).toBe(true);
    // Non-intersecting segments
    expect(intersect([0, 0], [2, 2], [5, 5], [7, 7])).toBe(false);
  });

  it('should check if segment crosses a polygon', () => {
    const polygon = [[2, 2], [2, 8], [8, 8], [8, 2]];
    // Crosses through the polygon
    expect(doesSegmentCrossPolygon([0, 5], [10, 5], polygon)).toBe(true);
    // Outside the polygon
    expect(doesSegmentCrossPolygon([0, 0], [1, 1], polygon)).toBe(false);
  });
});
```

- [ ] **Step 3: Run the test suite and verify**

Run: `npm run test`
Expected: Test passes successfully.

- [ ] **Step 4: Commit task 1**

```bash
git add src/utils/mapMath.js src/utils/mapMath.spec.js
git commit -m "feat: add mapMath utilities and tests"
```

---

### Task 2: Create Trails & Restricted Zones Data

**Files:**
- Create: `src/data/venueTrails.json`
- Test: `src/data/venueTrails.spec.js`

- [ ] **Step 1: Create trails and restricted zones JSON file**

Write the database in `src/data/venueTrails.json`:
```json
{
  "trails": [
    {
      "id": "main-trail-1",
      "name": "Main Street Path",
      "nameHe": "ציר הרחוב הראשי",
      "type": "main",
      "coords": [
        [46.7695, 18.4369],
        [46.7707, 18.4338],
        [46.7714, 18.4320]
      ]
    },
    {
      "id": "dome-trail",
      "name": "Dome Trail",
      "nameHe": "שביל הכיפה",
      "type": "secondary",
      "coords": [
        [46.7707, 18.4338],
        [46.7718, 18.4315],
        [46.7739, 18.4328]
      ]
    },
    {
      "id": "main-stage-trail",
      "name": "Main Stage Trail",
      "nameHe": "שביל הבמה הראשית",
      "type": "main",
      "coords": [
        [46.7707, 18.4338],
        [46.773164, 18.435942]
      ]
    }
  ],
  "restrictedZones": [
    {
      "id": "main-stage-backstage",
      "name": "Main Stage Backstage",
      "nameHe": "במה ראשית - מאחורי הקלעים",
      "coords": [
        [46.7733, 18.4357],
        [46.7737, 18.4359],
        [46.7735, 18.4365],
        [46.7731, 18.4363]
      ]
    },
    {
      "id": "lake-halomi-deep",
      "name": "Lake Halomi - No Crossing Zone",
      "nameHe": "אגם האלומי - מים עמוקים",
      "coords": [
        [46.7737, 18.4324],
        [46.7741, 18.4323],
        [46.7743, 18.4333],
        [46.7738, 18.4331]
      ]
    }
  ]
}
```

- [ ] **Step 2: Create simple verification test for data schema**

Write in `src/data/venueTrails.spec.js`:
```javascript
import { describe, it, expect } from 'vitest';
import trailsData from './venueTrails.json';

describe('venueTrails JSON validation', () => {
  it('should contain trails and restrictedZones arrays', () => {
    expect(Array.isArray(trailsData.trails)).toBe(true);
    expect(Array.isArray(trailsData.restrictedZones)).toBe(true);
    expect(trailsData.trails.length).toBeGreaterThan(0);
    expect(trailsData.restrictedZones.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run the test**

Run: `npm run test`
Expected: Tests pass.

- [ ] **Step 4: Commit task 2**

```bash
git add src/data/venueTrails.json src/data/venueTrails.spec.js
git commit -m "feat: add venue trails and restricted zones data"
```

---

### Task 3: Render Vector Layers and Collision Warning System

**Files:**
- Modify: `src/components/VenueMap.jsx`

- [ ] **Step 1: Import trails data and helper functions**

In `src/components/VenueMap.jsx`, import:
```javascript
import venueTrailsData from '../data/venueTrails.json';
import { ccw, intersect, doesSegmentCrossPolygon } from '../utils/mapMath';
```
*(Also replace any local `calculateBearing` with the import from `mapMath` if necessary, or keep it).*

- [ ] **Step 2: Calculate path collision warning in VenueMap**

Define a check in the component rendering context:
```javascript
  const crossedZone = useMemo(() => {
    if (!userPosition) return null;
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
```

- [ ] **Step 3: Render trails, restricted zones, and the warning banner**

1. In the `MapContainer` render block, map and draw:
```javascript
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
```

2. Render the warning banner at the top of the map view or nearby list if `crossedZone` is active:
```javascript
      {crossedZone && (
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
```

Add CSS for `.map-warning-banner` in `src/index.css`:
```css
.map-warning-banner {
  position: absolute;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(229, 62, 62, 0.95);
  border: 1px solid #feb2b2;
  color: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  width: 90%;
  max-width: 500px;
  backdrop-filter: blur(8px);
  animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideDown {
  from { transform: translate(-50%, -20px); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
}
```

- [ ] **Step 4: Commit task 3**

```bash
git add src/components/VenueMap.jsx src/index.css
git commit -m "feat: render trails, restricted zones, and route warning banner"
```

---

### Task 4: GPS Onboarding and Status FAB

**Files:**
- Modify: `src/components/VenueMap.jsx`

- [ ] **Step 1: Trigger auto-request location on mount**

In `src/components/VenueMap.jsx`, add a startup location request hook:
```javascript
  useEffect(() => {
    // Attempt automatic request on map tab activation
    requestNavigationLocation();
  }, []);
```

- [ ] **Step 2: Render beautiful onboarding card if GPS is denied or unavailable**

Replace the simple text notice `nearby-no-gps` with the rich interactive card:
```javascript
          {!userPosition && (
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
                      <p><strong>Chrome:</strong> {isHe ? 'לחוץ על מנעול האבטחה בשורת הכתובת -> הרשאות אתר -> מיקום -> אפשר' : 'Tap site settings icon in url bar -> Site Settings -> Location -> Allow'}</p>
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}
```

Add CSS style for `.gps-onboarding-card` in `src/index.css`:
```css
.gps-onboarding-card {
  margin: 16px;
  padding: 24px;
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--border);
  background: rgba(26, 21, 44, 0.7);
  backdrop-filter: blur(12px);
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.gps-onboarding-header h3 {
  margin-top: 10px;
  font-family: 'Exo 2', sans-serif;
  color: var(--primary);
  font-size: 1.2rem;
}

.gps-onboarding-card p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 16px 0;
}

.gps-grant-btn {
  width: 100%;
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: #fff;
  border: none;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(224, 64, 160, 0.4);
}

.gps-troubleshoot details {
  margin-top: 16px;
  text-align: start;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.gps-troubleshoot summary {
  cursor: pointer;
  padding: 4px;
}
```

- [ ] **Step 3: Render persistent FAB showing status**

In the FAB rendering section of `VenueMap.jsx`:
```javascript
      {/* GPS Status / Center FAB */}
      {viewMode === 'map' && (
        <button
          className={`map-fab ${!userPosition ? 'gps-warning' : ''}`}
          onClick={userPosition ? centerOnMe : requestNavigationLocation}
          aria-label={t.centerOnMe}
        >
          {userPosition ? <Crosshair size={22} /> : <MapPin size={22} className="warning-pulse" />}
        </button>
      )}
```

Add warning pulse CSS to `src/index.css`:
```css
.map-fab.gps-warning {
  border-color: #e53e3e;
  background: rgba(229, 62, 62, 0.2);
}

.map-fab.gps-warning .warning-pulse {
  color: #e53e3e;
  animation: pulse-red 1.5s infinite;
}

@keyframes pulse-red {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.6; }
  100% { transform: scale(1); opacity: 1; }
}
```

- [ ] **Step 4: Commit task 4**

```bash
git add src/components/VenueMap.jsx src/index.css
git commit -m "feat: implement GPS onboarding card and location status FAB"
```

---

### Task 5: Implement Two-Stage Compass Calibration

**Files:**
- Modify: `src/components/VenueMap.jsx`

- [ ] **Step 1: Load and add compassOffset state**

Initialize the offset in `VenueMap.jsx` using `localStorage`:
```javascript
  const [compassOffset, setCompassOffset] = useState(() => {
    const saved = localStorage.getItem('ozora_compass_offset');
    return saved ? parseFloat(saved) : 0;
  });
```

Pass `compassOffset` and setter to `CompassCard`:
```javascript
            <CompassCard
              target={compassTarget}
              userPosition={userPosition}
              locationStatus={locationStatus}
              lang={lang}
              onClose={() => setCompassTarget(null)}
              onRequestLocation={requestNavigationLocation}
              compassOffset={compassOffset}
              onSetCompassOffset={(offset) => {
                setCompassOffset(offset);
                localStorage.setItem('ozora_compass_offset', offset.toString());
              }}
            />
```

- [ ] **Step 2: Update needle calculation and add calibration UI in CompassCard**

Modify `CompassCard` inside `src/components/VenueMap.jsx`:
1. Use `compassOffset` in the needle calculation:
```javascript
  const needleRotation = heading != null ? bearing - (heading + compassOffset) : 0;
```

2. Add a calibration state inside `CompassCard`:
```javascript
  const [showCalibrationGuide, setShowCalibrationGuide] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState('ozora-stage');
```

3. Render the calibration guide and manual landmark selector inside the body:
```javascript
        <button 
          className="compass-calibrate-trigger" 
          onClick={() => setShowCalibrationGuide(prev => !prev)}
        >
          {isHe ? '📍 המצפן מזייף? כייל כיוון' : '📍 Compass off? Calibrate direction'}
        </button>

        {showCalibrationGuide && (
          <div className="compass-calibration-panel">
            <div className="calibration-section">
              <h4>1. {isHe ? 'כיול חיישן' : 'Sensor Calibration'}</h4>
              <p>{isHe ? 'הנף את הטלפון בתנועת 8 באוויר מספר פעמים כדי לאפס את החיישן.' : 'Wave your phone in a figure-8 motion to reset physical sensors.'}</p>
              <div className="figure-8-animation">∞</div>
            </div>

            {userPosition && (
              <div className="calibration-section">
                <h4>2. {isHe ? 'כיול ידני מול נקודת ייחוס' : 'Manual Landmark Alignment'}</h4>
                <p>{isHe ? 'הפנה את חלקו העליון של הטלפון לנקודה מוכרת שאתה רואה מולך ולחץ על כפתור הכיול:' : 'Point your phone top at a landmark in front of you and tap calibrate:'}</p>
                
                <select 
                  value={selectedLandmark} 
                  onChange={(e) => setSelectedLandmark(e.target.value)}
                  className="landmark-select"
                >
                  <option value="ozora-stage">{isHe ? 'במת אוזורה הראשית' : 'Ozora Main Stage'}</option>
                  <option value="pumpui">{isHe ? 'פאמפוי' : 'Pumpui'}</option>
                  <option value="art-world-tree">{isHe ? 'עץ העולם Világfa' : 'World Tree'}</option>
                </select>

                <button 
                  className="landmark-align-btn" 
                  onClick={() => {
                    if (heading != null) {
                      const landmarks = {
                        'ozora-stage': [46.773164, 18.435942],
                        'pumpui': [46.769936, 18.433367],
                        'art-world-tree': [46.7732, 18.4360]
                      };
                      const coords = landmarks[selectedLandmark];
                      if (coords) {
                        const calculatedB = calculateBearing(
                          userPosition.lat, 
                          userPosition.lng, 
                          coords[0], 
                          coords[1]
                        );
                        // Calculate offset
                        const newOffset = (calculatedB - heading + 360) % 360;
                        onSetCompassOffset(newOffset);
                        alert(isHe ? 'המצפן כויל בהצלחה!' : 'Compass calibrated successfully!');
                      }
                    }
                  }}
                >
                  {isHe ? 'אני מסתכל ישר אל נקודה זו' : 'I am looking directly at this spot'}
                </button>
              </div>
            )}
          </div>
        )}
```

Add CSS for these calibration components in `src/index.css`:
```css
.compass-calibrate-trigger {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 0.8rem;
  margin-top: 10px;
  cursor: pointer;
  text-decoration: underline;
}

.compass-calibration-panel {
  margin-top: 12px;
  border-top: 1px solid var(--border);
  padding-top: 12px;
  text-align: start;
}

.calibration-section {
  margin-bottom: 14px;
}

.calibration-section h4 {
  font-size: 0.85rem;
  margin: 0 0 4px 0;
  color: var(--text-primary);
}

.calibration-section p {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
}

.figure-8-animation {
  font-size: 24px;
  text-align: center;
  animation: sway 2s ease-in-out infinite;
  color: var(--primary);
}

@keyframes sway {
  0%, 100% { transform: rotate(-15deg); }
  50% { transform: rotate(15deg); }
}

.landmark-select {
  width: 100%;
  padding: 6px;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text-primary);
  border-radius: 4px;
  margin: 6px 0;
}

.landmark-align-btn {
  width: 100%;
  padding: 8px;
  background: var(--surface-hover);
  color: #fff;
  border: 1px solid var(--primary);
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}
```

- [ ] **Step 3: Commit task 5**

```bash
git add src/components/VenueMap.jsx src/index.css
git commit -m "feat: implement two-stage compass calibration system"
```
