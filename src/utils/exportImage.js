import { getSetUniqueKey } from './time';
import { getConflictsForSet, getConflictPartner } from './conflicts';
import logoSrc from '../assets/logo.png';

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

const WIDTH = 1080;
const PADDING = 56;
const CONTENT_WIDTH = WIDTH - PADDING * 2;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
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

export function generateScheduleImage({ groupedByDay, priorities, conflicts, lang, scheduleName }) {
  const isHe = lang === 'he';
  const title = scheduleName
    ? (isHe ? `${scheduleName} — אוזורה 2026` : `${scheduleName} — Ozora 2026`)
    : (isHe ? 'הלוח שלי — אוזורה 2026' : 'My Ozora 2026 Schedule');
  const siteUrl = 'yonatan2021.github.io/ozora-2026';

  const dayEntries = Object.entries(groupedByDay);
  let totalSets = 0;
  dayEntries.forEach(([, sets]) => { totalSets += sets.length; });

  const logoHeight = 80;
  const headerHeight = logoHeight + 64;
  const titleHeight = 52;
  const dayHeaderHeight = 48;
  const setRowHeight = 44;
  const dayGap = 24;
  const footerHeight = 80;
  const estimatedHeight = headerHeight + titleHeight + dayEntries.length * (dayHeaderHeight + dayGap) + totalSets * setRowHeight + footerHeight + PADDING * 2;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = estimatedHeight;
  const ctx = canvas.getContext('2d');

  // Night-sky gradient background matching site's night theme
  const grad = ctx.createLinearGradient(0, 0, 0, estimatedHeight);
  grad.addColorStop(0, '#0a0518');
  grad.addColorStop(0.3, '#0e0824');
  grad.addColorStop(0.7, '#12082e');
  grad.addColorStop(1, '#0a0518');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, estimatedHeight);

  // Cosmic atmosphere — radial glows like the site's body::before
  const glow1 = ctx.createRadialGradient(WIDTH * 0.15, estimatedHeight * 0.15, 0, WIDTH * 0.15, estimatedHeight * 0.15, WIDTH * 0.6);
  glow1.addColorStop(0, 'rgba(120, 40, 180, 0.18)');
  glow1.addColorStop(1, 'transparent');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, WIDTH, estimatedHeight);

  const glow2 = ctx.createRadialGradient(WIDTH * 0.85, estimatedHeight * 0.65, 0, WIDTH * 0.85, estimatedHeight * 0.65, WIDTH * 0.5);
  glow2.addColorStop(0, 'rgba(40, 180, 140, 0.12)');
  glow2.addColorStop(1, 'transparent');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, WIDTH, estimatedHeight);

  const glow3 = ctx.createRadialGradient(WIDTH * 0.5, estimatedHeight * 0.9, 0, WIDTH * 0.5, estimatedHeight * 0.9, WIDTH * 0.4);
  glow3.addColorStop(0, 'rgba(180, 40, 100, 0.10)');
  glow3.addColorStop(1, 'transparent');
  ctx.fillStyle = glow3;
  ctx.fillRect(0, 0, WIDTH, estimatedHeight);

  let y = PADDING;

  return { canvas, ctx, y, isHe, title, siteUrl, dayEntries, priorities, conflicts, headerHeight, logoHeight, titleHeight, dayHeaderHeight, setRowHeight, dayGap, footerHeight, estimatedHeight };
}

export async function exportScheduleAsImage({ groupedByDay, priorities, conflicts, lang, scheduleName }) {
  const isHe = lang === 'he';
  const title = scheduleName
    ? (isHe ? `${scheduleName} — אוזורה 2026` : `${scheduleName} — Ozora 2026`)
    : (isHe ? 'הלוח שלי — אוזורה 2026' : 'My Ozora 2026 Schedule');
  const siteUrl = 'yonatan2021.github.io/ozora-2026';

  const dayEntries = Object.entries(groupedByDay);
  let totalSets = 0;
  dayEntries.forEach(([, sets]) => { totalSets += sets.length; });

  const logoHeight = 80;
  const headerHeight = logoHeight + 48;
  const titleHeight = 56;
  const dayHeaderHeight = 48;
  const setRowHeight = 44;
  const dayGap = 28;
  const footerHeight = 100;
  const estimatedHeight = headerHeight + titleHeight + dayEntries.length * (dayHeaderHeight + dayGap) + totalSets * setRowHeight + footerHeight + PADDING * 2 + 20;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = estimatedHeight;
  const ctx = canvas.getContext('2d');

  // Night-sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, estimatedHeight);
  grad.addColorStop(0, '#0a0518');
  grad.addColorStop(0.3, '#0e0824');
  grad.addColorStop(0.7, '#12082e');
  grad.addColorStop(1, '#0a0518');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, estimatedHeight);

  // Cosmic atmosphere glows
  const glow1 = ctx.createRadialGradient(WIDTH * 0.15, estimatedHeight * 0.12, 0, WIDTH * 0.15, estimatedHeight * 0.12, WIDTH * 0.6);
  glow1.addColorStop(0, 'rgba(120, 40, 180, 0.16)');
  glow1.addColorStop(1, 'transparent');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, WIDTH, estimatedHeight);

  const glow2 = ctx.createRadialGradient(WIDTH * 0.85, estimatedHeight * 0.6, 0, WIDTH * 0.85, estimatedHeight * 0.6, WIDTH * 0.5);
  glow2.addColorStop(0, 'rgba(40, 180, 140, 0.10)');
  glow2.addColorStop(1, 'transparent');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, WIDTH, estimatedHeight);

  const glow3 = ctx.createRadialGradient(WIDTH * 0.5, estimatedHeight * 0.9, 0, WIDTH * 0.5, estimatedHeight * 0.9, WIDTH * 0.35);
  glow3.addColorStop(0, 'rgba(180, 40, 100, 0.08)');
  glow3.addColorStop(1, 'transparent');
  ctx.fillStyle = glow3;
  ctx.fillRect(0, 0, WIDTH, estimatedHeight);

  let y = PADDING;

  // Logo
  try {
    const logoImg = await loadImage(logoSrc);
    const logoW = (logoImg.width / logoImg.height) * logoHeight;
    const logoX = (WIDTH - logoW) / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(140, 60, 200, 0.3)';
    ctx.shadowBlur = 30;
    ctx.drawImage(logoImg, logoX, y, logoW, logoHeight);
    ctx.restore();
    y += logoHeight + 20;
  } catch {
    y += 20;
  }

  // Title
  ctx.fillStyle = '#eee0ff';
  ctx.font = "800 30px 'Orbitron', 'Heebo', sans-serif";
  ctx.textAlign = 'center';
  ctx.save();
  ctx.shadowColor = 'rgba(140, 60, 200, 0.4)';
  ctx.shadowBlur = 20;
  ctx.fillText(title, WIDTH / 2, y + 30);
  ctx.restore();
  y += titleHeight;

  // Thin separator under title
  const sepGrad = ctx.createLinearGradient(PADDING + 80, 0, WIDTH - PADDING - 80, 0);
  sepGrad.addColorStop(0, 'transparent');
  sepGrad.addColorStop(0.3, 'rgba(140, 80, 220, 0.4)');
  sepGrad.addColorStop(0.5, 'rgba(140, 80, 220, 0.6)');
  sepGrad.addColorStop(0.7, 'rgba(140, 80, 220, 0.4)');
  sepGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = sepGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING + 80, y);
  ctx.lineTo(WIDTH - PADDING - 80, y);
  ctx.stroke();
  y += 16;

  ctx.textAlign = isHe ? 'right' : 'left';

  dayEntries.forEach(([day, sets]) => {
    let dayLabel = day;
    if (isHe) {
      dayLabel = day
        .replace('DAY', 'יום')
        .replace('Warmup Sat', 'חימום שבת')
        .replace('Warmup Sun', 'חימום ראשון');
    }

    // Day header with subtle glow background
    const dayBgGrad = ctx.createLinearGradient(PADDING, 0, WIDTH - PADDING, 0);
    dayBgGrad.addColorStop(0, isHe ? 'transparent' : 'rgba(140, 80, 220, 0.08)');
    dayBgGrad.addColorStop(1, isHe ? 'rgba(140, 80, 220, 0.08)' : 'transparent');
    ctx.fillStyle = dayBgGrad;
    drawRoundedRect(ctx, PADDING, y, CONTENT_WIDTH, dayHeaderHeight - 8, 8);
    ctx.fill();

    ctx.fillStyle = '#d4b8ff';
    ctx.font = "700 18px 'Orbitron', 'Heebo', sans-serif";
    const textX = isHe ? WIDTH - PADDING - 16 : PADDING + 16;
    ctx.fillText(dayLabel, textX, y + 28);

    y += dayHeaderHeight;

    sets.forEach(set => {
      const key = getSetUniqueKey(set);
      const priority = priorities[key];
      const setConflicts = getConflictsForSet(set.id, conflicts);
      const stageColor = STAGE_COLORS[set.stage] || '#888';
      const stageGlow = STAGE_GLOW_COLORS[set.stage] || 'rgba(136, 136, 136, 0.08)';
      const alpha = priority === 'maybe' ? 0.45 : 1.0;

      // Row background
      if (priority === 'must') {
        ctx.fillStyle = 'rgba(230, 96, 64, 0.12)';
        drawRoundedRect(ctx, PADDING + 4, y + 2, CONTENT_WIDTH - 8, setRowHeight - 4, 6);
        ctx.fill();
      } else {
        ctx.fillStyle = stageGlow;
        drawRoundedRect(ctx, PADDING + 4, y + 2, CONTENT_WIDTH - 8, setRowHeight - 4, 6);
        ctx.fill();
      }

      ctx.globalAlpha = alpha;

      // Stage color dot
      ctx.fillStyle = stageColor;
      ctx.save();
      ctx.shadowColor = stageColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      const dotX = isHe ? WIDTH - PADDING - 12 : PADDING + 12;
      ctx.arc(dotX, y + setRowHeight / 2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Artist name
      ctx.fillStyle = '#eee0ff';
      ctx.font = "600 15px 'Exo 2', 'Heebo', sans-serif";
      const artistX = isHe ? WIDTH - PADDING - 28 : PADDING + 28;
      ctx.fillText(set.artist, artistX, y + 27);

      // Stage name
      const stageName = set.stage
        .replace(' / COOKING GROOVE', '')
        .replace(' (2000s Trance)', '');
      ctx.fillStyle = 'rgba(212, 184, 255, 0.5)';
      ctx.font = "400 12px 'Exo 2', 'Heebo', sans-serif";
      const stageX = isHe ? PADDING + 140 : WIDTH - PADDING - 140;
      ctx.textAlign = isHe ? 'left' : 'right';
      ctx.fillText(stageName, stageX, y + 26);

      // Time
      ctx.fillStyle = 'rgba(212, 184, 255, 0.7)';
      ctx.font = "500 13px 'Exo 2', 'Heebo', sans-serif";
      const timeStr = `${set.start}–${set.end}`;
      const timeX = isHe ? PADDING + 16 : WIDTH - PADDING - 16;
      ctx.textAlign = isHe ? 'left' : 'right';
      ctx.fillText(timeStr, timeX, y + 26);

      // Must badge
      if (priority === 'must') {
        ctx.fillStyle = '#e86040';
        ctx.font = "700 10px 'Exo 2', 'Heebo', sans-serif";
        const mustLabel = isHe ? 'חובה' : 'MUST';
        ctx.textAlign = isHe ? 'right' : 'left';
        ctx.font = "600 15px 'Exo 2', 'Heebo', sans-serif";
        const artistWidth = ctx.measureText(set.artist).width;
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

  // Footer separator
  y += 8;
  const footSep = ctx.createLinearGradient(PADDING + 60, 0, WIDTH - PADDING - 60, 0);
  footSep.addColorStop(0, 'transparent');
  footSep.addColorStop(0.3, 'rgba(140, 80, 220, 0.3)');
  footSep.addColorStop(0.5, 'rgba(140, 80, 220, 0.5)');
  footSep.addColorStop(0.7, 'rgba(140, 80, 220, 0.3)');
  footSep.addColorStop(1, 'transparent');
  ctx.strokeStyle = footSep;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING + 60, y);
  ctx.lineTo(WIDTH - PADDING - 60, y);
  ctx.stroke();
  y += 24;

  // Site URL — prominent CTA
  ctx.fillStyle = '#d4b8ff';
  ctx.font = "600 14px 'Exo 2', 'Heebo', sans-serif";
  ctx.textAlign = 'center';
  ctx.save();
  ctx.shadowColor = 'rgba(140, 60, 200, 0.3)';
  ctx.shadowBlur = 12;
  ctx.fillText(siteUrl, WIDTH / 2, y);
  ctx.restore();
  y += 22;

  // Tagline
  const tagline = isHe ? 'בנה את הלוח שלך עכשיו' : 'Build your schedule now';
  ctx.fillStyle = 'rgba(212, 184, 255, 0.45)';
  ctx.font = "400 12px 'Exo 2', 'Heebo', sans-serif";
  ctx.fillText(tagline, WIDTH / 2, y);
  y += 20;

  // Copyright
  ctx.fillStyle = 'rgba(212, 184, 255, 0.25)';
  ctx.font = "400 10px 'Exo 2', 'Heebo', sans-serif";
  ctx.fillText('© 2026 Bersaglio', WIDTH / 2, y);

  // Trim canvas to actual content height
  const finalHeight = y + PADDING;
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = WIDTH;
  finalCanvas.height = finalHeight;
  const fCtx = finalCanvas.getContext('2d');

  // Redraw background gradient for trimmed canvas
  const fGrad = fCtx.createLinearGradient(0, 0, 0, finalHeight);
  fGrad.addColorStop(0, '#0a0518');
  fGrad.addColorStop(0.3, '#0e0824');
  fGrad.addColorStop(0.7, '#12082e');
  fGrad.addColorStop(1, '#0a0518');
  fCtx.fillStyle = fGrad;
  fCtx.fillRect(0, 0, WIDTH, finalHeight);
  fCtx.drawImage(canvas, 0, 0);

  const blob = await new Promise(resolve => finalCanvas.toBlob(resolve, 'image/png'));

  if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'schedule.png', { type: 'image/png' })] })) {
    await navigator.share({
      files: [new File([blob], 'ozora-2026-schedule.png', { type: 'image/png' })],
    });
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ozora-2026-schedule.png';
    a.click();
    URL.revokeObjectURL(url);
  }
}
