/**
 * 百度搜索资源平台「普通收录」主动推送（可选）。
 *
 * 用法：
 *   BAIDU_TOKEN=你的token npm run seo:push
 *   或先构建再运行：npm run build && BAIDU_TOKEN=... npm run seo:push
 *
 * token 获取：百度搜索资源平台 → 用户中心 → 站点管理 → 普通收录 → 主动推送 → 准入密钥。
 * 注意：token 属于密钥，不要提交到 Git；放到环境变量或本地命令行即可。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const sitemapPath = path.join(ROOT, 'dist', 'sitemap.xml');
const configPath = path.join(ROOT, 'site.config.json');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const site = (config.siteUrl || '').trim().replace(/\/+$/, '');
const token = process.env.BAIDU_TOKEN || '';

if (!site) {
  console.error('[baidu] site.config.json 的 siteUrl 为空，请先填公网地址');
  process.exit(1);
}
if (!fs.existsSync(sitemapPath)) {
  console.error('[baidu] 找不到 dist/sitemap.xml，请先 npm run build');
  process.exit(1);
}
if (!token) {
  console.log('[baidu] 未设置 BAIDU_TOKEN，跳过推送。');
  console.log('  获取方式：百度搜索资源平台 → 站点管理 → 普通收录 → 主动推送 → 准入密钥');
  console.log('  执行：BAIDU_TOKEN=你的token npm run seo:push');
  process.exit(0);
}

const urls = [...fs.readFileSync(sitemapPath, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (urls.length === 0) {
  console.error('[baidu] sitemap 中没有 URL');
  process.exit(1);
}
console.log(`[baidu] 准备推送 ${urls.length} 个 URL 到 ${site}`);

const endpoint = `http://data.zz.baidu.com/urls?site=${encodeURIComponent(site)}&token=${encodeURIComponent(token)}`;
try {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: urls.join('\n'),
  });
  const text = await response.text();
  console.log(`[baidu] HTTP ${response.status}: ${text}`);
  if (!response.ok) process.exitCode = 1;
} catch (error) {
  console.error('[baidu] 推送失败：', error.message);
  process.exitCode = 1;
}
