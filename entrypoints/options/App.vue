<script setup lang="ts">
import ProviderSettings from './ProviderSettings.vue';
import { PROVIDERS } from '../../src/core/providers';

const lingdt = PROVIDERS.find((item) => item.id === 'lingdt')!;
</script>

<template>
  <div class="settings-layout">
    <header class="masthead">
      <a class="brand" href="./sidepanel.html" aria-label="Real Job 公司分析页">
        <svg viewBox="0 0 28 28" width="28" height="28" fill="none" aria-hidden="true"><rect x="3" y="3" width="22" height="22" rx="6" stroke="currentColor" stroke-width="2"/><path d="m8 14 4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>Real Job</span>
      </a>
      <span class="quiet">免费插件</span>
    </header>
    <main class="settings-main">
      <div class="page-intro">
        <h1>连接你自己的 API</h1>
        <p>在官方平台申请服务，将 Key 保存在本机。API 费用由你直接向官方支付。</p>
      </div>
      <ProviderSettings />
      <section class="provider-section" aria-labelledby="lingdt-title">
        <div class="section-heading">
          <div>
            <h2 id="lingdt-title">蚂蚁 LingDT</h2>
            <p class="supporting">用于基于证据的企业风险判断。</p>
          </div>
          <span class="status-label">等待官方接入信息</span>
        </div>
        <nav class="link-row" aria-label="LingDT 官方入口">
          <a :href="lingdt.signupUrl" target="_blank" rel="noopener noreferrer">前往官方申请</a>
          <a :href="lingdt.keyManagementUrl" target="_blank" rel="noopener noreferrer">管理 API Key</a>
          <a :href="lingdt.docsUrl" target="_blank" rel="noopener noreferrer">官方文档</a>
        </nav>
        <p class="notice">27B 模型的官方 HTTPS 网关尚待确认。当前不收取 LingDT Key，也不会向猜测地址发送请求。</p>
        <button class="button secondary" disabled type="button">暂不可配置</button>
      </section>
      <section class="data-note" aria-labelledby="data-note-title">
        <h2 id="data-note-title">数据如何流转</h2>
        <p>Key 不上传开发者服务器、不进入云同步。API 接入后，调用会将 Key 发给对应官方接口鉴权，并发送分析所需的公司资料。</p>
        <p>当前版本仅提供本机配置。搜索、连接验证、企业评级和页面读取尚未接入。</p>
      </section>
    </main>
    <footer class="footer">你的账号，你的 Key。Real Job 不提供充值、订阅或 API 转售服务。</footer>
  </div>
</template>
