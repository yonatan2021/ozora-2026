import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportEquipmentImageAsPng } from './exportEquipmentImage';

const sampleSection = {
  title: 'ציוד שטח (קבוצתי)',
  topics: [
    { id: 'shelter', heading: 'מחסה וצל', items: [{ id: 'shared-tents', label: 'אוהלים' }] }
  ]
};

describe('exportEquipmentImageAsPng', () => {
  let clickSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    clickSpy = vi.fn();
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      fillRect: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 50 })),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      drawImage: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
      scale: vi.fn(),
    }));
    HTMLCanvasElement.prototype.toBlob = vi.fn((cb) => cb(new Blob(['fake'], { type: 'image/png' })));
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') el.click = clickSpy;
      return el;
    });
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:fake-url');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it('triggers a PNG download with checked items rendered', async () => {
    await exportEquipmentImageAsPng({
      shared: sampleSection,
      personal: null,
      checkedMap: { 'shared-tents': true }
    });

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('resolves without throwing when both sections are provided', async () => {
    await expect(exportEquipmentImageAsPng({
      shared: sampleSection,
      personal: sampleSection,
      checkedMap: {}
    })).resolves.toBeUndefined();
  });

  it('exports only checked items when onlyChecked is true', async () => {
    const fillTextSpy = vi.fn();
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      fillRect: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      fillText: fillTextSpy,
      measureText: vi.fn(() => ({ width: 50 })),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      drawImage: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
      scale: vi.fn(),
    }));

    const multiSection = {
      title: 'ציוד שטח (קבוצתי)',
      topics: [
        {
          id: 'shelter',
          heading: 'מחסה וצל',
          items: [
            { id: 'shared-tents', label: 'אוהלים' },
            { id: 'shared-tarp', label: 'צילייה' }
          ]
        }
      ]
    };

    await exportEquipmentImageAsPng({
      shared: multiSection,
      personal: null,
      checkedMap: { 'shared-tents': true },
      onlyChecked: true
    });

    const calls = fillTextSpy.mock.calls.map(call => call[0]);
    expect(calls).toContain('✓  אוהלים');
    expect(calls).not.toContain('○  צילייה');
    expect(calls).not.toContain('✓  צילייה');
  });

  it('excludes empty topics and empty sections when onlyChecked is true', async () => {
    const fillTextSpy = vi.fn();
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      fillRect: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      fillText: fillTextSpy,
      measureText: vi.fn(() => ({ width: 50 })),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      drawImage: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
      scale: vi.fn(),
    }));

    const sharedSection = {
      title: 'Shared Title',
      topics: [
        {
          id: 'topic1',
          heading: 'Topic Heading 1',
          items: [{ id: 'shared-item1', label: 'Item 1' }]
        },
        {
          id: 'topic2',
          heading: 'Topic Heading 2',
          items: [{ id: 'shared-item2', label: 'Item 2' }]
        }
      ]
    };

    const personalSection = {
      title: 'Personal Title',
      topics: [
        {
          id: 'topic3',
          heading: 'Topic Heading 3',
          items: [{ id: 'personal-item1', label: 'Item 3' }]
        }
      ]
    };

    // Only 'shared-item1' is checked
    await exportEquipmentImageAsPng({
      shared: sharedSection,
      personal: personalSection,
      checkedMap: { 'shared-item1': true },
      onlyChecked: true
    });

    const calls = fillTextSpy.mock.calls.map(call => call[0]);

    // Shared Title section and Topic Heading 1 should be rendered
    expect(calls).toContain('Shared Title');
    expect(calls).toContain('Topic Heading 1');
    expect(calls).toContain('✓  Item 1');

    // Topic Heading 2 has no checked items, so it should be excluded
    expect(calls).not.toContain('Topic Heading 2');
    expect(calls).not.toContain('Item 2');

    // Personal Title section has no checked items, so the whole section should be excluded
    expect(calls).not.toContain('Personal Title');
    expect(calls).not.toContain('Topic Heading 3');
    expect(calls).not.toContain('Item 3');
  });
});
