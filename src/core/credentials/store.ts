import type { CredentialStorage, KeyStatus, KeyStore, ProviderId, StorageMode } from './types';

const prefix = 'real-job:credential:';

function validateProvider(providerId: ProviderId): void {
  if (providerId !== 'deepseek' && providerId !== 'lingdt') throw new Error('不支持的 API 服务商。');
}

function validKey(key: unknown): key is string {
  return typeof key === 'string' && key.trim().length > 0 && !/\s/u.test(key.trim()) && !Array.from(key).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || (code >= 127 && code <= 159);
  });
}

/** A lock supplied by the browser adapter coordinates independent extension pages. */
export type CredentialLock = <T>(operation: () => Promise<T>) => Promise<T>;

export function createKeyStore(storage: CredentialStorage, lock?: CredentialLock): KeyStore {
  let queue: Promise<unknown> = Promise.resolve();

  function serialized<T>(operation: () => Promise<T>): Promise<T> {
    const run = () => lock ? lock(operation) : operation();
    const result = queue.then(run, run);
    queue = result.then(() => undefined, () => undefined);
    return result;
  }

  async function protect(): Promise<void> {
    try {
      await Promise.all([
        storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }),
        storage.session.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }),
      ]);
    } catch {
      throw new Error('无法安全访问本机凭据，请重新加载扩展后重试。');
    }
  }

  return {
    async save(providerId, key, mode = 'session') {
      validateProvider(providerId);
      if (mode !== 'session' && mode !== 'local') throw new Error('不支持的 Key 保存方式。');
      if (!validKey(key)) throw new Error('请输入有效的 API Key，不能包含内部空白、换行或控制字符。');
      const normalized = key.trim();
      await serialized(async () => {
        await protect();
        const slot = `${prefix}${providerId}`;
        const otherMode: StorageMode = mode === 'session' ? 'local' : 'session';
        try {
          // Remove the stale area first: never turn a session-only save into an extra persistent copy.
          await storage[otherMode].remove(slot);
          await storage[mode].set({ [slot]: normalized });
        } catch {
          throw new Error('无法保存 API Key，请检查扩展存储后重试。');
        }
      });
    },
    async remove(providerId) {
      validateProvider(providerId);
      await serialized(async () => {
        await protect();
        const slot = `${prefix}${providerId}`;
        const results = await Promise.allSettled([storage.local.remove(slot), storage.session.remove(slot)]);
        if (results.some((result) => result.status === 'rejected')) {
          throw new Error('未能完整删除本机 API Key，请重新加载扩展后重试。');
        }
      });
    },
    async getStatus(providerId): Promise<KeyStatus> {
      validateProvider(providerId);
      return serialized(async () => {
        await protect();
        const slot = `${prefix}${providerId}`;
        let records: [Record<string, unknown>, Record<string, unknown>];
        try {
          records = await Promise.all([storage.session.get(slot), storage.local.get(slot)]);
        } catch {
          throw new Error('无法读取本机 API Key 状态，请重新加载扩展后重试。');
        }
        if (records.every((record) => Object.hasOwn(record, slot))) {
          throw new Error('检测到重复的本机凭据，请删除后重新保存。');
        }
        for (const [index, record] of records.entries()) {
          if (!Object.hasOwn(record, slot)) continue;
          const key = record[slot];
          if (!validKey(key)) throw new Error('本机凭据格式异常，请删除后重新配置。');
          return {
            configured: true,
            mode: index === 0 ? 'session' : 'local',
            maskedKey: `••••••••${key.length >= 8 ? key.slice(-4) : ''}`,
          };
        }
        return { configured: false, mode: null, maskedKey: null };
      });
    },
  };
}
