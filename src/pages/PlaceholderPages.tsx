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
