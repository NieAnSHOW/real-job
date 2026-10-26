import { describe, expect, it } from 'vitest';
import { createKeyStore } from '../src/core/credentials/store';
import type { CredentialStorage, StorageArea } from '../src/core/credentials/types';

function memoryStorage() {
  const events: string[] = [];
  const faults = new Set<string>();
  const records = { local: {} as Record<string, unknown>, session: {} as Record<string, unknown> };
  function area(name: 'local' | 'session'): StorageArea {
    async function operation(op: string) {
      events.push(`${name}:${op}`);
      if (faults.has(`${name}:${op}`)) throw new Error('unsafe-provider-error-secret');
    }
    return {
      async setAccessLevel(options) {
        expect(options.accessLevel).toBe('TRUSTED_CONTEXTS');
        await operation('restrict');
      },
      async get(key) {
        await operation('get');
        return Object.hasOwn(records[name], key) ? { [key]: records[name][key] } : {};
      },
      async set(items) {
        await operation('set');
        Object.assign(records[name], items);
      },
      async remove(key) {
        await operation('remove');
        delete records[name][key];
      },
    };
  }
  const storage: CredentialStorage = { local: area('local'), session: area('session') };
  return { storage, records, events, faults };
}

const slot = 'real-job:credential:deepseek';

describe('local credential store', () => {
  it('saves to session by default only after both access controls succeed', async () => {
    const fake = memoryStorage();
    const store = createKeyStore(fake.storage);
    await store.save('deepseek', '  example-secret-1234  ');
    expect(fake.records.session[slot]).toBe('example-secret-1234');
    expect(fake.records.local).toEqual({});
    expect(fake.events.indexOf('session:set')).toBeGreaterThan(fake.events.indexOf('local:restrict'));
    expect(fake.events.indexOf('session:set')).toBeGreaterThan(fake.events.indexOf('session:restrict'));
    expect(await store.getStatus('deepseek')).toEqual({ configured: true, mode: 'session', maskedKey: '••••••••1234' });
  });

  it.each(['local:restrict', 'session:restrict'])('fails closed if %s is rejected', async (failure) => {
    const fake = memoryStorage();
    fake.faults.add(failure);
    const store = createKeyStore(fake.storage);
    await expect(store.save('deepseek', 'example-secret')).rejects.toThrow('无法安全访问本机凭据');
    expect(fake.records).toEqual({ local: {}, session: {} });
    expect(fake.events.some((event) => /:(get|set|remove)$/.test(event))).toBe(false);
  });

  it('moves persistent credentials to session without leaving a durable copy', async () => {
    const fake = memoryStorage();
    const store = createKeyStore(fake.storage);
    await store.save('deepseek', 'old-persistent-secret', 'local');
    await store.save('deepseek', 'new-session-secret', 'session');
    expect(fake.records.local).toEqual({});
    expect(fake.records.session[slot]).toBe('new-session-secret');
    expect((await store.getStatus('deepseek')).mode).toBe('session');
  });

  it('moves session credentials to local without leaving a stale session copy', async () => {
    const fake = memoryStorage();
    const store = createKeyStore(fake.storage);
    await store.save('deepseek', 'old-session-secret');
    await store.save('deepseek', 'new-persistent-secret', 'local');
    expect(fake.records.session).toEqual({});
    expect(fake.records.local[slot]).toBe('new-persistent-secret');
    expect((await store.getStatus('deepseek')).mode).toBe('local');
  });

  it('removes both copies without deleting another provider credential', async () => {
    const fake = memoryStorage();
    fake.records.local[slot] = 'old-secret';
    fake.records.session[slot] = 'new-secret';
    fake.records.local['real-job:credential:lingdt'] = 'other-provider-secret';
    const store = createKeyStore(fake.storage);
    await store.remove('deepseek');
    expect(await store.getStatus('deepseek')).toEqual({ configured: false, mode: null, maskedKey: null });
    expect(fake.records.local['real-job:credential:lingdt']).toBe('other-provider-secret');
  });

  it.each(['', '   ', 'a\nb', 'a\rb', 'a\tb', 'a\u0000b', 'a\u007fb', 'a\u0085b', 'a b', 'a\u00a0b'])('rejects empty or control-containing input without storage access', async (key) => {
    const fake = memoryStorage();
    await expect(createKeyStore(fake.storage).save('deepseek', key)).rejects.toThrow('API Key');
    expect(fake.events).toEqual([]);
  });

  it('rejects unknown providers and storage modes before any storage access', async () => {
    const fake = memoryStorage();
    const store = createKeyStore(fake.storage);
    // Invalid external input must fail even if a caller bypasses TypeScript.
    await expect(store.save('untrusted' as 'deepseek', 'example-secret')).rejects.toThrow('服务商');
    await expect(store.getStatus('untrusted' as 'deepseek')).rejects.toThrow('服务商');
    await expect(store.remove('untrusted' as 'deepseek')).rejects.toThrow('服务商');
    await expect(store.save('deepseek', 'example-secret', 'sync' as 'local')).rejects.toThrow('保存方式');
    expect(fake.events).toEqual([]);
  });

  it.each(['x', 'tiny', 'example-secret-1234'])('never returns the complete stored credential in metadata', async (key) => {
    const fake = memoryStorage();
    const store = createKeyStore(fake.storage);
    await store.save('deepseek', key);
    const status = await store.getStatus('deepseek');
    expect(status.configured).toBe(true);
    expect(status.maskedKey).not.toBe(key);
    expect(Object.keys(status).sort()).toEqual(['configured', 'maskedKey', 'mode']);
    if (key.length < 8) expect(status.maskedKey).toBe('••••••••');
  });

  it('does not copy into a new area when stale-copy removal fails', async () => {
    const fake = memoryStorage();
    fake.records.local[slot] = 'persistent-secret';
    fake.faults.add('local:remove');
    const store = createKeyStore(fake.storage);
    await expect(store.save('deepseek', 'new-session-secret')).rejects.toThrow('无法保存 API Key');
    expect(fake.records.session).toEqual({});
    expect(fake.records.local[slot]).toBe('persistent-secret');
  });

  it('sanitizes storage failure messages and allows a later operation to recover', async () => {
    const fake = memoryStorage();
    fake.faults.add('session:set');
    const store = createKeyStore(fake.storage);
    let message = '';
    try { await store.save('deepseek', 'new-secret'); } catch (error) { message = (error as Error).message; }
    expect(message).toBe('无法保存 API Key，请检查扩展存储后重试。');
    expect(message).not.toContain('unsafe-provider-error-secret');
    fake.faults.clear();
    await store.save('deepseek', 'another-secret');
    expect((await store.getStatus('deepseek')).configured).toBe(true);
  });

  it('attempts deletion in both areas even when one deletion fails', async () => {
    const fake = memoryStorage();
    fake.records.local[slot] = 'local-secret';
    fake.records.session[slot] = 'session-secret';
    fake.faults.add('local:remove');
    const store = createKeyStore(fake.storage);
    await expect(store.remove('deepseek')).rejects.toThrow('未能完整删除');
    expect(fake.records.session).toEqual({});
    expect(fake.records.local[slot]).toBe('local-secret');
  });

  it('serializes save and deletion so a rapid delete cannot be undone by an earlier save', async () => {
    const fake = memoryStorage();
    const store = createKeyStore(fake.storage);
    await Promise.all([store.save('deepseek', 'pending-secret'), store.remove('deepseek')]);
    expect(await store.getStatus('deepseek')).toEqual({ configured: false, mode: null, maskedKey: null });
  });

  it('coordinates two independently created stores through a shared lock', async () => {
    const fake = memoryStorage();
    let tail: Promise<unknown> = Promise.resolve();
    const lock = <T>(operation: () => Promise<T>): Promise<T> => {
      const result = tail.then(operation);
      tail = result.catch(() => undefined);
      return result;
    };
    const first = createKeyStore(fake.storage, lock);
    const second = createKeyStore(fake.storage, lock);
    await Promise.all([
      first.save('deepseek', 'first-session-secret', 'session'),
      second.save('deepseek', 'last-local-secret', 'local'),
    ]);
    expect(fake.records.session).toEqual({});
    expect(fake.records.local[slot]).toBe('last-local-secret');
  });

  it('does not describe a key as session-only when a persistent copy also exists', async () => {
    const fake = memoryStorage();
    fake.records.session[slot] = 'session-secret';
    fake.records.local[slot] = 'local-secret';
    await expect(createKeyStore(fake.storage).getStatus('deepseek')).rejects.toThrow('重复的本机凭据');
  });

  it('treats corrupt stored values as a safe failure without exposing their contents', async () => {
    const fake = memoryStorage();
    fake.records.local[slot] = { unexpected: 'sensitive-content' };
    await expect(createKeyStore(fake.storage).getStatus('deepseek')).rejects.toThrow('本机凭据格式异常');
  });
});
