import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'Real Job · 求职信息助手',
    description: '免费、本机配置的求职信息助手。当前版本提供侧边栏与官方 API Key 管理。',
    minimum_chrome_version: '116',
    permissions: ['storage', 'sidePanel'],
    action: { default_title: '打开 Real Job' },
  },
});
