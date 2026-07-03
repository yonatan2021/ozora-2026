import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportScheduleToCsv } from './exportImage';

describe('exportScheduleToCsv', () => {
  let mockLink;

  beforeEach(() => {
    mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal('Blob', vi.fn(function(content, options) {
      this.content = content;
      this.options = options;
    }));
    vi.stubGlobal('document', {
      createElement: vi.fn(() => mockLink),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('generates correct CSV format for Hebrew language, conflicts, and notes using composite keys', () => {
    const groupedByDay = {
      "DAY 1": [
        { id: '1', artist: 'Ace Ventura', stage: 'OZORA STAGE', start: '20:00', end: '22:00', date: '2026-07-27' }
      ]
    };
    
    // Key format is: Artist::Stage::Date::Start
    const priorities = {
      "Ace Ventura::OZORA STAGE::2026-07-27::20:00": 'must'
    };
    const conflicts = [
      {
        setA: { id: '1', artist: 'Ace Ventura' },
        setB: { id: '2', artist: 'Liquid Soul' }
      }
    ];
    const notes = {
      "Ace Ventura::OZORA STAGE::2026-07-27::20:00": 'My favorite set!'
    };
    
    exportScheduleToCsv({ groupedByDay, priorities, conflicts, notes, lang: 'he' });
    
    expect(Blob).toHaveBeenCalled();
    const blobContent = vi.mocked(Blob).mock.calls[0][0][0];
    expect(blobContent).toContain('Ace Ventura');
    expect(blobContent).toContain('OZORA STAGE');
    expect(blobContent).toContain('חובה'); // 'must' -> 'חובה'
    expect(blobContent).toContain('Liquid Soul');
    expect(blobContent).toContain('My favorite set!');
    
    // Assert link properties and download triggers
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockLink.href).toBe('blob:mock-url');
    expect(mockLink.download).toBe('ozora-2026-schedule.csv');
    expect(mockLink.click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('generates correct CSV format for English language', () => {
    const groupedByDay = {
      "DAY 2": [
        { id: '2', artist: 'Liquid Soul', stage: 'PUMPUI', start: '14:00', end: '16:00', date: '2026-07-28' }
      ]
    };
    const priorities = {
      "Liquid Soul::PUMPUI::2026-07-28::14:00": 'want'
    };

    exportScheduleToCsv({ groupedByDay, priorities, conflicts: [], notes: {}, lang: 'en' });

    expect(Blob).toHaveBeenCalled();
    const blobContent = vi.mocked(Blob).mock.calls[0][0][0];
    expect(blobContent).toContain('Liquid Soul');
    expect(blobContent).toContain('PUMPUI');
    expect(blobContent).toContain('Want');
  });
});
