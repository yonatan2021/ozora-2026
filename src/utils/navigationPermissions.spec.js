import { describe, expect, it, vi } from 'vitest';
import {
  requestCurrentPosition,
  startLocationWatch,
} from './navigationPermissions';

const mockPosition = {
  coords: {
    latitude: 46.773164,
    longitude: 18.435942,
    accuracy: 12,
  },
};

describe('navigation permissions', () => {
  it('requests the current GPS position only when called', async () => {
    const getCurrentPosition = vi.fn((resolve) => resolve(mockPosition));
    const geolocation = { getCurrentPosition };

    await expect(requestCurrentPosition(geolocation)).resolves.toEqual({
      lat: 46.773164,
      lng: 18.435942,
      accuracy: 12,
    });

    expect(getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
    );
  });

  it('starts continuous GPS tracking after permission is already useful', () => {
    const onPosition = vi.fn();
    const watchPosition = vi.fn((resolve) => {
      resolve(mockPosition);
      return 7;
    });
    const geolocation = { watchPosition };

    const watchId = startLocationWatch(geolocation, onPosition, vi.fn());

    expect(watchId).toBe(7);
    expect(onPosition).toHaveBeenCalledWith({
      lat: 46.773164,
      lng: 18.435942,
      accuracy: 12,
    });
  });
});
