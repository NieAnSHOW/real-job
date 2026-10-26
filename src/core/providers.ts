import type { ProviderId } from './credentials/types';

export interface ProviderDefinition {
  id: ProviderId;
  name: string;
  signupUrl: string;
  keyManagementUrl: string;
  docsUrl: string;
  endpoint: string | null;
  runtimeReady: boolean;
}

/** Navigation links are not authenticated API destinations. No API adapter is enabled yet. */
export const PROVIDERS = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    signupUrl: 'https://platform.deepseek.com/',
    keyManagementUrl: 'https://platform.deepseek.com/api_keys',
    docsUrl: 'https://api-docs.deepseek.com/zh-cn/api/search',
    endpoint: 'https://api.deepseek.com/v1/tools/search',
    runtimeReady: false,
  },
  {
    id: 'lingdt',
    name: '蚂蚁 LingDT',
    signupUrl: 'https://maas.antdigital.com/console',
    keyManagementUrl: 'https://maas.antdigital.com/console/apiKey',
    docsUrl: 'https://maas.antdigital.com/docs/lingdt-decision-api-guide',
    endpoint: null,
    runtimeReady: false,
  },
] as const satisfies readonly ProviderDefinition[];
