const GPS_OPTIONS = { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 };

export function toUserPosition(position) {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
  };
}

export function requestCurrentPosition(geolocation = navigator.geolocation) {
  if (!geolocation) {
    return Promise.reject(new Error('Geolocation unavailable'));
  }

  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(
      (position) => resolve(toUserPosition(position)),
      reject,
      GPS_OPTIONS
    );
  });
}

export function startLocationWatch(
  geolocation = navigator.geolocation,
  onPosition,
  onError
) {
  if (!geolocation) return null;

  return geolocation.watchPosition(
    (position) => onPosition(toUserPosition(position)),
    onError,
    GPS_OPTIONS
  );
}

export function stopLocationWatch(geolocation = navigator.geolocation, watchId) {
  if (geolocation && watchId != null) {
    geolocation.clearWatch(watchId);
  }
}
