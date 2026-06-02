import { useId, useState } from 'react';

interface InfoTooltipProps {
  text: string;
  label?: string;
}

/**
 * Small "?" affordance that reveals an explanation on hover/focus.
 * Used throughout the app to explain token concepts and assumptions.
 */
export function InfoTooltip({ text, label = 'Erklärung' }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="grid h-4 w-4 place-items-center rounded-full border border-border bg-surface-2 text-[10px] font-bold text-muted transition-colors hover:border-primary hover:text-primary"
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-20 mb-2 w-60 -translate-x-1/2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-normal leading-relaxed text-text shadow-xl"
        >
          {text}
        </span>
      )}
    </span>
  );
}
