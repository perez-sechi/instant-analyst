interface KpiCardProps {
  icon: string;
  iconColor: string;
  iconBackground: string;
  label: string;
  value: string;
  note?: string;
}

export default function KpiCard({
  icon,
  iconColor,
  iconBackground,
  label,
  value,
  note,
}: KpiCardProps) {
  return (
    <article className="kpi-card">
      <div
        className="kpi-card__icon"
        style={{ background: iconBackground, color: iconColor }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <span className="kpi-card__label">{label}</span>
      <div className="kpi-card__value-row">
        <span className="kpi-card__value">{value}</span>
        {note !== undefined && <span className="kpi-card__note">{note}</span>}
      </div>
    </article>
  );
}
