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
        <button className="calibration-close" onClick={onClose} aria-label={isHe ? "סגור" : "Close"}>
          <X size={18} />
        </button>
        
        <div className="calibration-header">
          <Navigation className="calibration-icon animate-pulse" size={24} style={{ transform: 'rotate(45deg)' }} />
          <h3>{isHe ? 'כיול מיקום האוהל שלי' : 'Calibrating My Camp Location'}</h3>
        </div>

        <div className="calibration-body">
          <div className="sacred-geometry-loader">
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
