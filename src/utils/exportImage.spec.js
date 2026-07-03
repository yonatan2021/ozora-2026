import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportScheduleToCsv } from './exportImage';

describe('exportScheduleToCsv', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal('Blob', vi.fn(function(content, options) {
      this.content = content;
      this.options = options;
    }));
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        href: '',
        download: '',
        click: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('generates correct CSV format for Hebrew language', () => {
    const groupedByDay = {
      "DAY 1": [
        { id: '1', artist: 'Ace Ventura', stage: 'OZORA STAGE', start: '20:00', end: '22:00' }
      ]
    };
    const priorities = {
      "1_20:00": 'must'
    };
    
    exportScheduleToCsv({ groupedByDay, priorities, lang: 'he' });
    
    expect(Blob).toHaveBeenCalled();
    const blobContent = vi.mocked(Blob).mock.calls[0][0][0];
    expect(blobContent).toContain('Ace Ventura');
    expect(blobContent).toContain('OZORA STAGE');
    expect(blobContent).toContain('חובה');
  });

  it('generates correct CSV format for English language', () => {
    const groupedByDay = {
      "DAY 2": [
        { id: '2', artist: 'Liquid Soul', stage: 'PUMPUI', start: '14:00', end: '16:00' }
      ]
    };
    const priorities = {
      "2_14:00": 'want'
    };

    exportScheduleToCsv({ groupedByDay, priorities, lang: 'en' });

    expect(Blob).toHaveBeenCalled();
    const blobContent = vi.mocked(Blob).mock.calls[0][0][0];
    expect(blobContent).toContain('Liquid Soul');
    expect(blobContent).toContain('PUMPUI');
    expect(blobContent).toContain('Want');
  });
});
