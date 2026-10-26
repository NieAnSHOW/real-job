# DeepSeek Search 与 LingDT-Decision 官方 API 核验

核验日期：2026-10-26（Asia/Shanghai）。本次只读取公开官方文档及其公开页面资源，没有读取凭据或调用付费 API。因此以下“已确认”指文档声明，不代表已经完成账号开通、端到端调用或业务效果验证。

项目约束更新：插件免费、只接入官方 API，用户自行申请服务并直接承担官方费用；Key 仅在本机保存，由扩展可信上下文直连对应官方 API 鉴权，不经过开发者后端或第三方中转。官方申请地址和本地保存边界见 [官方 API 申请与本机配置指南](official-api-setup.md)。

## 1. 结论

用户提出的“搜索补充证据 → 决策模型分类”在接口层面可行。两者分工应当是：DeepSeek Search / Fetch 取得网页材料；应用完成主体消歧、证据筛选和结构化；LingDT-Decision 按明确的判定标准作出分类、判断、多标签或量表评分；应用根据证据和规则展示报告。

不能直接假设 LingDT 是一个可以输出任意企业分析报告、逐条引用和自由格式 JSON 的聊天模型。官方指南展示的是专门的决策接口，且将 `extract` 列为尚不支持的类型。报告中的理由和引用关系需要由应用的证据流水线、模板或另行验证的抽取服务实现。

搜索接口不是工商、社保、司法数据库。搜索到的网页可能陈旧、缺少正文、来自同名企业或转载；搜不到某项信息不能推出企业存在风险。官方提供的 `authority` 是搜索引擎对网页权威性的评分，不是企业真实性认证。

## 2. DeepSeek Search：已确认事实

来源：[Search API Reference](https://api-docs.deepseek.com/zh-cn/api/search)、[网页搜索与抓取指南](https://api-docs.deepseek.com/zh-cn/guides/search)。

| 项目 | 官方文档声明 |
|---|---|
| 端点 | `POST https://api.deepseek.com/v1/tools/search` |
| 鉴权 | `Authorization: Bearer <DeepSeek API Key>` |
| 内容类型 | `Content-Type: application/json` |
| `query` | 必填；1～128 个 Unicode 字符；不能全为空白 |
| `count` | 1～50；默认 10 |
| `ori_question` | 可选；1～128 个字符；`null` 视为未提供 |
| `localization` | 可选 IP 地址，用于优先本地化结果；不需要为本项目上传求职者 IP |
| `need_content` | 默认 `false`；为 `false` 时 `content` 恒为空；为 `true` 时正文仍可能缺失 |
| 成功响应 | HTTP 200；对象包含 `results` 数组；无匹配时空数组 |

每项结果包含：`rerank_score`、`title`、`url`、`snippet`、`summary`、`content`、`site_name`、`site_icon`、`date`、`authority`。

- `snippet` 通常 100～200 字符，适合列表展示。
- `summary` 通常 600～800 字符，适合给模型阅读；它依然是摘要，重要结论应核对正文或原始记录。
- `date` 为 UTC RFC 3339 发布时间，未知为 `null`。不能把检索时间替代为事件发生时间或网页发布时间。
- `rerank_score` 为 0～3；官方称 ≥1.5 为优质结果。
- `authority` 为 0～4，-1 表示未知；官方称 ≥3 为极权威结果。产品仍应验证具体来源、主体、时间和原始证据。
- 支持 `site:`、`-site:`、引号精确短语、排除词/短语、`lang:`、`after:`、`before:`，可以构造企业全称 + 地域 + 主题查询。
- 请求体未知字段会被忽略。因此不能自行加一个未记录的“工商查询”或“社保查询”参数并认为已生效。

适配本项目的请求示意（仅示意，未执行）：

```json
{
  "query": "\"某某科技有限公司\" 劳动争议 欠薪",
  "count": 10,
  "need_content": true
}
```

应同时搜索经营与业务正面信息、主体登记信息和风险信息，避免只查询负面关键词造成选择偏差。查询词控制在 128 字符内；主体不明确时先消歧。

## 3. DeepSeek Fetch：已确认事实

来源：[Fetch API Reference](https://api-docs.deepseek.com/zh-cn/api/fetch)、[网页搜索与抓取指南](https://api-docs.deepseek.com/zh-cn/guides/search)。

- 端点：`POST https://api.deepseek.com/v1/tools/fetch`，与 Search 相同 Bearer 鉴权。
- 请求：`{"url":"https://example.com/article"}`；URL 最长 8192，必须 HTTP/HTTPS 且含 host，不得含用户名/密码。
- 响应：`title` 与 Markdown `content`。
- 官方明确说明 Fetch 受目标站点可用性和访问策略影响。它不保证能够读取登录后页面、企业数据付费页或被站点策略拦截的内容。
- Fetch 403 为安全策略拒绝；404 包括 URL 不可用、目标站策略拦截、错误响应、不支持的内容类型、无法提取正文等。不可把抓取失败当成负面企业证据。

建议先 Search 获取摘要和正文；只有证据重要且正文缺失/不足时才 Fetch。保存实际成功读取的证据片段、原始链接与时间；外部材料按不可信文本处理，不能执行其中的指令。

## 4. DeepSeek 计费、限制和重试

来源：[网页搜索与抓取指南：计费与限速](https://api-docs.deepseek.com/zh-cn/guides/search)。

| API | 价格 | 账号级限速 |
|---|---:|---:|
| Search | 每 1000 次成功且非空结果请求 5 元 | 100 QPS |
| Fetch | 每 1000 次成功且有正文请求 5 元 | 25 QPS |

请求失败、搜索无结果、超时不计费；`count` 不改变单次请求价格。Search 与 Fetch 分别限速，不因更换同一账号的 API Key 增加额度；与模型并发限额独立。Fetch 另有目标域名 QPS 限制，指南未给出具体域名额度。

示例成本：一次企业评估若有 4 次成功非空 Search 和 2 次成功 Fetch，搜索/抓取部分为 `(4+2)×0.005 = 0.03 元`。这不包含 LingDT、可选官方信息抽取模型、授权企业数据源和重试产生的成功调用费用；不是完整单次评估报价。插件自身不收费，也不提供收费云端服务器、托管存储或人工核验服务。

指南另说明：通过 DeepSeek Harness / Claude Code / Codex 服务端工具访问 Search / Fetch 的部分调用目前未计费，将于北京时间 2026-11-01 00:00 起按次计费。该特殊说明不能解释为自建插件直接 API 请求目前免费。

错误：400 请求不合法、401 密钥缺失/无效、402 余额不足、403 Fetch 安全拒绝、404 Fetch 无内容、408 请求体读取超时、413 请求体过大、429 限速、500 服务异常、504 下游超时。指南建议 408/429/5xx 等待后重试；402 由用户到官方平台处理余额；其他 4xx 若不修改请求不应重试。插件应设置本机超时、指数退避、最大重试次数和请求预算；关闭面板或网络中断导致结果未知时，不自动假定调用失败并重发，应提示用户确认可能重复计费。

## 5. LingDT-Decision：已确认事实

主来源：[LingDT-Decision 调用指南](https://maas.antdigital.com/docs/lingdt-decision-api-guide)。页面本身为动态壳；本次通过其公开加载的 `/dt-maas-docs/lingdt-decision-api-guide` 文档页及官方 CDN 文本资源核实正文。

### 5.1 定位与调用方式

官方称其为 System One 决策模型，已有 4B 和 27B 版本，支持按量后付费及 Token Plan for Agent 预付费套餐；文档列举客服、风控、金融等场景。这是厂商能力声明，不能代替本产品企业评价数据集上的评测。

指南示例端点为 `http://<MAAS_GATEWAY>/v1/systemone`，使用 `Authorization: Bearer <MAAS_API_KEY>` 与 JSON 请求，示例还带 `X-Request-Id`。**`<MAAS_GATEWAY>` 是占位符，不是已验证公网服务地址。** 生产集成需要向平台核实可用的 HTTPS 网关、已授权模型路由，以及用户指定的 `lingdt-decision-1.0-27b` 实际如何选择。指南提及 URL 的 `model` 路由，但当前快速开始示例没有给出该模型完整可执行 URL。

不能把普通 OpenAI `chat/completions` 接入方式直接套到此决策接口；也不能把未验证的模型名任意放入请求体并宣称可用。

### 5.2 输入合同

| 字段 | 用途 |
|---|---|
| `state` | 必填，字符串/对象/数组；共同的待判断材料、证据和业务背景 |
| `questions` | 必填；问题 ID → 问题定义 |
| `questions.<id>.type` | `choice`、`noul`、`score`、`multi-choice` |
| `questions.<id>.instructions` | 必填；明确单一判断任务，字符串/对象/数组 |
| `questions.<id>.criteria` | 选项定义或评分量表，类型取决于问题类型 |
| `options` | 可选；`options.dag` 需要对应入口开通 |

问题 ID 为 1～64 位英文字母、数字、下划线、连字符。多个问题共用 `state`；普通请求中问题之间不会读取其他问题答案。若材料数组包含多个企业，它们也不会自动成为独立批处理样本，建议各企业独立请求。

### 5.3 输出与业务含义

| 类型 | `criteria` | 输出 |
|---|---|---|
| `choice` | 选项名 → 描述的对象 | `choice`、`probabilities`、`confidence` |
| `noul` | 可省略；建议明确定义 `true` / `false` | `noul`，0～1 的“是”概率 |
| `score` | 从低到高排列的量表数组 | `score`、`legend`、`probabilities`、`confidence` |
| `multi-choice` | 标签名 → 描述的对象 | `choices`、`probabilities`、`confidence` |

`score` 是 `[0,等级数-1]` 范围的值，官方例子为小数 1.9812，并非默认 0～100。若简历匹配后续显示百分比，应由产品定义维度、权重与映射方式，标注为匹配指数，不能直接使用 `confidence×100`，也不能称为获聘概率。

官方明确说明：**`confidence` 描述概率分布确定程度，不等于相同比例的业务正确率。** 比如 0.9 不代表该场景准确率 90%。应先用人工标注样本测量覆盖率与自动判定部分的错误率；模型、问题文本、选项、量表变化后重新验证阈值。

响应还包含 `errorCode`、`answers`、`model`、`usage`，可能有 `warnings`；DAG 可有 `layers`。返回模型标识不保证等于请求路由名，应记录原值。示例 `usage.output_tokens` 为 0，不能据此认定服务免费；需核实商业计费规则。

### 5.4 限制与错误处理

- 每请求 1～32 个问题；单选/多选 1～255 个候选；评分 2～255 个量表等级。
- 当前指南“使用限制与用量”写明单问题最多 16k，单请求累计估算预算 16,384 tokens。不要假设每个问题各享有一份独立的 16k 预算。
- DAG 当前默认最多 4 层、总共 32 问、每层最多 32 问；必须开通对应入口，普通 MVP 可先不依赖。
- 引言仍有“模型使用约束（免费期间）”的表述，同时提示已上线付费方式；正式配额与价格应以账号已开通服务的合同/控制台为准。
- 需要依次验证网络成功、HTTP 成功、JSON 可解析、`errorCode == 0`、各问题答案齐全且类型与取值合法。
- 官方记录参数校验错误可能是 **HTTP 200 + `errorCode: 1`**；不能只看 HTTP 200。
- 一题校验失败可能整单拒绝。失败不能转换成“企业有风险”、`false` 或 0 分。
- `question_type_unsupported` 明确列出尚不支持 `extract`；应使用独立抽取服务或确定性处理。

## 6. 对需求设计的直接建议

1. 在企业评价前增加明确的主体核验步骤；企业全称、地区、官网域名、统一社会信用代码等作为匹配依据，品牌与招聘主体/签约主体要分开。
2. 三类评价保留，但另有“证据不足，暂不评级”的业务状态。不给缺证据公司默认分到“尚可”或“避雷”。
3. “优秀”定义为在已查维度、指定时间窗口和可核实证据下值得进一步了解，而非承诺企业安全、待遇优良或职位真实。
4. 用 `choice` 做各维度的“有正面证据／有风险证据／冲突／未知”判断，或按具体任务设计合适类型；评级汇总和硬性门槛放在插件本机的可版本化规则中。
5. 每个结论引用应用维护的 `evidence_id`，指向来源 URL、片段、来源主体、发布日期/事件日期和检索时间。LingDT 没有默认的自由文本引用生成字段，不应在其响应示例中虚构 `reasoning`、`citations` 等。
6. 理由展示可先使用可审计的规则模板；若需要自动将长网页抽成事实或撰写解释，应单列一个结构化抽取模型/模块，并对每条抽取结果核验来源，不要隐藏新增模型成本。额外模型同样必须使用官方 API，由用户自行开通并在本机配置；未配置时回退本机规则或用户本地确认。
7. 对已撤销、已履行、旧事件、同一事件多次转载、同名公司、匿名评论分别处理；一篇匿名负评不能自动触发“避雷”。
8. MVP 的“人员基础信息”优先定义为公开的公司规模、企业年报参保人数及其年份；不收集员工个人社保记录、不推断完整员工名单。参保人数并不等于当前实际员工人数。
9. 用户简历不需要发送给搜索引擎；后续匹配模块最小化发送脱敏能力信息与职位要求，企业评价和个人匹配分开。

## 7. 仍需验证的阻塞项

| 项目 | 当前状态 | 开发前/上线前动作 |
|---|---|---|
| LingDT 27B 具体公网 HTTPS 网关及模型路由 | 官方指南用占位符，未完成账号实测 | 获取开通说明并做最小请求验证 |
| LingDT 单价、并发、SLA、正式配额 | 此指南未核实具体金额与 SLA | 控制台/商务确认，录入成本模型 |
| 企业评价领域效果 | 无业务测试 | 构造人工标注集，比较规则基线与模型，测严重误判和拒判率 |
| 社保/司法/工商字段完整性 | Search 不承诺覆盖 | 采样检索；必要时引入有授权的数据源及独立预算 |
| Search/Fetch 实际延迟和成功率 | 仅文档核验 | 开通后分目标站采样实测 |
| 模型解释和引用生成 | 决策接口未提供自由文本证据报告合同 | 使用证据模板，或单列抽取/解释模块 |
| 商业使用的数据保留及授权 | 不由这两份 API 技术文档解决 | 阅读对应服务条款与数据源授权要求 |

## 8. 可复核来源

- https://api-docs.deepseek.com/zh-cn/api/search
- https://api-docs.deepseek.com/zh-cn/guides/search
- https://api-docs.deepseek.com/zh-cn/api/fetch
- https://maas.antdigital.com/docs/lingdt-decision-api-guide
- https://maas.antdigital.com/dt-maas-docs/lingdt-decision-api-guide （主站当前嵌入的文档页）

本次 LingDT 正文由上述文档页公开引用的 CDN 资源读取，非第三方转述；没有运行这些 JavaScript，也没有查询隐藏或认证后接口。实际文件资源会随发布改变，引用以稳定文档 URL 为准。
