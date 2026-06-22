const CACHE_FLAG = 'ozora_map_cached';
const TILE_URL_BASE = 'https://tile.openstreetmap.org';

export function lon2tile(lon, zoom) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

export function lat2tile(lat, zoom) {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
}

export function calculateTileURLs(bounds, zoomRange) {
  const [[south, west], [north, east]] = bounds;
  const [minZoom, maxZoom] = zoomRange;
  const urls = [];

  for (let z = minZoom; z <= maxZoom; z++) {
    const xMin = lon2tile(west, z);
    const xMax = lon2tile(east, z);
    const yMin = lat2tile(north, z);
    const yMax = lat2tile(south, z);

    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        urls.push(`${TILE_URL_BASE}/${z}/${x}/${y}.png`);
      }
    }
  }

  return urls;
}

export function isCacheComplete() {
  return localStorage.getItem(CACHE_FLAG) === 'true';
}

export function resetCache() {
  localStorage.removeItem(CACHE_FLAG);
}

export async function prefetchTiles(urls, onProgress) {
  let succeeded = 0;
  let failed = 0;
  const batchSize = 10;

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((url) =>
        fetch(url, { mode: 'cors' }).then((r) => {
          if (!r.ok) throw new Error(r.status);
        })
      )
    );

    results.forEach((r) => {
      if (r.status === 'fulfilled') succeeded++;
      else failed++;
    });

    onProgress?.(succeeded + failed, urls.length);

    if (i + batchSize < urls.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  if (failed === 0) {
    localStorage.setItem(CACHE_FLAG, 'true');
  }

  return { succeeded, failed };
}
