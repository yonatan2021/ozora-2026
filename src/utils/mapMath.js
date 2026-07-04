export function normalizeCoord(p) {
  if (!p) return null;
  let lat, lng;
  if (Array.isArray(p)) {
    if (p.length < 2) return null;
    lat = Number(p[0]);
    lng = Number(p[1]);
  } else if (p.lat != null && p.lng != null) {
    lat = Number(p.lat);
    lng = Number(p.lng);
  } else {
    return null;
  }
  return (isNaN(lat) || isNaN(lng)) ? null : [lat, lng];
}

export function calculateBearing(lat1, lon1, lat2, lon2) {
  let p1Lat, p1Lng, p2Lat, p2Lng;
  
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

function _intersect(pA, pB, pC, pD) {
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

export function intersect(A, B, C, D) {
  const pA = normalizeCoord(A);
  const pB = normalizeCoord(B);
  const pC = normalizeCoord(C);
  const pD = normalizeCoord(D);

  if (!pA || !pB || !pC || !pD) return false;

  return _intersect(pA, pB, pC, pD);
}

function _isPointInPolygon(pt, normalizedPolygon) {
  const lat = pt[0], lng = pt[1];
  let inside = false;
  for (let i = 0, j = normalizedPolygon.length - 1; i < normalizedPolygon.length; j = i++) {
    const latI = normalizedPolygon[i][0], lngI = normalizedPolygon[i][1];
    const latJ = normalizedPolygon[j][0], lngJ = normalizedPolygon[j][1];
    
    // Cast horizontal ray to the right from point (lng, lat)
    const intersect = ((latI > lat) !== (latJ > lat)) &&
                      (lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isPointInPolygon(point, polygon) {
  const pt = normalizeCoord(point);
  if (!pt || !polygon || !Array.isArray(polygon)) return false;

  const normalizedPolygon = [];
  for (let i = 0; i < polygon.length; i++) {
    const p = normalizeCoord(polygon[i]);
    if (!p) return false;
    normalizedPolygon.push(p);
  }
  if (normalizedPolygon.length < 3) return false;

  return _isPointInPolygon(pt, normalizedPolygon);
}

export function doesSegmentCrossPolygon(p1, p2, polygonCoords) {
  const pt1 = normalizeCoord(p1);
  const pt2 = normalizeCoord(p2);

  if (!pt1 || !pt2) return false;
  if (!polygonCoords || !Array.isArray(polygonCoords)) return false;

  // Pre-normalize polygon coords once
  const normalizedPolygon = [];
  for (let i = 0; i < polygonCoords.length; i++) {
    const p = normalizeCoord(polygonCoords[i]);
    if (!p) return false;
    normalizedPolygon.push(p);
  }
  if (normalizedPolygon.length < 3) return false;

  // 1. Point in polygon check (if either endpoint is inside, it crosses/is inside the polygon)
  if (_isPointInPolygon(pt1, normalizedPolygon) || _isPointInPolygon(pt2, normalizedPolygon)) {
    return true;
  }

  // 2. Line segment intersection check with all sides
  for (let i = 0; i < normalizedPolygon.length; i++) {
    const nextIdx = (i + 1) % normalizedPolygon.length;
    const sideStart = normalizedPolygon[i];
    const sideEnd = normalizedPolygon[nextIdx];
    if (_intersect(pt1, pt2, sideStart, sideEnd)) {
      return true;
    }
  }
  return false;
}
