import { Button } from "../../shared/components/ui/button.tsx";
import {
  eyebrowClassName,
} from "../../shared/components/ui/styles.ts";

type TopbarProps = {
  currentLabel: string;
  statusLabel: string;
  onOpenWidget?: () => void;
};

export function Topbar({ currentLabel, statusLabel, onOpenWidget }: TopbarProps) {
  return (
    <header className="flex flex-col gap-3 rounded-[var(--radius-large)] border border-border-subtle bg-white/[0.03] px-4 py-3 shadow-[0_16px_32px_rgba(0,0,0,0.16)] md:flex-row md:items-center md:justify-between md:px-5">
      <div className="grid gap-1">
        <span className={eyebrowClassName}>Workspace</span>
        <strong className="text-lg font-semibold tracking-[-0.02em] text-text-primary">
          {currentLabel}
        </strong>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        {onOpenWidget ? (
          <Button
            variant="secondary"
            className="md:min-w-[140px]"
            onClick={onOpenWidget}
          >
            Open Widget
          </Button>
        ) : null}
        <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-subtle/75 px-3 py-2 text-sm text-text-secondary">
          <span className="h-2.5 w-2.5 rounded-full bg-accent-success" aria-hidden="true" />
          <span>{statusLabel}</span>
        </div>
      </div>
    </header>
  );
}
