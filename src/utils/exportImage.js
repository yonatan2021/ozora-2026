import { getSetUniqueKey } from './time';
import { getConflictsForSet, getConflictPartner } from './conflicts';
import logoSrc from '../assets/logo.png';
import QRCode from 'qrcode';

const STAGE_COLORS = {
  "OZORA STAGE": "#e64d7a",
  "PUMPUI": "#3db86e",
  "THE DOME": "#5a94d4",
  "DRAGON NEST / COOKING GROOVE": "#d4a03a",
  "VISIUM GARDEN": "#c0a840",
  "TEK ZERO (2000s Trance)": "#9955dd"
};

const STAGE_GLOW_COLORS = {
  "OZORA STAGE": "rgba(230, 77, 122, 0.12)",
  "PUMPUI": "rgba(61, 184, 110, 0.12)",
  "THE DOME": "rgba(90, 148, 212, 0.12)",
  "DRAGON NEST / COOKING GROOVE": "rgba(212, 160, 58, 0.12)",
  "VISIUM GARDEN": "rgba(192, 168, 64, 0.12)",
  "TEK ZERO (2000s Trance)": "rgba(153, 85, 221, 0.12)"
};

const DAY_DATES = {
  "Warmup Sat": "25/7",
  "Warmup Sun": "26/7",
  "DAY 1": "27/7",
  "DAY 2": "28/7",
  "DAY 3": "29/7",
  "DAY 4": "30/7",
  "DAY 5": "31/7",
  "DAY 6": "1/8",
  "DAY 7": "2/8"
};

const DAY_WEEKDAYS_HE = {
  "Warmup Sat": "שבת",
  "Warmup Sun": "ראשון",
  "DAY 1": "שני",
  "DAY 2": "שלישי",
  "DAY 3": "רביעי",
  "DAY 4": "חמישי",
  "DAY 5": "שישי",
  "DAY 6": "שבת",
  "DAY 7": "ראשון"
};

const DAY_WEEKDAYS_EN = {
  "Warmup Sat": "Sat",
  "Warmup Sun": "Sun",
  "DAY 1": "Mon",
  "DAY 2": "Tue",
  "DAY 3": "Wed",
  "DAY 4": "Thu",
  "DAY 5": "Fri",
  "DAY 6": "Sat",
  "DAY 7": "Sun"
};

const WIDTH = 1080;
const PADDING = 56;
const CONTENT_WIDTH = WIDTH - PADDING * 2;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let settled = false;
    const settle = (fn) => (...args) => {
      if (settled) return;
      settled = true;
      fn(...args);
    };
    img.onload = settle(() => resolve(img));
    img.onerror = settle(reject);
    img.src = src;
    setTimeout(settle(() => reject(new Error('image load timed out'))), 2000);
  });
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawSacredGeometry(ctx, w, h, theme) {
  const isDay = theme === 'theme-day';
  ctx.save();
  ctx.strokeStyle = isDay ? 'rgba(160, 120, 200, 0.08)' : 'rgba(140, 80, 220, 0.12)';
  ctx.lineWidth = 1;

  // Draw interlocking circles (Flower of Life style) at top and bottom
  const centers = [
    { x: w / 2, y: h * 0.25 },
    { x: w / 2, y: h * 0.75 }
  ];

  for (const c of centers) {
    const radius = 180;
    // Center circle
    ctx.beginPath();
    ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Outer rings
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const rx = c.x + radius * Math.cos(angle);
      const ry = c.y + radius * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(rx, ry, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawCosmicBackground(ctx, w, h, theme = 'theme-night') {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  if (theme === 'theme-day') {
    grad.addColorStop(0, '#faf8f5');
    grad.addColorStop(1, '#f2ede4');
  } else if (theme === 'theme-sunset') {
    grad.addColorStop(0, '#18040a');
    grad.addColorStop(1, '#381008');
  } else if (theme === 'theme-sunrise') {
    grad.addColorStop(0, '#05091a');
    grad.addColorStop(1, '#082c30');
  } else {
    grad.addColorStop(0, '#0a0518');
    grad.addColorStop(0.3, '#0e0824');
    grad.addColorStop(0.7, '#12082e');
    grad.addColorStop(1, '#0a0518');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  drawSacredGeometry(ctx, w, h, theme);

  let glowColor1 = 'rgba(120, 40, 180, 0.16)';
  let glowColor2 = 'rgba(40, 180, 140, 0.10)';
  let glowColor3 = 'rgba(180, 40, 100, 0.08)';

  if (theme === 'theme-day') {
    glowColor1 = 'rgba(230, 210, 180, 0.12)';
    glowColor2 = 'rgba(230, 210, 180, 0.08)';
    glowColor3 = 'rgba(230, 210, 180, 0.06)';
  } else if (theme === 'theme-sunset') {
    glowColor1 = 'rgba(230, 96, 64, 0.15)';
    glowColor2 = 'rgba(230, 96, 64, 0.10)';
    glowColor3 = 'rgba(230, 96, 64, 0.08)';
  } else if (theme === 'theme-sunrise') {
    glowColor1 = 'rgba(40, 180, 180, 0.12)';
    glowColor2 = 'rgba(40, 180, 180, 0.08)';
    glowColor3 = 'rgba(40, 180, 180, 0.06)';
  }

  const glow1 = ctx.createRadialGradient(w * 0.15, h * 0.12, 0, w * 0.15, h * 0.12, w * 0.6);
  glow1.addColorStop(0, glowColor1);
  glow1.addColorStop(1, 'transparent');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, w, h);

  const glow2 = ctx.createRadialGradient(w * 0.85, h * 0.6, 0, w * 0.85, h * 0.6, w * 0.5);
  glow2.addColorStop(0, glowColor2);
  glow2.addColorStop(1, 'transparent');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, w, h);

  const glow3 = ctx.createRadialGradient(w * 0.5, h * 0.9, 0, w * 0.5, h * 0.9, w * 0.35);
  glow3.addColorStop(0, glowColor3);
  glow3.addColorStop(1, 'transparent');
  ctx.fillStyle = glow3;
  ctx.fillRect(0, 0, w, h);
}

function drawGradientSeparator(ctx, y, inset, theme = 'theme-night') {
  const sep = ctx.createLinearGradient(PADDING + inset, 0, WIDTH - PADDING - inset, 0);
  sep.addColorStop(0, 'transparent');
  if (theme === 'theme-day') {
    sep.addColorStop(0.3, 'rgba(160, 120, 200, 0.25)');
    sep.addColorStop(0.5, 'rgba(160, 120, 200, 0.4)');
    sep.addColorStop(0.7, 'rgba(160, 120, 200, 0.25)');
  } else {
    sep.addColorStop(0.3, 'rgba(140, 80, 220, 0.35)');
    sep.addColorStop(0.5, 'rgba(140, 80, 220, 0.55)');
    sep.addColorStop(0.7, 'rgba(140, 80, 220, 0.35)');
  }
  sep.addColorStop(1, 'transparent');
  ctx.strokeStyle = sep;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING + inset, y);
  ctx.lineTo(WIDTH - PADDING - inset, y);
  ctx.stroke();
}

export async function exportScheduleAsImage({ groupedByDay, priorities, conflicts, lang, scheduleName, theme = 'theme-night', shareUrl }) {
  if (document.fonts) {
    await document.fonts.ready;
  }
  const isHe = lang === 'he';
  const siteUrl = 'yonatan2021.github.io/ozora-2026';
  const isDay = theme === 'theme-day';

  const dayEntries = Object.entries(groupedByDay);
  let totalSets = 0;
  dayEntries.forEach(([, sets]) => { totalSets += sets.length; });

  const logoHeight = 90;
  const headerHeight = logoHeight + 40;
  const titleHeight = scheduleName ? 90 : 50;
  const dayHeaderHeight = 56;
  const setRowHeight = 44;
  const dayGap = 28;
  const footerHeight = 110;
  const estimatedHeight = headerHeight + titleHeight + dayEntries.length * (dayHeaderHeight + dayGap) + totalSets * setRowHeight + footerHeight + PADDING * 2 + 20 + (shareUrl ? 50 : 0);

  const SCALE_FACTOR = 2.5;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH * SCALE_FACTOR;
  canvas.height = estimatedHeight * SCALE_FACTOR;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE_FACTOR, SCALE_FACTOR);

  drawCosmicBackground(ctx, WIDTH, estimatedHeight, theme);

  let y = PADDING;

  // Logo — elliptical mask with heavy radial vignette to blend into dark bg
  try {
    const logoImg = await loadImage(logoSrc);
    const logoW = (logoImg.width / logoImg.height) * logoHeight;
    const logoX = (WIDTH - logoW) / 2;
    const logoCX = logoX + logoW / 2;
    const logoCY = y + logoHeight / 2;

    // Draw logo into offscreen canvas with radial alpha mask
    const logoCanvas = document.createElement('canvas');
    logoCanvas.width = WIDTH * SCALE_FACTOR;
    logoCanvas.height = estimatedHeight * SCALE_FACTOR;
    const lCtx = logoCanvas.getContext('2d');
    lCtx.scale(SCALE_FACTOR, SCALE_FACTOR);

    lCtx.drawImage(logoImg, logoX, y, logoW, logoHeight);

    // Apply radial gradient as alpha mask — heavy fade at edges
    lCtx.globalCompositeOperation = 'destination-in';
    const mask = lCtx.createRadialGradient(logoCX, logoCY, logoHeight * 0.22, logoCX, logoCY, logoHeight * 0.55);
    mask.addColorStop(0, 'rgba(255,255,255,1)');
    mask.addColorStop(0.6, 'rgba(255,255,255,0.9)');
    mask.addColorStop(0.85, 'rgba(255,255,255,0.3)');
    mask.addColorStop(1, 'rgba(255,255,255,0)');
    lCtx.fillStyle = mask;
    lCtx.fillRect(0, 0, WIDTH, estimatedHeight);

    // Glow behind logo
    ctx.save();
    ctx.shadowColor = isDay ? 'rgba(160, 120, 200, 0.2)' : 'rgba(140, 60, 200, 0.3)';
    ctx.shadowBlur = 50;
    ctx.fillStyle = isDay ? 'rgba(160, 120, 200, 0.05)' : 'rgba(140, 60, 200, 0.06)';
    ctx.beginPath();
    ctx.ellipse(logoCX, logoCY, logoW * 0.45, logoHeight * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Composite logo with mask onto main canvas
    ctx.drawImage(logoCanvas, 0, 0, WIDTH, estimatedHeight);

    y += logoHeight + 16;
  } catch {
    y += 20;
  }

  // Title — personalized if name exists
  ctx.textAlign = 'center';
  if (scheduleName) {
    // Two-line: name prominently, then subtitle
    ctx.fillStyle = isDay ? '#332244' : '#eee0ff';
    ctx.font = "800 28px 'Orbitron', 'Heebo', sans-serif";
    ctx.save();
    ctx.shadowColor = isDay ? 'rgba(160, 120, 200, 0.2)' : 'rgba(140, 60, 200, 0.4)';
    ctx.shadowBlur = 20;
    const nameTitle = isHe ? `הלוח של ${scheduleName}` : `${scheduleName}'s Schedule`;
    ctx.fillText(nameTitle, WIDTH / 2, y + 28);
    ctx.restore();

    ctx.fillStyle = isDay ? 'rgba(51, 34, 68, 0.75)' : 'rgba(212, 184, 255, 0.6)';
    ctx.font = "600 16px 'Exo 2', 'Heebo', sans-serif";
    ctx.fillText('Ozora Festival 2026', WIDTH / 2, y + 54);
    y += titleHeight;
  } else {
    const title = isHe ? 'הלוח שלי — אוזורה 2026' : 'My Ozora 2026 Schedule';
    ctx.fillStyle = isDay ? '#332244' : '#eee0ff';
    ctx.font = "800 28px 'Orbitron', 'Heebo', sans-serif";
    ctx.save();
    ctx.shadowColor = isDay ? 'rgba(160, 120, 200, 0.2)' : 'rgba(140, 60, 200, 0.4)';
    ctx.shadowBlur = 20;
    ctx.fillText(title, WIDTH / 2, y + 30);
    ctx.restore();
    y += titleHeight;
  }

  drawGradientSeparator(ctx, y, 80, theme);
  y += 20;

  ctx.textAlign = isHe ? 'right' : 'left';

  dayEntries.forEach(([day, sets]) => {
    let dayLabel = day;
    if (isHe) {
      dayLabel = day
        .replace('DAY', 'יום')
        .replace('Warmup Sat', 'חימום שבת')
        .replace('Warmup Sun', 'חימום ראשון');
    }

    const dateStr = DAY_DATES[day] || '';
    const weekday = isHe ? (DAY_WEEKDAYS_HE[day] || '') : (DAY_WEEKDAYS_EN[day] || '');

    // Day header background
    const dayBgGrad = ctx.createLinearGradient(PADDING, 0, WIDTH - PADDING, 0);
    const dayHeaderBgColor = isDay ? 'rgba(160, 120, 200, 0.15)' : 'rgba(140, 80, 220, 0.10)';
    dayBgGrad.addColorStop(0, isHe ? 'transparent' : dayHeaderBgColor);
    dayBgGrad.addColorStop(1, isHe ? dayHeaderBgColor : 'transparent');
    ctx.fillStyle = dayBgGrad;
    drawRoundedRect(ctx, PADDING, y, CONTENT_WIDTH, dayHeaderHeight - 8, 10);
    ctx.fill();

    // Day name
    const textX = isHe ? WIDTH - PADDING - 16 : PADDING + 16;
    ctx.fillStyle = isDay ? '#332244' : '#d4b8ff';
    ctx.font = "700 20px 'Orbitron', 'Heebo', sans-serif";
    ctx.textAlign = isHe ? 'right' : 'left';
    ctx.fillText(dayLabel, textX, y + 30);

    // Date + weekday on opposite side
    if (dateStr) {
      const dateDisplay = isHe ? `יום ${weekday} · ${dateStr}` : `${weekday} · ${dateStr}`;
      ctx.fillStyle = isDay ? 'rgba(51, 34, 68, 0.75)' : 'rgba(212, 184, 255, 0.5)';
      ctx.font = "500 14px 'Exo 2', 'Heebo', sans-serif";
      const dateX = isHe ? PADDING + 16 : WIDTH - PADDING - 16;
      ctx.textAlign = isHe ? 'left' : 'right';
      ctx.fillText(dateDisplay, dateX, y + 30);
    }

    ctx.textAlign = isHe ? 'right' : 'left';
    y += dayHeaderHeight;

    sets.forEach(set => {
      const key = getSetUniqueKey(set);
      const priority = priorities[key];
      const setConflicts = getConflictsForSet(set.id, conflicts);
      const stageColor = STAGE_COLORS[set.stage] || '#888';
      const stageGlow = STAGE_GLOW_COLORS[set.stage] || 'rgba(136, 136, 136, 0.08)';
      const alpha = priority === 'maybe' ? 0.45 : 1.0;

      if (priority === 'must') {
        ctx.fillStyle = isDay ? 'rgba(230, 96, 64, 0.15)' : 'rgba(230, 96, 64, 0.12)';
        drawRoundedRect(ctx, PADDING + 4, y + 2, CONTENT_WIDTH - 8, setRowHeight - 4, 6);
        ctx.fill();
      } else {
        ctx.fillStyle = isDay ? 'rgba(160, 120, 200, 0.08)' : stageGlow;
        drawRoundedRect(ctx, PADDING + 4, y + 2, CONTENT_WIDTH - 8, setRowHeight - 4, 6);
        ctx.fill();
      }

      ctx.globalAlpha = alpha;

      // Stage dot with glow
      ctx.fillStyle = stageColor;
      ctx.save();
      ctx.shadowColor = stageColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      const dotX = isHe ? WIDTH - PADDING - 14 : PADDING + 14;
      ctx.arc(dotX, y + setRowHeight / 2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Artist name
      ctx.fillStyle = isDay ? '#332244' : '#eee0ff';
      ctx.font = "600 15px 'Exo 2', 'Heebo', sans-serif";
      const artistX = isHe ? WIDTH - PADDING - 30 : PADDING + 30;
      ctx.textAlign = isHe ? 'right' : 'left';
      ctx.fillText(set.artist, artistX, y + 27);

      // Stage name
      const stageName = set.stage
        .replace(' / COOKING GROOVE', '')
        .replace(' (2000s Trance)', '');
      ctx.fillStyle = isDay ? 'rgba(51, 34, 68, 0.75)' : 'rgba(212, 184, 255, 0.5)';
      ctx.font = "400 12px 'Exo 2', 'Heebo', sans-serif";
      const stageX = isHe ? PADDING + 140 : WIDTH - PADDING - 140;
      ctx.textAlign = isHe ? 'left' : 'right';
      ctx.fillText(stageName, stageX, y + 26);

      // Time
      ctx.fillStyle = isDay ? 'rgba(51, 34, 68, 0.75)' : 'rgba(212, 184, 255, 0.7)';
      ctx.font = "500 13px 'Exo 2', 'Heebo', sans-serif";
      const timeStr = `${set.start}–${set.end}`;
      const timeX = isHe ? PADDING + 16 : WIDTH - PADDING - 16;
      ctx.textAlign = isHe ? 'left' : 'right';
      ctx.fillText(timeStr, timeX, y + 26);

      // Must badge
      if (priority === 'must') {
        const mustLabel = isHe ? 'חובה' : 'MUST';
        ctx.textAlign = isHe ? 'right' : 'left';
        ctx.font = "600 15px 'Exo 2', 'Heebo', sans-serif";
        const artistWidth = ctx.measureText(set.artist).width;
        ctx.fillStyle = '#e86040';
        ctx.font = "700 9px 'Exo 2', 'Heebo', sans-serif";
        const labelOffset = isHe ? -artistWidth - 14 : artistWidth + 14;
        ctx.fillText(mustLabel, artistX + labelOffset, y + 26);
      }

      // Conflict warning
      if (setConflicts.length > 0) {
        ctx.fillStyle = '#d4a843';
        ctx.font = "400 10px 'Exo 2', 'Heebo', sans-serif";
        const conflictText = setConflicts.map(c => getConflictPartner(set.id, c).artist).join(', ');
        ctx.textAlign = isHe ? 'right' : 'left';
        ctx.fillText(`⚠ ${conflictText}`, artistX, y + 38);
      }

      ctx.globalAlpha = 1.0;
      ctx.textAlign = isHe ? 'right' : 'left';

      y += setRowHeight;
    });

    y += dayGap;
  });

  let qrImg = null;
  if (shareUrl) {
    try {
      const isDay = theme === 'theme-day';
      const qrDataUrl = await QRCode.toDataURL(shareUrl, {
        margin: 1,
        width: 180, // High-res width
        color: {
          dark: isDay ? '#332244' : '#eee0ff',
          light: isDay ? '#faf8f5' : '#0a0518'
        }
      });
      qrImg = await loadImage(qrDataUrl);
    } catch (e) {
      console.error('Failed to generate QR code', e);
    }
  }

  // Footer
  y += 8;
  drawGradientSeparator(ctx, y, 60, theme);
  y += 28;

  const yBeforeFooterText = y;

  if (qrImg) {
    ctx.save();
    const qrSize = 90;
    const qrX = isHe ? PADDING : WIDTH - PADDING - qrSize;
    const qrY = y - 10; // Align with the siteUrl
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    // Draw a tiny label under the QR code
    ctx.fillStyle = isDay ? 'rgba(51, 34, 68, 0.45)' : 'rgba(212, 184, 255, 0.35)';
    ctx.font = "600 9px 'Exo 2', 'Heebo', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(isHe ? 'סרוק לייבוא' : 'Scan to import', qrX + qrSize / 2, qrY + qrSize + 12);
    ctx.restore();
  }

  // Site URL
  ctx.fillStyle = isDay ? '#332244' : '#d4b8ff';
  ctx.font = "600 15px 'Exo 2', 'Heebo', sans-serif";
  ctx.textAlign = 'center';
  ctx.save();
  ctx.shadowColor = isDay ? 'rgba(160, 120, 200, 0.2)' : 'rgba(140, 60, 200, 0.3)';
  ctx.shadowBlur = 12;
  ctx.fillText(siteUrl, WIDTH / 2, y);
  ctx.restore();
  y += 24;

  // Tagline
  const tagline = isHe ? 'בנה את הלוח שלך עכשיו' : 'Build your schedule now';
  ctx.fillStyle = isDay ? 'rgba(51, 34, 68, 0.75)' : 'rgba(212, 184, 255, 0.45)';
  ctx.font = "400 12px 'Exo 2', 'Heebo', sans-serif";
  ctx.fillText(tagline, WIDTH / 2, y);
  y += 22;

  // Copyright
  ctx.fillStyle = isDay ? 'rgba(51, 34, 68, 0.4)' : 'rgba(212, 184, 255, 0.2)';
  ctx.font = "400 10px 'Exo 2', 'Heebo', sans-serif";
  ctx.fillText('© 2026 Bersaglio', WIDTH / 2, y);

  if (qrImg) {
    y = Math.max(y, yBeforeFooterText - 10 + 90 + 12);
  }

  // Trim canvas to actual content
  const finalHeight = y + PADDING;
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = WIDTH * SCALE_FACTOR;
  finalCanvas.height = finalHeight * SCALE_FACTOR;
  const fCtx = finalCanvas.getContext('2d');
  drawCosmicBackground(fCtx, WIDTH * SCALE_FACTOR, finalHeight * SCALE_FACTOR, theme);
  fCtx.drawImage(canvas, 0, 0);

  const blob = await new Promise(resolve => finalCanvas.toBlob(resolve, 'image/png'));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ozora-2026-schedule.png';
  a.click();
  URL.revokeObjectURL(url);
}

export function exportScheduleToCsv({ groupedByDay, priorities = {}, conflicts, notes = {}, lang }) {
  const isHe = lang === 'he';
  let csvContent = isHe
    ? "יום,תאריך,שעה,אמן,במה,עדיפות,קונפליקטים,הערות\n"
    : "Day,Date,Time,Artist,Stage,Priority,Conflicts,Notes\n";

  const PRIORITY_LABELS = {
    he: { must: 'חובה', want: 'רוצה', maybe: 'אולי' },
    en: { must: 'Must', want: 'Want', maybe: 'Maybe' }
  };

  for (const [day, sets] of Object.entries(groupedByDay)) {
    const dateStr = DAY_DATES[day] || '';
    for (const set of sets) {
      const key = getSetUniqueKey(set);
      const priorityVal = priorities[key] || '';
      const priorityText = PRIORITY_LABELS[lang === 'he' ? 'he' : 'en'][priorityVal] || '';

      const setConflicts = getConflictsForSet(set.id, conflicts || []);
      const conflictPartnerNames = setConflicts.map(c => {
        const partner = getConflictPartner(set.id, c);
        return partner ? partner.artist : '';
      }).filter(Boolean).join(', ');

      const noteText = notes[key] || '';

      const artistEsc = (set.artist || '').replace(/"/g, '""');
      const stageEsc = (set.stage || '').replace(/"/g, '""');
      const timeStr = `${set.start}-${set.end}`;
      const conflictsEsc = conflictPartnerNames.replace(/"/g, '""');
      const notesEsc = noteText.replace(/"/g, '""');

      csvContent += `"${day}","${dateStr}","${timeStr}","${artistEsc}","${stageEsc}","${priorityText}","${conflictsEsc}","${notesEsc}"\n`;
    }
  }

  // Prepend UTF-8 BOM so Excel opens it correctly with Hebrew characters
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ozora-2026-schedule.csv`;
  a.click();
  URL.revokeObjectURL(url);
}


