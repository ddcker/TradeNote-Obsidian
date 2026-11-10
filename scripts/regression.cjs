const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const notices = [];
class TFile {}
class TFolder {}
let supportsDeclarative = true;
const settingRows = [];
class MockSetting {
  constructor() { settingRows.push(this); }
  setName(value) { this.name = value; return this; }
  setDesc(value) { this.desc = value; return this; }
  setHeading() { this.heading = true; return this; }
  control(callback) {
    const component = { inputEl: {}, setPlaceholder() { return this; }, setValue(value) { this.value = value; return this; }, addOptions() { return this; }, setButtonText() { return this; }, setDisabled(value) { this.disabled = value; return this; }, onClick(fn) { this.click = fn; return this; }, onChange(fn) { this.change = fn; return this; } };
    (this.controls ??= []).push(component); callback(component); return this;
  }
  addText(fn) { return this.control(fn); }
  addToggle(fn) { return this.control(fn); }
  addButton(fn) { return this.control(fn); }
  addDropdown(fn) { return this.control(fn); }
}
let request = async () => { throw new Error('Unexpected network request'); };
const obsidian = { App: class {}, ItemView: class {}, MarkdownView: class {}, Modal: class {}, Notice: class { constructor(message) { notices.push(message); } }, Plugin: class {}, PluginSettingTab: class {}, Setting: MockSetting, SuggestModal: class { constructor() {} setPlaceholder() {} }, requireApiVersion: () => supportsDeclarative, TFile, TFolder, normalizePath: s => s.replace(/\\/g, '/'), requestUrl: (...args) => request(...args), setIcon() {} };
const modules = {};
for (const name of ['market-calendar', 'review-analysis', 'review-tags', 'quick-notes', 'markdown-sections', 'events', 'market-view', 'market-feel', 'tracks', 'trade-system']) {
  const moduleContext = { exports: {}, require: specifier => modules[specifier] };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(`src/${name}.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, moduleContext);
  modules[`./${name}`] = moduleContext.exports;
}
const context = { exports: {}, require: name => name === 'obsidian' ? obsidian : modules[name], console, Date, Map, Set, URL, URLSearchParams, window: { setTimeout, clearTimeout, setInterval: () => 0 } };
const source = fs.readFileSync('src/main.ts', 'utf8') + '\nObject.assign(exports, { loadReviewSettings, StockReviewSettingTab, sectionText, reviewBodyText, StockReviewDashboardView });';
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
const api = context.exports;
async function main() {

  const defaults = api.loadReviewSettings(null);
  const invalid = api.loadReviewSettings({ rootFolder: 42, confirmDelete: "false", calendarYears: { bad: ["01-01"], 2027: ["02-30"] }, calendarChecks: { 2027: { lastCheck: "broken", completed: true } } });
  assert.equal(invalid.rootFolder, defaults.rootFolder);
  assert.equal(invalid.confirmDelete, true);
  assert.equal(Object.keys(invalid.calendarYears).length, 0);
  assert.equal(Object.keys(invalid.calendarChecks).length, 0);
  const restored = api.loadReviewSettings({ rootFolder: " 自选复盘 ", confirmDelete: false, aiApiKey: "saved-key", calendarYears: { 2027: ["01-01/01-03"] }, calendarChecks: { 2027: { lastCheck: "2026-12-28", completed: true } } });
  assert.equal(restored.rootFolder, "自选复盘"); assert.equal(restored.confirmDelete, false);
  assert.equal(restored.aiApiKey, "saved-key"); assert.equal(restored.calendarYears['2027'].length, 3);
  restored.calendarYears['2027'].push('2027-01-04');
  assert.equal(Object.keys(api.loadReviewSettings(null).calendarYears).length, 0);
  assert.equal(invalid.reviewTags.length, 0);
  assert.equal(defaults.quickFolder, '随手记');
  assert.equal(defaults.includeQuickNotesInAi, false);
  const quickSettings = api.loadReviewSettings({ quickFolder: ' 灵感 ', includeQuickNotesInAi: true });
  assert.equal(quickSettings.quickFolder, '灵感');
  assert.equal(quickSettings.includeQuickNotesInAi, true);
  assert.equal(defaults.eventFolder, '大事');
  const eventSettings = api.loadReviewSettings({ eventFolder: ' 事件 ' });
  assert.equal(eventSettings.eventFolder, '事件');
  assert.equal(defaults.eventDrivenFolder, '事件驱动');
  const drivenSettings = api.loadReviewSettings({ eventDrivenFolder: ' 盘后 ' });
  assert.equal(drivenSettings.eventDrivenFolder, '盘后');
  assert.equal(defaults.marketFeelFolder, '大盘体感');
  const feelSettings = api.loadReviewSettings({ marketFeelFolder: ' 体感 ' });
  assert.equal(feelSettings.marketFeelFolder, '体感');
  const tagged = api.loadReviewSettings({ reviewTags: ['#救市政策', '救市政策', '来源/北漠海', 42, '含 空格'] });
  assert.equal(tagged.reviewTags.join(','), '救市政策,来源/北漠海');
  tagged.reviewTags.push('临时');
  assert.equal(api.loadReviewSettings(null).reviewTags.length, 0);
  const settingsPlugin = new api.default(); settingsPlugin.settings = api.loadReviewSettings(null);
  let settingSaves = 0; settingsPlugin.saveSettings = async () => { settingSaves++; };
  const tab = new api.StockReviewSettingTab({}, settingsPlugin);
  tab.containerEl = { empty() { settingRows.length = 0; } };
  const definitions = tab.getSettingDefinitions();
  assert.ok(definitions.every(d => typeof d.name === 'string' && typeof d.render === 'function'));
  tab.display();
  assert.equal(settingRows.length, definitions.length + 1); assert.equal(settingRows[0].heading, true);
  const legacyNames = settingRows.slice(1).map(row => row.name);
  assert.equal(legacyNames.join('|'), definitions.map(d => d.name).join('|'));
  const folderRow = settingRows.find(row => row.name === '日报文件夹');
  await folderRow.controls[0].change('  自选日报  ');
  assert.equal(settingsPlugin.settings.dailyFolder, '自选日报'); assert.equal(settingSaves, 1);
  supportsDeclarative = false; tab.refreshSettings();
  assert.equal(settingRows.length, definitions.length + 1);
  let updates = 0; tab.update = () => { updates++; };
  supportsDeclarative = true; tab.refreshSettings(); assert.equal(updates, 1);
  const startup = new api.default();
  const editorHandlers = {};
  startup.loadData = async () => ({ rootFolder: false, confirmDelete: false });
  startup.registerInterval = startup.registerEvent = startup.addSettingTab = startup.registerView = startup.addRibbonIcon = startup.addCommand = () => {};
  startup.app = { workspace: { onLayoutReady() {}, on(event, callback) { editorHandlers[event] = callback; } }, vault: { on() {} } };
  await startup.onload(); assert.equal(startup.settings.rootFolder, defaults.rootFolder); assert.equal(startup.settings.confirmDelete, false);
  editorHandlers['editor-paste']({ defaultPrevented: true, get clipboardData() { throw Error('Handled paste must not inspect clipboard'); } }, {}, null);
  let pasted = 0; let prevented = 0;
  startup.isDailyReview = () => true; startup.insertPastedImage = async () => { pasted++; };
  const editorInfo = Object.assign(new obsidian.MarkdownView(), { file: new TFile() });
  editorHandlers['editor-paste']({ defaultPrevented: false, clipboardData: { files: [{ type: 'image/png', name: 'test.png' }] }, preventDefault() { prevented++; } }, {}, editorInfo);
  assert.equal(pasted, 1); assert.equal(prevented, 1);

  const markdown = '# A股市场\n\n第一行\n第二行\n\n```md\n# 代码内标题\n```\n\n# 今日操作\n\n买入\n';
  assert.match(api.sectionText(markdown, 'A股市场'), /第一行\n第二行/);
  assert.match(api.sectionText(markdown, 'A股市场'), /代码内标题/);
  assert.equal(api.sectionText(markdown, '今日操作'), '买入');
  assert.equal(api.sectionText('# A股市场\n\n# 今日操作\n正文', 'A股市场'), '');
  assert.equal(api.sectionText('## 明日计划\r\n\r\n计划一\r\n计划二', '明日计划'), '计划一\n计划二');
  const bodyText = api.reviewBodyText('第一行\n第二行 ![[a.png]] [链接](https://example.com)');
  assert.match(bodyText, /第一行\n第二行/);
  assert.doesNotMatch(bodyText, /a\.png|https:/);
  assert.match(bodyText, /链接/);
  assert.equal(api.reviewBodyText('字'.repeat(200)).length, 200);
  const sectionApi = modules['./markdown-sections'];
  assert.equal(sectionApi.renameSectionHeading('# 昨日验证\n\n内容', '昨日验证', '次日验证'), '# 次日验证\n\n内容');
  assert.equal(sectionApi.renameSectionHeading('## 昨日验证\n\n内容', '昨日验证', '次日验证'), '## 次日验证\n\n内容');
  assert.equal(sectionApi.renameSectionHeading('# 今日反思\n\n内容', '昨日验证', '次日验证'), '# 今日反思\n\n内容');
  const tagApi = modules['./review-tags'];
  assert.equal(tagApi.extractTags('# A股市场\n降准 #救市政策 #来源/北漠海').join(','), '救市政策,来源/北漠海');
  assert.equal(tagApi.extractTags('```\n#代码标签\n```\n正文 #保留').join(','), '保留');
  assert.equal(tagApi.extractTags('`#行内` #正常').join(','), '正常');
  assert.equal(tagApi.extractTags('https://example.com/#anchor #有效').join(','), '有效');
  assert.equal(tagApi.extractTags('#123 #正常').join(','), '正常');
  assert.equal(tagApi.normalizeTag('  #救市政策 '), '救市政策');
  assert.equal(tagApi.normalizeTag('含 空格'), '');
  const insertionLines = ['# A股市场', '', '第一行', '第二行 #已有', '', '独立段落'];
  const insertion = tagApi.planTagInsertion(insertionLines, 2, '救市政策');
  assert.equal(insertion.line, 3); assert.equal(insertion.text, ' #救市政策');
  assert.equal(tagApi.planTagInsertion(insertionLines, 3, '已有').duplicate, true);
  assert.match(tagApi.planTagInsertion(['# 标题'], 0, '标签').error, /标题/);
  assert.match(tagApi.planTagInsertion(['```', '#代码', '```'], 1, '标签').error, /代码/);
  assert.match(tagApi.planTagInsertion(['正文'], 0, '含 空格').error, /有效/);
  const quickApi = modules['./quick-notes'];
  const formattedQuick = quickApi.formatQuickNoteBlock('14:32', '央行降准', ['#救市政策', '来源/北漠海']);
  assert.match(formattedQuick, /^## 14:32/);
  assert.match(formattedQuick, /#救市政策 #来源\/北漠海/);
  const quickMarkdown = '# 2026-11-06 随手记\n\n## 14:32\n\n内容A\n\n#救市政策\n\n## 21:05\n\n内容B';
  const parsedQuick = quickApi.parseQuickNotes('2026-11-06', quickMarkdown);
  assert.equal(parsedQuick.length, 2);
  assert.equal(parsedQuick[0].time, '14:32');
  assert.equal(parsedQuick[0].tags.join(','), '救市政策');
  assert.equal(parsedQuick[1].text, '内容B');
  assert.equal(quickApi.quickNoteBody('内容\n\n#救市政策'), '内容');
  const appendedQuick = quickApi.appendQuickNote('', '2026-11-06', '14:32', '内容', ['救市政策']);
  assert.match(appendedQuick, /^# 2026-11-06 随手记/);
  assert.match(appendedQuick, /## 14:32/);
  const eventApi = modules['./events'];
  const eventTemplate = eventApi.eventTemplate('美联储议息', '2026-12-10');
  assert.match(eventTemplate, /date: "2026-12-10"/);
  assert.match(eventTemplate, /# 美联储议息/);
  let updatedEvent = eventApi.updateEventNote(eventTemplate, '美联储议息', '2026-12-10', '预期降息', '实际维持不变');
  assert.match(updatedEvent, /## 预期\n\n预期降息/);
  assert.match(updatedEvent, /## 实际\n\n实际维持不变/);
  const parsedEvent = eventApi.parseEventNote(updatedEvent, 'fallback');
  assert.equal(parsedEvent.title, '美联储议息');
  assert.equal(parsedEvent.date, '2026-12-10');
  updatedEvent = eventApi.updateEventNote(updatedEvent, '美联储议息', '2026-12-10', '修改后的预期', '实际维持不变');
  assert.match(updatedEvent, /修改后的预期/);
  assert.doesNotMatch(updatedEvent, /预期降息/);
  assert.match(updatedEvent, /## 实际/);
  assert.equal(eventApi.naturalDaysBetween('2026-11-06', '2026-12-10'), 34);
  const weekday = date => ![0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay());
  assert.equal(eventApi.tradingDaysBetween('2026-11-06', '2026-11-09', weekday), 1);
  const countdown = eventApi.eventCountdown('2026-11-09', '2026-11-06', weekday);
  assert.equal(countdown.days, 3); assert.equal(countdown.tradingDays, 1);
  assert.match(countdown.label, /还有 3 个自然日 · 1 个A股交易日/);
  const pastCountdown = eventApi.eventCountdown('2026-11-05', '2026-11-06', weekday);
  assert.equal(pastCountdown.days, -1); assert.equal(pastCountdown.tradingDays, -1);
  assert.match(pastCountdown.label, /已发生 1 个自然日 · 1 个A股交易日/);
  assert.equal(eventApi.eventWeekday('2026-11-06'), '周五');
  assert.equal(eventApi.eventWeekday('2026-11-09'), '周一');
  assert.equal(eventApi.eventSlug('美联储：议息/会议?'), '美联储：议息会议');
  const viewApi = modules['./market-view'];
  const emptyView = viewApi.marketViewTemplate();
  assert.match(emptyView, /^# 整体观点/);
  let viewNote = viewApi.updateMarketView(emptyView, '最近两个月按反弹对待');
  assert.match(viewNote, /^# 整体观点\n\n最近两个月按反弹对待\n$/);
  assert.equal(viewApi.marketViewBody(viewNote), '最近两个月按反弹对待');
  viewNote = viewApi.updateMarketView(viewNote, '改为震荡市，等待放量');
  assert.doesNotMatch(viewNote, /反弹/);
  assert.equal(viewApi.marketViewBody(viewNote), '改为震荡市，等待放量');
  assert.equal(viewApi.marketViewBody('# 整体观点\n\n直接写在标题下面'), '直接写在标题下面');
  assert.equal(viewApi.marketViewBody('---\ntags: 观点\n---\n\n# 整体观点\n\n带 frontmatter'), '带 frontmatter');
  assert.equal(viewApi.marketViewBody('# 整体观点\n\n## 小节\n\n正文'), '## 小节\n\n正文');
  const viewPlugin = new api.default();
  viewPlugin.settings = api.loadReviewSettings(null);
  const marketFile = Object.assign(new TFile(), { path: '交易复盘/整体观点.md', name: '整体观点.md', basename: '整体观点', extension: 'md', stat: { mtime: 1762497600000 } });
  let marketText = '# 整体观点\n\n最近两个月按反弹对待';
  viewPlugin.app = { vault: { getAbstractFileByPath: path => path === marketFile.path ? marketFile : null, cachedRead: async () => marketText, process: async (_file, fn) => { marketText = fn(marketText); } } };
  viewPlugin.refreshDashboards = async () => {};
  const loadedView = await viewPlugin.getMarketView();
  assert.equal(loadedView.text, '最近两个月按反弹对待');
  assert.equal(loadedView.updated, marketFile.stat.mtime);
  assert.equal(viewPlugin.marketViewPath(), '交易复盘/整体观点.md');
  await viewPlugin.saveMarketView('改为震荡市');
  assert.match(marketText, /改为震荡市/);
  assert.doesNotMatch(marketText, /反弹/);
  const feelApi = modules['./market-feel'];
  const feelTemplate = feelApi.marketFeelTemplate('2026-11-07');
  assert.match(feelTemplate, /# 2026-11-07 大盘体感/);
  let feelNote = feelApi.updateMarketFeelNote(feelTemplate, '2026-11-07', { a: { score: 4, note: 'A股赚钱效应不错' }, us: { score: 2, note: '美股等待数据' } });
  assert.match(feelNote, /## A股\n\n体感：4\/5\n\nA股赚钱效应不错/);
  assert.match(feelNote, /## 美股\n\n体感：2\/5\n\n美股等待数据/);
  const parsedFeel = feelApi.parseMarketFeelNote(feelNote);
  assert.equal(parsedFeel.a.score, 4); assert.equal(parsedFeel.a.note, 'A股赚钱效应不错');
  assert.equal(parsedFeel.us.score, 2); assert.equal(parsedFeel.us.note, '美股等待数据');
  feelNote = feelApi.updateMarketFeelNote(feelNote, '2026-11-07', { a: { score: 0, note: '' }, us: { score: 5, note: '只更新美股' } });
  assert.equal(feelApi.parseMarketFeelNote(feelNote).a.score, 0);
  assert.equal(feelApi.parseMarketFeelNote(feelNote).us.score, 5);
  assert.equal(feelApi.normalizeMarketFeelScore(3), 3);
  assert.equal(feelApi.normalizeMarketFeelScore(0), 0);
  assert.equal(feelApi.normalizeMarketFeelScore(6), 0);
  assert.equal(feelApi.normalizeMarketFeelScore(3.5), 0);
  const feelRecords = [
    { a: { score: 4, note: '' }, us: { score: 2, note: '' } },
    { a: { score: 2, note: '' }, us: { score: 5, note: '' } },
    { a: { score: 0, note: '未评分' }, us: { score: 3, note: '' } },
  ];
  assert.equal(feelApi.averageMarketFeel(feelRecords, 'a', 5), 3);
  assert.equal(feelApi.averageMarketFeel(feelRecords, 'us', 5), 10 / 3);
  assert.equal(feelApi.averageMarketFeel(feelRecords, 'a', 1), 4);
  assert.equal(feelApi.averageMarketFeel(feelRecords.slice(2), 'a', 5), null);
  const feelPlugin = new api.default();
  feelPlugin.settings = api.loadReviewSettings(null);
  const feelFile = Object.assign(new TFile(), { path: '交易复盘/大盘体感/2026/11/2026-11-07.md', name: '2026-11-07.md', basename: '2026-11-07', extension: 'md' });
  let feelText = feelApi.marketFeelTemplate('2026-11-07');
  feelPlugin.app = { vault: {
    getMarkdownFiles: () => [feelFile],
    getAbstractFileByPath: path => path === feelFile.path ? feelFile : null,
    cachedRead: async () => feelText,
    process: async (_file, fn) => { feelText = fn(feelText); }
  } };
  feelPlugin.refreshDashboards = async () => {};
  const loadedFeels = await feelPlugin.getMarketFeels();
  assert.equal(loadedFeels.length, 1); assert.equal(loadedFeels[0].date, '2026-11-07');
  assert.equal(feelPlugin.marketFeelPath('2026-11-07'), '交易复盘/大盘体感/2026/11/2026-11-07.md');
  await feelPlugin.saveMarketFeel('2026-11-07', { a: { score: 4, note: 'A股不错' }, us: { score: 2, note: '' } });
  assert.match(feelText, /体感：4\/5\n\nA股不错/);
  await assert.rejects(feelPlugin.saveMarketFeel('2026-11-07', { a: { score: 0, note: '' }, us: { score: 0, note: '' } }), /至少/);
  assert.equal(feelPlugin.isTradingDay('2026-11-06'), true);
  assert.equal(feelPlugin.isUsTradingDay('2026-11-06'), true);
  assert.equal(feelPlugin.isTradingDay('2026-10-01'), false);
  assert.equal(feelPlugin.isUsTradingDay('2026-10-01'), true);
  assert.equal(feelPlugin.isMarketFeelTradingDay('2026-10-01'), true);
  assert.equal(feelPlugin.isMarketFeelTradingDay('2026-01-01'), false);
  assert.equal(feelPlugin.isMarketFeelTradingDay('2026-11-08'), false);
  await assert.rejects(feelPlugin.saveMarketFeel('2026-11-08', { a: { score: 4, note: '' }, us: { score: 0, note: '' } }), /休市/);
  await assert.rejects(feelPlugin.saveMarketFeel('2026-01-01', { a: { score: 4, note: '' }, us: { score: 0, note: '' } }), /休市/);
  const trackApi = modules['./tracks'];
  assert.equal(trackApi.trackTemplate('救市政策'), '# 救市政策\n\n');
  const parsedTrack = trackApi.parseTrack('# 救市政策\n\n第一段\n第二段', 'fallback');
  assert.equal(parsedTrack.title, '救市政策');
  assert.equal(parsedTrack.text, '第一段\n第二段');
  const legacyTrack = trackApi.parseTrack('---\ncreated: "2026-11-08"\n---\n\n# 旧笔记\n\n旧内容', 'fallback');
  assert.equal(legacyTrack.title, '旧笔记');
  assert.equal(legacyTrack.text, '旧内容');
  const legacyTemplateTrack = trackApi.parseTrack('---\ncreated: "2026-11-08"\n---\n\n# 旧模板\n\n## 逻辑\n\n内容甲\n\n## 记录\n\n### 2026-11-10\n\n内容乙\n\n## 结论\n', 'fallback');
  assert.equal(legacyTemplateTrack.text, '内容甲\n\n内容乙');
  const trackPlugin = new api.default();
  trackPlugin.settings = api.loadReviewSettings(null);
  const trackFile = Object.assign(new TFile(), { path: '交易复盘/跟踪/2026/11/2026-11-08-救市政策.md', name: '2026-11-08-救市政策.md', basename: '2026-11-08-救市政策', extension: 'md', stat: { mtime: 1762497600000 } });
  const trackText = trackApi.trackTemplate('救市政策');
  const createdTrackFiles = [];
  trackPlugin.app = { vault: {
    getMarkdownFiles: () => [trackFile],
    cachedRead: async () => trackText,
    getAbstractFileByPath: () => null,
    createFolder: async () => {},
    create: async (path, text) => { createdTrackFiles.push([path, text]); return Object.assign(new TFile(), { path }); }
  } };
  const loadedTracks = await trackPlugin.getTracks();
  assert.equal(loadedTracks.length, 1);
  assert.equal(loadedTracks[0].title, '救市政策');
  assert.equal(loadedTracks[0].text, '');
  assert.equal(trackPlugin.trackFolderPath(), '交易复盘/跟踪');
  await trackPlugin.createTrack('新笔记');
  assert.match(createdTrackFiles[0][0], /^交易复盘\/跟踪\/\d{4}\/\d{2}\/\d{4}-\d{2}-\d{2}-新笔记\.md$/);
  assert.equal(createdTrackFiles[0][1], '# 新笔记\n\n');
  const systemApi = modules['./trade-system'];
  const systemNote = systemApi.systemTemplate('首板低吸', '2026-11-08');
  assert.match(systemNote, /created: "2026-11-08"/);
  assert.match(systemNote, /## 适用环境/);
  assert.match(systemNote, /## 卖出条件/);
  const parsedSystem = systemApi.parseSystemNote(systemNote, 'fallback');
  assert.equal(parsedSystem.title, '首板低吸');
  assert.equal(parsedSystem.created, '2026-11-08');
  assert.equal(parsedSystem.sections['买入条件'], '');
  assert.equal(systemApi.SYSTEM_SECTIONS.join(','), '适用环境,买入条件,卖出条件,风控,案例,备注');
  const systemPlugin = new api.default();
  systemPlugin.settings = api.loadReviewSettings(null);
  const systemFile = Object.assign(new TFile(), { path: '交易复盘/交易系统/首板低吸.md', name: '首板低吸.md', basename: '首板低吸', extension: 'md' });
  systemPlugin.app = { vault: { getMarkdownFiles: () => [systemFile], cachedRead: async () => systemNote } };
  const loadedPatterns = await systemPlugin.getSystemPatterns();
  assert.equal(loadedPatterns.length, 1);
  assert.equal(loadedPatterns[0].sections['买入条件'], '');
  assert.equal(systemPlugin.systemFolderPath(), '交易复盘/交易系统');
  const drivenData = { title: '央行降准公告', date: '2026-11-06', time: '20:00', event: '盘后宣布降准', expectation: '预期降准 0.25 个百分点', result: '', reaction: '' };
  let drivenNote = eventApi.eventDrivenTemplate(drivenData.title, drivenData.date, drivenData.time);
  assert.match(drivenNote, /date: "2026-11-06"/);
  assert.match(drivenNote, /time: "20:00"/);
  const parsedDriven = eventApi.parseEventMeta(drivenNote, 'fallback');
  assert.equal(parsedDriven.date, '2026-11-06'); assert.equal(parsedDriven.time, '20:00');
  drivenNote = eventApi.updateEventDrivenNote(drivenNote, drivenData);
  assert.match(drivenNote, /## 事件\n\n盘后宣布降准/);
  assert.match(drivenNote, /## 预期\n\n预期降准 0.25 个百分点/);
  assert.match(drivenNote, /## 结果\n\n## 次日反应/);
  assert.equal(eventApi.eventDrivenStatus(''), 'pending');
  assert.equal(eventApi.eventDrivenStatus('结果'), 'done');
  const doneData = { ...drivenData, result: '实际降准 0.25 个百分点', reaction: '次日高开' };
  drivenNote = eventApi.updateEventDrivenNote(drivenNote, doneData);
  assert.match(drivenNote, /实际降准 0.25 个百分点/);
  assert.match(drivenNote, /次日高开/);
  const drivenSections = eventApi.eventDrivenSections(drivenNote);
  assert.equal(drivenSections.event, '盘后宣布降准');
  assert.equal(drivenSections.result, '实际降准 0.25 个百分点');
  const withNote = drivenNote.replace('## 次日反应', '## 备注\n\n手工补充\n\n## 次日反应');
  assert.match(eventApi.updateEventDrivenNote(withNote, doneData), /手工补充/);
  const noTime = eventApi.updateEventDrivenNote(drivenNote, { ...doneData, time: '' });
  assert.doesNotMatch(noTime, /^time:/m);
  const dashboard = new api.StockReviewDashboardView();
  dashboard.quickFilter = 'all'; dashboard.sectionFilter = 'A股市场'; dashboard.query = '';
  const entry = { date: '2026-10-15', sections: { 'A股市场': '' }, text: '' };
  dashboard.sectionPresence = 'written'; assert.equal(dashboard.matchesFilters(entry), false);
  dashboard.sectionPresence = 'missing'; assert.equal(dashboard.matchesFilters(entry), true);
  const taggedEntry = { date: '2026-10-15', sections: { 'A股市场': '降准 #救市政策', '美股市场': '' }, text: '降准 #救市政策' };
  dashboard.sectionPresence = 'written'; dashboard.tagFilter = '救市政策';
  assert.equal(dashboard.matchesFilters(taggedEntry), true);
  dashboard.sectionFilter = '美股市场'; assert.equal(dashboard.matchesFilters(taggedEntry), false);
  dashboard.sectionFilter = 'A股市场'; dashboard.tagFilter = '';
  const quickDashboard = new api.StockReviewDashboardView();
  quickDashboard.quickRange = 'all'; quickDashboard.quickQuery = ''; quickDashboard.quickTagFilter = '救市政策';
  const quickNoteEntry = { date: '2026-11-06', time: '14:32', text: '内容 #救市政策', tags: ['救市政策'] };
  assert.equal(quickDashboard.matchesQuickNote(quickNoteEntry), true);
  quickDashboard.quickTagFilter = ''; quickDashboard.quickQuery = '政策';
  assert.equal(quickDashboard.matchesQuickNote(quickNoteEntry), true);
  quickDashboard.quickQuery = '不存在'; assert.equal(quickDashboard.matchesQuickNote(quickNoteEntry), false);
  const plugin = new api.default();
  const oldFile = Object.assign(new TFile(), { path: '交易复盘/日报/2026-10-16.md', name: '2026-10-16.md', basename: '2026-10-16' });
  plugin.app = { vault: { getAbstractFileByPath: () => null, getMarkdownFiles: () => [oldFile] } };
  plugin.settings = { rootFolder: '交易复盘', dailyFolder: '日报' };
  assert.equal(await plugin.getOrCreateDaily('2026-10-16'), oldFile);
  const weekendPlugin = new api.default();
  weekendPlugin.settings = { rootFolder: '交易复盘', dailyFolder: '日报' };
  const createdPaths = [];
  weekendPlugin.app = { vault: {
    getAbstractFileByPath: () => null,
    getMarkdownFiles: () => [],
    createFolder: async () => {},
    create: async (path) => {
      createdPaths.push(path);
      const name = path.split('/').pop();
      return Object.assign(new TFile(), { path, name, basename: name.replace(/\.md$/, ''), extension: 'md' });
    }
  } };
  const weekendFile = await weekendPlugin.getOrCreateDaily('2026-10-17');
  assert.equal(weekendFile.path, '交易复盘/日报/2026/10/20261017复盘.md');
  assert.deepEqual(createdPaths, ['交易复盘/日报/2026/10/20261017复盘.md']);
  await assert.rejects(weekendPlugin.getOrCreateDaily('2999-01-01'), /未来/);
  const ai = new api.default(); ai.settings = { aiBaseUrl: 'https://example.com', aiApiKey: 'test', aiModel: 'test' };
  request = async () => ({ json: {} }); await assert.rejects(ai.testAi(), /有效消息/);
  await assert.rejects(plugin.getOrCreateDaily('2026-02-30'), /无效/);
  assert.equal(plugin.imageExtension(''), '');
  const attachment = Object.assign(new TFile(), { name: 'shared.png' });
  const unused = Object.assign(new TFile(), { name: 'unused.png' });
  const folder = Object.assign(new TFolder(), { children: [attachment, unused] }); const removed = [];
  plugin.app = { vault: { getAbstractFileByPath: () => folder, getMarkdownFiles: () => [{ name: 'other.md', path: 'other.md' }], read: async () => '![[shared.png]]' }, fileManager: { trashFile: async file => removed.push(file.name) } };
  await plugin.deleteAttachmentsForDate('2026-10-16'); assert.equal(removed.join(','), 'unused.png');
  const calendar = modules['./market-calendar'];
  assert.equal(calendar.fourthMondayOfDecember(2026), '2026-12-28');
  assert.equal(calendar.fourthMondayOfDecember(2025), '2025-12-22');
  assert.equal(calendar.calendarCheckTarget(new Date('2026-12-27T15:59:00Z')).year, '2026');
  assert.equal(calendar.calendarCheckTarget(new Date('2026-12-27T16:00:00Z')).year, '2027');
  assert.equal(calendar.calendarCheckTarget(new Date('2027-01-02T00:00:00Z')).year, '2027');
  const annualText = '2026年休市安排 元旦：1月1日（星期四）至1月3日（星期六）休市。春节：2月15日至2月23日休市。清明节：4月4日至4月6日休市。劳动节：5月1日至5月5日休市。端午节：6月19日至6月21日休市。中秋节：9月25日至9月27日休市。国庆节：10月1日至10月7日休市。';
  assert.equal(calendar.parseAnnualClosures('2026', annualText).join(','), calendar.expandClosures('2026', calendar.HOLIDAY_RANGES['2026'].join(' ')).join(','));
  assert.equal(calendar.parseAnnualClosures('2027', annualText), null);
  assert.equal(calendar.parseAnnualClosures('2026', '2026年休市安排 元旦：1月1日休市'), null);
  const crossYear = annualText.replace('1月1日（星期四）至1月3日（星期六）', '2025年12月31日至2026年1月3日');
  assert.equal(calendar.parseAnnualClosures('2026', crossYear)[0], '2026-01-01');
  const updater = new api.default(); updater.settings = { calendarYears: {}, calendarChecks: {} };
  updater.saveData = async () => {}; updater.refreshDashboards = async () => {}; updater.applyCalendar = () => {};
  updater.app = { workspace: { getLeavesOfType: () => [] } };
  let calendarFetches = 0;
  updater.fetchAnnualCalendar = async () => { calendarFetches++; return null; };
  await updater.checkAnnualCalendar(new Date('2026-12-27T00:00:00Z')); assert.equal(calendarFetches, 0);
  await updater.checkAnnualCalendar(new Date('2026-12-28T00:00:00Z')); assert.equal(calendarFetches, 1);
  await updater.checkAnnualCalendar(new Date('2026-12-28T12:00:00Z')); assert.equal(calendarFetches, 1);
  updater.fetchAnnualCalendar = async () => { calendarFetches++; return { dates: ['2027-01-01'], source: 'https://www.sse.com.cn/' }; };
  await updater.checkAnnualCalendar(new Date('2026-12-29T00:00:00Z')); assert.equal(calendarFetches, 2);
  assert.equal(updater.settings.calendarChecks['2027'].completed, true);
  await updater.checkAnnualCalendar(new Date('2027-01-02T00:00:00Z')); assert.equal(calendarFetches, 2);
  assert.equal(updater.settings.calendarYears['2027'][0], '2027-01-01');
  assert.equal(calendar.builtInClosures().has('2026-02-23'), true);
  assert.equal(calendar.builtInClosures().has('2025-02-04'), true);
  assert.equal(calendar.builtInClosures().has('2024-02-09'), true);
  assert.equal(calendar.expandClosures('2027', '01-01/01-03').length, 3);
  assert.throws(() => calendar.expandClosures('2027', '02-30'));
  assert.throws(() => calendar.expandClosures('2027', '2026-01-01'));
  assert.throws(() => calendar.expandClosures('2027', '01-03/01-01'));
  assert.equal(calendar.isUsTradingDay('2026-11-06'), true);
  assert.equal(calendar.isUsTradingDay('2026-11-07'), false);
  assert.equal(calendar.isUsTradingDay('2026-11-26'), false);
  assert.equal(calendar.isUsTradingDay('2026-11-27'), true);
  assert.equal(calendar.isUsTradingDay('2026-01-19'), false);
  assert.equal(calendar.isUsTradingDay('2026-02-16'), false);
  assert.equal(calendar.isUsTradingDay('2026-04-03'), false);
  assert.equal(calendar.isUsTradingDay('2026-05-25'), false);
  assert.equal(calendar.isUsTradingDay('2026-06-19'), false);
  assert.equal(calendar.isUsTradingDay('2026-07-03'), false);
  assert.equal(calendar.isUsTradingDay('2026-09-07'), false);
  assert.equal(calendar.isUsTradingDay('2026-12-25'), false);
  assert.equal(calendar.isUsTradingDay('2021-06-18'), true);
  assert.equal(calendar.isUsTradingDay('2021-12-24'), false);
  assert.equal(calendar.isUsTradingDay('2021-12-31'), true);
  assert.equal(calendar.isUsTradingDay('2022-06-20'), false);
  assert.equal(calendar.isUsTradingDay('2027-06-18'), false);
  assert.equal(calendar.isUsTradingDay('2027-12-31'), true);
  const analysis = modules['./review-analysis'];
  assert.equal(analysis.reviewRange('2026-10-22', 'weekly').start, '2026-10-19');
  assert.equal(analysis.reviewRange('2026-10-22', 'weekly').end, '2026-10-25');
  assert.equal(analysis.reviewRange('2026-10-22', 'daily').end, '2026-10-22');
  assert.doesNotMatch(analysis.plainReviewText('内容 ![[a.png]] ![x](https://example.com/a.png) <img src="b.png">'), /a.png|b.png|https:/);
  const reviewer = new api.default(); reviewer.settings = ai.settings;
  reviewer.getReviewEntries = async () => [
    { date: '2026-10-19', text: '# A股市场\n复盘事实 ![[private.png]]' },
    { date: '2026-10-20', text: '# 今日反思\n反思记录' },
    { date: '2026-10-23', text: 'FUTURE_SHOULD_NOT_SEND' },
    { date: '2026-10-18', text: 'OUT_OF_RANGE_SHOULD_NOT_SEND' }
  ];
  let sent;
  request = async options => { sent = JSON.parse(options.body); return { json: { choices: [{ message: { content: '文字分析 ![bad](https://example.com/b.png)' } }] } }; };
  const report = await reviewer.analyzeReview('2026-10-22', 'weekly');
  assert.equal(typeof sent.messages[0].content, 'string');
  assert.match(sent.messages[0].content, /复盘事实/);
  assert.doesNotMatch(sent.messages[0].content, /private.png|FUTURE_SHOULD_NOT_SEND|OUT_OF_RANGE_SHOULD_NOT_SEND/);
  assert.doesNotMatch(report, /b.png/);
  reviewer.getReviewEntries = async () => [
    { date: '2026-10-24', text: 'WEEKEND_POLICY_SHOULD_SEND' },
    { date: '2026-10-25', text: 'SUNDAY_INSIGHT_SHOULD_SEND' }
  ];
  const weekendDaily = await reviewer.analyzeReview('2026-10-24', 'daily');
  assert.match(sent.messages[0].content, /WEEKEND_POLICY_SHOULD_SEND/);
  assert.doesNotMatch(sent.messages[0].content, /SUNDAY_INSIGHT_SHOULD_SEND/);
  assert.match(weekendDaily, /文字复盘 1 篇/);
  const weekendWeekly = await reviewer.analyzeReview('2026-10-25', 'weekly');
  assert.match(sent.messages[0].content, /WEEKEND_POLICY_SHOULD_SEND/);
  assert.match(sent.messages[0].content, /SUNDAY_INSIGHT_SHOULD_SEND/);
  assert.match(weekendWeekly, /文字复盘 2 篇/);
  const quickReviewer = new api.default();
  quickReviewer.settings = api.loadReviewSettings({ aiBaseUrl: 'https://example.com', aiApiKey: 'quick-fixture', aiModel: 'quick-model', includeQuickNotesInAi: true });
  quickReviewer.getReviewEntries = async () => [{ date: '2026-10-22', text: '# A股市场\n复盘正文' }];
  quickReviewer.getQuickNotes = async () => [{ date: '2026-10-22', time: '09:30', text: '随手心得 QUICK_NOTE_SHOULD_SEND', tags: [] }];
  const quickReport = await quickReviewer.analyzeReview('2026-10-22', 'daily');
  assert.match(sent.messages[0].content, /QUICK_NOTE_SHOULD_SEND/);
  assert.match(sent.messages[0].content, /随手记/);
  assert.match(quickReport, /随手记 1 条/);
  quickReviewer.getReviewEntries = async () => [];
  await quickReviewer.analyzeReview('2026-10-22', 'daily');
  assert.match(sent.messages[0].content, /QUICK_NOTE_SHOULD_SEND/);
  quickReviewer.settings.includeQuickNotesInAi = false;
  await assert.rejects(quickReviewer.analyzeReview('2026-10-22', 'daily'), /没有可分析/);
  reviewer.getReviewEntries = async () => [];
  await assert.rejects(reviewer.analyzeReview('2026-10-22', 'daily'), /没有可分析/);
  const modelPlugin = new api.default(); modelPlugin.settings = api.loadReviewSettings({ aiBaseUrl: 'https://a.example/chat/completions', aiApiKey: 'fixture', aiModel: 'manual-model' });
  const modelTab = new api.StockReviewSettingTab({}, modelPlugin); modelTab.refreshSettings = () => {};
  let finishModels; modelPlugin.listAiModels = () => new Promise(resolve => { finishModels = resolve; });
  const pendingRow = new MockSetting(); modelTab.renderModelSetting(pendingRow);
  const fetching = pendingRow.controls[1].click(); modelPlugin.settings.aiBaseUrl = 'https://b.example/chat/completions'; finishModels(['obsolete-model']); await fetching;
  assert.equal(modelTab.availableModels.length, 0, 'late model response cannot replace a different provider list');
  assert.equal(pendingRow.controls[1].disabled, false, 'fetch button is restored after rejection');
  modelPlugin.listAiModels = async () => ['provider-b-model'];
  const fetchedRow = new MockSetting(); modelTab.renderModelSetting(fetchedRow); await fetchedRow.controls[1].click();
  const selectableRow = new MockSetting(); modelTab.renderModelSetting(selectableRow);
  modelPlugin.settings.aiApiKey = 'different-fixture'; await selectableRow.controls[1].change('provider-b-model');
  assert.equal(modelPlugin.settings.aiModel, 'manual-model', 'a stale dropdown cannot save a model after credentials change');
  console.log('PASS: model-list response races, stale selections and fetch-button recovery');
  const reader = new api.default(); reader.settings = api.loadReviewSettings(null);
  const reviewFile = { path: '交易复盘/日报/2026/10/20261028复盘.md', name: '20261028复盘.md', basename: '20261028复盘', extension: 'md' };
  let reviewText = '# A股市场\n原文\n# 今日反思\n反思 #救市政策', cachedReads = 0;
  reader.app = { vault: {
    getMarkdownFiles: () => [reviewFile],
    getFiles: () => [reviewFile, { path: '交易复盘/附件/2026/10/28/image.png', extension: 'png' }],
    cachedRead: async () => { cachedReads++; return reviewText; },
    read: async () => { throw new Error('Dashboard should use the Vault read cache'); }
  } };
  let entries = await reader.getReviewEntries();
  assert.equal(entries[0].date, '2026-10-28'); assert.equal(entries[0].filledCount, 2); assert.equal(entries[0].attachmentCount, 1);
  assert.equal(entries[0].tags.join(','), '救市政策');
  reviewText = '# A股市场\n编辑后的正文'; entries = await reader.getReviewEntries();
  assert.match(entries[0].text, /编辑后的正文/); assert.equal(entries[0].filledCount, 1); assert.equal(cachedReads, 2);
  console.log('PASS: dashboard cached reads retain date parsing, sections, attachments and edited content');
  const quickReader = new api.default(); quickReader.settings = api.loadReviewSettings(null);
  const quickFile = { path: '交易复盘/随手记/2026/11/2026-11-06.md', name: '2026-11-06.md', basename: '2026-11-06', extension: 'md' };
  quickReader.app = { vault: { getMarkdownFiles: () => [quickFile], cachedRead: async () => quickMarkdown } };
  const loadedQuick = await quickReader.getQuickNotes();
  assert.equal(loadedQuick.length, 2);
  assert.equal(loadedQuick[0].time, '21:05');
  assert.equal(loadedQuick[1].tags.join(','), '救市政策');
  assert.equal(loadedQuick[0].file, quickFile);
  const eventReader = new api.default(); eventReader.settings = api.loadReviewSettings(null);
  const eventFile = { path: '交易复盘/大事/2026/12/2026-12-10-美联储议息.md', name: '2026-12-10-美联储议息.md', basename: '2026-12-10-美联储议息', extension: 'md' };
  eventReader.app = { vault: { getMarkdownFiles: () => [eventFile], cachedRead: async () => updatedEvent } };
  const loadedEvents = await eventReader.getEvents();
  assert.equal(loadedEvents.length, 1);
  assert.equal(loadedEvents[0].title, '美联储议息');
  assert.equal(loadedEvents[0].date, '2026-12-10');
  assert.match(loadedEvents[0].expectation, /修改后的预期/);
  assert.equal(loadedEvents[0].actual, '实际维持不变');
  assert.equal(loadedEvents[0].file, eventFile);
  const drivenReader = new api.default(); drivenReader.settings = api.loadReviewSettings(null);
  const drivenFile = { path: '交易复盘/事件驱动/2026/11/2026-11-06-央行降准公告.md', name: '2026-11-06-央行降准公告.md', basename: '2026-11-06-央行降准公告', extension: 'md' };
  drivenReader.app = { vault: { getMarkdownFiles: () => [drivenFile], cachedRead: async () => drivenNote } };
  const loadedDriven = await drivenReader.getEventDrivenRecords();
  assert.equal(loadedDriven.length, 1);
  assert.equal(loadedDriven[0].title, '央行降准公告');
  assert.equal(loadedDriven[0].date, '2026-11-06');
  assert.equal(loadedDriven[0].time, '20:00');
  assert.equal(loadedDriven[0].result, '实际降准 0.25 个百分点');
  assert.equal(loadedDriven[0].reaction, '次日高开');
  assert.equal(loadedDriven[0].file, drivenFile);
  console.log('PASS: review parsing, filters, market cutoff, legacy notes, attachments, AI text analysis and annual calendar');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
