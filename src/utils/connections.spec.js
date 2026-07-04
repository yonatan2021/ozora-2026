import { describe, it, expect } from 'vitest';
import { getArtistConnections, getSetsForArtist } from './connections';

describe('Connections utility', () => {
  it('should return null for unknown artist', () => {
    expect(getArtistConnections('Unknown Artist')).toBeNull();
  });

  it('should return connections for Simon Posford projects', () => {
    const conn = getArtistConnections('Hallucinogen');
    expect(conn).not.toBeNull();
    expect(conn.isEnsemble).toBe(false);
    expect(conn.members[0].name).toBe('Simon Posford');
    expect(conn.allOtherProjects).toContain('Shpongle');
    expect(conn.allOtherProjects).toContain('Younger Brother');
    expect(conn.additionalShowsCount).toBeGreaterThan(0);
  });

  it('should treat Younger Brother as ensemble and show correct members', () => {
    const conn = getArtistConnections('Younger Brother');
    expect(conn).not.toBeNull();
    expect(conn.isEnsemble).toBe(true);
    expect(conn.members.map(m => m.name)).toContain('Simon Posford');
    expect(conn.members.map(m => m.name)).toContain('Benji Vaughan');
  });

  it('should return sets for artist', () => {
    const sets = getSetsForArtist('Astrix');
    expect(sets.length).toBeGreaterThan(0);
    expect(sets[0].artist).toBe('Astrix');
  });
});
