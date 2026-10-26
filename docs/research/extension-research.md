# Chrome 侧边栏扩展与 BOSS 直聘采集边界核验

核验日期：2026-10-26（Asia/Shanghai）。架构建议已按用户本机 Key、官方 API 直连、免费插件要求更新为 v0.2；官方事实与产品建议分开。范围：官方文档与公开协议的只读调研；未登录、未采集职位、未调用任何 BOSS 私有接口、未做扩展原型或商店审核实验。

## 结论

Chrome MV3 原生侧边栏、用户触发的当前页面 DOM 读取、扩展可信页面直接调用官方 API、带证据结果展示，在浏览器机制层面可行。实际服务商是否接受扩展直连、BOSS 具体 DOM 选择器稳定性及数据覆盖率尚未验证。当前设计没有自有后端，Key 仅本机保存、仅在调用时发给对应官方 API 鉴权；申请入口见 [官方 API 开通指南](official-api-setup.md)。

**BOSS 平台许可是实质限制，并非仅有抽象的爬虫风险。** 本次实际打开官方《用户协议》，第七节明确限制未经许可的插件获取数据。用户主动点击、仅读取可见 DOM、低频访问有助于减少权限和运行风险，但这些技术选择本身不等于已获得平台许可。因此产品应把“获得适当平台许可并完成条款适用评估”作为 BOSS 自动读取模块正式上线的前置条件；核心研究与产品验证可先采用用户输入公司名称和合法来源数据。

## 官方事实及设计影响

| 项目 | 已核验事实 | 对产品的影响 |
|---|---|---|
| sidePanel | Chrome 114+、MV3+，需 `sidePanel` 权限；面板属于扩展页面，能访问 Chrome 扩展 API；可在特定网站启用，可跨标签页保持打开 | 采用原生 sidePanel，不必在 BOSS DOM 插入整套浮窗；左右位置由用户浏览器设置决定，不承诺强制右侧 |
| 打开面板 | `sidePanel.open()` 自 Chrome 116 提供，须响应用户操作；`setPanelBehavior({openPanelOnActionClick:true})` 支持工具栏按钮打开 | MVP 可设 Chrome 116+；由用户点击扩展按钮打开，不依赖静默弹出 |
| 内容脚本 | content script 可通过 DOM 读取页面、与扩展通信，默认位于 isolated world，与页面 JS 变量隔离 | 仅采集明确白名单字段；无需接触页面运行时私有状态、Cookie、招聘聊天或接口 token |
| activeTab | 用户调用扩展后，临时授予当前标签页访问能力；同源导航可保留，跨源导航或关闭标签页撤销；是 `<all_urls>` 的替代方式之一 | MVP 用户每次在需分析的新标签页点击扩展按钮，结合 `scripting` 注入。不能假定面板已打开就获得所有新标签页权限 |
| MV3 worker | 通常在空闲 30 秒、单次请求处理超过 5 分钟或 fetch 响应超过 30 秒才到达时终止；存在版本差异和例外；全局变量在终止后丢失 | 长任务在打开的 sidePanel 页面分步执行，本机保存检查点；关闭或休眠可能中断，重开由用户继续；不能以端口保活承诺后台一直运行 |
| 远端请求 | 扩展页面/worker 可在声明 host permission 后跨源请求；内容脚本请求仍按网页跨源约束处理 | 带 Key 的请求只在扩展可信上下文执行，对已核验官方 API 域名精确授权；内容脚本不调用服务或读取 Key |
| 远程代码 | MV3 执行代码必须打包到扩展；远程 JavaScript/WASM 属于远程托管代码；普通 JSON 数据不等同远程代码 | 模型结果只能是校验后的数据，不可 eval；脚本、UI 依赖和提取逻辑打包发布，不下载执行动态选择器脚本 |
| Web Store 用户数据 | 需准确隐私政策，披露收集、用途、共享对象；浏览活动仅在明确对用户可见功能所需范围内收集；必要场景需明显披露并取得明确同意 | 说明必要字段会直接发给用户启用的 DeepSeek、蚂蚁等官方 API；不存在开发者中转，仍不能宣传所有分析完全离线；不上传整页、浏览历史或会话信息 |
| 本机存储 | `storage.local` 默认对 content script 可见，可用 `setAccessLevel` 限定为 `TRUSTED_CONTEXTS`；`storage.session` 默认不暴露给 content script，浏览器重启等情形会清除 | 写 Key 或注入页面脚本前完成可信上下文限制；默认 session，用户主动选择后才写 local；不使用 sync，也不将本地存储宣传为硬件保险箱 |

## BOSS 官方协议的实际原文

来源：[BOSS直聘用户协议](https://about.zhipin.com/agreement?id=registerprotocol)。从 [BOSS 官网](https://www.zhipin.com/) 页脚及登录协议链接定位，随后用浏览器加载公开正文读取。页面底部署“更新日期：2023年3月20日；生效日期：2023年3月27日；版本：2023年3月版”。这是 2026-10-26 访问时该 URL 展示的版本标记，不代表所有渠道协议都已穷尽核验。

第四节《服务说明》相关条款：

> 用户应通过本平台使用相关服务；未经许可，不得通过其他第三方工具或运营平台获取BOSS直聘平台内的任何信息服务，包括但不限于通过第三方软件登录BOSS直聘账号、发布职位、浏览职位、收发简历等。如因用户使用第三方软件导致相关信息泄露的，BOSS直聘不承担任何责任，且用户还应承担由此给BOSS直聘造成的损失。

第七节《用户的平台使用义务》第 5 项相关条款：

> 未经BOSS直聘公司许可，使用插件、外挂或通过其他第三方工具、运营平台或任何服务接入本服务或系统获取相关数据或信息的；

第七节第 7 项相关条款：

> 未经BOSS直聘公司的许可自行或授权、允许、协助任何第三人对平台内的任何信息内容进行非法获取；“非法获取”是指采用包括但不限于“蜘蛛”(spider)程序、爬虫程序、拟人程序等非真实用户或避开、破坏技术措施等非正常浏览的手段、方式，读取、复制、转存、获得数据和信息内容的行为；

这些条款支持“存在明确合同限制”的结论；本调研不判断具体实现的法律定性，也未取得 BOSS 的授权。不要在 PRD 中写“公开可见即可以任意采集”或“用户授权插件即可代替平台许可”。

## 建议的实现边界（在平台许可成立的条件下）

### 权限与采集

- 默认权限候选：`sidePanel`、`activeTab`、`scripting`、`storage`；已核验官方 API 域名的精确 `host_permissions`；纯手动输入阶段不需要 `activeTab/scripting`。是否需要额外权限应由实际 API 调用决定，不预先申请 `cookies`、`history`、`debugger`、`webRequest` 或 `<all_urls>`。
- 临时授权模式最适合初期：用户在目标页点击扩展按钮，再点击“分析当前公司”。切到未授权标签页时显示再次点击扩展按钮的提示，不静默越界读取。
- 若后续要求在 BOSS 标签页之间自动识别，考虑按需申请精确 BOSS 域名权限；这是显式权限扩展，且不能替代平台许可。
- 白名单字段：显示公司名、工商全称（如果页面存在）、城市、行业、规模描述、职位名/薪资/要求（匹配阶段需要）、页面 URL 与采集时间。字段不存在就标为缺失，不从整页随机文本推断。
- 不采集招聘聊天、HR 联系方式、求职者资料、Cookie、token 或未展示的内部数据。
- 内容脚本读取 → 扩展可信页面结构校验 → 用户确认实体 → 直连官方 API；Key 不经过内容脚本，每个任务绑定 `tabId + pageUrl + companyKey + snapshotHash`。

### SPA 与多标签页

- BOSS 页面是否采用 SPA、何种路由和 DOM 结构，尚需在获得许可后的代表性页面验证；当前仅提出防御性适配。
- 采集时读取当前 URL 和公司字段；可用有节流/清理机制的 `MutationObserver` 检测展示变化，并对 URL 变化重新核验。不能只依赖全页加载事件，也不能在 isolated world 里假定修改页面 `history.pushState` 即可可靠拦截页面路由。
- 用户切换公司后立即清除“当前公司”指向或标明旧报告属于旧公司；旧请求晚返回时不得覆盖新任务。
- 面板上始终显示报告的主体名称、城市/标识及数据时间。已经保存的本地报告可继续查看，但不得自动绑定到新页面；面板关闭可能中断尚未完成的分析。

### 长任务、本机 Key 与缓存

1. sidePanel 在本机创建任务并分步调用官方 API，IndexedDB 保存证据和任务检查点；没有自有 API、中转、云端任务或跨用户缓存。
2. Key 默认使用 `storage.session`；用户主动选择“保存到本机”才进入受可信上下文限制的 `storage.local`。不写 `storage.sync`、内容脚本、普通网页 DOM、日志或导出。扩展设置页的 Key 输入框在保存后清空。
3. Key 运行时通过 HTTPS Authorization 只发送给匹配的官方 API，不上传开发者云端；完全禁止官方鉴权传输将无法使用这些 API。官方可能处理并保留业务请求，应准确披露。
4. 请求前保存 pending 记录，成功后保存结果。关闭面板、退出浏览器或休眠后可能暂停/中断；重开时用户决定继续。响应未保存的在途调用标为结果未知，不自动重发，提示可能已经计费。
5. worker 仅做事件协调和短操作；不依赖内存、端口保活或 offscreen 绕过生命周期。多个面板使用本机一致性锁，默认每个浏览器配置同时一个分析。
6. 官方目的地址使用随扩展发布的精确 allowlist；带 Key 请求拒绝重定向，不接受网页、模型或任意 Base URL 控制目的地址。官方申请页和控制台跳转不携带 Key。
7. 公司缓存按核实主体和版本存本机；报告另冻结必要证据快照，过期缓存不破坏历史可追溯性。保存和删除规则见主需求/技术文档。
8. 本机存储不能防御本机恶意软件或被接管的浏览器配置，插件无法保证排除系统级备份；用户可删除本地 Key，官方撤销/轮换需到官方控制台操作。

### 最低验收场景

- 支持与不支持网页、未授权标签页、公司名缺失/同名公司。
- 同一标签页切换职位/公司、多个标签页快速切换、旧请求晚返回。
- worker 被终止、关闭/重开面板、浏览器退出/休眠、网络中断与本机检查点恢复；未知在途请求不得自动重发。
- 403/429/超时、网页布局改变、证据不够、模型 JSON 不合法。
- 验证没有采集/传输整页、聊天、Cookie 或非白名单字段；所有结果正确标示来源主体。
- content script 无法读取 local/session Key；sync、日志、导出无 Key；网络仅向对应官方 API 发送鉴权头；跨域重定向和未核实网关被阻止。
- 删除 Key 后不再派发新请求；测试连接仅由用户触发并说明可能计费；申请/充值由官方页面完成。
- 在支持的 Chrome 版本做真实扩展加载测试；此调研尚未执行这些验收。

## 官方来源

1. [Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
2. [Content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
3. [The activeTab permission](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)
4. [Extension service worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
5. [Cross-origin network requests](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests)
6. [Remote hosted code](https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code)
7. [Chrome Web Store Program Policies](https://developer.chrome.com/docs/webstore/program-policies/policies)
8. [User data policy FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
9. [BOSS 直聘用户协议](https://about.zhipin.com/agreement?id=registerprotocol)
10. [Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)（v0.2 补充核验）

以上网页均在核验日实际访问。Chrome 页面通过 HTTP 200 正文检索核实；BOSS 协议因客户端渲染，使用 ego-browser 公开页面读取完整相关条款。
