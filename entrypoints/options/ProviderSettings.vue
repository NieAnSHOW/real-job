<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { getKeyStore, type KeyStatus, type StorageMode } from '../../src/core/credentials';
import { PROVIDERS } from '../../src/core/providers';

const provider = PROVIDERS.find((item) => item.id === 'deepseek')!;
const keyInput = ref('');
const storageMode = ref<StorageMode>('session');
const status = ref<KeyStatus>({ configured: false, mode: null, maskedKey: null });
const loading = ref(true);
const busy = ref(false);
const supported = ref(false);
const statusError = ref('');
const message = ref('');
const actionError = ref('');
const canRemove = computed(() => supported.value && !busy.value && !loading.value
  && (status.value.configured || Boolean(statusError.value)));
const statusLabel = computed(() => {
  if (loading.value) return '正在读取本机配置';
  if (statusError.value) return '配置读取失败';
  if (!status.value.configured) return '未配置';
  return status.value.mode === 'local' ? '已保存在本机 · 尚未验证' : '仅本次会话 · 尚未验证';
});

async function refreshStatus() {
  try {
    status.value = await getKeyStore().getStatus('deepseek');
    statusError.value = '';
  } catch {
    message.value = '';
    statusError.value = '无法读取本机配置。可尝试删除已保存 Key 后重新设置；如仍失败，请重新加载扩展。';
  } finally {
    loading.value = false;
  }
}

async function saveKey() {
  if (!supported.value || busy.value || loading.value || statusError.value) return;
  busy.value = true;
  message.value = '';
  actionError.value = '';
  try {
    await getKeyStore().save('deepseek', keyInput.value, storageMode.value);
    keyInput.value = '';
    await refreshStatus();
    if (!statusError.value) {
      message.value = storageMode.value === 'local'
        ? 'Key 已保存在本机。没有发送网络请求。'
        : 'Key 已保存在本次浏览器会话。重启浏览器后需重新填写。';
    }
  } catch {
    actionError.value = '保存失败。请检查 Key 是否为空或含空白、控制字符，然后重试；仍失败时请重新加载扩展。';
  } finally {
    busy.value = false;
  }
}

async function removeKey() {
  if (!canRemove.value) return;
  busy.value = true;
  message.value = '';
  actionError.value = '';
  try {
    await getKeyStore().remove('deepseek');
    keyInput.value = '';
    await refreshStatus();
    if (!statusError.value) message.value = '本机和会话中的 Key 已删除。如需使 Key 失效，请到官方平台撤销。';
  } catch {
    actionError.value = '删除未完成。请重新加载扩展后再次删除，必要时到官方平台撤销 Key。';
  } finally {
    busy.value = false;
  }
}

function onStorageChanged() {
  void refreshStatus();
}

onMounted(() => {
  supported.value = typeof chrome !== 'undefined' && Boolean(chrome.runtime?.id && chrome.storage?.local);
  if (!supported.value) {
    statusError.value = '当前是网页预览。请在 Chrome 中加载扩展后使用本机 Key 设置。';
    loading.value = false;
    return;
  }
  void refreshStatus();
  chrome.storage.onChanged.addListener(onStorageChanged);
});

onBeforeUnmount(() => {
  keyInput.value = '';
  if (supported.value) chrome.storage.onChanged.removeListener(onStorageChanged);
});
</script>

<template>
  <section class="provider-section" aria-labelledby="deepseek-title">
    <div class="section-heading">
      <div>
        <h2 id="deepseek-title">DeepSeek</h2>
        <p class="supporting">用于企业公开信息的搜索与网页抓取。</p>
      </div>
      <span class="status-label" :class="{ 'is-configured': status.configured }">{{ statusLabel }}</span>
    </div>
    <nav class="link-row" aria-label="DeepSeek 官方入口">
      <a :href="provider.signupUrl" target="_blank" rel="noopener noreferrer">前往官方申请</a>
      <a :href="provider.keyManagementUrl" target="_blank" rel="noopener noreferrer">管理 API Key</a>
      <a :href="provider.docsUrl" target="_blank" rel="noopener noreferrer">官方文档</a>
    </nav>
    <p v-if="statusError" class="message error" role="alert">{{ statusError }}</p>
    <form class="key-form" @submit.prevent="saveKey">
      <fieldset :disabled="!supported || busy || loading || Boolean(statusError)">
        <label for="deepseek-key">{{ status.configured ? '替换 API Key' : 'API Key' }}</label>
        <p v-if="status.configured" class="field-help">当前配置：{{ status.maskedKey }}。保存新的 Key 会替换原配置。</p>
        <input
          id="deepseek-key"
          v-model="keyInput"
          type="password"
          autocomplete="off"
          autocapitalize="off"
          :spellcheck="false"
          placeholder="粘贴从 DeepSeek 官方获取的 Key"
          aria-describedby="key-help"
          maxlength="8192"
        />
        <p id="key-help" class="field-help">仅在此扩展中保存。当前版本尚未接入 API，不会发送验证请求。</p>
        <label for="storage-mode">保存方式</label>
        <select id="storage-mode" v-model="storageMode" aria-describedby="storage-help">
          <option value="session">仅本次会话</option>
          <option value="local">保存到本机</option>
        </select>
        <p id="storage-help" class="field-help">
          {{ storageMode === 'session' ? '浏览器重启、扩展更新或重新加载后，需要重新填写。' : '保存在当前浏览器配置中，不使用浏览器同步。本机存储不是系统密钥保险箱。' }}
        </p>
      </fieldset>
      <div class="button-row">
        <button class="button primary" type="submit" :disabled="!supported || busy || loading || Boolean(statusError) || !keyInput.trim()">{{ busy ? '正在处理…' : '保存 Key' }}</button>
        <button class="button secondary" type="button" :disabled="!canRemove" @click="removeKey">删除已保存 Key</button>
      </div>
    </form>
    <p v-if="message" class="message success" role="status">{{ message }}</p>
    <p v-if="actionError" class="message error" role="alert">{{ actionError }}</p>
  </section>
</template>
