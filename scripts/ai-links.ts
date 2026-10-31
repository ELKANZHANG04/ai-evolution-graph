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
  const timer = setTimeout(() => controller.abort(), 90_000);
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
      result[id] = {
        core: typeof record.core === 'string' ? record.core.slice(0, 80) : '',
        themes: Array.isArray(record.themes)
          ? record.themes.filter((t): t is string => typeof t === 'string').slice(0, 5)
          : [],
        keywords: Array.isArray(record.keywords)
          ? record.keywords.filter((t): t is string => typeof t === 'string').slice(0, 8)
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

  const entries = loadEntries()
    .map((item) => item.entry)
    .filter((entry): entry is Entry => entry !== null);
  if (entries.length === 0) {
    console.log('· 没有条目，跳过 AI 语义层');
    return;
  }

  const result = readExisting();
  const pending = entries.filter((entry) => !result[entry.id]);
  console.log(`· AI 语义层：${pending.length}/${entries.length} 条待处理（模型 ${MODEL}）`);

  let failed = 0;
  for (let offset = 0; offset < pending.length; offset += BATCH_SIZE) {
    const batch = pending.slice(offset, offset + BATCH_SIZE);
    try {
      const links = await callModel(apiKey, batch);
      Object.assign(result, links);
      fs.writeFileSync(OUTPUT, `${JSON.stringify(result)}\n`);
      console.log(`  ✓ ${Math.min(offset + BATCH_SIZE, pending.length)}/${pending.length}`);
    } catch (error) {
      failed += 1;
      console.warn(`  ⚠ 批次 ${offset / BATCH_SIZE + 1} 失败：${(error as Error).message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  fs.writeFileSync(OUTPUT, `${JSON.stringify(result)}\n`);
  console.log(`✓ AI 语义层完成：${Object.keys(result).length} 条（失败批次 ${failed}）`);
}

main().catch((error) => {
  console.warn(`AI 语义层失败（已回退到规则联系）：${(error as Error).message}`);
  process.exitCode = 0;
});
