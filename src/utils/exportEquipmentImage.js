import logoSrc from '../assets/logo.png';
import { getEquipmentItemFields } from './equipmentItemFields';
import { translations } from './lang';

const WIDTH = 1080;
const PADDING = 56;
const PAGE_HEIGHT = 1700;

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
    // Test environments (jsdom) don't actually perform image loads, so
    // onload/onerror never fire. Fail fast instead of hanging forever.
    setTimeout(settle(() => reject(new Error('image load timed out'))), 2000);
  });
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
}

function countSectionItems(section) {
  return section.topics.reduce((sum, t) => sum + t.items.length, 0);
}

function normalizeItemState(value) {
  if (value === true || value === false) {
    return { checked: value, quantity: '', note: '' };
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      checked: !!value.checked,
      quantity: value.quantity == null ? '' : String(value.quantity),
      note: typeof value.note === 'string' ? value.note : ''
    };
  }

  return { checked: false, quantity: '', note: '' };
}

function downloadCanvas(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    }, 'image/png');
  });
}

function drawPageMarker(ctx, page, total, h, theme, lang = 'he') {
  if (total <= 1) return;
  const isDay = theme === 'theme-day';
  const t = translations[lang];
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = isDay ? 'rgba(51, 34, 68, 0.62)' : 'rgba(232, 216, 255, 0.76)';
  ctx.font = "600 15px 'Exo 2', 'Heebo', sans-serif";
  ctx.fillText(t.equipPageMarker.replace('{page}', page).replace('{total}', total), WIDTH / 2, h - 24);
  ctx.restore();
}

function drawSection(ctx, section, checkedMap, startY, theme = 'theme-night', lang = 'he') {
  const isDay = theme === 'theme-day';
  const isHe = lang === 'he';
  const t = translations[lang];
  let y = startY;

  ctx.textAlign = 'center';
  ctx.fillStyle = isDay ? '#332244' : '#e8d8ff';
  ctx.font = "700 26px 'Orbitron', 'Heebo', sans-serif";
  ctx.fillText(section.title[lang], WIDTH / 2, y);
  y += 44;

  const headingX = isHe ? WIDTH - PADDING : PADDING;
  const itemX = isHe ? WIDTH - PADDING - 18 : PADDING + 18;

  for (const topic of section.topics) {
    ctx.textAlign = isHe ? 'right' : 'start';
    ctx.fillStyle = isDay ? '#5a30a3' : '#c9a8ff';
    ctx.font = "700 19px 'Exo 2', 'Heebo', sans-serif";
    ctx.fillText(topic.heading[lang], headingX, y);
    y += 30;

    for (const item of topic.items) {
      const details = normalizeItemState(checkedMap[item.id]);
      const checked = details.checked;
      const label = item.label[lang];
      const fields = getEquipmentItemFields(item, topic, section.key);
      const metaParts = [];
      if (fields.quantity && details.quantity) metaParts.push(`${t.equipQuantityLabel}: ${details.quantity}`);
      if (fields.note && details.note) metaParts.push(`${t.noteLabel}: ${details.note}`);
      ctx.font = "400 16px 'Exo 2', 'Heebo', sans-serif";
      ctx.textAlign = isHe ? 'right' : 'start';

      if (isDay) {
        if (checked) {
          ctx.fillStyle = '#1e7e34';
          if (isHe) {
            ctx.fillText(`${label}  ✓`, itemX, y);
          } else {
            ctx.fillText(`✓  ${label}`, itemX, y);
          }
        } else {
          ctx.fillStyle = 'rgba(51, 34, 68, 0.35)';
          ctx.fillText('○', itemX, y);
          ctx.fillStyle = 'rgba(51, 34, 68, 0.45)';
          const spacing = ctx.measureText('○  ').width;
          if (isHe) {
            ctx.fillText(label, itemX - spacing, y);
          } else {
            ctx.fillText(label, itemX + spacing, y);
          }
        }
      } else {
        ctx.fillStyle = checked ? '#7be88a' : 'rgba(255,255,255,0.35)';
        const mark = checked ? '✓' : '○';
        if (isHe) {
          ctx.fillText(`${label}  ${mark}`, itemX, y);
        } else {
          ctx.fillText(`${mark}  ${label}`, itemX, y);
        }
      }
      y += 24;

      if (metaParts.length > 0) {
        ctx.fillStyle = isDay ? 'rgba(51, 34, 68, 0.58)' : 'rgba(255,255,255,0.55)';
        ctx.font = "500 13px 'Exo 2', 'Heebo', sans-serif";
        ctx.fillText(metaParts.join(' · '), itemX, y);
        y += 20;
      }
    }
    y += 14;
  }

  return y;
}

export async function exportEquipmentImageAsPng({ shared, personal, checkedMap, onlyChecked = false, theme = 'theme-night', lang = 'he' }) {
  const filterSection = (section) => {
    if (!section) return null;
    const filteredTopics = section.topics.map(topic => {
      const filteredItems = topic.items.filter(item => !onlyChecked || normalizeItemState(checkedMap[item.id]).checked);
      return { ...topic, items: filteredItems };
    }).filter(topic => topic.items.length > 0);

    if (filteredTopics.length === 0) return null;
    return { ...section, topics: filteredTopics };
  };

  const filteredShared = filterSection(shared);
  const filteredPersonal = filterSection(personal);
  const sections = [
    filteredShared ? { key: 'shared', ...filteredShared } : null,
    filteredPersonal ? { key: 'personal', ...filteredPersonal } : null
  ].filter(Boolean);

  if (document.fonts) {
    await document.fonts.ready;
  }

  const headerHeight = 90 + 40;
  let estimatedHeight = headerHeight + PADDING * 2;
  for (const section of sections) {
    estimatedHeight += 70; // section title
    for (const topic of section.topics) {
      estimatedHeight += 30 + 14;
      for (const item of topic.items) {
        const fields = getEquipmentItemFields(item, topic, section.key);
        const details = normalizeItemState(checkedMap[item.id]);
        estimatedHeight += 24 + ((fields.quantity && details.quantity) || (fields.note && details.note) ? 20 : 0);
      }
    }
  }

  const SCALE_FACTOR = 2.5;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH * SCALE_FACTOR;
  canvas.height = estimatedHeight * SCALE_FACTOR;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE_FACTOR, SCALE_FACTOR);

  drawCosmicBackground(ctx, WIDTH, estimatedHeight, theme);

  let y = PADDING;

  try {
    const logoImg = await loadImage(logoSrc);
    const logoH = 70;
    const logoW = (logoImg.width / logoImg.height) * logoH;
    ctx.drawImage(logoImg, (WIDTH - logoW) / 2, y, logoW, logoH);
    y += logoH + 30;
  } catch {
    y += 20;
  }

  for (const section of sections) {
    y = drawSection(ctx, section, checkedMap, y, theme, lang);
  }

  const pageCount = Math.max(1, Math.ceil(estimatedHeight / PAGE_HEIGHT));

  for (let page = 0; page < pageCount; page += 1) {
    const sourceY = page * PAGE_HEIGHT;
    const pageHeight = Math.min(PAGE_HEIGHT, estimatedHeight - sourceY);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = WIDTH * SCALE_FACTOR;
    pageCanvas.height = pageHeight * SCALE_FACTOR;
    const pageCtx = pageCanvas.getContext('2d');
    pageCtx.drawImage(
      canvas,
      0,
      sourceY * SCALE_FACTOR,
      WIDTH * SCALE_FACTOR,
      pageHeight * SCALE_FACTOR,
      0,
      0,
      WIDTH * SCALE_FACTOR,
      pageHeight * SCALE_FACTOR
    );
    pageCtx.scale(SCALE_FACTOR, SCALE_FACTOR);
    drawPageMarker(pageCtx, page + 1, pageCount, pageHeight, theme, lang);

    const suffix = pageCount > 1 ? `-${page + 1}-of-${pageCount}` : '';
    await downloadCanvas(pageCanvas, `ozora-2026-equipment-checklist${suffix}.png`);
  }
}

// avoid unused-var lint on countSectionItems while keeping it available for future progress overlays
void countSectionItems;
