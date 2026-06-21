import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import QRCode from 'qrcode';
import { translations } from '../utils/lang';

export default function QRCodeModal({ url, lang, onClose }) {
  const canvasRef = useRef(null);
  const t = translations[lang];

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 280,
        margin: 2,
        color: {
          dark: '#f0e6ff',
          light: '#0b0713'
        }
      });
    }
  }, [url]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        <h3 className="qr-modal-title">{t.qrTitle}</h3>
        <canvas ref={canvasRef} className="qr-canvas" />
        <p className="qr-modal-hint">
          {lang === 'he'
            ? 'החבר/ה סורק/ת את הקוד עם מצלמת הטלפון'
            : 'Friend scans this code with their phone camera'}
        </p>
      </div>
    </div>
  );
}
