import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('wxt/browser', () => ({ browser: undefined }));

import { getKeyStore } from '../src/core/credentials';

afterEach(() => vi.unstubAllGlobals());

describe('Chrome credential adapter', () => {
  it('refuses ordinary browser/Node environments instead of persisting in localStorage', () => {
    expect(() => getKeyStore()).toThrow('请在 Chrome 扩展中');
  });
});
