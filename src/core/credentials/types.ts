export type ProviderId = 'deepseek' | 'lingdt';
export type StorageMode = 'session' | 'local';

export interface KeyStatus {
  configured: boolean;
  mode: StorageMode | null;
  maskedKey: string | null;
}

/** Deliberately excludes sync storage and generic messaging access. */
export interface StorageArea {
  setAccessLevel(options: { accessLevel: 'TRUSTED_CONTEXTS' }): Promise<void>;
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface CredentialStorage {
  local: StorageArea;
  session: StorageArea;
}

export interface KeyStore {
  save(providerId: ProviderId, key: string, mode?: StorageMode): Promise<void>;
  remove(providerId: ProviderId): Promise<void>;
  getStatus(providerId: ProviderId): Promise<KeyStatus>;
}
