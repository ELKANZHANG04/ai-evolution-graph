import type { Entry, RelationType } from './types';
import { connectionBetween } from './connections';
import { getAiLinkInfo, getAiMainlineIds, getAiPosition, semanticSimilarity } from './semantic';
import { MAINLINE_CHAPTERS, type MainlineChapterMeta } from './mainline';

/**
 * 「我的灵感」v3：把星标挂到已建好的「主线网络」上。
 *
 * 用户 2026-11-01 反馈：
 * 1. 星标之间的联系不再是重点——每条星标先找它在主线里程碑上的锚点；
 * 2. 星标节点挂到主线所在的阶段长条里，主线固定不动、星标可拖动；
 * 3. 找不到锚点的「新方向」单独一行，并把附近主线节点轻轻推开（过渡动画）；
 * 4. 每个星标给一句「在主线中的位置」描述（优先用构建期生成的文案，规则兜底）。
 *
 * 纯函数 + 确定性输出（不依赖 DOM / 随机数），可单测。
 */

export const NETWORK_WIDTH = 960;
/** 锚点最低分：低于它视为「尚未接上主线」的新方向 */
export const ANCHOR_MIN_SCORE = 6;
export const MAX_ANCHORS = 2;

const TOP_MARGIN = 8;
const BOTTOM_MARGIN = 10;
const PADDING_X = 56;
const CHAPTER_GAP = 14;
/** 章标题区 + 主线行的纵向位置（相对长条顶部） */
const SPINE_Y = 66;
const STAR_TOP = 106;
const STAR_ROW_H = 56;
const STRIP_BOTTOM_PAD = 10;
const MIN_STRIP_H = 138;
/** 星标标签约 12 字，同一行至少留出这么多像素 */
const STAR_GAP = 128;

export type AnchorTier = 'strong' | 'medium' | 'weak';

export interface StarMainlineAnchor {
  id: string;
  title: string;
  date: string;
  score: number;
  tier: AnchorTier;
  reasons: string[];
}

export interface MainlineNodePlacement {
  entry: Entry;
  chapterId: string;
  chapterIndex: number;
  x: number;
  y: number;
  radius: number;
  /** 该里程碑本身被加星 */
  starred: boolean;
  /** 附近有新方向星标，主线节点让位 */
  nudged: boolean;
}

export interface StarPlacement {
  entry: Entry;
  chapterId: string;
  chapterIndex: number;
  chapterTitle: string;
  x: number;
  y: number;
  radius: number;
  row: number;
  /** 星标本身是主线里程碑（不再画卫星节点，只在主线节点上加星环） */
  isMainlineMilestone: boolean;
  /** 未接上主线的新方向 */
  novel: boolean;
  anchors: StarMainlineAnchor[];
  /** 新方向临时挂在最近的里程碑上（虚线） */
  nearestMainlineId: string | null;
  /** 在主线中的位置描述 */
  position: string;
  positionSource: 'ai' | 'derived';
}

export interface StarMainlineLink {
  starId: string;
  mainlineId: string;
  score: number;
  tier: AnchorTier;
  /** 是否真正接上（false = 新方向的临时虚线） */
  anchored: boolean;
  reasons: string[];
}

export interface MainlineLink {
  source: string;
  target: string;
  type: RelationType;
}

export interface ChapterStripData {
  chapter: MainlineChapterMeta;
  index: number;
  top: number;
  height: number;
  mainlineY: number;
  mainline: MainlineNodePlacement[];
  /** 本章所有星标（含主线里程碑本身被加星的那条） */
  stars: StarPlacement[];
  /** 本章卫星星标（不含主线里程碑） */
  satellites: StarPlacement[];
  links: StarMainlineLink[];
  mainlineLinks: MainlineLink[];
  novelCount: number;
}

export interface StarMainlineNetworkStats {
  stars: number;
  connected: number;
  novel: number;
  chapters: number;
  mainline: number;
  mainlineStarred: number;
}

export interface StarMainlineNetworkData {
  width: number;
  height: number;
  strips: ChapterStripData[];
  stars: StarPlacement[];
  links: StarMainlineLink[];
  stats: StarMainlineNetworkStats;
}

/* ------------------------------------------------------------------ */
/* 基础工具（确定性）                                                   */
/* ------------------------------------------------------------------ */

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hashUnit(value: string): number {
  return hashString(value) / 4294967295;
}

function dayDistance(left: string, right: string): number {
  const a = Date.parse(`${left}T00:00:00Z`);
  const b = Date.parse(`${right}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.POSITIVE_INFINITY;
  return Math.abs(a - b) / 86_400_000;
}

function uniqueReasons(reasons: string[]): string[] {
  const result: string[] = [];
  for (const reason of reasons) {
    if (!reason) continue;
    if (!result.includes(reason)) result.push(reason);
  }
  return result.slice(0, 4);
}

/** 去掉语义层理由里的「AI」字样：页面上不需要标注 AI */
function cleanReason(reason: string): string {
  return reason.replace(/^AI\s+/, '').replace(/^AI/, '').trim();
}

/** 太泛的词不参与锚点匹配 */
const GENERIC_ANCHOR_TOKENS = new Set([
  'ai',
  '模型',
  '大模型',
  'model',
  'models',
  'llm',
  '海外',
  '国内',
  '前沿',
  '技术',
  '研究',
  '发布',
  '公司',
  '平台',
  '系统',
]);

/** 中英文标签归一：让「开源权重」和「open-source」能对上 */
const TAG_ALIASES: Record<string, string> = {
  开源: 'opensource',
  开源权重: 'opensource',
  'open-source': 'opensource',
  opensource: 'opensource',
  开源模型: 'opensource',
  推理: 'reasoning',
  推理时计算: 'reasoning',
  推理模型: 'reasoning',
  reasoning: 'reasoning',
  智能体: 'agent',
  agentic: 'agent',
  agent: 'agent',
  多模态: 'multimodal',
  multimodal: 'multimodal',
  算力: 'compute',
  gpu: 'compute',
  硬件: 'compute',
  芯片: 'compute',
  hardware: 'compute',
  语音: 'voice',
  全双工: 'voice',
  语音交互: 'voice',
  voice: 'voice',
  长上下文: 'context',
  上下文: 'context',
  memory: 'context',
  context: 'context',
  安全: 'safety',
  safety: 'safety',
  评测: 'eval',
  benchmark: 'eval',
  政策: 'policy',
  监管: 'policy',
  治理: 'policy',
  policy: 'policy',
  世界模型: 'embodied',
  具身: 'embodied',
  机器人: 'embodied',
  worldmodel: 'embodied',
  robotics: 'embodied',
  历史: 'history',
  思想: 'thought',
  哲学: 'thought',
  thought: 'thought',
  商业化: 'capital',
  融资: 'capital',
  市场: 'capital',
  财报: 'capital',
  终端: 'device',
  产品: 'product',
  product: 'product',
  架构: 'architecture',
  模型架构: 'architecture',
  architecture: 'architecture',
  搜索: 'search',
  推荐: 'search',
  search: 'search',
  同声传译: 'translation',
  翻译: 'translation',
  translation: 'translation',
  训练: 'training',
  预训练: 'training',
  training: 'training',
  对齐: 'alignment',
  alignment: 'alignment',
};

/** 公司名只作弱信号：避免「都提到 Google」就强行连到 BERT/Transformer */
const WEAK_COMPANY_TOKENS = new Set([
  'google',
  'openai',
  'anthropic',
  'meta',
  'microsoft',
  'nvidia',
  'amazon',
  'aws',
  'apple',
  'tencent',
  'baidu',
  'alibaba',
  'huawei',
  'xiaomi',
  'bytedance',
  '谷歌',
  '微软',
  '苹果',
  '腾讯',
  '百度',
  '阿里',
  '华为',
  '英伟达',
  '字节',
]);

/** 主题词太宽：不能因为「都开源/都涉及 Agent」就接到某条主线上 */
const TOPIC_TOKENS = new Set([
  'opensource',
  'reasoning',
  'agent',
  'multimodal',
  'compute',
  'voice',
  'context',
  'safety',
  'eval',
  'policy',
  'embodied',
  'history',
  'thought',
  'capital',
  'product',
  'architecture',
  'search',
  'translation',
  'training',
  'alignment',
]);

/** 模型家族：GPT-6.1 应该能接回 GPT-5 那条主线 */
const MODEL_FAMILY_PATTERN = /^(gpt|gemini|deepseek|claude|llama|qwen|glm|kimi|grok|mistral|sora)/;
const MODEL_FAMILY_EXACT = new Set(['gpt', 'gemini', 'deepseek', 'claude', 'llama', 'qwen', 'glm', 'kimi', 'grok', 'mistral', 'sora']);

function canonicalToken(raw: string): string {
  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(/[\s_\-·/、，,.()（）[\]【】]+/g, '');
  if (!normalized) return '';
  return TAG_ALIASES[normalized] ?? normalized;
}

/** 条目的可比关键词：标签 + 语义关键词（不用标题，避免「标题里顺带提到 Codex」造成误连） */
function entryTokens(entry: Entry): Set<string> {
  const tokens = new Set<string>();
  const add = (raw: string): void => {
    const token = canonicalToken(raw);
    if (!token || GENERIC_ANCHOR_TOKENS.has(token) || /^\d+$/.test(token)) return;
    tokens.add(token);
    const family = MODEL_FAMILY_PATTERN.exec(token);
    if (family && family[1] !== token) tokens.add(family[1]);
  };
  for (const tag of entry.tags) add(tag);
  for (const keyword of getAiLinkInfo(entry.id)?.keywords ?? []) add(keyword);
  return tokens;
}

function tokenMatch(left: string, right: string): boolean {
  if (left === right) return true;
  // 模型家族只向上兼容：gpt 能接 gpt-5 / gpt-6.1，但不能误配 chatgpt
  if (MODEL_FAMILY_EXACT.has(left)) return right.startsWith(left);
  if (MODEL_FAMILY_EXACT.has(right)) return left.startsWith(right);
  const minLength = Math.min(left.length, right.length);
  return minLength >= 3 && (left.includes(right) || right.includes(left));
}

function sharedTokensBetween(left: ReadonlySet<string>, right: ReadonlySet<string>): string[] {
  const shared: string[] = [];
  for (const token of left) {
    if (TOPIC_TOKENS.has(token)) continue;
    for (const candidate of right) {
      if (TOPIC_TOKENS.has(candidate)) continue;
      if (tokenMatch(token, candidate)) {
        shared.push(token.length <= candidate.length ? token : candidate);
        break;
      }
    }
  }
  return [...new Set(shared)];
}

export function linkTier(score: number): AnchorTier {
  if (score >= 10) return 'strong';
  if (score >= 6) return 'medium';
  return 'weak';
}

export function mainlineRadius(importance: number): number {
  return 5 + clamp(Number.isFinite(importance) ? importance : 5, 1, 10) * 0.7;
}

export function starRadius(importance: number): number {
  return 10 + clamp(Number.isFinite(importance) ? importance : 5, 1, 10) * 0.8;
}

export function shortTitle(title: string, max = 12): string {
  const chars = [...title];
  return chars.length > max ? `${chars.slice(0, max).join('')}…` : title;
}

export function chapterIndexOfDate(date: string): number {
  for (let index = 0; index < MAINLINE_CHAPTERS.length; index += 1) {
    const chapter = MAINLINE_CHAPTERS[index];
    if (date >= chapter.dateStart && date <= chapter.dateEnd) return index;
  }
  return date < MAINLINE_CHAPTERS[0].dateStart ? 0 : MAINLINE_CHAPTERS.length - 1;
}

export function chapterLabelOf(index: number): string {
  const chapter = MAINLINE_CHAPTERS[index];
  return `第 ${index + 1} 章 · ${chapter.title}`;
}

/** 主线节点（2012 起的 mainline 里程碑），按日期排序 */
export function getMainlineEntries(entries: readonly Entry[]): Entry[] {
  return entries
    .filter((entry) => entry.mainline && entry.date >= '2012-01-01')
    .sort((left, right) => left.date.localeCompare(right.date) || left.id.localeCompare(right.id));
}

/* ------------------------------------------------------------------ */
/* 锚点评分                                                            */
/* ------------------------------------------------------------------ */

function anchorScoreOf(
  star: Entry,
  mainline: Entry,
  tagDf: Map<string, number>,
  tokenDf: Map<string, number>,
  tokenById: Map<string, Set<string>>,
  total: number,
): StarMainlineAnchor {
  const rule = connectionBetween(star, mainline, { tagDf, total });
  const semantic = semanticSimilarity(star.id, mainline.id);
  const reasons = [...rule.reasons, ...semantic.reasons.map(cleanReason)];
  let score = rule.score + semantic.score;

  if (getAiMainlineIds(star.id).includes(mainline.id)) {
    score += 6;
    reasons.unshift('这条内容直接接在这条主线上');
  }

  // 直接引用 / 被引用的主线关系是最硬信号
  const referencesMainline =
    star.relations.some((relation) => relation.to === mainline.id) ||
    mainline.relations.some((relation) => relation.to === star.id);
  if (referencesMainline) {
    score += 2;
    reasons.push('与主线里程碑有直接引用关系');
  }

  const sharedTokens = sharedTokensBetween(
    tokenById.get(star.id) ?? new Set<string>(),
    tokenById.get(mainline.id) ?? new Set<string>(),
  );
  if (sharedTokens.length > 0) {
    let tokenScore = 0;
    for (const token of sharedTokens.slice(0, 6)) {
      const frequency = tokenDf.get(token) ?? 1;
      const idf = Math.min(2.5, 1 + Math.log((total + 1) / (frequency + 1)));
      tokenScore += idf * 2 * (WEAK_COMPANY_TOKENS.has(token) ? 0.3 : 1);
    }
    tokenScore = Math.round(Math.min(9, tokenScore) * 10) / 10;
    if (tokenScore >= 1) {
      score += tokenScore;
      reasons.push(`共同关键词：${sharedTokens.slice(0, 3).join('、')}`);
    }
  }

  const gap = dayDistance(star.date, mainline.date);
  if (gap <= 90) score += 1;
  else if (gap <= 365) score += 0.5;

  score = Math.round(score * 10) / 10;
  return {
    id: mainline.id,
    title: mainline.title,
    date: mainline.date,
    score,
    tier: linkTier(score),
    reasons: uniqueReasons(reasons),
  };
}

/* ------------------------------------------------------------------ */
/* 布局                                                                */
/* ------------------------------------------------------------------ */

/**
 * 章内主线节点等距铺开（按日期排序）。
 * 阶段内只有 2–9 个里程碑，等距比按日期硬挤更清楚；时间范围由章头标注。
 */
function layoutMainlineX(mainline: readonly Entry[]): number[] {
  const count = mainline.length;
  if (count === 0) return [];
  const left = PADDING_X;
  const right = NETWORK_WIDTH - PADDING_X;
  if (count === 1) return [NETWORK_WIDTH / 2];
  const available = right - left;
  // 稀疏阶段别把节点摊到两端：限制最大间距并居中，读起来更像一段叙事
  const step = Math.min(240, available / (count - 1));
  const start = left + (available - step * (count - 1)) / 2;
  return mainline.map((_, index) => start + step * index);
}

/** 新方向星标会轻轻推开两侧主线节点（±6px，最多 ±10），让整体更协调 */
function novelNudges(
  mainlineXs: readonly number[],
  novelTargets: readonly number[],
): { offsets: number[]; nudgedIndices: Set<number> } {
  const offsets = mainlineXs.map(() => 0);
  const nudgedIndices = new Set<number>();
  for (const targetX of novelTargets) {
    if (mainlineXs.length === 0) break;
    let nearest = 0;
    let best = Number.POSITIVE_INFINITY;
    for (let index = 0; index < mainlineXs.length; index += 1) {
      const distance = Math.abs(mainlineXs[index] - targetX);
      if (distance < best) {
        best = distance;
        nearest = index;
      }
    }
    const direction = targetX >= mainlineXs[nearest] ? 1 : -1;
    offsets[nearest] += direction * 6;
    nudgedIndices.add(nearest);
    const neighbour = nearest + (direction > 0 ? 1 : -1);
    if (neighbour >= 0 && neighbour < mainlineXs.length) {
      offsets[neighbour] += direction * 3;
      nudgedIndices.add(neighbour);
    }
  }
  for (let index = 0; index < offsets.length; index += 1) {
    offsets[index] = clamp(offsets[index], -10, 10);
  }
  return { offsets, nudgedIndices };
}

interface RowSlot {
  draft: SatelliteDraft;
  x: number;
}

/** 把一行里的节点按最小间距推开，并收回画布边界内 */
function spreadRow(items: RowSlot[], left: number, right: number, gap: number): void {
  if (items.length === 0) return;
  items.sort((a, b) => a.x - b.x || a.draft.entry.id.localeCompare(b.draft.entry.id));
  for (let index = 1; index < items.length; index += 1) {
    if (items[index].x - items[index - 1].x < gap) items[index].x = items[index - 1].x + gap;
  }
  const last = items[items.length - 1];
  const overflow = last.x - right;
  if (overflow > 0) for (const item of items) item.x -= overflow;
  if (items[0].x < left) {
    const shift = left - items[0].x;
    for (const item of items) item.x += shift;
  }
  for (const item of items) item.x = clamp(item.x, left, right);
}

/* ------------------------------------------------------------------ */
/* 位置描述                                                            */
/* ------------------------------------------------------------------ */

function composeDerivedPosition(
  entry: Entry,
  chapterIndex: number,
  anchors: readonly StarMainlineAnchor[],
  isMainlineMilestone: boolean,
): string {
  const ai = getAiLinkInfo(entry.id);
  const core = ai?.core?.trim();
  const chapter = MAINLINE_CHAPTERS[chapterIndex];
  const chapterPart = `第 ${chapterIndex + 1} 章「${chapter.title}」`;

  if (isMainlineMilestone) {
    return `它本身就是${chapterPart}的主线里程碑，是理解这一阶段的锚点。`;
  }
  if (anchors.length === 0) {
    const base = `暂时没接上${chapterPart}的主线里程碑，作为新方向挂在主线之外`;
    return core ? `${base}；核心是「${core}」。` : `${base}，值得留意它会不会长成下一条支线。`;
  }
  const anchorPart =
    anchors.length === 1
      ? `接在「${anchors[0].title}」之后，属于${chapterPart}`
      : `主要接在「${anchors[0].title}」，并与「${anchors[1].title}」同属一条线（${chapterPart}）`;
  return core ? `${anchorPart}；它要讲的是「${core}」。` : `${anchorPart}。`;
}

/** 位置描述的最终取值（构建期 AI 文案优先，否则规则组合） */
export function resolveStarPosition(
  entry: Entry,
  chapterIndex: number,
  anchors: readonly StarMainlineAnchor[],
  isMainlineMilestone: boolean,
): { position: string; source: 'ai' | 'derived' } {
  const ai = getAiPosition(entry.id);
  if (ai) return { position: ai, source: 'ai' };
  return {
    position: composeDerivedPosition(entry, chapterIndex, anchors, isMainlineMilestone),
    source: 'derived',
  };
}

/* ------------------------------------------------------------------ */
/* 主构建函数                                                          */
/* ------------------------------------------------------------------ */

interface SatelliteDraft {
  entry: Entry;
  chapterIndex: number;
  anchors: StarMainlineAnchor[];
  novel: boolean;
  nearestMainlineId: string | null;
  targetX: number;
}

export function buildStarMainlineNetwork(
  entries: readonly Entry[],
  starIds: readonly string[],
): StarMainlineNetworkData {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const mainlineEntries = getMainlineEntries(entries);
  const mainlineIdSet = new Set(mainlineEntries.map((entry) => entry.id));
  const starEntries = [...new Set(starIds)]
    .map((id) => byId.get(id))
    .filter((entry): entry is Entry => entry !== undefined);
  const starIdSet = new Set(starEntries.map((entry) => entry.id));

  // 标签 IDF（规则联系用）
  const tagDf = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of new Set(entry.tags)) tagDf.set(tag, (tagDf.get(tag) ?? 0) + 1);
  }
  const total = entries.length;

  // 关键词 IDF：跨条目太常见的词（agent / Google）不应该单独把星标接到主线上
  const tokenById = new Map<string, Set<string>>();
  const tokenDf = new Map<string, number>();
  for (const entry of entries) {
    const tokens = entryTokens(entry);
    tokenById.set(entry.id, tokens);
    for (const token of tokens) tokenDf.set(token, (tokenDf.get(token) ?? 0) + 1);
  }

  const mainlineByChapter = new Map<number, Entry[]>();
  for (const entry of mainlineEntries) {
    const index = chapterIndexOfDate(entry.date);
    const list = mainlineByChapter.get(index) ?? [];
    list.push(entry);
    mainlineByChapter.set(index, list);
  }

  /* 1. 给每条星标找主线锚点（跨所有里程碑） */
  const satelliteDrafts: SatelliteDraft[] = [];

  for (const star of starEntries) {
    if (mainlineIdSet.has(star.id)) {
      continue;
    }

    const scored: StarMainlineAnchor[] = [];
    for (const mainline of mainlineEntries) {
      const anchor = anchorScoreOf(star, mainline, tagDf, tokenDf, tokenById, total);
      if (anchor.score > 0) scored.push(anchor);
    }
    scored.sort(
      (left, right) =>
        right.score - left.score ||
        right.date.localeCompare(left.date) ||
        left.id.localeCompare(right.id) ||
        left.title.localeCompare(right.title),
    );

    const primary = scored[0];
    if (primary && primary.score >= ANCHOR_MIN_SCORE) {
      const mainline = byId.get(primary.id) as Entry;
      const chapterIndex = chapterIndexOfDate(mainline.date);
      // 第二条锚点限制在同一章，避免跨章连线把网络拉乱
      const anchors = scored
        .filter((anchor) => {
          const target = byId.get(anchor.id);
          return (
            target !== undefined &&
            chapterIndexOfDate(target.date) === chapterIndex &&
            anchor.score >= ANCHOR_MIN_SCORE
          );
        })
        .slice(0, MAX_ANCHORS);
      satelliteDrafts.push({
        entry: star,
        chapterIndex,
        anchors,
        novel: false,
        nearestMainlineId: primary.id,
        targetX: 0,
      });
      continue;
    }

    // 新方向：按星标自己的日期落到对应阶段，临时挂在最近的里程碑旁
    const chapterIndex = chapterIndexOfDate(star.date);
    const chapterMainline = mainlineByChapter.get(chapterIndex) ?? [];
    let nearest: Entry | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const candidate of chapterMainline) {
      const distance = dayDistance(star.date, candidate.date);
      if (distance < bestDistance) {
        bestDistance = distance;
        nearest = candidate;
      }
    }
    satelliteDrafts.push({
      entry: star,
      chapterIndex,
      anchors: [],
      novel: true,
      nearestMainlineId: nearest?.id ?? null,
      targetX: 0,
    });
  }

  /* 2. 逐章布局 */
  let top = TOP_MARGIN;
  const strips: ChapterStripData[] = [];
  const allStars: StarPlacement[] = [];
  const allLinks: StarMainlineLink[] = [];

  for (let chapterIndex = 0; chapterIndex < MAINLINE_CHAPTERS.length; chapterIndex += 1) {
    const chapter = MAINLINE_CHAPTERS[chapterIndex];
    const chapterMainline = (mainlineByChapter.get(chapterIndex) ?? []).slice();
    const chapterDrafts = satelliteDrafts.filter((draft) => draft.chapterIndex === chapterIndex);
    const novelDrafts = chapterDrafts.filter((draft) => draft.novel);

    // 2.1 主线节点：按日期铺开，再根据新方向微调
    const baseXs = layoutMainlineX(chapterMainline);
    const baseXById = new Map<string, number>();
    chapterMainline.forEach((entry, index) => baseXById.set(entry.id, baseXs[index]));

    const novelTargets = novelDrafts.map((draft) => {
      const nearestX = draft.nearestMainlineId ? baseXById.get(draft.nearestMainlineId) : undefined;
      if (nearestX !== undefined) return nearestX + (hashUnit(draft.entry.id) * 2 - 1) * 18;
      return PADDING_X + hashUnit(draft.entry.id) * (NETWORK_WIDTH - PADDING_X * 2);
    });
    const { offsets, nudgedIndices } = novelNudges(baseXs, novelTargets);

    const mainlineY = top + SPINE_Y;
    const mainlineNodes: MainlineNodePlacement[] = chapterMainline.map((entry, index) => ({
      entry,
      chapterId: chapter.id,
      chapterIndex,
      x: clamp(baseXs[index] + offsets[index], PADDING_X, NETWORK_WIDTH - PADDING_X),
      y: mainlineY,
      radius: mainlineRadius(entry.importance),
      starred: starIdSet.has(entry.id),
      nudged: nudgedIndices.has(index),
    }));
    const mainlineById = new Map(mainlineNodes.map((node) => [node.entry.id, node]));

    // 2.2 星标目标 x：锚点的加权中心；新方向落在最近里程碑旁边
    for (const draft of chapterDrafts) {
      if (draft.anchors.length > 0) {
        let weight = 0;
        let sum = 0;
        for (const anchor of draft.anchors) {
          const node = mainlineById.get(anchor.id);
          if (!node) continue;
          const w = Math.max(0.5, anchor.score);
          sum += node.x * w;
          weight += w;
        }
        draft.targetX = weight > 0 ? sum / weight : NETWORK_WIDTH / 2;
      } else {
        const nearest = draft.nearestMainlineId ? mainlineById.get(draft.nearestMainlineId) : undefined;
        const base = nearest?.x ?? NETWORK_WIDTH / 2;
        draft.targetX = base + (hashUnit(draft.entry.id) * 2 - 1) * 22;
      }
      draft.targetX += (hashUnit(`${draft.entry.id}:x`) * 2 - 1) * 8;
    }

    const connectedDrafts = chapterDrafts
      .filter((draft) => !draft.novel)
      .sort((left, right) => left.targetX - right.targetX || left.entry.id.localeCompare(right.entry.id));
    const sortedNovelDrafts = novelDrafts
      .slice()
      .sort((left, right) => left.targetX - right.targetX || left.entry.id.localeCompare(right.entry.id));

    // 新方向不挤在最近里程碑那一点：按顺序在整章宽度里铺开，形成一条「待观察」带
    const novelLeft = PADDING_X + 84;
    const novelRight = NETWORK_WIDTH - PADDING_X - 84;
    if (sortedNovelDrafts.length === 1) {
      sortedNovelDrafts[0].targetX = (novelLeft + novelRight) / 2;
    } else if (sortedNovelDrafts.length > 1) {
      const step = (novelRight - novelLeft) / (sortedNovelDrafts.length - 1);
      sortedNovelDrafts.forEach((draft, index) => {
        draft.targetX = novelLeft + step * index + (hashUnit(`${draft.entry.id}:n`) * 2 - 1) * 10;
      });
    }

    // 2.3 分行：同一行至少间隔 STAR_GAP；新方向从已接主线的行之后开始，单独成带
    const left = PADDING_X + 48;
    const right = NETWORK_WIDTH - PADDING_X - 48;
    const rows: RowSlot[][] = [];
    const assignRows = (drafts: SatelliteDraft[], startRow: number): void => {
      for (const draft of drafts) {
        let targetRow = -1;
        for (let rowIndex = startRow; rowIndex < rows.length; rowIndex += 1) {
          if (rows[rowIndex].every((slot) => Math.abs(slot.x - draft.targetX) >= STAR_GAP)) {
            targetRow = rowIndex;
            break;
          }
        }
        if (targetRow === -1) {
          rows.push([]);
          targetRow = rows.length - 1;
        }
        rows[targetRow].push({ draft, x: draft.targetX });
      }
    };
    assignRows(connectedDrafts, 0);
    const novelStartRow = rows.length;
    assignRows(sortedNovelDrafts, novelStartRow);
    for (const row of rows) spreadRow(row, left, right, STAR_GAP);

    // 2.4 生成星标放置（含主线里程碑本身被加星的情况）
    const chapterStars: StarPlacement[] = [];
    const chapterSatellites: StarPlacement[] = [];
    for (const node of mainlineNodes) {
      if (!node.starred) continue;
      const description = resolveStarPosition(node.entry, chapterIndex, [], true);
      const placement: StarPlacement = {
        entry: node.entry,
        chapterId: chapter.id,
        chapterIndex,
        chapterTitle: chapter.title,
        x: node.x,
        y: node.y,
        radius: node.radius,
        row: -1,
        isMainlineMilestone: true,
        novel: false,
        anchors: [],
        nearestMainlineId: null,
        position: description.position,
        positionSource: description.source,
      };
      chapterStars.push(placement);
    }

    rows.forEach((row, rowIndex) => {
      for (const slot of row) {
        const { draft } = slot;
        const nearest = draft.nearestMainlineId ? mainlineById.get(draft.nearestMainlineId) : undefined;
        const description = resolveStarPosition(draft.entry, chapterIndex, draft.anchors, false);
        const placement: StarPlacement = {
          entry: draft.entry,
          chapterId: chapter.id,
          chapterIndex,
          chapterTitle: chapter.title,
          x: slot.x,
          y: top + STAR_TOP + rowIndex * STAR_ROW_H,
          radius: starRadius(draft.entry.importance),
          row: rowIndex,
          isMainlineMilestone: false,
          novel: draft.novel,
          anchors: draft.anchors,
          nearestMainlineId: nearest?.entry.id ?? draft.nearestMainlineId,
          position: description.position,
          positionSource: description.source,
        };
        chapterStars.push(placement);
        chapterSatellites.push(placement);
      }
    });

    // 2.5 星标 → 主线连线（新方向画虚线临时挂靠）
    const chapterLinks: StarMainlineLink[] = [];
    for (const star of chapterSatellites) {
      if (star.novel) {
        // 新方向的虚线挂到「横向最近」的里程碑，避免所有虚线都拉到最右边一个点
        let nearestNode: MainlineNodePlacement | null = null;
        let nearestDistance = Number.POSITIVE_INFINITY;
        for (const node of mainlineNodes) {
          const distance = Math.abs(node.x - star.x);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestNode = node;
          }
        }
        if (nearestNode) {
          star.nearestMainlineId = nearestNode.entry.id;
          chapterLinks.push({
            starId: star.entry.id,
            mainlineId: nearestNode.entry.id,
            score: 0,
            tier: 'weak',
            anchored: false,
            reasons: ['还没有直接接上主线里程碑，先临时挂在最近的节点旁'],
          });
        }
        continue;
      }
      for (const anchor of star.anchors) {
        if (!mainlineById.has(anchor.id)) continue;
        chapterLinks.push({
          starId: star.entry.id,
          mainlineId: anchor.id,
          score: anchor.score,
          tier: anchor.tier,
          anchored: true,
          reasons: anchor.reasons,
        });
      }
    }

    // 2.6 主线之间的关系（同章、两端都是里程碑）
    const mainlineLinks: MainlineLink[] = [];
    const seen = new Set<string>();
    for (const node of mainlineNodes) {
      for (const relation of node.entry.relations) {
        if (!mainlineById.has(relation.to)) continue;
        const key = `${[node.entry.id, relation.to].sort().join('|')}|${relation.type}`;
        if (seen.has(key)) continue;
        seen.add(key);
        mainlineLinks.push({ source: node.entry.id, target: relation.to, type: relation.type });
      }
    }

    const rowsCount = rows.length;
    const height =
      rowsCount === 0
        ? MIN_STRIP_H
        : Math.max(MIN_STRIP_H, STAR_TOP + rowsCount * STAR_ROW_H + STRIP_BOTTOM_PAD);

    strips.push({
      chapter,
      index: chapterIndex,
      top,
      height,
      mainlineY,
      mainline: mainlineNodes,
      stars: chapterStars.sort(
        (left, right) => right.entry.date.localeCompare(left.entry.date) || left.entry.id.localeCompare(right.entry.id),
      ),
      satellites: chapterSatellites,
      links: chapterLinks,
      mainlineLinks,
      novelCount: chapterSatellites.filter((star) => star.novel).length,
    });
    allStars.push(...chapterStars);
    allLinks.push(...chapterLinks);
    top = top + height + CHAPTER_GAP;
  }

  // 位置解读区按日期倒序
  allStars.sort(
    (left, right) => right.entry.date.localeCompare(left.entry.date) || left.entry.id.localeCompare(right.entry.id),
  );

  const stats: StarMainlineNetworkStats = {
    stars: allStars.length,
    connected: allStars.filter((star) => star.isMainlineMilestone || star.anchors.length > 0).length,
    novel: allStars.filter((star) => !star.isMainlineMilestone && star.novel).length,
    chapters: strips.length,
    mainline: mainlineEntries.length,
    mainlineStarred: allStars.filter((star) => star.isMainlineMilestone).length,
  };

  return {
    width: NETWORK_WIDTH,
    height: top - CHAPTER_GAP + BOTTOM_MARGIN,
    strips,
    stars: allStars,
    links: allLinks,
    stats,
  };
}

/* ------------------------------------------------------------------ */
/* 辅助查询                                                            */
/* ------------------------------------------------------------------ */

export function placementFor(
  network: StarMainlineNetworkData,
  entryId: string,
): StarPlacement | undefined {
  return network.stars.find((star) => star.entry.id === entryId);
}

export function mainlineNodeFor(
  network: StarMainlineNetworkData,
  entryId: string,
): MainlineNodePlacement | undefined {
  for (const strip of network.strips) {
    const node = strip.mainline.find((item) => item.entry.id === entryId);
    if (node) return node;
  }
  return undefined;
}
