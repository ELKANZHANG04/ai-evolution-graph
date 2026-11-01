/**
 * 构建期 AI 语义层（可选）：用智谱 GLM-4.7-Flash（免费）为每个条目提取
 * 主题 / 核心思想 / 关键词，并为最近条目生成「在主线中的位置」与关联里程碑 id，
 * 写入 src/data/ai-links.json（供「我的灵感」分类、主线锚点与位置解读使用）。
 *
 * 用法：
 *   ZHIPU_API_KEY=xxx npm run ai:links
 *
 * 未配置 key 时自动跳过（不影响构建）；API 失败 / 超时保留已完成部分并正常退出。
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadEntries, ROOT } from './lib/load-entries';
import type { Entry } from '../src/lib/types';
import { MAINLINE_CHAPTERS } from '../src/lib/mainline';

const ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const MODEL = process.env.AI_MODEL ?? 'glm-4.7-flash';
const BATCH_SIZE = 8;
const CONCURRENCY = 2;
const MAX_RETRIES = 1;
/** 整体时间预算：免费 API 慢/限流时不拖垮 CI，超出后保留已生成部分 */
const TIME_BUDGET_MS = 5 * 60 * 1000;
/** 位置解读只补最近一批条目，避免每次部署都把全部 211 条重跑一遍 */
const POSITION_RECENT_DATE = '2026-09-01';
const POSITION_BUDGET_MS = 4 * 60 * 1000;
const POSITION_BATCH_SIZE = 6;
/** 免费模型并发一高就 429：串行 + 退避重试，只补最近 24 条，先保证成功率 */
const POSITION_MAX_ENTRIES = 24;
const POSITION_CONCURRENCY = 1;
const POSITION_RETRY_DELAYS = [3000, 8000, 20000];
/** 4.7-Flash 429 时退到上一代免费模型，先保证有位置文案 */
const POSITION_FALLBACK_MODEL = 'glm-4.5-flash';

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
const DATA_DIR = path.join(ROOT, 'src', 'data');
const OUTPUT = path.join(DATA_DIR, 'ai-links.json');

interface AiEntryLink {
  core: string;
  themes: string[];
  keywords: string[];
  /** 在主线中的位置（构建期生成；可缺省，前端会用规则组合兜底） */
  position?: string;
  /** 语义上最相关的主线里程碑 id */
  mainline?: string[];
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

function formatMainlineContext(entries: Entry[]): string {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const lines: string[] = [];
  for (let index = 0; index < MAINLINE_CHAPTERS.length; index += 1) {
    const chapter = MAINLINE_CHAPTERS[index];
    lines.push(`【第 ${index + 1} 章 · ${chapter.title}】${chapter.dateStart.slice(0, 4)}–${chapter.dateEnd.slice(0, 4)}`);
    for (const entry of entries) {
      if (!byId.has(entry.id)) continue;
      if (entry.date < chapter.dateStart || entry.date > chapter.dateEnd) continue;
      lines.push(`- ${entry.id} | ${entry.date} | ${entry.title}`);
    }
  }
  return lines.join('\n');
}

function buildPositionPrompt(mainlineContext: string): string {
  return `你是 AI 技术史编辑，熟悉 2012–2026 年 AI 演进主线。下面是站内主线里程碑（分阶段）：

${mainlineContext}

任务：对用户给出的每条内容，判断它在主线中的位置：
- position：一句话（≤50 字），说明它接在哪个主线里程碑之后、属于哪个阶段，是延续、补充还是突破；尽量点出一个里程碑标题，不要空泛。
- mainlineIds：1–2 个最相关的主线里程碑 id，必须从上面列表里选；如果确实属于主线之外的新方向，给空数组 []。
只输出 JSON：{"items":[{"id":"...","position":"...","mainlineIds":["..."]}]}，不要解释。`;
}

function compressPositionEntry(entry: Entry): Record<string, unknown> {
  return {
    id: entry.id,
    title: entry.title,
    date: entry.date,
    type: entry.type,
    categories: entry.categories,
    tags: entry.tags,
    summary: entry.summary.slice(0, 200),
    significance: entry.significance.slice(0, 160),
  };
}

async function callPositionModel(
  apiKey: string,
  batch: Entry[],
  systemPrompt: string,
  validMainlineIds: Set<string>,
  model: string = MODEL,
): Promise<Record<string, { position: string; mainline: string[] }>> {
  const body = {
    model,
    temperature: 0.2,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify({ items: batch.map(compressPositionEntry) }) },
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
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content ?? '';
    const parsed = extractJson(content) as { items?: unknown } | null;
    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    const result: Record<string, { position: string; mainline: string[] }> = {};
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const record = item as Record<string, unknown>;
      const id = typeof record.id === 'string' ? record.id : '';
      if (!id) continue;
      const position = typeof record.position === 'string' ? record.position.trim().slice(0, 90) : '';
      const mainline = Array.isArray(record.mainlineIds)
        ? [...new Set(record.mainlineIds.filter((value): value is string => typeof value === 'string'))]
            .filter((value) => validMainlineIds.has(value))
            .slice(0, 2)
        : [];
      if (position) result[id] = { position, mainline };
    }
    return result;
  } finally {
    clearTimeout(timer);
  }
}

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
  fs.mkdirSync(DATA_DIR, { recursive: true });
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

  // 兜底：API 未覆盖的条目用标签/类别规则映射补齐，保证任何星标组合都有语义层
  const CAT_THEME: Record<string, string> = {
    architecture: '模型架构与训练',
    model: '模型架构与训练',
    opensource: '开源与权重',
    alignment: '对齐与治理',
    multimodal: '多模态与视觉',
    agent: '智能体与自动化',
    hardware: '国产算力与芯片',
    product: '产品与终端',
    thought: '历史与思想',
    org: '资本市场与商业化',
  };
  const TAG_RULES: Array<[RegExp, string]> = [
    [/语音|全双工|audio|speech/i, '语音与实时交互'],
    [/搜索|推荐|search/i, '搜索与推荐'],
    [/办公|生产力|office/i, '办公与生产力'],
    [/推理|reasoning|test.?time/i, '推理时计算'],
    [/评测|benchmark|红队|安全/i, '评测与安全'],
    [/监管|政策|法案|合规|治理/i, '政策与监管'],
    [/世界模型|具身|机器人|人形|world.?model|robot/i, '世界模型与具身'],
    [/记忆|长上下文|上下文|memory|long.?context/i, '长上下文与记忆'],
    [/开源|open.?source|权重/i, '开源与权重'],
    [/算力|芯片|gpu|昇腾|寒武纪|硬件|infra/i, '国产算力与芯片'],
    [/历史|思想|哲学|图灵/i, '历史与思想'],
    [/智能体|agent|mcp|工具/i, '智能体与自动化'],
    [/多模态|视觉|视频|图像|生成/i, '多模态与视觉'],
    [/市场|融资|ipo|资本|商业/i, '资本市场与商业化'],
    [/产品|终端|手机|pc|应用/i, '产品与终端'],
  ];
  const GENERIC_TAGS = new Set(['AI', 'ai', '国内', '海外']);
  let bootstrapped = 0;
  for (const entry of entries) {
    if (result[entry.id]) continue;
    const themes = new Set<string>();
    for (const category of entry.categories) {
      const theme = CAT_THEME[category];
      if (theme) themes.add(theme);
    }
    const tags = entry.tags.filter((tag) => !GENERIC_TAGS.has(tag));
    for (const tag of tags) {
      for (const [pattern, theme] of TAG_RULES) if (pattern.test(tag)) themes.add(theme);
    }
    const themeList = [...themes].slice(0, 3);
    result[entry.id] = {
      core: (entry.significance || entry.summary || entry.title).slice(0, 50),
      themes: themeList.length > 0 ? themeList : ['其他'],
      keywords: [...new Set([...tags.slice(0, 5), ...entry.categories.slice(0, 2)])].slice(0, 6),
    };
    bootstrapped += 1;
  }
  if (bootstrapped > 0) console.log(`· 规则回退补齐 ${bootstrapped} 条`);

  // 位置解读：只补最近活跃条目（用户最可能加星的一批），避免每次部署重跑全部数据
  const mainlineEntries = entries
    .filter((entry) => entry.mainline && entry.date >= '2012-01-01')
    .sort((left, right) => left.date.localeCompare(right.date));
  const validMainlineIds = new Set(mainlineEntries.map((entry) => entry.id));
  const positionTargets = entries
    .filter((entry) => {
      if (entry.mainline) return false;
      if (result[entry.id]?.position) return false;
      if (entry.date >= POSITION_RECENT_DATE) return true;
      return (entry.added_at ?? '') >= POSITION_RECENT_DATE;
    })
    .sort((left, right) => right.date.localeCompare(left.date) || right.importance - left.importance)
    .slice(0, POSITION_MAX_ENTRIES);
  if (positionTargets.length > 0) {
    const prompt = buildPositionPrompt(formatMainlineContext(mainlineEntries));
    const positionDeadline = Date.now() + POSITION_BUDGET_MS;
    console.log(`· 主线位置解读：${positionTargets.length} 条待生成`);
    let positionDone = 0;
    let positionFailed = 0;
    const positionBatches: Entry[][] = [];
    for (let offset = 0; offset < positionTargets.length; offset += POSITION_BATCH_SIZE) {
      positionBatches.push(positionTargets.slice(offset, offset + POSITION_BATCH_SIZE));
    }
    const runPositionBatch = async (batch: Entry[], attempt: number): Promise<void> => {
      try {
        const model = attempt >= 2 ? POSITION_FALLBACK_MODEL : MODEL;
        const links = await callPositionModel(apiKey, batch, prompt, validMainlineIds, model);
        for (const [id, value] of Object.entries(links)) {
          result[id] = { ...(result[id] ?? { core: '', themes: ['其他'], keywords: [] }), ...value };
        }
        positionDone += Object.keys(links).length;
        fs.writeFileSync(OUTPUT, `${JSON.stringify(result)}\n`);
        console.log(`  ✓ 位置 ${positionDone}/${positionTargets.length}`);
      } catch (error) {
        const message = (error as Error).message;
        if (attempt <= POSITION_RETRY_DELAYS.length) {
          const wait = POSITION_RETRY_DELAYS[attempt - 1] ?? 20000;
          // 免费模型 429 时退避重试；其它错误也最多重试一轮
          if (message.includes('429') || attempt <= 1) {
            console.warn(`  · 位置批次重试（第 ${attempt} 次）：${message.slice(0, 80)}`);
            await new Promise((resolve) => setTimeout(resolve, wait));
            return runPositionBatch(batch, attempt + 1);
          }
        }
        positionFailed += 1;
        console.warn(`  ⚠ 位置批次失败（${batch.map((entry) => entry.id).join(',')}）：${message.slice(0, 120)}`);
      }
    };
    let positionCursor = 0;
    const positionWorkers = Array.from({ length: Math.min(POSITION_CONCURRENCY, positionBatches.length) }, async () => {
      while (positionCursor < positionBatches.length) {
        if (Date.now() > positionDeadline) return;
        const index = positionCursor;
        positionCursor += 1;
        await runPositionBatch(positionBatches[index], 1);
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    });
    await Promise.all(positionWorkers);
    const targetIds = new Set(positionTargets.map((entry) => entry.id));
    const generated = entries.filter((entry) => targetIds.has(entry.id) && result[entry.id]?.position).length;
    console.log(`✓ 主线位置解读完成：${generated}/${positionTargets.length} 条，失败批次 ${positionFailed}`);
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
