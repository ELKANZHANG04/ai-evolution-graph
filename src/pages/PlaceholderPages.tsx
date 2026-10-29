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
