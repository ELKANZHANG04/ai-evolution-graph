// 语义数据 = 仓库内种子（人工/历史生成）+ CI 构建期增量（缓存恢复后合并）
import aiLinkSeed from '../data/ai-links.json';

/**
 * AI 语义层（可选）：构建期用免费大模型（如智谱 GLM-4.7-Flash）为每个条目提取
 * 「核心思想 / 主题 / 关键词」，前端用它判断两条星标内容是否在讲同一件事。
 * 未配置 API Key 时数据为空，自动回退到规则联系。
 */
export interface AiLinkInfo {
  core?: string;
  themes?: string[];
  keywords?: string[];
}

const LINKS = (aiLinkSeed ?? {}) as Record<string, AiLinkInfo>;

export function hasSemanticLayer(): boolean {
  return Object.keys(LINKS).length > 0;
}

export function getAiLinkInfo(id: string): AiLinkInfo | undefined {
  return LINKS[id];
}

function normalize(token: string): string {
  return token
    .trim()
    .toLowerCase()
    .replace(/[\s_\-·/、，,()（）[\]【】]+/g, '');
}

/** 关键词匹配：完全一致，或包含关系（如 Agent / Agentic、GLM / GLM-4-Voice） */
export function keywordMatch(left: string, right: string): boolean {
  const a = normalize(left);
  const b = normalize(right);
  if (!a || !b) return false;
  if (a === b) return true;
  if (Math.min(a.length, b.length) >= 2 && (a.includes(b) || b.includes(a))) return true;
  return false;
}

function overlap(left: string[] = [], right: string[] = []): string[] {
  return [...new Set(left)].filter((item) =>
    right.some((candidate) => keywordMatch(item, candidate)),
  );
}

/** 已生成语义数据的条目数（用于 UI 说明） */
export function getSemanticEntryCount(): number {
  return Object.keys(LINKS).length;
}

export interface SemanticSimilarity {
  score: number;
  reasons: string[];
  sharedThemes: string[];
  sharedKeywords: string[];
}

/** 两条条目的 AI 语义相似度（0–10 分） */
export function semanticSimilarity(leftId: string, rightId: string): SemanticSimilarity {
  const left = LINKS[leftId];
  const right = LINKS[rightId];
  if (!left || !right) return { score: 0, reasons: [], sharedThemes: [], sharedKeywords: [] };

  const sharedThemes = overlap(left.themes, right.themes);
  const sharedKeywords = overlap(left.keywords, right.keywords);
  const score =
    Math.min(6, sharedThemes.length * 2) + Math.min(4.5, sharedKeywords.length * 1.5);
  const reasons: string[] = [];
  if (sharedThemes.length > 0) reasons.push(`AI 主题：${sharedThemes.slice(0, 3).join('、')}`);
  if (sharedKeywords.length > 0) reasons.push(`AI 关键词：${sharedKeywords.slice(0, 4).join('、')}`);

  return {
    score: Math.round(score * 10) / 10,
    reasons,
    sharedThemes,
    sharedKeywords,
  };
}
