import { describe, it, expect } from 'vitest';
import data from './equipmentChecklist.json';

describe('equipmentChecklist JSON validation', () => {
  it('has shared and personal sections with title and topics', () => {
    expect(data.shared.title).toBeTruthy();
    expect(data.personal.title).toBeTruthy();
    expect(Array.isArray(data.shared.topics)).toBe(true);
    expect(Array.isArray(data.personal.topics)).toBe(true);
    expect(data.shared.topics.length).toBeGreaterThan(0);
    expect(data.personal.topics.length).toBeGreaterThan(0);
  });

  it('every topic has a non-empty heading and at least one item', () => {
    for (const section of [data.shared, data.personal]) {
      for (const topic of section.topics) {
        expect(typeof topic.id).toBe('string');
        expect(topic.id.length).toBeGreaterThan(0);
        expect(typeof topic.heading).toBe('string');
        expect(topic.heading.length).toBeGreaterThan(0);
        expect(Array.isArray(topic.items)).toBe(true);
        expect(topic.items.length).toBeGreaterThan(0);
      }
    }
  });

  it('every item has a unique id and non-empty label', () => {
    const allIds = [];
    for (const section of [data.shared, data.personal]) {
      for (const topic of section.topics) {
        for (const item of topic.items) {
          expect(typeof item.id).toBe('string');
          expect(item.id.length).toBeGreaterThan(0);
          expect(typeof item.label).toBe('string');
          expect(item.label.length).toBeGreaterThan(0);
          allIds.push(item.id);
        }
      }
    }
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it('shared item ids are prefixed shared- and personal item ids are prefixed personal-', () => {
    for (const topic of data.shared.topics) {
      for (const item of topic.items) {
        expect(item.id.startsWith('shared-')).toBe(true);
      }
    }
    for (const topic of data.personal.topics) {
      for (const item of topic.items) {
        expect(item.id.startsWith('personal-')).toBe(true);
      }
    }
  });
});
