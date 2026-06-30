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

function drawCosmicBackground(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0a0518');
  grad.addColorStop(0.3, '#0e0824');
  grad.addColorStop(0.7, '#12082e');
  grad.addColorStop(1, '#0a0518');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function countSectionItems(section) {
  return section.topics.reduce((sum, t) => sum + t.items.length, 0);
}

function drawSection(ctx, section, checkedMap, startY) {
  let y = startY;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8d8ff';
  ctx.font = "700 26px 'Orbitron', 'Heebo', sans-serif";
  ctx.fillText(section.title, WIDTH / 2, y);
  y += 44;

  ctx.textAlign = 'start';
  for (const topic of section.topics) {
    ctx.fillStyle = '#c9a8ff';
    ctx.font = "700 19px 'Exo 2', 'Heebo', sans-serif";
    ctx.fillText(topic.heading, PADDING, y);
    y += 30;

    for (const item of topic.items) {
      const checked = !!checkedMap[item.id];
      ctx.fillStyle = checked ? '#7be88a' : 'rgba(255,255,255,0.35)';
      ctx.font = "400 16px 'Exo 2', 'Heebo', sans-serif";
      const mark = checked ? '✓' : '○';
      ctx.fillText(`${mark}  ${item.label}`, PADDING + 18, y);
      y += 26;
    }
    y += 14;
  }

  return y;
}

export async function exportEquipmentImageAsPng({ shared, personal, checkedMap }) {
  const sections = [shared, personal].filter(Boolean);

  const headerHeight = 90 + 40;
  let estimatedHeight = headerHeight + PADDING * 2;
  for (const section of sections) {
    estimatedHeight += 70; // section title
    for (const topic of section.topics) {
      estimatedHeight += 30 + topic.items.length * 26 + 14;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = estimatedHeight;
  const ctx = canvas.getContext('2d');

  drawCosmicBackground(ctx, WIDTH, estimatedHeight);

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
    y = drawSection(ctx, section, checkedMap, y);
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
