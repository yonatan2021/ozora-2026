import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportScheduleToCsv, exportScheduleAsImage } from './exportImage';
import QRCode from 'qrcode';

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(() => Promise.resolve('data:image/png;base64,mockqr')),
  }
}));

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

describe('exportScheduleAsImage', () => {
  let mockLink;
  let mockCanvas;
  let mockContext;

  beforeEach(() => {
    mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };

    mockContext = {
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
      ellipse: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
      scale: vi.fn(),
      quadraticCurveTo: vi.fn(),
    };

    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockContext),
      toBlob: vi.fn((cb) => cb(new Blob(['fake'], { type: 'image/png' }))),
    };

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });

    vi.stubGlobal('Blob', vi.fn(function(content, options) {
      this.content = content;
      this.options = options;
    }));

    vi.stubGlobal('File', vi.fn(function(content, filename, options) {
      this.content = content;
      this.filename = filename;
      this.options = options;
    }));

    vi.stubGlobal('document', {
      fonts: {
        ready: Promise.resolve()
      },
      createElement: vi.fn((tag) => {
        if (tag === 'canvas') return mockCanvas;
        if (tag === 'a') return mockLink;
        return {};
      }),
    });

    class MockImage {
      constructor() {
        this.onload = null;
        this.onerror = null;
        this.src = '';
      }
      set src(val) {
        this._src = val;
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
      get src() {
        return this._src;
      }
    }
    vi.stubGlobal('Image', MockImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('generates QR code and draws it when shareUrl is provided', async () => {
    vi.stubGlobal('navigator', {
      share: undefined,
      canShare: undefined,
    });

    const groupedByDay = {
      "DAY 1": [
        { id: '1', artist: 'Ace Ventura', stage: 'OZORA STAGE', start: '20:00', end: '22:00', date: '2026-07-27' }
      ]
    };

    await exportScheduleAsImage({
      groupedByDay,
      priorities: {},
      conflicts: [],
      lang: 'en',
      scheduleName: 'Test',
      theme: 'theme-night',
      shareUrl: 'https://test.com/share'
    });

    expect(QRCode.toDataURL).toHaveBeenCalledWith('https://test.com/share', expect.any(Object));
    expect(mockContext.drawImage).toHaveBeenCalled();
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('draws QR code correctly aligned in Hebrew', async () => {
    vi.stubGlobal('navigator', {
      share: undefined,
      canShare: undefined,
    });

    const groupedByDay = {
      "DAY 1": [
        { id: '1', artist: 'Ace Ventura', stage: 'OZORA STAGE', start: '20:00', end: '22:00', date: '2026-07-27' }
      ]
    };

    await exportScheduleAsImage({
      groupedByDay,
      priorities: {},
      conflicts: [],
      lang: 'he',
      scheduleName: 'Test',
      theme: 'theme-day',
      shareUrl: 'https://test.com/share'
    });

    expect(mockContext.fillText).toHaveBeenCalledWith('סרוק לייבוא', expect.any(Number), expect.any(Number));
  });

  it('uses navigator.share when available and supported', async () => {
    const shareSpy = vi.fn(() => Promise.resolve());
    const canShareSpy = vi.fn(() => true);
    vi.stubGlobal('navigator', {
      share: shareSpy,
      canShare: canShareSpy,
    });

    const groupedByDay = {
      "DAY 1": [
        { id: '1', artist: 'Ace Ventura', stage: 'OZORA STAGE', start: '20:00', end: '22:00', date: '2026-07-27' }
      ]
    };

    await exportScheduleAsImage({
      groupedByDay,
      priorities: {},
      conflicts: [],
      lang: 'en',
      scheduleName: 'Test',
      theme: 'theme-night',
      shareUrl: 'https://test.com/share'
    });

    expect(canShareSpy).toHaveBeenCalled();
    expect(shareSpy).toHaveBeenCalled();
    expect(mockLink.click).not.toHaveBeenCalled();
  });
});

