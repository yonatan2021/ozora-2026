import { describe, expect, it } from 'vitest';
import venueMapData from './venueMap.json';

const stageCoords = {
  'ozora-stage': [46.773164, 18.435942],
  pumpui: [46.769936, 18.433367],
  'the-dome': [46.771823, 18.431491],
  'dragon-nest': [46.770563, 18.434113],
  'visium-garden': [46.76958, 18.43357],
  'tek-zero': [46.771823, 18.431491],
};

describe('venue map stage locations', () => {
  it('keeps the stage POIs aligned to the marked festival map positions', () => {
    for (const [stageId, coords] of Object.entries(stageCoords)) {
      const poi = venueMapData.pois.find(item => item.id === stageId);

      expect(poi?.coords).toEqual(coords);
    }
  });

  it('places Tek Zero at The Dome stage', () => {
    const dome = venueMapData.pois.find(item => item.id === 'the-dome');
    const tekZero = venueMapData.pois.find(item => item.id === 'tek-zero');

    expect(tekZero?.coords).toEqual(dome?.coords);
  });
});
