// 用 glob 可选加载：干净 clone（未运行 ai:links）时文件不存在也不会让测试/构建失败
const AI_LINK_MODULES = import.meta.glob<{ default: Record<string, AiLinkInfo> }>(
  '../generated/ai-links.json',
  { eager: true },
);

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

const LINKS: Record<string, AiLinkInfo> =
  Object.values(AI_LINK_MODULES)[0]?.default ?? {};

export function hasSemanticLayer(): boolean {
  return Object.keys(LINKS).length > 0;
}

export function getAiLinkInfo(id: string): AiLinkInfo | undefined {
  return LINKS[id];
}

function normalize(token: string): string {
  return token.trim().toLowerCase().replace(/\s+/g, ' ');
}

function overlap(left: string[] = [], right: string[] = []): string[] {
  const rightSet = new Set(right.map(normalize));
  return [...new Set(left)]
    .filter((item) => item.trim().length > 0)
    .filter((item) => rightSet.has(normalize(item)));
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
