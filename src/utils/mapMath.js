export function calculateBearing(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function ccw(A, B, C) {
  if (!A || !B || !C || A.length < 2 || B.length < 2 || C.length < 2) return false;
  return (C[0] - A[0]) * (B[1] - A[1]) > (B[0] - A[0]) * (C[1] - A[1]);
}

export function intersect(A, B, C, D) {
  if (!A || !B || !C || !D || A.length < 2 || B.length < 2 || C.length < 2 || D.length < 2) return false;
  return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);
}

export function doesSegmentCrossPolygon(p1, p2, polygonCoords) {
  if (!p1 || !p2 || p1.length < 2 || p2.length < 2) return false;
  if (!polygonCoords || !Array.isArray(polygonCoords) || polygonCoords.length < 3) return false;
  for (let i = 0; i < polygonCoords.length; i++) {
    const nextIdx = (i + 1) % polygonCoords.length;
    const sideStart = polygonCoords[i];
    const sideEnd = polygonCoords[nextIdx];
    if (!sideStart || !sideEnd || sideStart.length < 2 || sideEnd.length < 2) continue;
    if (intersect(p1, p2, sideStart, sideEnd)) {
      return true;
    }
  }
  return false;
}

