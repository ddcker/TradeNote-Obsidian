# 复盘札记

## 项目简介

复盘札记（TradeNote）是一款 [Obsidian](https://obsidian.md/) 本地交易复盘插件，用普通 Markdown 笔记记录每天的市场观察、交易操作和思考。它可以轻松实现：

- **日历复盘**：按日期创建和打开复盘（含周末和休市日），查看每天各板块的填写情况；
- **六段记录**：A股市场、美股市场、昨日验证、今日操作、今日反思、明日计划；
- **计划承接**：查看上一份复盘的明日计划，复制内容或打开原文；
- **历史检索**：按月份、日期、正文和复盘板块查找记录，筛选已写或未写内容；
- **段落标签**：用原生 Obsidian 标签标记观点来源或主题（如 #来源/某某、#救市政策），支持快捷插入和仪表盘筛选；
- **随手记**：随时记录心得、政策和来源，按天归档，支持标签和仪表盘筛选；
- **大事倒计时**：记录有确定日期的事件，查看剩余自然日和 A 股交易日，并保留预期与实际；
- **事件驱动记录**：记录盘后公布的事件、市场预期、实际结果和次日反应，按“待结果 / 已出结果”管理；
- **图片归档**：粘贴或拖入图片，按日期保存附件并插入笔记；
- **文字分析**：可选配置 AI，对日报或周报生成纯文字分析；
- **交易日历**：内置 A 股休市安排，在日历中标记非交易日，支持手动补充和年度更新。

复盘笔记和图片均保存在本地，不依赖其他插件，可以直接使用 Obsidian 的编辑、搜索、链接和备份功能。基础复盘无需配置 AI；启用 AI 分析时，所选范围内的复盘文字会发送到你配置的接口。

作者 B 站主页：[北漠海](https://space.bilibili.com/1065768987)

更新日志：[更新记录](CHANGELOG.md)

如果发现问题或有功能建议，欢迎 B 站私信[北漠海](https://space.bilibili.com/1065768987)，或加 QQ 群 **588526922** 交流反馈。也可以通过[问题反馈](https://github.com/beimohai/TradeNote-Obsidian/issues)提交问题。

## 快速入门

### 从 Obsidian 插件市场安装（推荐）

1. 打开 Obsidian 的“设置 → 第三方插件”，如有需要，先关闭受限模式；
2. 点击“浏览”，搜索 **TradeNote**；
3. 打开插件详情，点击“安装”，安装后启用 **TradeNote**；
4. 点击左侧功能区的复盘图标，或在命令面板运行“打开复盘仪表盘”。

也可以打开 [TradeNote 插件市场页面](https://obsidian.md/plugins?id=tradenote)，跳转到 Obsidian 安装。
后续可在“设置 → 第三方插件”中检查更新，无需手动下载文件。

### 从 GitHub 手动安装（备用）

需要 Obsidian 1.7.2 或更高版本；在 1.13 及以上版本中，插件设置支持全局设置搜索。

1. 打开[版本发布页](https://github.com/beimohai/TradeNote-Obsidian/releases/latest)，下载 `main.js`、`manifest.json` 和 `styles.css` 三个文件；
2. 在 Obsidian 仓库的 `.obsidian/plugins/` 目录下新建 `tradenote` 文件夹，将三个文件放入其中；如果看不到 `.obsidian`，需打开系统的“显示隐藏文件”选项；
3. 重启 Obsidian，在“设置 → 第三方插件”中启用 **TradeNote**；
4. 点击左侧功能区的复盘图标，或在命令面板运行“打开复盘仪表盘”。

手动更新时只替换这三个文件，不要删除原来的 `data.json`，否则会丢失插件设置。

推荐优先使用插件市场安装和更新；上述手动方式适用于离线安装或需要指定版本的情况。

### 开始复盘

1. 在仪表盘选择日期，创建或打开当天的复盘笔记；
2. 在六个板块下记录自己的观察、操作和反思，可以直接粘贴或拖入图片；
3. 在工作台回顾上一份复盘的明日计划，在历史资料库中搜索和筛选已有记录；
4. 想起什么就运行“随手记一条”，选好标签后保存，内容会按天归档；
5. 如需 AI 分析，在插件设置中填写接口地址、密钥和模型，再运行“AI 日报与周报分析”。

### 从源码构建

需要 Node.js 22.13 或更高版本，以及 pnpm 11.25.0：

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm lint
pnpm test
pnpm build
pnpm package
```

构建后，项目根目录会生成 `main.js`；`pnpm package` 会将三个安装文件输出到 `dist/tradenote/`，不打包设置、笔记或附件。生产构建不含源码映射并压缩语法与空白，开发时可运行 `pnpm dev` 保留源码映射并监听源码。

历史检索和仪表盘刷新复用 Obsidian 的笔记读取缓存，编辑后的内容仍由 Obsidian 更新。延迟加载的标签页会在刷新前正确加载；切换 AI 地址或密钥后，需要重新获取对应服务的模型列表。

## 功能概览

### 1. 日历工作台与六段复盘

- 日历按日期创建和打开复盘，周末和休市日同样可以记录心得与政策；已创建的日期显示六个板块的填写情况；
- 今日工作台可直接打开笔记，或定位到对应板块；
- 日报只包含六个一级标题，不添加 YAML 属性，也不预填示例内容；
- 上一份复盘中的明日计划会显示在工作台，方便核对计划与实际操作。

### 2. 历史资料库与筛选

- 支持全部、当前月、今日等范围，按日期或修改时间升序、降序排列；
- 可以搜索日期和正文，按某一复盘板块及其是否已写筛选记录；
- 可以按段落标签筛选，只显示包含该标签的复盘和板块；
- 在日报编辑器中右键选择“插入复盘标签”，或运行命令面板中的同名命令，标签会追加到当前段落末尾；
- 常用标签在设置页维护，打标签时也会合并仓库中已有的标签；标签是普通 Markdown 文本，Obsidian 的标签面板和 `tag:#标签` 搜索同样可用；
- 点击摘要可直接定位原笔记中的标题；
- 删除复盘支持二次确认，笔记通过 Obsidian 的文件回收机制处理。

### 3. 随手记

- 命令面板运行“随手记一条”、点击侧边栏笔形图标，或使用仪表盘顶部的“随手记”按钮，随时记录不属于日报的心得、政策和来源；
- 每条记录按 `## HH:mm` 追加到当天的 `随手记/YYYY/MM/YYYY-MM-DD.md`，可选标签，保存后可直接打开；
- 仪表盘底部的“随手记”面板支持按范围、标签和正文搜索，点击日期可定位到原条目；
- 随手记和日报共用同一套原生 Obsidian 标签，`tag:#救市政策` 可以同时搜到两类内容。

### 4. 大事倒计时

- 记录有明确日期的大事（议息、政策窗口、解禁、财报等），每个事件一篇 Markdown 笔记，保存在 `大事/YYYY/MM/日期-标题.md`；
- 独立页面按“即将发生 / 已发生”分组，显示日期、星期、剩余自然日和 A 股交易日；
- 事件可以分别填写“预期”和“实际”，事件发生后保留原文，方便事后对照；
- 新建和编辑通过页面顶部按钮或“新建大事”弹窗完成；交易日按插件内置的 A 股休市日历计算，尚未公布休市安排的年份只排除周末。

### 5. 事件驱动记录

- 适合盘后公布、次日才知道结果的事件（政策、数据、公告等），不参与倒计时；
- 每个事件一篇 Markdown 笔记，保存在 `事件驱动/YYYY/MM/日期-标题.md`，记录事件内容、预期、结果和次日反应；
- 页面按“待结果 / 已出结果”分组，可按状态和正文搜索；结果留空即视为待结果；
- 可分别编辑事件、预期、结果和次日反应，事件发生后保留原有预期，方便对照。

### 6. 图片附件与本地存储

- 在复盘笔记中粘贴或拖入图片，自动按日期归档并插入图片链接；
- 笔记和图片使用普通文件保存，停用插件后仍可阅读、编辑和备份；
- 复盘根目录、日报目录、附件目录、随手记目录、大事目录和事件驱动目录可在插件设置中调整。

### 7. AI 日报与周报分析

- 支持兼容聊天补全格式的接口，可手动填写模型或获取模型列表，并测试连接；
- 日报分析读取所选日期，周报分析汇总所选日期所在自然周；
- 周报只使用截至所选日期或今天的记录，以较早者为准；
- 分析前剔除图片引用，不读取图片文件；输出为纯文字，可复制或另存为笔记，不覆盖原始日报；
- 可在设置中开启“AI 分析包含随手记”（默认关闭）；开启后，所选日期范围内的随手记也会发送到 AI 接口。

### 8. A 股休市日历

- 内置 2024—2026 年休市安排，周末和休市日在日历中标记为非交易日，但不限制创建复盘；
- 可按年份手动补充休市日期，与内置日历合并使用；
- 每年 12 月第四个星期一起检查上交所次年年度休市公告，同一北京时间日期最多尝试一次，完整保存后停止该年度搜索；
- 插件关闭期间不会检查，下次打开时补查。尚未公布的休市安排无法提前确定，应以交易所公告为准。

## 文件结构

默认目录如下，可在插件设置中修改：

```text
交易复盘/
├─ 日报/
│  └─ YYYY/
│     └─ MM/
│        └─ YYYYMMDD复盘.md
├─ 附件/
│  └─ YYYY/
│     └─ MM/
│        └─ DD/
│           └─ image-时间戳.png
├─ 随手记/
│  └─ YYYY/
│     └─ MM/
│        └─ YYYY-MM-DD.md
├─ 大事/
│  └─ YYYY/
│     └─ MM/
│        └─ YYYY-MM-DD-事件.md
├─ 事件驱动/
│  └─ YYYY/
│     └─ MM/
│        └─ YYYY-MM-DD-事件.md
└─ AI复盘分析/
   └─ YYYY/
```

每篇日报的初始内容为：

```markdown
# A股市场

# 美股市场

# 昨日验证

# 今日操作

# 今日反思

# 明日计划
```

## 数据与网络说明

- 日常复盘保存在当前 Obsidian 仓库内，不连接券商账户；标签也是笔记中的普通文本，不会额外上传；
- 大事记录、预期和实际都保存在本地 Markdown 笔记中；
- 事件驱动记录的预期、结果和次日反应同样保存在本地 Markdown 笔记中，不参与 AI 分析；
- 年度日历更新访问[上海证券交易所](https://www.sse.com.cn/disclosure/dealinstruc/closed/)，用于获取休市公告；
- AI 为可选功能。运行分析或测试连接、获取模型列表时，会请求你配置的服务；服务可能需要账户或产生费用，按服务方规则执行；
- AI 分析会发送所选日期范围内剔除图片引用后的复盘文字，请根据自己的需要选择服务；
- 默认只发送日报/周报复盘；开启“AI 分析包含随手记”后，所选范围内的随手记文字也会发送；
- 接口密钥保存在当前仓库的 `.obsidian/plugins/tradenote/data.json` 中，请勿将该文件提交到公开仓库。
- 历史检索和附件统计会枚举仓库中的文件路径；删除附件前会检查其他 Markdown 笔记的引用，避免误删仍被使用的图片。相关读取在本地完成，AI 分析只发送所选范围内的复盘文字；
- 剪贴板仅在点击“复制”时写入相应文字，粘贴图片时读取本次粘贴事件携带的图片，不会在后台读取系统剪贴板。

插件用于记录和回顾交易，不提供投资建议。

## 赞助与支持

如果你喜欢我的插件，你可以在这里对我表达支持，谢谢！

![微信与支付宝收款码](src/assets/community/support.png)

交流群：QQ 群 **588526922**。

- [问题反馈](https://github.com/beimohai/TradeNote-Obsidian/issues)
- [提交改进](https://github.com/beimohai/TradeNote-Obsidian/pulls)
- [作者 GitHub](https://github.com/beimohai)
- [作者 B 站主页](https://space.bilibili.com/1065768987)

## 开源协议

本项目基于 [MIT 开源协议](LICENSE) 开源。

_世界因开源更精彩_

---

## English overview

TradeNote is a local-first trading journal for [Obsidian](https://obsidian.md/). Record market observations, verify previous plans, document trades, reflect on decisions, and prepare the next trading day in ordinary Markdown notes. Your journal and image attachments remain readable and editable without the plugin.

### Features

- A calendar for any date, with non-trading days marked and section completion indicators.
- Six-section daily notes for A-share and US market observations, previous-plan verification, trades, reflection, and next-day planning.
- Native Obsidian paragraph tags such as `#来源/某某` or `#救市政策`, with quick insertion and dashboard filtering.
- Quick notes for ad-hoc insights, policies, and sources, stored one file per day with native tags and a dashboard filter.
- An event countdown page with natural-day and A-share trading-day counts, plus expectation and actual-outcome notes.
- Event-driven records for after-close announcements, with expectations, actual results, and next-day market reactions.
- Search and filter past reviews by date, month, text, section, tag, and whether a section has been written.
- Paste or drop images into review notes and organize attachments by date.
- Optional text-only AI analysis for daily and weekly reviews through a compatible Chat Completions API.
- Built-in Chinese stock-market holidays for 2024–2026, manual additions, and annual updates from the Shanghai Stock Exchange.

### Installation

Requires Obsidian 1.7.2 or later. Settings are searchable on Obsidian 1.13 and later.

1. In Obsidian, open **Settings → Community plugins** and turn off Restricted mode if needed.
2. Select **Browse**, search for **TradeNote**, and open its listing.
3. Select **Install**, then enable **TradeNote**.
4. Open the review dashboard from the ribbon or command palette and select a date to start writing.

You can also open the [TradeNote community plugin page](https://obsidian.md/plugins?id=tradenote). Future updates are available from **Settings → Community plugins**.

For an offline or version-specific installation, download `main.js`, `manifest.json`, and `styles.css` from a [GitHub release](https://github.com/beimohai/TradeNote-Obsidian/releases), place them in `.obsidian/plugins/tradenote/`, restart Obsidian, and enable the plugin. If your vault uses a custom configuration folder, use that folder in place of `.obsidian`.

When updating manually, replace only those three files and keep your existing `data.json`. Production builds omit source maps and compact syntax and whitespace. Run `pnpm package` to collect the three distributable files in `dist/tradenote/`.

The dashboard uses Obsidian’s note-read cache and loads deferred tabs before refreshing. Model lists are invalidated when the API endpoint or key changes, so a previous provider’s list cannot be selected accidentally.

### Privacy and network access

Basic journaling does not require an AI account. Journal notes and attachments are stored in your vault. The plugin enumerates file paths for review search and attachment statistics, and checks other Markdown notes before deleting attachments to avoid removing images still in use. Clipboard writes happen when you select a copy action; image pasting reads only the image provided by the paste event, with no background clipboard reading.

Annual calendar updates contact the Shanghai Stock Exchange. If you choose AI analysis, text from the selected review period is sent to your configured provider after image references are removed. Image files are not read for analysis. Quick notes are stored as plain Markdown and are included in AI analysis only when you enable “Include quick notes in AI analysis”, which is off by default. Connection tests and model-list requests also contact that provider, which may require an account or charge fees. API credentials are stored in `.obsidian/plugins/tradenote/data.json`; do not publish this file.

### Development

Use Node.js 22.13 or later and pnpm 11.25.0. Run `pnpm install --frozen-lockfile`, followed by `pnpm release:files` to check types, lint, run tests, and build. Release tags use the exact numeric version in `manifest.json`, for example `0.1.4`, without a `v` prefix.

### Support and license

Report problems through [GitHub issues](https://github.com/beimohai/TradeNote-Obsidian/issues), contact [北漠海 on Bilibili](https://space.bilibili.com/1065768987), or join QQ group **588526922**. Optional donations are welcome through the WeChat Pay and Alipay codes in the Chinese support section above. Donations are not required to use any feature.

TradeNote is released under the [MIT License](LICENSE). It helps record and review trading decisions and does not provide investment advice.
