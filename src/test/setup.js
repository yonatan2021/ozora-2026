import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

const createStorageMock = () => {
  let store = {};

  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

const localStorageMock = createStorageMock();
const sessionStorageMock = createStorageMock();

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: localStorageMock,
});

Object.defineProperty(window, 'sessionStorage', {
  configurable: true,
  value: sessionStorageMock,
});

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: localStorageMock,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  configurable: true,
  value: sessionStorageMock,
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock URL APIs
window.URL.createObjectURL = () => 'blob:mock-url';
window.URL.revokeObjectURL = () => {};

// Mock Canvas context
HTMLCanvasElement.prototype.getContext = function (type) {
  if (type === '2d') {
    return {
      setTransform: () => {},
      clearRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      createRadialGradient: () => ({
        addColorStop: () => {},
      }),
      fillStyle: null,
      scale: () => {},
    };
  }
  return null;
};

// Mock Image loading for JSDOM
class MockImage {
  constructor() {
    this.width = 100;
    this.height = 100;
  }
  set src(val) {
    this._src = val;
    if (val) {
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 0);
    }
  }
  get src() {
    return this._src;
  }
}
Object.defineProperty(globalThis, 'Image', {
  configurable: true,
  writable: true,
  value: MockImage,
});

