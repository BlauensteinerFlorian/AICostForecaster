import type { ReactNode } from 'react';
import { InfoTooltip } from './InfoTooltip';

interface SectionProps {
  title: string;
  step?: number;
  info?: string;
  actions?: ReactNode;
  children: ReactNode;
}

/** A titled card used as the main layout building block. */
export function Section({ title, step, info, actions, children }: SectionProps) {
  return (
    <section className="rounded-card border border-border bg-surface/80 p-5 shadow-sm backdrop-blur">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-text">
          {step !== undefined && (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-fg">
              {step}
            </span>
          )}
          {title}
          {info && <InfoTooltip text={info} />}
        </h2>
        {actions}
      </header>
      {children}
    </section>
  );
}
