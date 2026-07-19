import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportEquipmentToCsv, exportEquipmentToExcel, exportEquipmentToJson } from './exportEquipmentData';

describe('exportEquipmentData', () => {
  let clickSpy;
  let createdElement;
  let blobContent;
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
    globalThis.Blob = class FakeBlob {
      constructor(content) {
        blobContent = content;
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
      title: { he: 'כותרת שיתופית', en: 'Shared Title' },
      topics: [
        {
          id: 'topic1',
          heading: { he: 'כותרת נושא 1', en: 'Topic Heading 1' },
          items: [
            { id: 'shared-item1', label: { he: 'פריט שיתופי 1', en: 'Shared Item 1' }, hint: { he: 'רמז 1', en: 'Hint 1' } },
            { id: 'shared-item2', label: { he: 'פריט שיתופי 2', en: 'Shared Item 2' }, hint: '' }
          ]
        }
      ]
    },
    personal: {
      title: { he: 'כותרת אישית', en: 'Personal Title' },
      topics: [
        {
          id: 'topic2',
          heading: { he: 'כותרת נושא 2', en: 'Topic Heading 2' },
          items: [
            { id: 'personal-item1', label: { he: 'פריט אישי 1', en: 'Personal Item 1' }, hint: '' }
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

      exportEquipmentToCsv(mockEquipmentData, checkedMap, 'both', false, 'en');

      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(createdElement.download).toBe('ozora-2026-equipment-all.csv');

      const csvStr = blobContent[0];
      expect(csvStr).toContain('﻿Type,Category,Item,Quantity,User Note,Ozora Note,Status\n');
      expect(csvStr).toContain('"Shared Title","Topic Heading 1","Shared Item 1","","","Hint 1","Checked"');
      expect(csvStr).toContain('"Shared Title","Topic Heading 1","Shared Item 2","","","","Not checked"');
      expect(csvStr).toContain('"Personal Title","Topic Heading 2","Personal Item 1","","","","Not checked"');
    });

    it('defaults to Hebrew when lang is not given', () => {
      exportEquipmentToCsv(mockEquipmentData, {}, 'both', false);
      const csvStr = blobContent[0];
      expect(csvStr).toContain('﻿סוג,קטגוריה,פריט,כמות,הערת משתמש,הערת Ozora,סטטוס\n');
      expect(csvStr).toContain('"כותרת שיתופית","כותרת נושא 1","פריט שיתופי 1"');
    });

    it('exports only checked items when onlyChecked is true', () => {
      const checkedMap = {
        'shared-item1': true
      };

      exportEquipmentToCsv(mockEquipmentData, checkedMap, 'both', true, 'en');

      expect(clickSpy).toHaveBeenCalledTimes(1);
      const csvStr = blobContent[0];
      expect(csvStr).toContain('"Shared Title","Topic Heading 1","Shared Item 1","","","Hint 1","Checked"');
      expect(csvStr).not.toContain('Shared Item 2');
      expect(csvStr).not.toContain('Personal Item 1');
    });

    it('includes quantity and user notes for the new item state format', () => {
      exportEquipmentToCsv(mockEquipmentData, {
        'shared-item1': { checked: true, quantity: '4', note: 'Yoni brings two' }
      }, 'both', true, 'en');

      const csvStr = blobContent[0];
      expect(csvStr).toContain('"Shared Title","Topic Heading 1","Shared Item 1","4","Yoni brings two","Hint 1","Checked"');
    });

    it('filters by scope: shared only', () => {
      exportEquipmentToCsv(mockEquipmentData, {}, 'shared', false, 'en');
      expect(createdElement.download).toBe('ozora-2026-equipment-shared.csv');
      const csvStr = blobContent[0];
      expect(csvStr).toContain('Shared Item 1');
      expect(csvStr).not.toContain('Personal Item 1');
    });

    it('filters by scope: personal only', () => {
      exportEquipmentToCsv(mockEquipmentData, {}, 'personal', false, 'en');
      expect(createdElement.download).toBe('ozora-2026-equipment-personal.csv');
      const csvStr = blobContent[0];
      expect(csvStr).not.toContain('Shared Item 1');
      expect(csvStr).toContain('Personal Item 1');
    });
  });

  describe('exportEquipmentToExcel', () => {
    it('exports a branded Excel workbook in Hebrew (default)', () => {
      exportEquipmentToExcel(mockEquipmentData, {
        'shared-item1': { checked: true, quantity: '2', note: 'bring early' }
      }, 'both', false);

      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(createdElement.download).toBe('ozora-2026-equipment-all.xls');
      const workbook = blobContent[0];
      expect(workbook).toContain('OZORA 2026');
      expect(workbook).toContain('רשימת ציוד לפסטיבל');
      expect(workbook).toContain('הערת Ozora');
      expect(workbook).toContain('bring early');
      expect(workbook).toContain('ציוד שסומן');
      expect(workbook).toContain('ss:RightToLeft="1"');
    });

    it('exports a branded Excel workbook in English, left-to-right', () => {
      exportEquipmentToExcel(mockEquipmentData, {
        'shared-item1': { checked: true, quantity: '2', note: 'bring early' }
      }, 'both', false, 'en');

      const workbook = blobContent[0];
      expect(workbook).toContain('OZORA 2026');
      expect(workbook).toContain('Ozora Note');
      expect(workbook).toContain('bring early');
      expect(workbook).toContain('Checked Equipment');
      expect(workbook).toContain('ss:RightToLeft="0"');
      expect(workbook).toContain('Shared Item 1');
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
