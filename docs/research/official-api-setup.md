# 官方 API 申请与本机配置指南

核验日期：2026-10-26。适用方案：免费 Chrome 扩展，用户自行申请官方 API，并直接向对应官方服务商支付可能产生的费用；插件不售卖额度、订阅、代理接口或托管服务。

本次只核对公开官方链接和公开页面资源，没有登录、申请账号、创建密钥或调用付费接口。登录后流程、账号资格和最终费用以用户自己的官方控制台为准。

## 1. 官方入口

| 用途 | 注册/开通入口 | API Key 入口 | 官方文档 |
|---|---|---|---|
| DeepSeek 网页搜索与抓取 | [DeepSeek 开放平台](https://platform.deepseek.com/) | [DeepSeek API Keys](https://platform.deepseek.com/api_keys) | [Search](https://api-docs.deepseek.com/zh-cn/api/search)、[Fetch](https://api-docs.deepseek.com/zh-cn/api/fetch)、[计费与限速](https://api-docs.deepseek.com/zh-cn/guides/search) |
| 蚂蚁 LingDT 决策模型 | [蚂蚁百灵 MaaS 官网](https://maas.antdigital.com/)、[官方控制台](https://maas.antdigital.com/console) | [官方 API Key 页面](https://maas.antdigital.com/console/apiKey) | [LingDT-Decision 调用指南](https://maas.antdigital.com/docs/lingdt-decision-api-guide)、[官方价格入口](https://maas.antdigital.com/pricing) |

插件设置页提供“前往官方申请”“管理官方 API Key”“查看官方文档”按钮。链接在普通浏览器标签页打开，不嵌入代理登录页，不自动替用户开户、购买或充值，也不将已填写的 Key 放入 URL。

申请网站与 API 鉴权地址用途不同。`platform.deepseek.com` 和 `maas.antdigital.com/console` 是供用户访问的管理入口，不能因为域名属于同一服务商就把密钥附加到它们的所有请求上。

## 2. DeepSeek 申请步骤

1. 打开 [DeepSeek 开放平台](https://platform.deepseek.com/)，按官方页面完成注册或登录。
2. 在 [API Keys](https://platform.deepseek.com/api_keys) 页面按账号实际可用流程创建密钥。仅在本机插件的 DeepSeek 配置栏填写，不发给插件开发者。
3. 在官方平台查看当前服务可用性、余额、限额和计费条件，需要充值时由用户在官方平台自行完成。
4. 回到插件选择“仅本次会话使用”或明确选择“保存到本机”。如果发起连接测试，应先提示“测试会请求官方接口，可能产生官方费用”，用户主动点击后再执行。
5. 需要撤销时，在插件删除本地 Key，并前往官方 API Keys 页面按官方能力撤销或轮换。只删除本机副本不等于撤销服务商侧凭据。

当前公开文档声明的直连接口为 `https://api.deepseek.com/v1/tools/search` 与 `https://api.deepseek.com/v1/tools/fetch`，均使用 Bearer 鉴权。插件应固定其已核验的 HTTPS origin 和允许路径，不要求用户粘贴第三方中转地址。

本次确认方式：DeepSeek [官方文档首页](https://api-docs.deepseek.com/zh-cn/)直接包含开放平台及 API Keys 链接；本次直接访问两个平台页面均返回 HTTP 429。因此已确认官方链接归属，未确认当时可完成登录、创建 Key 或账号是否已开通搜索能力。

## 3. LingDT 申请步骤与待确认事项

1. 打开 [蚂蚁百灵 MaaS 官网](https://maas.antdigital.com/)或[官方控制台](https://maas.antdigital.com/console)，按官网入口注册或登录。
2. 查看账号是否已提供 `lingdt-decision-1.0-27b` 或对应 27B 决策服务。不能假设普通平台账号默认具有该模型的调用资格。
3. 根据账号实际控制台和[官方调用指南](https://maas.antdigital.com/docs/lingdt-decision-api-guide)完成所需服务开通、购买或联系官方支持。是否需要专门申请、适用套餐和正式配额本次未验证；不要把某个通用套餐写成必定包含 27B。
4. 进入[官方 API Key 页面](https://maas.antdigital.com/console/apiKey)，按官方流程取得可用于对应决策服务的凭据，并核对服务端点与模型路由。
5. 插件确认已有受支持的官方 HTTPS 端点和模型路由配置后，用户才填写并启用 LingDT Key。未确认端点时显示“等待官方接入信息”，禁止向猜测地址或任意自定义 base URL 发送密钥。
6. 价格、余额及用量在[官方价格入口](https://maas.antdigital.com/pricing)和账号控制台查看，实际账单以官方为准。

指南的示例网关仍是 `http://<MAAS_GATEWAY>/v1/systemone`，不能把占位符当可执行 URL，也不能在生产环境通过明文 HTTP 发送 Key。本项目尚未核实 `lingdt-decision-1.0-27b` 的完整官方 HTTPS 调用地址与路由，属于正式接入前的验证项。

本次确认方式：MaaS 官网及 `/console`、`/console/apiKey`、`/pricing` 返回 HTTP 200；官网公开加载的前端资源明确包含这些路由。它们是单页应用入口，本次没有进入登录后的业务页面，也没有验证账号状态或凭据生成流程。若官方后续调整路由，应回到官网的“控制台”入口，不能自动重定向用户到非官方替代站。

## 4. 插件配置项

| 配置项 | 用户操作 | 保存及验证 |
|---|---|---|
| DeepSeek API Key | 手动填写、替换、删除 | 仅插件可信上下文访问；不进入页面内容脚本 |
| LingDT API Key | 在官方接入参数已确认后填写 | 与 DeepSeek 分开保存，只发向对应官方 API |
| 凭据保存方式 | 会话使用，或主动选择本机保存 | 会话用 `chrome.storage.session`；持久保存用 `chrome.storage.local`，不使用 `storage.sync` |
| 模型 | 选择插件已支持、账号已开通的官方模型 | 不把任意模型名或第三方路由伪装成 LingDT |
| 调用预算 | 设置每次请求数、重试和本地用量提醒 | 只是本机防误操作限制，不能替代服务商侧账单或额度限制 |
| 连接测试 | 主动点击，事先知道可能计费 | 不在每次打开设置页时自动发计费请求 |

本机保存应限制为扩展可信上下文；对 `storage.local` 显式设置访问级别为 `TRUSTED_CONTEXTS`，避免默认内容脚本可访问的行为。`storage.session` 在扩展停用、重载、更新或浏览器重启时会清空；它不代表重启后仍记住 Key。具体语义见 [Chrome 官方 Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)。Key 输入框默认遮蔽；读取时不把已保存 Key 重新填入普通网页 DOM。敏感值不出现在 URL、日志、错误信息、剪贴板自动操作、报告或配置导出中。

扩展本机存储不等于操作系统硬件密钥库，不宣称“绝对安全”或“自动端到端加密”。若未实现用户口令加密，就应如实说明保存方式；密钥与加密钥匙同存并不能提供强本机保护。插件不主动同步或上传本地文件，但用户自行启用的整机/浏览器配置目录备份不受插件控制。

## 5. “只保存在本机”的准确边界

可用于设置页的说明文案：

> 插件免费使用。请自行向 DeepSeek 和蚂蚁百灵 MaaS 申请 API Key；官方 API 费用由服务商直接向你收取。Key 只保存在本机，不上传到插件开发者或第三方中转服务。调用时，插件会通过 HTTPS 将对应 Key 作为鉴权信息发送给该官方 API，并发送完成分析所需的公司资料。你可以随时删除本地 Key，并到官方平台撤销凭据。

Key 不上传自有云端，与 Key 永不离开设备不是同一承诺。远程官方 API 必须接收鉴权凭据；公司检索词、证据包以及未来经确认的脱敏简历数据，也会按功能需要发送给对应官方 API。插件本地删除不能撤回已发送给官方服务的请求，官方的数据保留和处理政策需单独向用户说明。

默认不设开发者分析后台、不自动遥测、不上传报告或崩溃转储。故障反馈仅允许用户主动导出经过脱敏检查的诊断信息，导出内容必须排除 Key。

## 6. 后续增加服务的规则

若增加结构化抽取模型、企业数据或其他能力，也只允许其官方 API，并提供官方申请和价格入口，由用户自行开通。当前没有为抽取模型确定供应商或接口；不得偷偷使用开发者共享 Key 或付费中转。缺少可用配置时，明确停用该可选能力，或回退到本机规则及用户本地确认。

“官方 API”指直接向服务提供方的已验证官方服务端点请求，不包含第三方聚合网关、转售接口、镜像或未授权网页接口。企业数据源的官方身份也不能代替对数据再展示用途的许可核查。
