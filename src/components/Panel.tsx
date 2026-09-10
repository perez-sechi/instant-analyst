import type { ReactNode } from 'react';

interface PanelProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function Panel({ title, subtitle, children }: PanelProps) {
  return (
    <section className="panel">
      <div>
        <h2 className="panel__title">{title}</h2>
        <p className="panel__subtitle">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}
