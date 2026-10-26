<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { getKeyStore } from '../../src/core/credentials';

const companyName = ref('');
const keyStatus = ref('正在读取配置');
const notice = ref('');
const supported = ref(false);

async function refreshStatus() {
  try {
    const status = await getKeyStore().getStatus('deepseek');
    keyStatus.value = status.configured ? '已配置 · 尚未验证' : '未配置';
  } catch {
    keyStatus.value = '无法读取配置';
    notice.value = '请在 Chrome 扩展中打开此页，或重新加载扩展。';
  }
}

async function openSettings() {
  if (supported.value) {
    try {
      await chrome.runtime.openOptionsPage();
    } catch {
      notice.value = '未能打开设置，请右键扩展图标并选择“选项”。';
    }
  } else {
    window.location.assign('./options.html');
  }
}

function onStorageChanged() { void refreshStatus(); }

onMounted(() => {
  supported.value = typeof chrome !== 'undefined' && Boolean(chrome.runtime?.id && chrome.storage?.local);
  if (!supported.value) {
    keyStatus.value = '网页预览';
    return;
  }
  void refreshStatus();
  chrome.storage.onChanged.addListener(onStorageChanged);
});

onBeforeUnmount(() => {
  if (supported.value) chrome.storage.onChanged.removeListener(onStorageChanged);
});
</script>

<template>
  <div class="panel-layout">
    <header class="masthead">
      <div class="brand">
        <svg viewBox="0 0 28 28" width="28" height="28" fill="none" aria-hidden="true"><rect x="3" y="3" width="22" height="22" rx="6" stroke="currentColor" stroke-width="2"/><path d="m8 14 4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>Real Job</span>
      </div>
      <button class="text-button" type="button" @click="openSettings">API 设置</button>
    </header>
    <main>
      <section class="panel-intro" aria-labelledby="panel-title">
        <h1 id="panel-title">了解公司，<br />从可靠的依据开始。</h1>
        <p>核对企业信息，区分风险与未知，再决定是否进一步了解。</p>
      </section>
      <section class="company-section" aria-labelledby="company-title">
        <h2 id="company-title">要了解哪家公司？</h2>
        <label for="company-name">公司全称</label>
        <input id="company-name" v-model="companyName" autocomplete="off" maxlength="128" placeholder="例如：公司工商登记全称" aria-describedby="analysis-unavailable" />
        <button class="button primary full-width" disabled type="button">分析功能尚未接入</button>
        <p id="analysis-unavailable" class="field-help">当前是初始化版本。填写名称不会保存或发送请求，也不会生成企业评级。</p>
      </section>
      <section class="connection-section" aria-labelledby="connection-title">
        <div class="section-heading">
          <h2 id="connection-title">服务配置</h2>
          <button class="text-button" type="button" @click="openSettings">管理</button>
        </div>
        <dl class="connection-list">
          <div><dt>DeepSeek 搜索</dt><dd>{{ keyStatus }}</dd></div>
          <div><dt>LingDT 决策</dt><dd>等待官方网关</dd></div>
        </dl>
        <p class="supporting">先到官方申请 API，再在设置中保存你自己的 Key。</p>
      </section>
      <p v-if="notice" class="message error" role="alert">{{ notice }}</p>
    </main>
    <footer class="footer panel-footer">
      <p>插件免费 · Key 仅本机保存</p>
      <p>官方 API 的调用费用由你自行承担。</p>
    </footer>
  </div>
</template>
