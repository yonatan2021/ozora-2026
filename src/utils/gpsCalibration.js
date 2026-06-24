export function calculateMean(samples) {
  if (!samples || samples.length === 0) return null;
  let latSum = 0;
  let lngSum = 0;
  samples.forEach(s => {
    latSum += s.lat;
    lngSum += s.lng;
  });
  return {
    lat: latSum / samples.length,
    lng: lngSum / samples.length,
  };
}

export function calculateMedian(samples) {
  if (!samples || samples.length === 0) return null;
  const sortedLat = [...samples].sort((a, b) => a.lat - b.lat);
  const sortedLng = [...samples].sort((a, b) => a.lng - b.lng);
  const mid = Math.floor(samples.length / 2);
  
  const medianLat = samples.length % 2 !== 0 
    ? sortedLat[mid].lat 
    : (sortedLat[mid - 1].lat + sortedLat[mid].lat) / 2;

  const medianLng = samples.length % 2 !== 0 
    ? sortedLng[mid].lng 
    : (sortedLng[mid - 1].lng + sortedLng[mid].lng) / 2;

  return { lat: medianLat, lng: medianLng };
}

export function distanceBetween(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function filterOutliers(samples, median, maxAllowedDistanceMeters = 40) {
  if (!samples || samples.length <= 2) return samples;
  return samples.filter(s => {
    const dist = distanceBetween(s.lat, s.lng, median.lat, median.lng);
    return dist <= maxAllowedDistanceMeters;
  });
}

export function calibrateGPS(samples, maxAccuracyThreshold = 25) {
  if (!samples || samples.length === 0) return null;

  // 1. Filter out points with poor accuracy
  let usableSamples = samples.filter(s => s.accuracy <= maxAccuracyThreshold);
  
  // Fallback if all samples have poor accuracy
  if (usableSamples.length === 0) {
    usableSamples = samples;
  }

  if (usableSamples.length <= 2) {
    const simpleMean = calculateMean(usableSamples);
    const maxAcc = Math.max(...usableSamples.map(s => s.accuracy));
    return { ...simpleMean, accuracy: maxAcc };
  }

  // 2. Initial median calculation
  const median = calculateMedian(usableSamples);

  // 3. Filter outliers relative to median (max 40m distance)
  const filteredSamples = filterOutliers(usableSamples, median, 40);

  // 4. Calculate final mean of filtered samples
  const finalMean = calculateMean(filteredSamples);
  
  // Calculate average accuracy
  const avgAccuracy = filteredSamples.reduce((sum, s) => sum + s.accuracy, 0) / filteredSamples.length;

  return {
    lat: finalMean.lat,
    lng: finalMean.lng,
    accuracy: avgAccuracy,
  };
}
