# Real Job

面向求职者的 Chrome 侧边栏助手：检索企业公开信息，展示可追溯的风险判断；后续支持简历与岗位匹配。

当前阶段：基于 v0.2 方案初始化 Chrome 扩展。首期为小范围邀请测试，后续考虑公开发布。插件免费，用户自行申请并承担官方 API 费用；Key 仅在本机保存，不提供自有后端、密钥托管、云同步或收费服务。

当前版本提供侧边栏、设置页、官方申请链接和本地 Key 管理。真实 API 调用、企业搜索与评级、BOSS 页面读取、持久任务引擎及简历匹配尚未接入；页面不会生成模拟评级，也不会自动调用付费 API。LingDT 配置保持禁用，直到核实官方 HTTPS 网关与 27B 路由。

未来启用官方接口后，Key 仅以鉴权凭据发送给对应官方 API；必要的企业查询和模型输入也会直达相应官方服务。“本机保存 Key”不表示未来的模型分析完全离线运行。

## 本地开发

需要 Node.js 22.13+（建议 Node 22 LTS）和 npm。

```bash
npm ci
npm run dev
```

生产构建与检查：

```bash
npm run check
npm run build
npm run zip
```

单独检查可运行 `npm run typecheck`、`npm run lint`、`npm test`。依赖版本由 `package-lock.json` 固定。

## 在 Chrome 加载

1. 运行 `npm run build`。
2. 在 Chrome 打开 `chrome://extensions`，开启开发者模式。
3. 点击“加载已解压的扩展程序”，选择项目内的 `.output/chrome-mv3` 目录。
4. 点击工具栏的 Real Job 扩展图标打开侧边栏，从侧边栏进入 API 设置。

最低 Chrome 版本为 116。当前仅申请 `sidePanel` 和 `storage` 权限，不读取 BOSS 页面，也不申请网站访问权限。重新构建后在扩展管理页点击重新加载。

普通网页预览只能查看布局；真实保存 Key 和打开 Chrome 侧边栏需要在扩展环境中操作，网页预览不会偷偷改用 localStorage。

## 配置与安全边界

- DeepSeek：[官方申请](https://platform.deepseek.com/) · [API Key 管理](https://platform.deepseek.com/api_keys)。当前仅实现本地保存，不验证账号或余额。
- LingDT：[官方控制台](https://maas.antdigital.com/console) · [API Key 管理](https://maas.antdigital.com/console/apiKey)。具体模型网关未核实，当前不接受密钥配置。
- 默认只在本次会话保存；选择“保存到本机”才持久保存。浏览器重启会清除会话密钥。
- 扩展对本地及会话存储设置可信上下文限制，不使用 `chrome.storage.sync`；Key 不进入日志、报告、URL 或导出。
- 本机保存不是操作系统密钥保险箱，无法防御被接管的电脑或浏览器配置；插件不提供云备份，用户的系统备份由其自行管理。
- 删除本机 Key 不等于在官方撤销 Key；失效或轮换应到官方管理页面完成。

手动冒烟检查：打开侧边栏与设置页；保存虚构测试字符串到会话存储并刷新确认状态；切换到本机存储后确认旧副本移除；删除后状态恢复未配置；确认不产生任何官方 API 请求。请勿将真实 Key 粘贴到问题反馈或截图中。

## 目录

```text
entrypoints/       扩展后台、侧边栏、设置页
src/core/          服务商资料、本地密钥管理、未来分析的数据类型
src/styles/        本地样式
tests/             存储与密钥边界测试
docs/              需求、技术研究与初始化计划
```

## 需求与技术资料

| 文档 | 内容 |
|---|---|
| [产品需求分析](docs/01-product-requirements.md) | 用户流程、MVP、评级门槛、数据边界、简历匹配和验收 |
| [技术可行性与架构](docs/02-technical-feasibility.md) | 官方接口能力、架构、数据合同、任务恢复、成本及推进计划 |
| [官方 API 申请与配置指南](docs/research/official-api-setup.md) | 官方申请/Key 管理入口、自备密钥、费用归属及本机保存边界 |
| [DeepSeek / LingDT 官方资料核验](docs/research/api-research.md) | 端点、输入输出、限额、价格和待开通验证项 |
| [Chrome / BOSS 官方资料核验](docs/research/extension-research.md) | 侧边栏与权限、后台生命周期、BOSS 协议原文及来源 |

核心约束：BOSS 公开协议限制未经许可的插件取数；LingDT 是结构化决策接口，证据抽取和报告解释需由应用另行完成。建议先通过手动公司输入验证检索与评价链路，再按许可条件启用页面读取。

资料核验日期：2026-10-26。设计中的阈值、性能和工期均为待实测建议。
