import logoSrc from '../assets/logo.png';

const WIDTH = 1080;
const PADDING = 56;

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

function drawSection(ctx, section, checkedMap, startY, theme = 'theme-night') {
  const isDay = theme === 'theme-day';
  let y = startY;

  ctx.textAlign = 'center';
  ctx.fillStyle = isDay ? '#332244' : '#e8d8ff';
  ctx.font = "700 26px 'Orbitron', 'Heebo', sans-serif";
  ctx.fillText(section.title, WIDTH / 2, y);
  y += 44;

  ctx.textAlign = 'start';
  for (const topic of section.topics) {
    ctx.fillStyle = isDay ? '#5a30a3' : '#c9a8ff';
    ctx.font = "700 19px 'Exo 2', 'Heebo', sans-serif";
    ctx.fillText(topic.heading, PADDING, y);
    y += 30;

    for (const item of topic.items) {
      const checked = !!checkedMap[item.id];
      ctx.font = "400 16px 'Exo 2', 'Heebo', sans-serif";
      if (isDay) {
        if (checked) {
          ctx.fillStyle = '#1e7e34';
          ctx.fillText(`✓  ${item.label}`, PADDING + 18, y);
        } else {
          ctx.fillStyle = 'rgba(51, 34, 68, 0.35)';
          ctx.fillText('○', PADDING + 18, y);
          ctx.fillStyle = 'rgba(51, 34, 68, 0.45)';
          const spacing = ctx.measureText('○  ').width;
          ctx.fillText(item.label, PADDING + 18 + spacing, y);
        }
      } else {
        ctx.fillStyle = checked ? '#7be88a' : 'rgba(255,255,255,0.35)';
        const mark = checked ? '✓' : '○';
        ctx.fillText(`${mark}  ${item.label}`, PADDING + 18, y);
      }
      y += 26;
    }
    y += 14;
  }

  return y;
}

export async function exportEquipmentImageAsPng({ shared, personal, checkedMap, theme = 'theme-night' }) {
  if (document.fonts) {
    await document.fonts.ready;
  }
  const sections = [shared, personal].filter(Boolean);

  const headerHeight = 90 + 40;
  let estimatedHeight = headerHeight + PADDING * 2;
  for (const section of sections) {
    estimatedHeight += 70; // section title
    for (const topic of section.topics) {
      estimatedHeight += 30 + topic.items.length * 26 + 14;
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
    y = drawSection(ctx, section, checkedMap, y, theme);
  }

  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ozora-2026-equipment-checklist.png';
  a.click();
  URL.revokeObjectURL(url);
}

// avoid unused-var lint on countSectionItems while keeping it available for future progress overlays
void countSectionItems;
