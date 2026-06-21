import { useState, useRef, useEffect } from 'react';
import { Share2, Link, QrCode, Image } from 'lucide-react';
import { translations } from '../utils/lang';
import QRCodeModal from './QRCodeModal';

export default function ShareMenu({ shareUrl, lang, onCopyLink, onExportImage }) {
  const [open, setOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const menuRef = useRef(null);
  const t = translations[lang];

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="share-menu-wrapper" ref={menuRef}>
      <button className="share-schedule-btn" onClick={() => setOpen(!open)}>
        <Share2 size={16} />
        <span>{t.shareSchedule}</span>
      </button>

      {open && (
        <div className="share-menu-dropdown">
          <button onClick={() => { onCopyLink(); setOpen(false); }}>
            <Link size={14} />
            <span>{t.copyLink}</span>
          </button>
          <button onClick={() => { setShowQR(true); setOpen(false); }}>
            <QrCode size={14} />
            <span>{t.showQR}</span>
          </button>
          <button onClick={() => { onExportImage(); setOpen(false); }}>
            <Image size={14} />
            <span>{t.exportImage}</span>
          </button>
        </div>
      )}

      {showQR && (
        <QRCodeModal url={shareUrl} lang={lang} onClose={() => setShowQR(false)} />
      )}
    </div>
  );
}
