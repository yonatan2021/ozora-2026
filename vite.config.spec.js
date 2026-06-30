import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Vite PWA update strategy', () => {
  it('uses prompt mode without automatic service worker activation', () => {
    const config = readFileSync(path.join(process.cwd(), 'vite.config.js'), 'utf8');

    expect(config).toContain("registerType: 'prompt'");
    expect(config).toContain('injectRegister: null');
    expect(config).not.toContain("registerType: 'autoUpdate'");
    expect(config).not.toContain('skipWaiting: true');
    expect(config).not.toContain('clientsClaim: true');
  });
});
