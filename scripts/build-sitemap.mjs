/**
 * 构建后 SEO 产物生成（dist/ 下）：
 *   - robots.txt
 *   - sitemap.xml
 *   - 若 site.config.json 配置了 siteUrl，则把 canonical / og:url / og:image 注入 dist/index.html
 *
 * 用法：node scripts/build-sitemap.mjs
 * 站点上线后把公网地址填进 site.config.json 的 siteUrl，再重新 npm run build 即可。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const configPath = path.join(ROOT, 'site.config.json');

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return {};
  }
}

function todayISO() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
}

function main() {
  if (!fs.existsSync(DIST)) {
    console.warn('[seo] dist/ 不存在，请先 npm run build');
    return;
  }
  const config = readConfig();
  const siteUrl = (config.siteUrl || '').trim().replace(/\/+$/, '');
  const lastmod = todayISO();

  // robots.txt
  const robotsLines = ['User-agent: *', 'Allow: /', ''];
  if (siteUrl) robotsLines.push(`Sitemap: ${siteUrl}/sitemap.xml`, '');
  fs.writeFileSync(path.join(DIST, 'robots.txt'), robotsLines.join('\n'), 'utf8');

  // sitemap.xml：入口页 + /p/** 静态内容页（主线/思想/动态/关于/每条条目）
  const pDir = path.join(DIST, 'p');
  const pRoutes = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, item.name);
      if (item.isDirectory()) walk(abs);
      else if (item.name === 'index.html') {
        const route = path.relative(DIST, abs).replace(/index\.html$/, '').replaceAll(path.sep, '/');
        pRoutes.push(route);
      }
    }
  }
  walk(pDir);
  const urls = [
    { loc: siteUrl ? `${siteUrl}/` : '/', priority: '1.0' },
    ...pRoutes
      .sort()
      .map((route) => ({
        loc: siteUrl ? `${siteUrl}/${route.replace(/^\/+/, '')}` : `/${route.replace(/^\/+/, '')}`,
        priority: route.startsWith('p/entry/') ? '0.8' : '0.9',
      })),
  ];
  if (siteUrl) {
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map(
        (item) => `  <url><loc>${item.loc}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>${item.priority}</priority></url>`,
      ),
      '</urlset>',
      '',
    ];
    fs.writeFileSync(path.join(DIST, 'sitemap.xml'), lines.join('\n'), 'utf8');
    console.log(`[seo] 已生成 sitemap.xml（${urls.length} 个 URL，含 ${pRoutes.length} 个静态内容页）与 robots.txt`);
  } else {
    console.log('[seo] 已生成 robots.txt；site.config.json 的 siteUrl 为空 → 未生成 sitemap.xml');
    console.log('[seo] 部署拿到公网地址后，把它填进 site.config.json 再 npm run build');
  }

  // 注入 canonical / og:url / og:image
  const indexPath = path.join(DIST, 'index.html');
  if (siteUrl && fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    const inject = [
      `<link rel="canonical" href="${siteUrl}/" />`,
      `<meta property="og:url" content="${siteUrl}/" />`,
      `<meta property="og:image" content="${siteUrl}/og-image.png" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
    ].join('\n    ');
    if (!html.includes('rel="canonical"')) {
      html = html.replace('</head>', `  ${inject}\n  </head>`);
      fs.writeFileSync(indexPath, html, 'utf8');
      console.log('[seo] 已注入 canonical / og:url / og:image');
    }
  }
}

main();
