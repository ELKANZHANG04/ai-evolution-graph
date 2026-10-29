import { z } from 'zod';
import { CATEGORY_VALUES, ENTRY_TYPES, NODE_KINDS, RELATION_TYPES, THOUGHT_ROLES } from './types';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '必须是 YYYY-MM-DD 格式的日期');

const kebabId = z
  .string()
  .min(2, 'id 至少 2 个字符')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'id 必须是 kebab-case（小写字母/数字/短横线）');

/**
 * frontmatter 结构校验（zod）。
 * 跨字段规则（insight 必填 quote/speaker/occasion、relations 目标存在等）在 scripts/validate.ts 中。
 */
export const entryFrontmatterSchema = z.object({
  id: kebabId,
  type: z.enum(ENTRY_TYPES),
  title: z.string().min(1, 'title 不能为空'),
  title_en: z.string().min(1, 'title_en 不能为空'),
  date: isoDate,
  importance: z.number().int().min(1).max(10),
  categories: z.array(z.enum(CATEGORY_VALUES)).min(1, '至少一个类别'),
  summary: z.string().min(1, 'summary 不能为空'),
  significance: z.string().min(1, 'significance 不能为空'),
  quote: z.string().optional().default(''),
  speaker: z.string().optional().default(''),
  occasion: z.string().optional().default(''),
  my_comment: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  /** 不确定的来源链接一律留空，禁止编造 URL */
  sources: z.array(z.string().url('来源必须是合法 URL')).optional().default([]),
  relations: z
    .array(
      z.object({
        to: kebabId,
        type: z.enum(RELATION_TYPES),
        note: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
  needs_review: z.boolean().optional().default(false),
  node_kind: z.enum(NODE_KINDS).optional(),
  added_at: isoDate.optional(),
  mainline: z.boolean().optional().default(false),
  thought_chain: z.string().min(1).optional(),
  thought_role: z.enum(THOUGHT_ROLES).optional(),
});

export type EntryFrontmatter = z.infer<typeof entryFrontmatterSchema>;
