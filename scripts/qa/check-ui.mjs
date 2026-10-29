/**
 * M1 UI 自动验收脚本（puppeteer-core + 本机 Chrome）
 * 用法：node scripts/qa/check-ui.mjs [url]
 * 默认 url: http://127.0.0.1:5173/#/timeline
 */
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.argv[2] ?? 'http://127.0.0.1:5173';
const OUT_DIR = path.resolve('docs/screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const delays = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-first-run', '--disable-gpu', '--hide-scrollbars', '--disable-extensions'],
});

try {
  /* ---------------- 桌面端 ---------------- */
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(`PAGEERROR: ${error.message}`));

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/#/timeline`, { waitUntil: 'networkidle0', timeout: 20000 });
  await page.waitForSelector('.tl-block', { timeout: 15000 });
  await delays(400);

  const blockCount = await page.$$eval('.tl-block', (nodes) => nodes.length);
  check('时间轴渲染 90+ 个块', blockCount >= 90, `实际 ${blockCount}`);

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  check('桌面无横向溢出', overflow.scrollWidth <= overflow.innerWidth + 1, JSON.stringify(overflow));

  await page.screenshot({ path: path.join(OUT_DIR, 'm1-desktop.png') });

  // hover tooltip
  const blockBox = await page.$eval('.tl-block', (node) => {
    const rect = node.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });
  await page.mouse.move(blockBox.x, blockBox.y);
  await delays(300);
  const tooltipText = await page
    .$eval('.tl-tooltip', (node) => node.textContent?.trim() ?? '')
    .catch(() => '');
  check('hover 出现 tooltip', tooltipText.length > 2, tooltipText.slice(0, 40));

  // 点击 ChatGPT 块 → 抽屉
  const chatgpt = await page.$$('.tl-block');
  const chatgptAria = await page.$$eval('.tl-block', (nodes) =>
    nodes.map((node) => node.getAttribute('aria-label') ?? ''),
  );
  const chatgptIndex = chatgptAria.findIndex((label) => label.includes('ChatGPT 发布'));
  if (chatgptIndex >= 0) {
    await chatgpt[chatgptIndex].click();
  } else {
    await chatgpt[chatgpt.length - 1].click();
  }
  await page.waitForSelector('.drawer-panel', { timeout: 5000 });
  await delays(300);
  const drawer = await page.evaluate(() => ({
    title: document.querySelector('.drawer-heading')?.textContent?.trim() ?? '',
    hasSource: !!document.querySelector('.drawer-panel a[href^="http"]'),
    hasImportance: !!document.querySelector('.badge-importance'),
    copyBtn: !!Array.from(document.querySelectorAll('.drawer-foot button')).find((b) =>
      (b.textContent ?? '').includes('复制引用'),
    ),
    url: location.hash,
  }));
  check('点击块打开详情抽屉', drawer.title.length > 0 && drawer.url.includes('entry='), drawer.title);
  check('抽屉含影响力徽标/来源/复制引用', drawer.hasImportance && drawer.hasSource && drawer.copyBtn, JSON.stringify(drawer));
  await page.screenshot({ path: path.join(OUT_DIR, 'm1-drawer.png') });

  // Esc 关闭
  await page.keyboard.press('Escape');
  await delays(400);
  const drawerClosed = (await page.$('.drawer-panel')) === null;
  check('Esc 关闭抽屉', drawerClosed);

  // 图例筛选：点击第一个类别，块变暗
  const dimmedBefore = await page.$$eval('.tl-block.is-dimmed', (nodes) => nodes.length);
  await page.click('.legend-item');
  await delays(400);
  const dimmedAfter = await page.$$eval('.tl-block.is-dimmed', (nodes) => nodes.length);
  check('图例点击可筛选（块变暗不消失）', dimmedAfter > dimmedBefore, `${dimmedBefore} → ${dimmedAfter}`);
  await page.click('.legend-item');
  await delays(200);

  // 缩放
  const zoomBefore = await page.$eval('.tl-zoom-value', (node) => node.textContent?.trim() ?? '');
  const zoomButtons = await page.$$('.tl-zoom-btn');
  await zoomButtons[1].click();
  await delays(400);
  const zoomAfter = await page.$eval('.tl-zoom-value', (node) => node.textContent?.trim() ?? '');
  check('缩放按钮生效', zoomBefore !== zoomAfter, `${zoomBefore} → ${zoomAfter}`);
  if (zoomButtons[2]) await zoomButtons[2].click();

  // 年份 chip
  const yearChips = await page.$$('.tl-year-chip');
  check('年份 chip 存在', yearChips.length >= 10, `${yearChips.length} 个`);
  if (yearChips.length > 0) {
    await yearChips[yearChips.length - 1].click();
    await delays(300);
  }

  // 关于页
  await page.goto(`${BASE}/#/about`, { waitUntil: 'networkidle0' });
  await delays(400);
  const about = await page.evaluate(() => ({
    rows: document.querySelectorAll('.about-table tbody tr').length,
    hasAnchor10: (document.body.textContent ?? '').includes('开启范式/时代'),
    hasModelDoc: (document.body.textContent ?? '').includes('数据模型'),
  }));
  check('关于页含评分锚点表与数据模型', about.hasAnchor10 && about.hasModelDoc && about.rows >= 10, JSON.stringify(about));
  await page.screenshot({ path: path.join(OUT_DIR, 'm1-about.png'), fullPage: false });

  check('无浏览器控制台错误', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

  /* ---------------- 移动端 ---------------- */
  const mobile = await browser.newPage();
  const mobileErrors = [];
  mobile.on('pageerror', (error) => mobileErrors.push(error.message));
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobile.goto(`${BASE}/#/timeline`, { waitUntil: 'networkidle0', timeout: 20000 });
  await mobile.waitForSelector('.mobile-timeline-card', { timeout: 15000 });
  await delays(500);

  const mobileLayout = await mobile.evaluate(() => {
    const overflowElements = Array.from(document.querySelectorAll('body *'))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, cls: (element.className ?? '').toString().slice(0, 40), right: Math.round(rect.right), width: Math.round(rect.width) };
      })
      .filter((item) => item.right > window.innerWidth + 2 && item.width > 10)
      .slice(0, 8);
    return {
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflowElements,
    };
  });
  check(
    '移动端无横向溢出',
    mobileLayout.scrollWidth <= mobileLayout.innerWidth + 1,
    JSON.stringify(mobileLayout.overflowElements),
  );
  await mobile.screenshot({ path: path.join(OUT_DIR, 'm1-mobile.png'), fullPage: false });

  // 移动端点击卡片打开抽屉
  await mobile.click('.mobile-timeline-card');
  await mobile.waitForSelector('.drawer-panel', { timeout: 5000 });
  await delays(300);
  const mobileDrawer = await mobile.evaluate(() => ({
    title: document.querySelector('.drawer-heading')?.textContent?.trim() ?? '',
    width: document.querySelector('.drawer-panel')?.getBoundingClientRect().width ?? 0,
    viewport: window.innerWidth,
  }));
  check('移动端点击卡片打开抽屉', mobileDrawer.title.length > 0, JSON.stringify(mobileDrawer));
  await mobile.screenshot({ path: path.join(OUT_DIR, 'm1-mobile-drawer.png'), fullPage: false });
  check('移动端无页面错误', mobileErrors.length === 0, mobileErrors.slice(0, 2).join(' | '));

  /* ---------------- M2：奠基时代折叠区 ---------------- */
  const desk = await browser.newPage();
  await desk.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const deskErrors = [];
  desk.on('pageerror', (error) => deskErrors.push(error.message));
  await desk.goto(`${BASE}/#/timeline`, { waitUntil: 'networkidle0', timeout: 20000 });
  await delays(600);
  const foundation = await desk.evaluate(() => {
    const toggle = document.querySelector('.foundation-toggle');
    return {
      exists: !!toggle,
      text: toggle?.textContent?.trim() ?? '',
    };
  });
  check('奠基时代折叠区存在', foundation.exists && foundation.text.includes('奠基时代'), foundation.text);
  if (foundation.exists) {
    await desk.click('.foundation-toggle');
    await delays(400);
    const items = await desk.$$eval('.foundation-item', (nodes) => nodes.length);
    check('奠基时代可展开（10 条简述）', items === 10, `${items} 条`);
    await desk.screenshot({ path: path.join(OUT_DIR, 'm2-foundation.png') });
    await desk.click('.foundation-item');
    await delays(400);
    check('点击奠基条目打开详情抽屉', (await desk.$('.drawer-panel')) !== null);
    await desk.keyboard.press('Escape');
    await delays(300);
  }

  /* ---------------- M2：影响图谱 ---------------- */
  const graph = await browser.newPage();
  await graph.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const graphErrors = [];
  graph.on('pageerror', (error) => graphErrors.push(error.message));
  graph.on('console', (message) => {
    if (message.type() === 'error') graphErrors.push(message.text());
  });
  await graph.goto(`${BASE}/#/graph`, { waitUntil: 'networkidle0', timeout: 20000 });
  await graph.waitForSelector('.im-root', { timeout: 15000 });
  await delays(1200);
  const graphStats = await graph.evaluate(() => {
    const stats = Array.from(document.querySelectorAll('.graph-stats dd')).map((node) => node.textContent?.trim() ?? '');
    return { stats, hasChart: !!document.querySelector('.im-chart'), hasToolbar: !!document.querySelector('.im-toolbar') };
  });
  const nodeCount = Number(graphStats.stats[0] ?? 0);
  check('影响图谱渲染 90+ 节点', graphStats.hasChart && nodeCount >= 90, JSON.stringify(graphStats.stats));
  await graph.screenshot({ path: path.join(OUT_DIR, 'm2-graph-global.png') });

  await graph.goto(`${BASE}/#/graph?focus=transformer-2017`, { waitUntil: 'networkidle0' });
  await delays(1200);
  const focusState = await graph.evaluate(() => ({
    focusbar: document.querySelector('.im-focusbar')?.textContent?.trim() ?? '',
    back: !!document.querySelector('.im-back-btn'),
    hash: location.hash,
  }));
  check('聚焦思维导图模式生效', focusState.href !== '' && focusState.focusbar.includes('上游') && focusState.back, focusState.focusbar.slice(0, 50));
  await graph.screenshot({ path: path.join(OUT_DIR, 'm2-graph-focus.png') });
  if (focusState.back) {
    await graph.click('.im-back-btn');
    await delays(700);
    const hashBack = await graph.evaluate(() => location.hash);
    check('返回全局按钮生效', !hashBack.includes('focus='), hashBack);
  }
  check('影响图谱无 console/page error', graphErrors.length === 0, graphErrors.slice(0, 2).join(' | '));

  const graphMobile = await browser.newPage();
  await graphMobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await graphMobile.goto(`${BASE}/#/graph`, { waitUntil: 'networkidle0', timeout: 20000 });
  await delays(800);
  const mobileGraph = await graphMobile.evaluate(() => ({
    hasList: !!document.querySelector('.im-mobile'),
    groups: document.querySelectorAll('.im-mobile-group').length,
  }));
  check('影响图谱移动端降级为影响链列表', mobileGraph.hasList, JSON.stringify(mobileGraph));
  await graphMobile.screenshot({ path: path.join(OUT_DIR, 'm2-graph-mobile.png') });
  await desk.close();
  await graph.close();
  await graphMobile.close();



  /* ---------------- M2.5：主线（默认视图） ---------------- */
  const mainPage = await browser.newPage();
  await mainPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const mainErrors = [];
  mainPage.on('pageerror', (error) => mainErrors.push(error.message));
  mainPage.on('console', (message) => {
    if (message.type() === 'error') mainErrors.push(message.text());
  });
  await mainPage.goto(`${BASE}/#/mainline`, { waitUntil: 'networkidle0', timeout: 20000 });
  await mainPage.waitForSelector('.ml-chapter', { timeout: 15000 });
  await delays(600);
  const mainline = await mainPage.evaluate(() => ({
    chapters: document.querySelectorAll('.ml-chapter').length,
    cards: document.querySelectorAll('.ml-card').length,
    breakthroughs: document.querySelectorAll('.ml-card.is-breakthrough').length,
    marks: document.querySelectorAll('.ml-marks button').length,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  const navItems = await mainPage.$$eval('.app-nav .nav-item', (nodes) =>
    nodes.map((node) => (node.textContent ?? '').replace(/\s+/g, '')),
  );
  check(
    '主导航 4 项（全量数据已并入主题页）',
    navItems.length === 4 && navItems.join('|').includes('主线') && !navItems.join('').includes('全量数据'),
    navItems.join('/'),
  );
  const chapterOpeners = await mainPage.$$eval('.ml-chapter-open', (nodes) => nodes.length);
  check('主线 5 个章节入口（可点进看全部事件）', chapterOpeners === 5, `${chapterOpeners} 个`);
  check('主线 5 章', mainline.chapters === 5, JSON.stringify(mainline));
  check('主线 24 个里程碑', mainline.cards === 24, `实际 ${mainline.cards}`);
  check('主线 9 个突破点高亮', mainline.breakthroughs === 9, `实际 ${mainline.breakthroughs}`);
  check('主线背景事件刻度（体量感）', mainline.marks >= 60, `${mainline.marks} 个`);
  check('主线无横向溢出', mainline.scrollWidth <= mainline.innerWidth + 1);
  await mainPage.screenshot({ path: path.join(OUT_DIR, 'm26-mainline.png') });

  // 仅看突破点
  const toggle = await mainPage.$('.mainline-toggle');
  if (toggle) {
    await toggle.click();
    await delays(400);
    const afterToggle = await mainPage.$$eval('.ml-card', (nodes) => nodes.length);
    check('仅看突破点后剩 9 张卡', afterToggle === 9, `实际 ${afterToggle}`);
    await mainPage.screenshot({ path: path.join(OUT_DIR, 'm26-mainline-breakthrough.png') });
    await toggle.click();
    await delays(300);
  }
  // 卡片 → 抽屉
  await mainPage.click('.ml-card');
  await delays(500);
  check('主线卡片打开详情抽屉', (await mainPage.$('.drawer-panel')) !== null);
  await mainPage.keyboard.press('Escape');
  await delays(300);
  // 背景刻度 → 抽屉
  const markCount = await mainPage.$$eval('.ml-marks button', (nodes) => nodes.length);
  if (markCount > 0) {
    await mainPage.click('.ml-marks button');
    await delays(500);
    check('背景刻度打开详情抽屉', (await mainPage.$('.drawer-panel')) !== null);
    await mainPage.keyboard.press('Escape');
    await delays(300);
  }
  // 背景事件展开标题
  const expandToggle = await mainPage.$('.ml-background-toggle');
  if (expandToggle) {
    await expandToggle.click();
    await delays(400);
    const bg = await mainPage.evaluate(() => ({
      open: document.querySelector('.ml-background-toggle')?.getAttribute('aria-expanded') === 'true',
      items: document.querySelectorAll('.ml-background-item').length,
      first: document.querySelector('.ml-background-item')?.textContent?.trim() ?? '',
    }));
    check('背景事件可展开且标题可见', bg.open && bg.items > 0 && bg.first.length > 0, JSON.stringify({ items: bg.items, first: bg.first.slice(0, 24) }));
    await mainPage.screenshot({ path: path.join(OUT_DIR, 'm26-mainline-expanded.png') });
    await mainPage.click('.ml-background-item');
    await delays(400);
    check('背景事件标题可点开详情', (await mainPage.$('.drawer-panel')) !== null);
    await mainPage.keyboard.press('Escape');
    await delays(300);
  }
  check('主线无 console/page error', mainErrors.length === 0, mainErrors.slice(0, 2).join(' | '));

  /* ---------------- M2.6：章节/主题页（全部事件 + 本章时间轴/图谱） ---------------- */
  await mainPage.click('.ml-chapter-open');
  await mainPage.waitForSelector('.chapter-row', { timeout: 15000 });
  await delays(600);
  const chapterPage = await mainPage.evaluate(() => ({
    hash: location.hash,
    rows: document.querySelectorAll('.chapter-row').length,
    firstTitle: document.querySelector('.chapter-row-title')?.textContent?.trim() ?? '',
    tabs: document.querySelectorAll('.chapter-tab').length,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  check('章节页展示全部事件且标题可见', chapterPage.rows >= 15 && chapterPage.firstTitle.length > 0 && chapterPage.tabs === 3, JSON.stringify({ rows: chapterPage.rows, first: chapterPage.firstTitle.slice(0, 20) }));
  await mainPage.screenshot({ path: path.join(OUT_DIR, 'm26-chapter.png') });
  await mainPage.click('.chapter-row');
  await delays(400);
  check('章节页事件可打开详情', (await mainPage.$('.drawer-panel')) !== null);
  await mainPage.keyboard.press('Escape');
  await delays(300);
  const tabButtons = await mainPage.$$('.chapter-tab');
  if (tabButtons[1]) {
    await tabButtons[1].click();
    await mainPage.waitForSelector('.tl-block', { timeout: 20000 });
    await delays(800);
    check('章节页可切「本章时间轴」', (await mainPage.$('.tl-block')) !== null);
  }
  if (tabButtons[2]) {
    await tabButtons[2].click();
    await mainPage.waitForSelector('.im-root', { timeout: 20000 });
    await delays(900);
    check('章节页可切「本章影响图谱」', (await mainPage.$('.im-root')) !== null);
    await mainPage.screenshot({ path: path.join(OUT_DIR, 'm26-chapter-graph.png') });
  }

  /* ---------------- M2.5：思想看板 ---------------- */
  const thoughts = await browser.newPage();
  await thoughts.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const thoughtErrors = [];
  thoughts.on('pageerror', (error) => thoughtErrors.push(error.message));
  thoughts.on('console', (message) => {
    if (message.type() === 'error') thoughtErrors.push(message.text());
  });
  await thoughts.goto(`${BASE}/#/thoughts`, { waitUntil: 'networkidle0', timeout: 20000 });
  await thoughts.waitForSelector('.tb-board', { timeout: 15000 });
  await delays(600);
  const board = await thoughts.evaluate(() => ({
    themes: document.querySelectorAll('.tb-theme').length,
    filters: document.querySelectorAll('.tb-filter-chip').length,
    cards: document.querySelectorAll('.tb-card').length,
    quotes: document.querySelectorAll('.tb-quote-block').length,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  check('思想看板 7 个主题', board.themes === 7, JSON.stringify(board));
  check('思想看板主题筛选条（全部 + 7 主题）', board.filters === 8, `${board.filters} 个`);
  check('思想看板观点卡 ≥16', board.cards >= 16, `${board.cards} 张`);
  await thoughts.screenshot({ path: path.join(OUT_DIR, 'm26-thoughts.png') });

  // 主题筛选
  const filterButtons = await thoughts.$$('.tb-filter-chip');
  if (filterButtons[1]) {
    await filterButtons[1].click();
    await delays(400);
    const filteredThemes = await thoughts.$$eval('.tb-theme', (nodes) => nodes.length);
    check('主题筛选可收窄到单个主题', filteredThemes === 1, `${filteredThemes} 个`);
    await thoughts.screenshot({ path: path.join(OUT_DIR, 'm26-thoughts-filtered.png') });
    await filterButtons[0].click();
    await delays(300);
  }
  // 展开原文
  const quoteToggle = await thoughts.$('.tb-quote-toggle');
  if (quoteToggle) {
    await quoteToggle.click();
    await delays(300);
    const expanded = await thoughts.evaluate(() => ({
      blocks: document.querySelectorAll('.tb-quote.is-expanded').length,
      aria: document.querySelector('.tb-quote-toggle')?.getAttribute('aria-expanded') === 'true',
    }));
    check('原文可展开（思想优先、原文降级）', expanded.blocks > 0 && expanded.aria, JSON.stringify(expanded));
  }
  await thoughts.click('.tb-card');
  await delays(500);
  check('思想卡片打开详情抽屉', (await thoughts.$('.drawer-panel')) !== null);
  await thoughts.keyboard.press('Escape');
  await delays(300);
  check('思想看板无 console/page error', thoughtErrors.length === 0, thoughtErrors.slice(0, 2).join(' | '));

  /* ---------------- M2.5：全量数据（tab 切换 + 旧链接兼容） ---------------- */
  const explore = await browser.newPage();
  await explore.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await explore.goto(`${BASE}/#/timeline?entry=chatgpt-2022`, { waitUntil: 'networkidle0', timeout: 20000 });
  await delays(800);
  const legacy = await explore.evaluate(() => ({
    hash: location.hash,
    hasCanvas: !!document.querySelector('.tl-block'),
    hasDrawer: !!document.querySelector('.drawer-panel'),
  }));
  check('旧深链 #/timeline 兼容并保留详情', legacy.hasCanvas && legacy.hasDrawer, JSON.stringify(legacy));
  // 关掉抽屉遮罩，否则会拦截下方 tab 点击
  await explore.keyboard.press('Escape');
  await delays(400);
  const graphTab = await explore.$('.explore-tabs .explore-tab:nth-child(2)');
  if (graphTab) {
    await graphTab.click();
    await explore.waitForSelector('.im-root', { timeout: 15000 });
    await delays(800);
    const exploreGraph = await explore.evaluate(() => location.hash);
    check('全量数据可切到影响图谱', exploreGraph.includes('mode=graph'), exploreGraph);
    await explore.screenshot({ path: path.join(OUT_DIR, 'm25-explore-graph.png') });
  }

  /* ---------------- M2.5：移动端主线/看板 ---------------- */
  const mainMobile = await browser.newPage();
  await mainMobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mainMobile.goto(`${BASE}/#/mainline`, { waitUntil: 'networkidle0', timeout: 20000 });
  await mainMobile.waitForSelector('.ml-card', { timeout: 15000 });
  await delays(600);
  const mobileMain = await mainMobile.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    cards: document.querySelectorAll('.ml-card').length,
    cardsPerRow: (() => {
      const cards = Array.from(document.querySelectorAll('.ml-card'));
      if (cards.length < 2) return 1;
      const tops = cards.slice(0, 6).map((card) => Math.round(card.getBoundingClientRect().top));
      return tops.filter((top) => top === tops[0]).length;
    })(),
  }));
  check('移动端主线单列且无溢出', mobileMain.scrollWidth <= 391 && mobileMain.cardsPerRow === 1, JSON.stringify(mobileMain));
  await mainMobile.screenshot({ path: path.join(OUT_DIR, 'm26-mainline-mobile.png'), fullPage: false });
  await mainMobile.close();

  const thoughtsMobile = await browser.newPage();
  await thoughtsMobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await thoughtsMobile.goto(`${BASE}/#/thoughts`, { waitUntil: 'networkidle0', timeout: 20000 });
  await thoughtsMobile.waitForSelector('.tb-board', { timeout: 15000 });
  await delays(600);
  const mobileThoughts = await thoughtsMobile.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    chains: document.querySelectorAll('.tb-theme').length,
  }));
  check('移动端思想看板无横向溢出', mobileThoughts.scrollWidth <= 391, JSON.stringify(mobileThoughts));
  await thoughtsMobile.screenshot({ path: path.join(OUT_DIR, 'm26-thoughts-mobile.png') });
  await thoughtsMobile.close();

  await mainPage.close();
  await thoughts.close();
  await explore.close();

} finally {
  await browser.close();
}

const failed = results.filter((item) => !item.passed);
console.log(`\n结果：${results.length - failed.length}/${results.length} 通过`);
if (failed.length > 0) {
  console.log('失败项：', failed.map((item) => item.name).join('、'));
  process.exitCode = 1;
}
