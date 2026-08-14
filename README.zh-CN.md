# AI SERP 策略分析师

一个可本地运行的交互式 Web MVP：输入关键词，分析其 SERP（美国英语区），由 LLM 产出**有证据支撑**的内容策略建议。评估关键词：**`best tool for SEO`**（市场：美国，语言：英语）。

技术栈：**Next.js**（App Router、TypeScript、Tailwind）。一个进程同时承载前端 UI 与服务端 API 路由——**LLM 调用只发生在服务端，绝不出现在浏览器里**。

> 🎬 演示视频（英文版 README 含视频链接）：https://youtu.be/xmudau8xGAg

---

## 设计决策

### 1. 我们如何理解用户及其问题

**用户**：SEO 和内容团队，他们需要决定*是否*以及*如何*围绕某个关键词创建页面。

**问题**：今天这个决策依赖人工打开 Google、肉眼扫一遍前 10 条结果、主观判断意图/内容形态/差异化空间。它慢、难以辩护，而且"哪条结果导致了哪个结论"的推理过程，在分析师转交给写手时基本丢失。

**用户真正需要的**不是一串结果列表，而是一个**可追溯的论证**：*SERP 展示了什么（事实）→ 这说明了什么（推断）→ 我们应该建什么页（建议）*，且每一步都锚定具体结果。产品的核心价值就是把这套推理显性化、可审计。

### 2. 产品与技术假设

- **单关键词聚焦是对的**：用户流程是"一个关键词 → 一个决策"。批量分析和排名追踪本来就在范围外，最高价值的体验是把单个关键词的简报做深、做可信。
- **"事实 vs 推断"是核心 UX 概念**：SERP 条目是*观察数据*（模型永不改写）；分析与建议是*模型判断*。UI 将二者视觉分离，并把每条建议关联到支撑它的具体 SERP 排名位次。
- **处处结构化输出**：LLM 返回 JSON，服务端用 Zod schema 校验，一次失败重试，再失败落到缓存样例。自由文本只是兜底，不是契约。
- **优雅降级**：没有 API key 时，应用跑在捆绑的真实 SERP fixture + 缓存分析上；有 key 时拉取实时数据。核心体验永不因缺少凭据而瘫痪。
- **技术栈选择**：Next.js（App Router、TypeScript、Tailwind）——一个进程同时承载 UI 与服务端 API 路由（LLM 调用只发生在服务端）。对这个规模（规范化 10 条结果 + 一次 LLM 调用）是合适的解：端到端类型安全、本地运行无需 CORS 或跨服务串联、未来若上线也有生产级路径。

### 3. SERP 数据如何获取与处理

- **实时来源**：**Serper.dev** API（真实 Google SERP，`gl=us`、`hl=en`），在配置了 `SERPER_API_KEY` 时启用。Google 首屏有多少 organic 就返回多少——广告和 SERP 特性经常把 organic 压到 10 条以下（我们的演示词实测为 8–9 条；请求 `num: 20` 也无法改变）。我们如实显示 "Top N organic results"，而不是用第二页结果凑数（那会伪造排名位置）。
- **无 key 模式**：捆绑快照 `data/fixtures/*.json`（3 个关键词，来自实时源采集，美国/英语，时间戳在每个文件内）。可用 `node scripts/capture-serper.mjs "<关键词>"` 重新生成。
- **规范化**：原始 API 响应统一映射为规范的 `SerpResult` 模型——`position`、`title`、`url`、`domain`、`snippet`——任何数据源都能通过 `lib/serp/sources.ts` 里的 `SERPSource` 接缝插入同一套管线。
- **两步管线**：`POST /api/serp` 只返回 SERP 事实（快，fixture 约几十毫秒），`POST /api/analyze` 再跑 LLM（数秒）。UI 先渲染事实、后填充分析——"观察数据先于模型判断"的顺序在交互中可见；5 分钟进程内缓存避免每次运行重复抓取同一 SERP。
- **处理链路**：关键词 → SERP 来源（实时或 fixture）→ 前 N 条 organic → LLM 分析。SERP 条目原样通过，LLM 绝不改写。

### 4. LLM 在系统中的职责

LLM 是**读者和策略师，不是数据获取者**：

- **SERP 分析**（结构化输出）：推断搜索意图（含置信度与推理依据）、主导页面/内容类型、排名页共性模式、内容机会/差异化缺口。
- **页面策略**（结构化输出）：推荐页面类型、目标用户与核心需求、内容角度/价值主张、建议标题、页面结构，以及*为什么能赢*——每条 rationale 都引用具体 SERP 位次作为证据。
- **硬边界**：不能抓数据、不能编造结果，每个判断都附带其依据的证据。服务端用 Zod 校验所有输出；LLM 失败时降级到 `data/samples/` 的缓存分析，保证 UI 体验始终可演示。

### 5. 主动排除的功能

按任务书：登录/权限、数据库与分析历史、线上部署、批量关键词、排名追踪、搜索量/关键词难度、Backlink/PageSpeed/技术审计、完整抓取排名页、自动生成完整文章、生产级爬虫。另外排除了：多地区/本地 SERP、SERP 特性解析（PAA、精选摘要、AI Overview）——列入下一步。

### 6. 如果继续开发，下一步做什么

1. **SERP 特性感知**：People Also Ask、精选摘要、AI Overview——它们会改变许多关键词的内容打法。
2. **新鲜度工作流**：一条命令完成 fixture 重抓 + 样例分析重新生成（目前 capture 脚本已有，样例再生还是手动 API 调用）。
3. **多关键词与意图聚类**，然后批量导出内容简报（标题 + 大纲 → 内容团队）。
4. **关键词难度 / 搜索量**作为可选增强。
5. **实时地区切换**（已参数化为美/英）与新鲜度复查。

### 7. 如何衡量这个产品是否有效

- **证据覆盖率**：引用具体 SERP 结果的建议占比（目标 100%）——可审计性，即核心承诺。
- **意图与形态准确率**：模型分析与人类 SEO 对同一 SERP 判断的一致性（抽查评分表）。
- **决策质量**：按建议建的页面是否进入该关键词前 10？（长期看，唯一重要的指标。）
- **简报产出耗时**：从关键词到内容简报的分钟数 vs 现在的小时数；内容团队无需返工直接采纳的简报占比。

---

## 安装与启动

要求：Node.js 20+。

```bash
npm install
npm run dev          # auto：配置了 SERPER_API_KEY 时走实时 SERP，否则走 fixture
```

打开 http://localhost:3000，输入关键词，点击 **Analyze SERP**。

### 数据源模式（启动命令决定，而非 UI 切换）

| 命令 | SERP 数据源 |
|---|---|
| `npm run dev` | **auto** —— 配置了 `SERPER_API_KEY` 时走 live（Serper.dev），否则走捆绑 fixture |
| `npm run dev:fixture` | **fixture** —— 始终使用捆绑快照（`SERP_MODE=fixture`），零网络、完全可复现 |
| `npm run dev:live` | **live** —— 始终真实 Google SERP（`SERP_MODE=live`） |

生产模式：`npm run build && npm start`（或 `npm run start:fixture`）。
响应中始终报告实际使用的数据源（`serp.source.type`），演示时不存在歧义。

## 环境变量

把 `.env.example` 复制为 `.env.local`（本仓库已复制；`.env*` 已被 gitignore）：

| 变量 | 是否必需 | 用途 |
|---|---|---|
| `SERPER_API_KEY` | 实时 SERP 时需要 | Serper.dev key（免费额度：https://serper.dev）——真实 Google SERP 抓取。缺失 → 使用捆绑 fixture。 |
| `OPENAI_API_KEY` | 实时 LLM 时需要 | **任意 OpenAI-compatible 服务**的 key（DeepSeek、Moonshot、OpenRouter、SiliconFlow、OpenAI 等）——服务端分析。缺失 → 使用缓存样例分析。 |
| `OPENAI_BASE_URL` | 可选 | 默认 `https://api.deepseek.com`；可指向任意 OpenAI-compatible 端点。 |
| `OPENAI_MODEL` | 可选 | 默认 `deepseek-chat`；例如 `moonshot-v1-8k`、`gpt-4o-mini` 等。 |
| `SERP_MODE` | 可选 | `live` \| `fixture` \| 不设 = auto。通常用 `npm run dev:fixture` / `dev:live` 设置，无需手改。 |

**两个 key 均可选。** 完全无 key 时，应用仍可基于 `best tool for SEO`、`what is seo`、`ahrefs vs semrush` 三个词的捆绑 fixture + 缓存样例演示完整体验。

## 演示 fixture 与样例

捆绑关键词（无需任何 key 即可使用；每个 fixture + sample 对均来自真实数据源实时采集/生成）：

| 关键词 | 样例中的意图 | Fixture | Sample |
|---|---|---|---|
| `best tool for SEO` | commercial（商业比较） | `data/fixtures/best-tool-for-seo.json` | `data/samples/best-tool-for-seo.json` |
| `what is seo` | informational（信息型） | `data/fixtures/what-is-seo.json` | `data/samples/what-is-seo.json` |
| `ahrefs vs semrush` | commercial（对比型） | `data/fixtures/ahrefs-vs-semrush.json` | `data/samples/ahrefs-vs-semrush.json` |

- Fixture 是真实 Google SERP 快照（Serper.dev，美国/英语；来源与采集时间在每个文件内）。重新生成：`node scripts/capture-serper.mjs "<关键词>"`。
- Sample 是 LLM 对对应 fixture 的缓存分析，无 `OPENAI_API_KEY`（或实时调用失败）时使用。
- 其他关键词在配置了 `SERPER_API_KEY` 时均可使用（实时抓取，无需 fixture）。

## API

两步管线——前端按序调用并在各阶段落地时渲染：

| 端点 | 步骤 | 延迟 | 响应 |
|---|---|---|---|
| `POST /api/serp` | 1. 仅 SERP 数据 | 约几十毫秒（fixture）到约 2 秒（live） | `{ keyword, serp, warnings? }` |
| `POST /api/analyze` | 2. LLM 分析 + 策略 | 数秒（LLM 调用） | `{ keyword, serp, analysis, strategy, llm, warnings? }` |

请求体：`{"keyword": "best tool for SEO"}`。可选的 `"mode": "live" | "fixture"` 仅对当次调用覆盖启动时的 `SERP_MODE`。

## 项目结构

```
app/page.tsx                  UI shell：状态机（SERP 阶段 → LLM 阶段）+ 组装
app/api/serp/route.ts         第一步：仅 SERP 数据（快）
app/api/analyze/route.ts      第二步：LLM 分析 + 策略（慢），复用缓存的 SERP
components/ui/primitives.tsx  共享原子组件（SectionTitle、BulletList、Spinner、InfoChip）
components/serp/SerpTable.tsx 观察到的 SERP 结果 + 数据源徽章
components/analysis/AnalysisCard.tsx  模型推断卡
components/strategy/StrategyCard.tsx  建议卡（悬停高亮证据）
components/workbench/Skeletons.tsx    Empty/Loading/右栏骨架 + 演示关键词
lib/types.ts                  共享类型（SerpResult、SerpAnalysis、PageStrategy 等）
lib/serp/sources.ts           SERPSource 接缝：Serper.dev 实时抓取 + fixture 加载 + 缓存
lib/llm/schemas.ts            Zod schemas —— 结构化输出契约
lib/llm/analyze.ts            OpenAI-compatible LLM 调用（JSON 模式，1 次重试）→ 缓存样例兜底
lib/llm/sample.ts             样例加载器 + prompt 序列化
data/fixtures/                真实 SERP 快照（无 key 模式）
data/samples/                 缓存分析（无 key 模式）
scripts/capture-serper.mjs    把实时 SERP 捕获进 data/fixtures/
```

## 范围说明

在时间盒预算内完成，遵循三个优先级：(1) 任务书明确排除的功能一律不做；(2) 单关键词的深度体验优先于广度；(3) 演示必须零 API key 可运行。以下各项均为**有意推迟**，而非遗漏。

| 推迟项 | 原本计划如何实现 | 为什么推迟 |
|---|---|---|
| **SERP 特性解析**（PAA、精选摘要、AI Overview、知识面板） | Serper 响应已包含这些字段（`peopleAlsoAsk`、`answerBox`…）——扩展快照 schema，喂给 LLM prompt，在分析中增加"SERP 特性"板块 | 任务书明确范围外；核心承诺是前 N 条 organic 的证据链。这是价值最高的下一迭代 |
| **多关键词 / 批量分析与意图聚类** | 管线已参数化（关键词 → SERPSource → 分析）；批量 = 循环 + 聚类 + 导出简报 | 任务书明确范围外；单关键词深度简报是假定的价值单位 |
| **一键新鲜度工作流**（重抓 fixture + 重新生成样例） | `capture-serper.mjs` 已存在；再写一个兄弟脚本重跑管线并写入 `data/samples/` | 演示数据已采集；属于工具链打磨，非核心体验 |
| **自动化测试** | Vitest：schema 校验 + 数据源规范化单测；两个 API 路由的冒烟测试 | 时间盒：关键路径已用人工验证覆盖（curl API 路径 + CDP 驱动 UI 检查） |
| **客户端分析缓存**（秒级重跑） | 客户端按 keyword + mode 建 Map 缓存 | 8–13 秒等待*就是*真实 LLM 调用——缓存会让演示"显得快"，但掩盖了实际发生的事 |
| **多地区切换** | 已参数化（`gl`/`hl`）；把常量换成配置 | 范围外（按任务书仅美/英） |
