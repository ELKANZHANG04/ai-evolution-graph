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
    check('奠基时代可展开（10–12 条简述）', items >= 10 && items <= 12, `${items} 条`);
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
    '主导航 5 项（含「我的灵感」星标区）',
    navItems.length === 5 &&
      navItems.join('|').includes('主线') &&
      navItems.join('|').includes('我的灵感') &&
      !navItems.join('').includes('全量数据'),
    navItems.join('/'),
  );
  const chapterOpeners = await mainPage.$$eval('.ml-chapter-open', (nodes) => nodes.length);
  check('主线 5 个章节入口（可点进看全部事件）', chapterOpeners === 5, `${chapterOpeners} 个`);
  check('主线 5 章', mainline.chapters === 5, JSON.stringify(mainline));
  check('主线里程碑数量在容量内（≥24）', mainline.cards >= 24 && mainline.cards <= 32, `实际 ${mainline.cards}`);
  check('主线 9 个突破点高亮', mainline.breakthroughs === 9, `实际 ${mainline.breakthroughs}`);
  check('主线背景事件刻度（体量感）', mainline.marks >= 50, `${mainline.marks} 个`);
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
  // ---------- 默认：思维导图视图（每个主题一张） ----------
  const mapInfo = await thoughts.evaluate(() => ({
    maps: document.querySelectorAll('.mm').length,
    roots: document.querySelectorAll('.mm-root').length,
    branches: document.querySelectorAll('.mm-branch').length,
    leaves: document.querySelectorAll('.mm-leaf').length,
    edges: document.querySelectorAll('.mm-edge').length,
    zoomValue: document.querySelector('.mm-zoom-value')?.textContent?.trim() ?? '',
    viewButtons: [...document.querySelectorAll('.tb-view-btn')].map((b) => b.textContent?.trim() ?? ''),
    horizontalScrollMaps: [...document.querySelectorAll('.mm-scroll')].filter((n) => n.scrollWidth > n.clientWidth + 2).length,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  check('每个主题一张思维导图（11 张）', mapInfo.maps === 11 && mapInfo.roots === 11, JSON.stringify(mapInfo));
  check('导图有根 → 子方向 → 思想三层结构', mapInfo.branches >= 30 && mapInfo.leaves === 90 && mapInfo.edges > mapInfo.leaves, JSON.stringify({ branches: mapInfo.branches, leaves: mapInfo.leaves, edges: mapInfo.edges }));
  check('导图默认视图 + 可切换看板', mapInfo.viewButtons.join('/') === '思维导图/看板', mapInfo.viewButtons.join('/'));

  // 分支内时间倒序（同一行从左到右最新在前）
  const branchOrder = await thoughts.evaluate(() => {
    const rows = [...document.querySelectorAll('.mm-paper')].flatMap((paper) => {
      const leaves = [...paper.querySelectorAll('.mm-leaf')];
      const byTop = new Map();
      for (const leaf of leaves) {
        const top = leaf.closest('div[style*="position: absolute"]')?.style.top ?? '';
        const list = byTop.get(top) ?? [];
        list.push(leaf);
        byTop.set(top, list);
      }
      return [...byTop.values()].map((list) =>
        list
          .map((leaf) => ({ x: parseFloat(leaf.closest('div[style*="position: absolute"]')?.style.left ?? '0'), date: leaf.getAttribute('data-date') ?? '' }))
          .sort((a, b) => a.x - b.x)
          .map((item) => item.date),
      );
    });
    return rows.every((dates) => dates.every((date, index) => index === 0 || dates[index - 1] >= date));
  });
  check('导图每个子方向内按时间倒序', branchOrder);

  // 默认 100% 截图（能看到根/分支/首行节点）
  await thoughts.screenshot({ path: path.join(OUT_DIR, 'thoughts-v4.png') });

  // 缩放：点 + 后百分比变化；再点「适配」看整张导图
  const mapZoomBefore = mapInfo.zoomValue;
  await thoughts.click('.mm-zoom-btn:last-of-type');
  await delays(300);
  const mapZoomAfter = await thoughts.$eval('.mm-zoom-value', (node) => node.textContent?.trim() ?? '');
  check('导图缩放按钮生效', mapZoomBefore !== mapZoomAfter, `${mapZoomBefore} → ${mapZoomAfter}`);
  await thoughts.click('.mm-zoom-btn.is-fit');
  await delays(300);
  await thoughts.screenshot({ path: path.join(OUT_DIR, 'thoughts-v4-fit.png') });

  // 主题筛选：收窄到单个主题（只保留一张导图）
  await (await thoughts.$$('.tb-filter-chip'))[1].click();
  await delays(400);
  const filteredMaps = await thoughts.$$eval('.mm', (nodes) => nodes.length);
  check('主题筛选可收窄到单个导图', filteredMaps === 1, `${filteredMaps} 张`);
  await thoughts.screenshot({ path: path.join(OUT_DIR, 'm4-thoughts-filtered.png') });
  await (await thoughts.$$('.tb-filter-chip'))[0].click();
  await delays(400);

  // 导图节点 → 详情
  await thoughts.click('.mm-leaf');
  await delays(500);
  check('导图节点打开详情抽屉', (await thoughts.$('.drawer-panel')) !== null);
  await thoughts.keyboard.press('Escape');
  await delays(300);

  // ---------- 看板视图（保留信息量） ----------
  await (await thoughts.$$('.tb-view-btn'))[1].click();
  await delays(500);
  const board = await thoughts.evaluate(() => ({
    themes: document.querySelectorAll('.tb-theme').length,
    filters: document.querySelectorAll('.tb-filter-chip').length,
    cards: document.querySelectorAll('.tb-card').length,
    importance: document.querySelectorAll('.tb-card .badge-importance').length,
    typeBadges: document.querySelectorAll('.tb-card .badge-type').length,
    tracks: document.querySelectorAll('.tb-track').length,
    roleBadges: document.querySelectorAll('.tb-role-badge, .tb-arrow').length,
    statusBadges: document.querySelectorAll('.tb-theme-status, .tb-status-dot').length,
    radarBadges: document.querySelectorAll('.tb-radar-badge').length,
    pins: document.querySelectorAll('.tb-pin').length,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  check('看板视图：11 主题 / 12 筛选 / 90 卡', board.themes === 11 && board.filters === 12 && board.cards === 90, JSON.stringify(board));
  check('看板卡片与主线同标：类型 + 贡献度', board.importance === board.cards && board.typeBadges === board.cards, JSON.stringify({ importance: board.importance, type: board.typeBadges }));
  check('已删除角色/活跃度/雷达徽标', board.roleBadges === 0 && board.statusBadges === 0 && board.radarBadges === 0 && board.pins === 0, JSON.stringify({ role: board.roleBadges, status: board.statusBadges, radar: board.radarBadges, pins: board.pins }));
  check('看板无横向溢出', board.scrollWidth <= 1442, `${board.scrollWidth}`);
  await thoughts.screenshot({ path: path.join(OUT_DIR, 'thoughts-board.png') });

  const boardOrder = await thoughts.evaluate(() => {
    const themes = [...document.querySelectorAll('.tb-theme')].map((theme) => {
      const dates = [...theme.querySelectorAll('.tb-card')].map((card) => card.getAttribute('data-date') ?? '');
      return dates.every((date, index) => index === 0 || dates[index - 1] >= date);
    });
    return themes.every(Boolean);
  });
  check('看板每个主题按时间倒序', boardOrder);

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
    maps: document.querySelectorAll('.mm').length,
    mobileRows: document.querySelectorAll('.mm-mobile-row').length,
    canvasVisible: (() => {
      const node = document.querySelector('.mm-scroll');
      if (!node) return null;
      return window.getComputedStyle(node).display !== 'none';
    })(),
  }));
  check(
    '移动端导图降级为分支分组列表且无横向溢出',
    mobileThoughts.scrollWidth <= 391 && mobileThoughts.maps === 11 && mobileThoughts.mobileRows === 90 && mobileThoughts.canvasVisible === false,
    JSON.stringify(mobileThoughts),
  );
  await thoughtsMobile.screenshot({ path: path.join(OUT_DIR, 'm26-thoughts-mobile.png') });
  await thoughtsMobile.close();

  await mainPage.close();
  await thoughts.close();
  await explore.close();


  /* ---------------- M3：最新动态 ---------------- */
  const feed = await browser.newPage();
  await feed.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const feedErrors = [];
  feed.on('pageerror', (error) => feedErrors.push(error.message));
  feed.on('console', (message) => {
    if (message.type() === 'error') feedErrors.push(message.text());
  });
  await feed.goto(`${BASE}/#/feed`, { waitUntil: 'networkidle0', timeout: 20000 });
  await feed.waitForSelector('.feed-page', { timeout: 15000 });
  await delays(700);
  const feedInfo = await feed.evaluate(() => ({
    sections: Array.from(document.querySelectorAll('.feed-section-title')).map((node) =>
      (node.textContent ?? '').replace(/\s+/g, ' ').trim(),
    ),
    tabs: document.querySelectorAll('.feed-tab').length,
    cards: document.querySelectorAll('.feed-card').length,
    importance: document.querySelectorAll('.feed-card .badge-importance').length,
    types: document.querySelectorAll('.feed-card .badge-type').length,
    innovationBadges: document.querySelectorAll('.feed-innovation-badge').length,
  }));
  check(
    '最新动态不再按事件/思想拆栏（单一「最近入库」流）',
    feedInfo.sections.length === 1 && feedInfo.sections[0].includes('最近入库'),
    feedInfo.sections.join(' | '),
  );
  check('最新动态已删除时间窗 tab', feedInfo.tabs === 0, `${feedInfo.tabs} 个`);
  check('最新动态只展示最近 5 天入库（有卡片）', feedInfo.cards >= 1, `${feedInfo.cards} 张`);
  check(
    '最新动态与主线一致：类型 + 贡献度（影响力分数）',
    feedInfo.importance === feedInfo.cards && feedInfo.types === feedInfo.cards && feedInfo.importance > 0,
    JSON.stringify({ importance: feedInfo.importance, types: feedInfo.types, cards: feedInfo.cards }),
  );
  check(
    '创新雷达以内联中性标签出现（不单独成栏、不抢焦点）',
    feedInfo.innovationBadges <= feedInfo.cards,
    `${feedInfo.innovationBadges} 个`,
  );
  const feedFreshness = await feed.evaluate(() => {
    const cutoff = new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const dates = Array.from(document.querySelectorAll('.feed-card')).map(
      (card) => card.getAttribute('data-date') ?? '',
    );
    return {
      cutoff,
      allFresh: dates.every((date) => date >= cutoff),
      descending: dates.every((date, index) => index === 0 || dates[index - 1] >= date),
      minDate: dates.slice().sort()[0] ?? '',
    };
  });
  check(
    '最新动态只保留近半年事件且按时间倒序',
    feedFreshness.allFresh && feedFreshness.descending,
    JSON.stringify({ cutoff: feedFreshness.cutoff, oldest: feedFreshness.minDate, desc: feedFreshness.descending }),
  );
  const feedForbidden = await feed.evaluate(() => {
    const text = document.body.textContent ?? '';
    return {
      candidate: text.includes('候选晋升'),
      window: text.includes('7 天') || text.includes('30 天'),
      split: text.includes('新入库 · 事件') || text.includes('新入库 · 思想'),
      tabs: document.querySelectorAll('.feed-tab').length,
    };
  });
  check(
    '已删除候选晋升池 / 时间窗 / 事件思想拆栏',
    !feedForbidden.candidate && !feedForbidden.window && !feedForbidden.split && feedForbidden.tabs === 0,
    JSON.stringify(feedForbidden),
  );
  await feed.screenshot({ path: path.join(OUT_DIR, 'feed-v3.png') });
  await feed.click('.feed-card');
  await delays(500);
  check('最新动态卡片打开详情抽屉', (await feed.$('.drawer-panel')) !== null);
  await feed.keyboard.press('Escape');
  await delays(300);
  check('最新动态无 console/page error', feedErrors.length === 0, feedErrors.slice(0, 2).join(' | '));

  /* ---------------- M4：我的灵感（星标 + 自动联系） ---------------- */
  const stars = await browser.newPage();
  await stars.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  const starErrors = [];
  stars.on('pageerror', (error) => starErrors.push(error.message));
  stars.on('console', (message) => {
    if (message.type() === 'error') starErrors.push(message.text());
  });
  await stars.goto(`${BASE}/#/feed`, { waitUntil: 'networkidle0', timeout: 20000 });
  await stars.waitForSelector('.feed-card', { timeout: 15000 });
  await delays(400);
  await stars.click('.feed-card .star-btn');
  await delays(300);
  const starredFromFeed = await stars.evaluate(() => ({
    stored: (() => {
      try {
        return JSON.parse(localStorage.getItem('aeg.stars.v1') ?? '[]');
      } catch {
        return [];
      }
    })(),
    active: document.querySelector('.feed-card .star-btn')?.getAttribute('aria-pressed') ?? 'false',
  }));
  check(
    '最新动态卡片可加星并写入本地',
    Array.isArray(starredFromFeed.stored) && starredFromFeed.stored.length === 1 && starredFromFeed.active === 'true',
    JSON.stringify(starredFromFeed),
  );

  // 注入两条有自动联系的星标，验证「我的灵感」页与自动连线
  await stars.evaluate(() => {
    localStorage.setItem(
      'aeg.stars.v1',
      JSON.stringify(['gemini-4-carbon-2026', 'google-gemini-1b-users-2026']),
    );
  });
  // hash 导航不会重建模块缓存，直接改 hash 后 reload，模拟用户刷新进入
  await stars.evaluate(() => {
    location.hash = '#/stars';
  });
  await stars.reload({ waitUntil: 'networkidle0', timeout: 20000 });
  await stars.waitForSelector('.stars-page', { timeout: 15000 });
  await delays(500);
  const starsPage = await stars.evaluate(() => ({
    cards: document.querySelectorAll('.stars-card').length,
    nodes: document.querySelectorAll('.stars-node').length,
    edges: document.querySelectorAll('.stars-edge').length,
    links: document.querySelectorAll('.stars-link').length,
    stats: [...document.querySelectorAll('.stars-stats dd')].map((node) => node.textContent?.trim()),
  }));
  check(
    '「我的灵感」展示星标与统计',
    starsPage.cards === 2 && starsPage.nodes === 2 && starsPage.links >= 1,
    JSON.stringify(starsPage),
  );
  check(
    '星标之间自动产生联系（连线 + 理由）',
    starsPage.edges >= 1 && starsPage.stats[1] !== '0',
    JSON.stringify({ edges: starsPage.edges, stats: starsPage.stats }),
  );

  // 刷新后仍保留
  await stars.reload({ waitUntil: 'networkidle0' });
  await delays(400);
  const persisted = await stars.$$eval('.stars-card', (nodes) => nodes.length);
  check('星标在本机浏览器持久保存（刷新后仍在）', persisted === 2, `${persisted} 张`);
  await stars.screenshot({ path: path.join(OUT_DIR, 'stars-v1.png') });

  // 取消星标
  await stars.click('.stars-card .star-btn');
  await delays(300);
  const afterRemove = await stars.$$eval('.stars-card', (nodes) => nodes.length);
  check('取消星标后从列表移除', afterRemove === 1, `${afterRemove} 张`);

  // 抽屉里也能加星
  await stars.goto(`${BASE}/#/feed?entry=gemini-4-carbon-2026`, { waitUntil: 'networkidle0' });
  await delays(500);
  const drawerStar = await stars.evaluate(() => ({
    exists: document.querySelector('.drawer-panel .star-btn') !== null,
    pressed: document.querySelector('.drawer-panel .star-btn')?.getAttribute('aria-pressed') ?? '',
  }));
  check('详情抽屉内也可加星（状态同步）', drawerStar.exists, JSON.stringify(drawerStar));

  // 清理测试数据，避免污染用户本地
  await stars.evaluate(() => localStorage.removeItem('aeg.stars.v1'));
  check('我的灵感无 console/page error', starErrors.length === 0, starErrors.slice(0, 2).join(' | '));
  await stars.close();

  /* ---------------- M3：全局搜索 ---------------- */
  const search = await browser.newPage();
  await search.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const searchErrors = [];
  search.on('pageerror', (error) => searchErrors.push(error.message));
  search.on('console', (message) => {
    if (message.type() === 'error') searchErrors.push(message.text());
  });
  await search.goto(`${BASE}/#/search?q=transformer`, { waitUntil: 'networkidle0', timeout: 20000 });
  await search.waitForSelector('.search-result', { timeout: 15000 });
  await delays(600);
  const searchInfo = await search.evaluate(() => ({
    results: document.querySelectorAll('.search-result').length,
    marks: document.querySelectorAll('.search-result-snippet mark').length,
    input: document.querySelector('.search-input')?.value ?? '',
    stats: document.querySelector('.search-stats')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  }));
  check('搜索 q=transformer 有结果且高亮', searchInfo.results >= 10 && searchInfo.marks > 0 && searchInfo.input === 'transformer', JSON.stringify({ results: searchInfo.results, marks: searchInfo.marks }));
  check('搜索结果统计（条数/耗时）', /条结果/.test(searchInfo.stats), searchInfo.stats.slice(0, 40));
  await search.screenshot({ path: path.join(OUT_DIR, 'm3-search.png') });
  await search.click('.search-result');
  await delays(500);
  check('搜索结果打开详情抽屉', (await search.$('.drawer-panel')) !== null);
  await search.keyboard.press('Escape');
  await delays(300);
  // 组合筛选（URL 驱动）
  await search.goto(`${BASE}/#/search?q=transformer&cat=model`, { waitUntil: 'networkidle0' });
  await delays(700);
  const filtered = await search.evaluate(() => ({
    results: document.querySelectorAll('.search-result').length,
    activeCats: document.querySelectorAll('.search-cat.is-active, .search-cats .is-active').length,
  }));
  check('搜索可组合类别筛选（结果收窄）', filtered.results > 0 && filtered.results < searchInfo.results, JSON.stringify(filtered));
  // 空结果
  await search.goto(`${BASE}/#/search?q=zzzzzz`, { waitUntil: 'networkidle0' });
  await delays(700);
  check('搜索无结果有空态', (await search.$('.search-empty')) !== null);
  check('搜索无 console/page error', searchErrors.length === 0, searchErrors.slice(0, 2).join(' | '));

  /* ---------------- M3：页头搜索入口 + `/` 快捷键 ---------------- */
  const header = await browser.newPage();
  await header.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await header.goto(`${BASE}/#/mainline`, { waitUntil: 'networkidle0', timeout: 20000 });
  await delays(600);
  await header.keyboard.press('/');
  await delays(200);
  const shortcut = await header.evaluate(() => document.activeElement?.className ?? '');
  check('按 / 聚焦页头搜索框', shortcut.includes('header-search-input'), shortcut);
  await header.type('.header-search-input', 'transformer');
  await header.keyboard.press('Enter');
  await header.waitForSelector('.search-result', { timeout: 15000 });
  await delays(500);
  const headerSearch = await header.evaluate(() => ({
    hash: location.hash,
    input: document.querySelector('.search-input')?.value ?? '',
  }));
  check('页头搜索跳转并同步关键词', headerSearch.hash.includes('#/search?q=transformer') && headerSearch.input === 'transformer', JSON.stringify(headerSearch));

  await feed.close();
  await search.close();
  await header.close();

} finally {
  await browser.close();
}

const failed = results.filter((item) => !item.passed);
console.log(`\n结果：${results.length - failed.length}/${results.length} 通过`);
if (failed.length > 0) {
  console.log('失败项：', failed.map((item) => item.name).join('、'));
  process.exitCode = 1;
}
