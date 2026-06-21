import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

afterEach(() => {
  cleanup();
  localStorage.clear();
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
    };
  }
  return null;
};

