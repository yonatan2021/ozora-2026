export function normalizeCoord(p) {
  if (!p) return null;
  if (Array.isArray(p)) return p.length >= 2 ? [Number(p[0]), Number(p[1])] : null;
  if (p.lat != null && p.lng != null) return [Number(p.lat), Number(p.lng)];
  return null;
}

export function calculateBearing(lat1, lon1, lat2, lon2) {
  let p1Lat = lat1, p1Lng = lon1, p2Lat = lat2, p2Lng = lon2;
  
  if (typeof lat1 === 'object' && lat1 !== null) {
    const p1 = normalizeCoord(lat1);
    const p2 = normalizeCoord(lon1);
    if (p1 && p2) {
      p1Lat = p1[0]; p1Lng = p1[1];
      p2Lat = p2[0]; p2Lng = p2[1];
    } else {
      return 0;
    }
  } else {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
    p1Lat = Number(lat1); p1Lng = Number(lon1);
    p2Lat = Number(lat2); p2Lng = Number(lon2);
  }

  if (p1Lat === p2Lat && p1Lng === p2Lng) return 0;
  const dLon = ((p2Lng - p1Lng) * Math.PI) / 180;
  const lat1Rad = (p1Lat * Math.PI) / 180;
  const lat2Rad = (p2Lat * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function orientation(p, q, r) {
  const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
  if (Math.abs(val) < 1e-9) return 0; // Collinear
  return (val > 0) ? 1 : 2; // Clockwise or Counter-Clockwise
}

function onSegment(p, q, r) {
  return q[0] <= Math.max(p[0], r[0]) && q[0] >= Math.min(p[0], r[0]) &&
         q[1] <= Math.max(p[1], r[1]) && q[1] >= Math.min(p[1], r[1]);
}

export function intersect(A, B, C, D) {
  const pA = normalizeCoord(A);
  const pB = normalizeCoord(B);
  const pC = normalizeCoord(C);
  const pD = normalizeCoord(D);

  if (!pA || !pB || !pC || !pD) return false;

  const o1 = orientation(pA, pB, pC);
  const o2 = orientation(pA, pB, pD);
  const o3 = orientation(pC, pD, pA);
  const o4 = orientation(pC, pD, pB);

  // General case: segments cross each other
  if (o1 !== o2 && o3 !== o4) return true;

  // Special cases: collinear segments check for overlap
  if (o1 === 0 && onSegment(pA, pC, pB)) return true;
  if (o2 === 0 && onSegment(pA, pD, pB)) return true;
  if (o3 === 0 && onSegment(pC, pA, pD)) return true;
  if (o4 === 0 && onSegment(pC, pB, pD)) return true;

  return false;
}

export function isPointInPolygon(point, polygon) {
  const pt = normalizeCoord(point);
  if (!pt || !polygon || !Array.isArray(polygon) || polygon.length < 3) return false;
  
  const x = pt[0], y = pt[1];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = normalizeCoord(polygon[i]);
    const pj = normalizeCoord(polygon[j]);
    if (!pi || !pj) continue;

    const xi = pi[0], yi = pi[1];
    const xj = pj[0], yj = pj[1];
    
    const intersect = ((yi > y) !== (yj > y)) &&
                      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function doesSegmentCrossPolygon(p1, p2, polygonCoords) {
  const pt1 = normalizeCoord(p1);
  const pt2 = normalizeCoord(p2);

  if (!pt1 || !pt2) return false;
  if (!polygonCoords || !Array.isArray(polygonCoords) || polygonCoords.length < 3) return false;

  // 1. Point in polygon check (if either endpoint is inside, it crosses/is inside the polygon)
  if (isPointInPolygon(pt1, polygonCoords) || isPointInPolygon(pt2, polygonCoords)) {
    return true;
  }

  // 2. Line segment intersection check with all sides
  for (let i = 0; i < polygonCoords.length; i++) {
    const nextIdx = (i + 1) % polygonCoords.length;
    const sideStart = polygonCoords[i];
    const sideEnd = polygonCoords[nextIdx];
    if (intersect(pt1, pt2, sideStart, sideEnd)) {
      return true;
    }
  }
  return false;
}
