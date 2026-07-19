import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import useGuides from './useGuides';

describe('useGuides hook', () => {
  it('should parse guides from markdown files and exclude README', () => {
    const { result } = renderHook(() => useGuides());
    const { guides } = result.current;

    // Verify we load the expected guides
    expect(guides.length).toBeGreaterThanOrEqual(6);

    // Verify README is excluded
    const readme = guides.find(g => g.slug === 'README');
    expect(readme).toBeUndefined();

    // Verify tickets guide is loaded, parsed, and has the correct order
    const tickets = guides.find(g => g.slug === 'tickets');
    expect(tickets).toBeDefined();
    expect(tickets.title).toContain('כרטיסים');
    expect(tickets.order).toBe(1);
    expect(tickets.topics.length).toBeGreaterThan(0);

    // Verify all guides have the required structure
    for (const guide of guides) {
      expect(guide.slug).toBeDefined();
      expect(guide.title).toBeDefined();
      expect(guide.icon).toBeDefined();
      expect(guide.order).toBeDefined();
      expect(Array.isArray(guide.topics)).toBe(true);

      for (const topic of guide.topics) {
        expect(topic.heading).toBeDefined();
        expect(topic.html).toBeDefined();
      }
    }
  });

  it('serves the English translation when lang is "en", keeping the same slug', () => {
    const { result } = renderHook(() => useGuides('en'));
    const { guides } = result.current;

    const tickets = guides.find(g => g.slug === 'tickets');
    expect(tickets).toBeDefined();
    expect(tickets.title).toBe('Tickets & Purchasing');
    expect(tickets.topics.length).toBeGreaterThan(0);
  });

  it('falls back to Hebrew for guides without an English translation yet', () => {
    const { result: heResult } = renderHook(() => useGuides('he'));
    const { result: enResult } = renderHook(() => useGuides('en'));

    expect(heResult.current.guides.length).toBe(enResult.current.guides.length);
  });
});
