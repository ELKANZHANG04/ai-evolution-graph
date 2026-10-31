/**
 * 构建期 AI 语义层（可选）：用智谱 GLM-4.7-Flash（免费）为每个条目提取
 * 主题 / 核心思想 / 关键词，写入 src/generated/ai-links.json。
 *
 * 用法：
 *   ZHIPU_API_KEY=xxx npm run ai:links
 *
 * 未配置 key 时自动跳过（不影响构建）；API 失败时保留已完成部分并正常退出。
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadEntries, ROOT } from './lib/load-entries';
import type { Entry } from '../src/lib/types';

const ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const MODEL = process.env.AI_MODEL ?? 'glm-4.7-flash';
const BATCH_SIZE = 8;
const CONCURRENCY = 2;
const MAX_RETRIES = 1;
/** 整体时间预算：免费 API 慢/限流时不拖垮 CI，超出后保留已生成部分 */
const TIME_BUDGET_MS = 5 * 60 * 1000;

/** 受控主题词表：强制模型复用同一套主题，避免每条内容自创主题导致无法匹配 */
export const CANONICAL_THEMES = [
  '智能体与自动化',
  '语音与实时交互',
  '多模态与视觉',
  '开源与权重',
  '模型架构与训练',
  '推理时计算',
  '评测与安全',
  '对齐与治理',
  '世界模型与具身',
  '国产算力与芯片',
  '搜索与推荐',
  '办公与生产力',
  '长上下文与记忆',
  '资本市场与商业化',
  '政策与监管',
  '历史与思想',
  '产品与终端',
  '其他',
] as const;
const GENERATED_DIR = path.join(ROOT, 'src', 'generated');
const OUTPUT = path.join(GENERATED_DIR, 'ai-links.json');

interface AiEntryLink {
  core: string;
  themes: string[];
  keywords: string[];
}

type AiLinkMap = Record<string, AiEntryLink>;

function readExisting(): AiLinkMap {
  try {
    const raw = JSON.parse(fs.readFileSync(OUTPUT, 'utf8'));
    return typeof raw === 'object' && raw !== null ? (raw as AiLinkMap) : {};
  } catch {
    return {};
  }
}

const SYSTEM_PROMPT = `你是 AI 技术史编辑。用户会给一批 AI 条目（标题/摘要/标签/日期）。
请为每个条目提取：
- core：一句话概括这条内容真正在讨论的“思想内核”（不超过 30 字）
- themes：2-4 个跨条目的抽象主题（如：推理时计算、全双工交互、国产算力、Agent 长期记忆、模型开源、评测与安全）——用简短中文名词
- keywords：4-6 个可与其他条目产生关联的关键词（公司/模型/方法/问题，尽量具体）
只输出 JSON：{"items":[{"id":"...","core":"...","themes":["..."],"keywords":["..."]}]}，不要解释。`;

function compressEntry(entry: Entry): Record<string, unknown> {
  return {
    id: entry.id,
    title: entry.title,
    date: entry.date,
    type: entry.type,
    categories: entry.categories,
    tags: entry.tags,
    summary: entry.summary.slice(0, 220),
    thought_chain: entry.thought_chain,
  };
}

function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/g, '').trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function callModel(apiKey: string, batch: Entry[]): Promise<AiLinkMap> {
  const body = {
    model: MODEL,
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify({ items: batch.map(compressEntry) }) },
    ],
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
    }
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content ?? '';
    const parsed = extractJson(content) as { items?: unknown } | null;
    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    const result: AiLinkMap = {};
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const record = item as Record<string, unknown>;
      const id = typeof record.id === 'string' ? record.id : '';
      if (!id) continue;
      const canonical = new Set<string>(CANONICAL_THEMES);
      const themes = Array.isArray(record.themes)
        ? record.themes
            .filter((t): t is string => typeof t === 'string')
            .map((t) => t.trim())
            .filter((t) => canonical.has(t))
            .slice(0, 3)
        : [];
      result[id] = {
        core: typeof record.core === 'string' ? record.core.slice(0, 80) : '',
        themes: themes.length > 0 ? themes : ['其他'],
        keywords: Array.isArray(record.keywords)
          ? record.keywords
              .filter((t): t is string => typeof t === 'string')
              .map((t) => t.trim())
              .filter(Boolean)
              .slice(0, 8)
          : [],
      };
    }
    return result;
  } finally {
    clearTimeout(timer);
  }
}

async function main(): Promise<void> {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  const apiKey = process.env.ZHIPU_API_KEY?.trim() ?? '';
  if (!apiKey) {
    if (!fs.existsSync(OUTPUT)) fs.writeFileSync(OUTPUT, '{}\n');
    console.log('· AI 语义层跳过：未配置 ZHIPU_API_KEY（设置后重新构建即可启用）');
    return;
  }

  // 按时间倒序：优先保证近期内容（用户最可能加星的最新动态）有 AI 语义
  const entries = loadEntries()
    .map((item) => item.entry)
    .filter((entry): entry is Entry => entry !== null)
    .sort((left, right) => right.date.localeCompare(left.date) || right.importance - left.importance);
  if (entries.length === 0) {
    console.log('· 没有条目，跳过 AI 语义层');
    return;
  }

  const result = readExisting();
  const deadline = Date.now() + TIME_BUDGET_MS;
  const pending = entries.filter((entry) => !result[entry.id]);
  console.log(`· AI 语义层：${pending.length}/${entries.length} 条待处理（模型 ${MODEL}）`);

  const batches: Entry[][] = [];
  for (let offset = 0; offset < pending.length; offset += BATCH_SIZE) {
    batches.push(pending.slice(offset, offset + BATCH_SIZE));
  }

  let failed = 0;
  let processed = 0;
  const runBatch = async (batch: Entry[], attempt: number): Promise<void> => {
    try {
      const links = await callModel(apiKey, batch);
      Object.assign(result, links);
      processed += batch.length;
      fs.writeFileSync(OUTPUT, `${JSON.stringify(result)}\n`);
      console.log(`  ✓ ${processed}/${pending.length}`);
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
        return runBatch(batch, attempt + 1);
      }
      failed += 1;
      console.warn(`  ⚠ 批次失败（${batch.map((entry) => entry.id).join(',')}）：${(error as Error).message}`);
    }
  };

  // 有限并发 + 时间预算（超出预算保留已生成部分，避免拖垮 CI）
  let cursor = 0;
  let outOfTime = false;
  const workers = Array.from({ length: Math.min(CONCURRENCY, batches.length) }, async () => {
    while (cursor < batches.length) {
      if (Date.now() > deadline) {
        outOfTime = true;
        return;
      }
      const index = cursor;
      cursor += 1;
      await runBatch(batches[index], 1);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  });
  await Promise.all(workers);
  if (outOfTime) console.warn('· 达到时间预算，剩余条目留待下次部署补齐');

  // 兜底：预算内对少量缺失条目逐条补漏
  const missing = entries.filter((entry) => !result[entry.id]);
  if (missing.length > 0 && Date.now() < deadline) {
    console.log(`· 逐条补漏 ${Math.min(10, missing.length)} 条`);
    for (const entry of missing.slice(0, 10)) {
      if (Date.now() > deadline) break;
      await runBatch([entry], 1);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  fs.writeFileSync(OUTPUT, `${JSON.stringify(result)}\n`);
  const coverage = entries.filter((entry) => result[entry.id]).length;
  console.log(`✓ AI 语义层完成：${coverage}/${entries.length} 条（失败批次 ${failed}）`);
  if (coverage < entries.length) {
    console.warn(`  ⚠ 仍有 ${entries.length - coverage} 条未生成，可在下次部署自动补齐`);
  }
  return;
}

main().catch((error) => {
  console.warn(`AI 语义层失败（已回退到规则联系）：${(error as Error).message}`);
  process.exitCode = 0;
});
