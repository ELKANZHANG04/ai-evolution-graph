import { TypeBadge } from '../components/common/Badges';

interface PlaceholderProps {
  title: string;
  subtitle: string;
  milestone: string;
  plan: string[];
  note: string;
}

function Placeholder({ title, subtitle, milestone, plan, note }: PlaceholderProps) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-card">
        <div className="placeholder-kicker">
          <TypeBadge type="event" />
          <span className="chip mono" style={{ color: 'var(--accent)' }}>
            {milestone} 交付
          </span>
        </div>
        <h1>{title}</h1>
        <p className="placeholder-sub">{subtitle}</p>
        <ul className="placeholder-plan">
          {plan.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="placeholder-note">{note}</p>
      </div>
    </div>
  );
}

export function GraphPage() {
  return (
    <Placeholder
      title="关系图谱"
      subtitle="力导向图：节点 = 事件 / 模型 / 论文 / 产品 / 公司 / 人物，边 = 关系。点击节点高亮完整上下游影响链。"
      milestone="M2"
      plan={[
        '节点大小 = 影响力，颜色 = 类别，边线型 = 关系类型（基于/启发/竞争/开源衍生/人才流动）',
        '点击 Transformer 自动高亮 BERT、GPT 系、ViT 等下游影响链',
        '按年份 / 类别 / 关键词过滤；构建期预计算坐标，保证不抖动',
        '移动端降级为影响链列表',
      ]}
      note="M1 先交付时间轴主视图与详情抽屉；关系图谱在 M2 上线。"
    />
  );
}

export function FeedPage() {
  return (
    <Placeholder
      title="最新动态"
      subtitle="倒序事件卡片流，可筛选最近 7 / 30 天，回答「今天发生了什么」。"
      milestone="M3"
      plan={[
        '每日增量更新：新条目入库后自动出现在流顶部（NEW 标记）',
        '7 / 30 天时间窗筛选；无近期数据时展示「最近更新于 …」',
        '卡片含类别色条、影响力徽标、待核对角标，点击开详情',
        '与思想库共用筛选状态与 URL 深链',
      ]}
      note="每日更新流程在 M2 与数据扩量一起上线。"
    />
  );
}

export function InsightsPage() {
  return (
    <Placeholder
      title="思想库"
      subtitle="type = insight 的卡片墙：观点原文、说话人、场合、来源，以及深度解读。"
      milestone="M3"
      plan={[
        '观点原文大字排版，突出「谁在什么场合说了什么」',
        '每条思想包含 300–800 字深度解读（背景 / 核心观点 / 为什么今天还要读）',
        '关联到影响链条上的模型与产品，可一键跳转',
        '每日更新优先收录新思想、新动向',
      ]}
      note="思想条目要细——这是本项目的价值重点之一。"
    />
  );
}
