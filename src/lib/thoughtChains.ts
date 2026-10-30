import type { Entry, ThoughtRole } from './types';

/**
 * 思想看板配置：每条链是一条"命题 → 推进 → 修正/反驳"的演进路径。
 * 步骤可以引用 insight（大字引用原文）或 event/product（紧凑事件卡）；
 * 条目的 thought_chain 字段与本配置一致时，会按日期自动追加到链尾。
 */
export interface ThoughtStepConfig {
  entryId: string;
  role: ThoughtRole;
  /** 箭头文案（缺省按 role 生成） */
  arrow?: string;
}

export interface ThoughtChainConfig {
  id: string;
  title: string;
  question: string;
  description: string;
  steps: ThoughtStepConfig[];
  /** 相关模型实践（链底部 chips） */
  context: string[];
}

export const THOUGHT_CHAIN_CONFIGS: ThoughtChainConfig[] = [
  {
    id: 'architecture',
    title: '架构与范式',
    question: '模型结构的下一次收敛，会发生在哪里？',
    description:
      '从 AlexNet 的卷积、ResNet 的残差到 Transformer 的注意力，架构曾是十年里最清晰的进步叙事；此后 MoE、线性注意力、状态空间模型与多模态融合轮番登场——"什么结构才配得上通用智能"始终没有定论，讨论一直延续到今天。',
    steps: [],
    context: ['transformer-2017', 'vit-2020', 'deepseek-v3-2024'],
  },
  {
    id: 'interaction',
    title: '交互范式',
    question: '人和 AI 的对话，必须是"轮流说话"吗？',
    description:
      'ChatGPT 把对话变成入口，GPT-4o 让语音接近实时；而全双工、可被打断、主动插话的"持续在场"交互，正把回合制对话推向新范式——这条线从 2022 一路讨论到 2026。',
    steps: [],
    context: ['chatgpt-2022', 'gpt-4o-2024', 'character-ai-2022'],
  },
  {
    id: 'generative-decision',
    title: '生成式决策',
    question: '计划一旦写下，就不能改吗？',
    description:
      '从 Decision Transformer 把序列决策写成序列预测，到扩散语言模型把"计划"变成可编辑状态——新证据到来时只重建受影响的部分；agent 的推理路径与算力分配正在被重新设计，讨论持续升温。',
    steps: [],
    context: ['gato-2022', 'o1-2024', 'mcp-2024'],
  },
  {
    id: 'memory',
    title: '记忆与持续学习',
    question: '模型如何记住，并持续变强？',
    description:
      '上下文窗口越做越长，外挂记忆仍只是权宜之计；嵌套学习、睡眠时计算与持续学习架构，尝试让模型"边用边学"而不是停在训练截止日——这是近两年最持续的追问之一。',
    steps: [],
    context: ['gpt-4-2023', 'notebooklm-2023', 'mcp-2024'],
  },
  {
    id: 'evaluation',
    title: '评估与安全',
    question: '如何审计越来越自主的系统？',
    description:
      '从 MMLU、HELM 到 Chatbot Arena、SWE-bench，评估从"跑分"变成工程；当 agent 能自己行动，红队、可复现审计与可扩展监督成为评估的新前线，讨论一直延续到 2026。',
    steps: [],
    context: ['eu-ai-act-2024', 'openai-model-spec-update-2026', 'o1-2024'],
  },
  {
    id: 'scaling',
    title: '规模与泛化',
    question: '算力、数据与参数，能一直放大下去吗？',
    description:
      '从「通用方法 × 算力」的信念，到可预测的 Scaling Laws、Chinchilla 的数据修正，再到推理时计算的分叉——规模这条主线从未停止被质疑，也从未停止给出新答案。',
    steps: [
      { entryId: 'sutton-bitter-lesson-2019', role: 'thesis' },
      { entryId: 'scaling-laws-2020', role: 'advance', arrow: '实证化：loss 可预测' },
      { entryId: 'chinchilla-paper-2022', role: 'revision', arrow: '修正：数据也要等比放大' },
      { entryId: 'o1-2024', role: 'advance', arrow: '分叉：把算力花在推理上' },
    ],
    context: ['gpt-3-2020', 'deepseek-r1-2025', 'o3-2025'],
  },
  {
    id: 'software',
    title: '软件形态',
    question: '写代码的下一层抽象是什么？',
    description:
      'Karpathy 用「Software 1.0 → 2.0 → 3.0」描述编程抽象的三次跃迁：从显式规则到神经网络权重，再到自然语言意图；coding agent 与 vibe coding 正把这场讨论推进到 2026。',
    steps: [
      { entryId: 'karpathy-software-2-0-2017', role: 'thesis' },
      { entryId: 'karpathy-software-3-0-2025', role: 'advance', arrow: '升级：自然语言即程序' },
    ],
    context: ['codex-2021', 'cursor-2023', 'spec-driven-development-2025'],
  },
  {
    id: 'worldmodel',
    title: '世界模型 vs 语言模型',
    question: '通向通用智能，是理解世界，还是预测下一个 token？',
    description:
      'LeCun 主张必须建立可预测世界的内部模型；自回归大模型与视频生成路线则用规模与数据给出另一条反例——从世界模型到 Sora、Genie，两条路线至今仍在拉扯。',
    steps: [
      { entryId: 'lecun-world-model-2022', role: 'advance', arrow: '推进：世界模型的路线图' },
      { entryId: 'gpt-4-2023', role: 'rebuttal', arrow: '反例：自回归大模型路线胜出' },
      { entryId: 'sora-2024', role: 'advance', arrow: '落地：视频生成的世界模拟' },
    ],
    context: ['sora-2024', 'sora-2-2025', 'genie-4-2026'],
  },
  {
    id: 'alignment',
    title: '对齐与安全',
    question: '如何让强大的模型可靠、可监督？',
    description:
      '从 RLHF、宪法 AI 到可扩展监督与红队评测：对齐从"调参技巧"变成决定模型能否上线、由谁承担风险的工程与治理问题；监管与规范讨论持续到今天。',
    steps: [],
    context: ['rlhf-instructgpt-2022', 'constitutional-ai-2022', 'openai-model-spec-update-2026'],
  },
  {
    id: 'agents',
    title: '智能体与交互',
    question: '人机交互的下一个形态是什么？',
    description:
      '从对话框到能自主规划、调用工具、长时间运行的智能体；MCP 等协议、权限、信任与验收标准，正在成为产品竞争的新焦点，也是 2024 年以来最热的工程讨论。',
    steps: [],
    context: ['mcp-2024', 'cursor-2023', 'openai-devday-2026'],
  },
  {
    id: 'opensource',
    title: '开源与闭源',
    question: '前沿能力应该开放吗？',
    description:
      'LLaMA 开启权重开放潮，DeepSeek、Qwen、Mistral 等开源模型持续逼近前沿；闭源厂商则把最强模型留在 API 后面——开源与闭源的分界线一直在移动。',
    steps: [
      { entryId: 'llama-2023', role: 'thesis' },
      { entryId: 'deepseek-r1-2025', role: 'advance', arrow: '冲击：开源推理模型追平前沿' },
      { entryId: 'gpt-5-2025', role: 'rebuttal', arrow: '回应：闭源继续守前沿' },
    ],
    context: ['mistral-7b-2023', 'llama-4-2025', 'mistral-large-4-2026'],
  },
];

export interface ThoughtStepData {
  entry: Entry;
  role: ThoughtRole;
  arrow: string;
}

export interface ThoughtChainData extends Omit<ThoughtChainConfig, 'steps' | 'context'> {
  steps: ThoughtStepData[];
  context: Entry[];
  /** 新条目（thought_chain 命中但未写进配置）自动追加的条数 */
  extraCount: number;
}

const ROLE_ARROW: Record<ThoughtRole, string> = {
  thesis: '命题',
  advance: '推进',
  revision: '修正',
  rebuttal: '反驳',
};

export const ROLE_LABEL: Record<ThoughtRole, string> = {
  thesis: '命题',
  advance: '推进',
  revision: '修正',
  rebuttal: '反驳',
};

export function roleLabel(role: ThoughtRole): string {
  return ROLE_LABEL[role] ?? role;
}

/** 构建思想看板数据：配置步骤 + 按 thought_chain 自动补充的条目 */
export function buildThoughtChains(entries: readonly Entry[]): ThoughtChainData[] {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  return THOUGHT_CHAIN_CONFIGS.map((config) => {
    const configured = new Set(config.steps.map((step) => step.entryId));
    const steps: ThoughtStepData[] = [];

    for (const step of config.steps) {
      const entry = byId.get(step.entryId);
      if (!entry) continue;
      steps.push({
        entry,
        role: step.role,
        arrow: step.arrow ?? ROLE_ARROW[step.role],
      });
    }

    const extras = entries
      .filter((entry) => entry.thought_chain === config.id && !configured.has(entry.id))
      .sort((a, b) => a.date.localeCompare(b.date));

    let extraCount = 0;
    for (const entry of extras) {
      const role = entry.thought_role ?? 'advance';
      steps.push({ entry, role, arrow: ROLE_ARROW[role] });
      extraCount += 1;
    }

    // 很新的路线置顶；其余按时间排序
    const pinned = (step: ThoughtStepData) => (step.entry.thought_pin === 'top' ? 0 : 1);
    steps.sort(
      (a, b) => pinned(a) - pinned(b) || a.entry.date.localeCompare(b.entry.date),
    );

    const context = config.context
      .map((id) => byId.get(id))
      .filter((entry): entry is Entry => entry !== undefined);

    return { ...config, steps, context, extraCount };
  });
}

export function thoughtChainCount(entries: readonly Entry[]): number {
  return entries.filter((entry) => entry.type === 'insight').length;
}
