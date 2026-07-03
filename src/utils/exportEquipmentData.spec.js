import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportEquipmentToCsv, exportEquipmentToJson } from './exportEquipmentData';

describe('exportEquipmentData', () => {
  let clickSpy;
  let createdElement;
  let blobContent;
  let blobOptions;
  const originalBlob = globalThis.Blob;

  beforeEach(() => {
    vi.restoreAllMocks();
    clickSpy = vi.fn();
    
    // Mock document.createElement
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        el.click = clickSpy;
        createdElement = el;
      }
      return el;
    });

    // Mock Blob to intercept content
    blobContent = null;
    blobOptions = null;
    globalThis.Blob = class FakeBlob {
      constructor(content, options) {
        blobContent = content;
        blobOptions = options;
      }
    };

    // Mock URL functions
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:fake-url');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    globalThis.Blob = originalBlob;
  });

  const mockEquipmentData = {
    shared: {
      title: 'Shared Title',
      topics: [
        {
          id: 'topic1',
          heading: 'Topic Heading 1',
          items: [
            { id: 'shared-item1', label: 'Shared Item 1', hint: 'Hint 1' },
            { id: 'shared-item2', label: 'Shared Item 2' }
          ]
        }
      ]
    },
    personal: {
      title: 'Personal Title',
      topics: [
        {
          id: 'topic2',
          heading: 'Topic Heading 2',
          items: [
            { id: 'personal-item1', label: 'Personal Item 1' }
          ]
        }
      ]
    }
  };

  describe('exportEquipmentToCsv', () => {
    it('exports all items when onlyChecked is false', () => {
      const checkedMap = {
        'shared-item1': true
      };

      exportEquipmentToCsv(mockEquipmentData, checkedMap, 'both', false);

      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(createdElement.download).toBe('ozora-2026-equipment-all.csv');
      
      const csvStr = blobContent[0];
      // Hebrew header: "סוג,קטגוריה,פריט,הערה,סטטוס\n"
      expect(csvStr).toContain('\uFEFFסוג,קטגוריה,פריט,הערה,סטטוס\n');
      expect(csvStr).toContain('"Shared Title","Topic Heading 1","Shared Item 1","Hint 1","סומן"');
      expect(csvStr).toContain('"Shared Title","Topic Heading 1","Shared Item 2","","לא סומן"');
      expect(csvStr).toContain('"Personal Title","Topic Heading 2","Personal Item 1","","לא סומן"');
    });

    it('exports only checked items when onlyChecked is true', () => {
      const checkedMap = {
        'shared-item1': true
      };

      exportEquipmentToCsv(mockEquipmentData, checkedMap, 'both', true);

      expect(clickSpy).toHaveBeenCalledTimes(1);
      const csvStr = blobContent[0];
      expect(csvStr).toContain('"Shared Title","Topic Heading 1","Shared Item 1","Hint 1","סומן"');
      expect(csvStr).not.toContain('Shared Item 2');
      expect(csvStr).not.toContain('Personal Item 1');
    });

    it('filters by scope: shared only', () => {
      exportEquipmentToCsv(mockEquipmentData, {}, 'shared', false);
      expect(createdElement.download).toBe('ozora-2026-equipment-shared.csv');
      const csvStr = blobContent[0];
      expect(csvStr).toContain('Shared Item 1');
      expect(csvStr).not.toContain('Personal Item 1');
    });

    it('filters by scope: personal only', () => {
      exportEquipmentToCsv(mockEquipmentData, {}, 'personal', false);
      expect(createdElement.download).toBe('ozora-2026-equipment-personal.csv');
      const csvStr = blobContent[0];
      expect(csvStr).not.toContain('Shared Item 1');
      expect(csvStr).toContain('Personal Item 1');
    });
  });

  describe('exportEquipmentToJson', () => {
    it('downloads the checkedMap as JSON', () => {
      const checkedMap = { 'item-1': true };
      exportEquipmentToJson(checkedMap);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(createdElement.download).toBe('ozora-2026-equipment-backup.json');
      const jsonStr = blobContent[0];
      expect(JSON.parse(jsonStr)).toEqual(checkedMap);
    });
  });
});
