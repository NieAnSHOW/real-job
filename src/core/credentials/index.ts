import { browser } from 'wxt/browser';
import { createKeyStore, type CredentialLock } from './store';
import type { KeyStore, StorageArea, StorageMode } from './types';

export { createKeyStore } from './store';
export type { CredentialStorage, KeyStatus, KeyStore, ProviderId, StorageMode } from './types';

let singleton: KeyStore | undefined;

/** Lazily initializes only in a real extension. Never falls back to webpage storage. */
export function getKeyStore(): KeyStore {
  if (!browser?.runtime?.id || !browser.storage?.local || !browser.storage?.session) {
    throw new Error('请在 Chrome 扩展中打开此页面后管理 API Key。');
  }
  const locks = globalThis.navigator?.locks;
  if (!locks) throw new Error('当前环境无法安全协调凭据存储，请使用受支持的 Chrome 扩展。');
  if (singleton) return singleton;

  function area(mode: StorageMode): StorageArea {
    return {
      setAccessLevel: (options) => browser.storage[mode].setAccessLevel(options),
      get: (key) => browser.storage[mode].get(key),
      set: (items) => browser.storage[mode].set(items),
      remove: (key) => browser.storage[mode].remove(key),
    };
  }

  // Web Locks coordinate multiple settings pages; the store queue handles a single context.
  const lock: CredentialLock = async <T>(operation: () => Promise<T>): Promise<T> => {
    let result: { ok: true; value: T } | { ok: false; error: unknown };
    try {
      result = await locks.request('real-job:credential-store', { mode: 'exclusive' }, async () => {
        try {
          return { ok: true as const, value: await operation() };
        } catch (error) {
          // Operation errors are already sanitized by the store; do not confuse them with lock errors.
          return { ok: false as const, error };
        }
      });
    } catch {
      throw new Error('无法安全协调本机凭据，请重新加载扩展后重试。');
    }
    if (!result.ok) throw result.error;
    return result.value;
  };

  singleton = createKeyStore({ local: area('local'), session: area('session') }, lock);
  return singleton;
}
