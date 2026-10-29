import { describe, expect, it } from 'vitest';
import { entryFrontmatterSchema } from './schema';

const valid = {
  id: 'chatgpt-2022',
  type: 'product' as const,
  title: 'ChatGPT 发布',
  title_en: 'ChatGPT Launch',
  date: '2022-11-30',
  importance: 10,
  categories: ['product'],
  summary: 'OpenAI 发布对话式产品 ChatGPT。',
  significance: '两月内成为现象级产品，开启生成式 AI 大众化。',
  tags: ['openai', 'chatbot'],
  sources: ['https://openai.com/index/chatgpt/'],
  relations: [{ to: 'gpt-3-2020', type: '基于' as const }],
  needs_review: false,
};

describe('entryFrontmatterSchema', () => {
  it('接受合法条目并补齐默认值', () => {
    const parsed = entryFrontmatterSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.quote).toBe('');
      expect(parsed.data.speaker).toBe('');
      expect(parsed.data.occasion).toBe('');
      expect(parsed.data.my_comment).toBe('');
      expect(parsed.data.needs_review).toBe(false);
      expect(parsed.data.sources).toEqual(valid.sources);
    }
  });

  it('拒绝非法日期格式', () => {
    expect(entryFrontmatterSchema.safeParse({ ...valid, date: '2022/11/30' }).success).toBe(false);
    expect(entryFrontmatterSchema.safeParse({ ...valid, date: '2022-11-30T00:00:00Z' }).success).toBe(false);
  });

  it('拒绝非 kebab-case 的 id', () => {
    expect(entryFrontmatterSchema.safeParse({ ...valid, id: 'ChatGPT_2022' }).success).toBe(false);
  });

  it('拒绝越界影响力', () => {
    expect(entryFrontmatterSchema.safeParse({ ...valid, importance: 11 }).success).toBe(false);
    expect(entryFrontmatterSchema.safeParse({ ...valid, importance: 3.5 }).success).toBe(false);
  });

  it('拒绝未知类别与关系类型', () => {
    expect(entryFrontmatterSchema.safeParse({ ...valid, categories: ['unknown'] }).success).toBe(false);
    expect(entryFrontmatterSchema.safeParse({ ...valid, relations: [{ to: 'x', type: '抄袭' }] }).success).toBe(false);
  });

  it('拒绝编造不合法 URL', () => {
    expect(entryFrontmatterSchema.safeParse({ ...valid, sources: ['not-a-url'] }).success).toBe(false);
  });

  it('允许空来源（配合 needs_review）', () => {
    const parsed = entryFrontmatterSchema.safeParse({ ...valid, sources: [], needs_review: true });
    expect(parsed.success).toBe(true);
  });
});
