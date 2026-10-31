import { describe, expect, it } from 'vitest';
import { keywordMatch } from './semantic';

describe('keywordMatch', () => {
  it('完全一致（忽略空格/大小写/连字符）', () => {
    expect(keywordMatch('Agent', 'agent')).toBe(true);
    expect(keywordMatch('GLM-4-Voice', 'glm4voice')).toBe(true);
  });

  it('包含关系也视为相关（Agent / Agentic、语音 / 语音交互）', () => {
    expect(keywordMatch('Agent', 'Agentic')).toBe(true);
    expect(keywordMatch('语音交互', '语音')).toBe(true);
  });

  it('无关关键词不匹配', () => {
    expect(keywordMatch('Chatbot Arena', 'RLHF')).toBe(false);
    expect(keywordMatch('', 'Agent')).toBe(false);
  });
});
