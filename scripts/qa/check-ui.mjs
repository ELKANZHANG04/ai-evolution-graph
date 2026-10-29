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
  check('时间轴渲染 22 个块', blockCount === 22, `实际 ${blockCount}`);

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
} finally {
  await browser.close();
}

const failed = results.filter((item) => !item.passed);
console.log(`\n结果：${results.length - failed.length}/${results.length} 通过`);
if (failed.length > 0) {
  console.log('失败项：', failed.map((item) => item.name).join('、'));
  process.exitCode = 1;
}
