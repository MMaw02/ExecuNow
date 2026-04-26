import { GripVertical, Pause, Play, X } from "lucide-react";
import type { MouseEvent } from "react";
import { Button } from "../../shared/components/ui/button.tsx";
import { formatClock } from "../../shared/utils/formatClock.ts";
import type { SessionWidgetShellVariant } from "../widget/widget.runtime.ts";

export type SessionWidgetViewProps = {
  focusStateLabel: string;
  onReturnToMain(): void;
  onTogglePause(): void;
  onWidgetMouseDown(event: MouseEvent<HTMLElement>): void;
  pauseDisabled: boolean;
  remainingSeconds: number;
  sessionActive: boolean;
  shellVariant: SessionWidgetShellVariant;
  statusLabel: string;
  title: string;
};

export function SessionWidgetView({
  focusStateLabel,
  onReturnToMain,
  onTogglePause,
  onWidgetMouseDown,
  pauseDisabled,
  remainingSeconds,
  sessionActive,
  shellVariant,
  statusLabel,
  title,
}: SessionWidgetViewProps) {
  const shellClassName =
    shellVariant === "stable-windows"
      ? "border-[rgba(140,170,222,0.2)] bg-[rgba(7,22,44,0.98)]"
      : "border-[rgba(140,170,222,0.18)] bg-[rgba(4,17,36,0.82)] backdrop-blur-[8px]";
  const chromeClassName =
    shellVariant === "stable-windows"
      ? "border-white/8 bg-[rgba(255,255,255,0.04)]"
      : "border-white/6 bg-white/[0.03]";
  const timerPanelClassName =
    shellVariant === "stable-windows"
      ? "border-[rgba(25,120,229,0.28)] bg-[rgba(10,33,66,0.96)]"
      : "border-[rgba(25,120,229,0.26)] bg-[rgba(13,38,72,0.76)]";

  return (
    <main
      className={
        shellVariant === "stable-windows"
          ? "grid h-screen w-screen place-items-center overflow-hidden bg-[linear-gradient(180deg,rgba(7,22,44,0.98),rgba(4,17,36,0.98))] p-3"
          : "grid h-screen w-screen place-items-center overflow-hidden bg-transparent p-3"
      }
    >
      <section
        className={`grid h-[96px] w-full max-w-[820px] grid-cols-[92px_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-[10px] border px-4 py-3 text-foreground shadow-none ${shellClassName}`}
        onMouseDown={onWidgetMouseDown}
        data-tauri-drag-region
      >
        <div
          className={`flex h-full select-none items-center justify-center rounded-[8px] text-[rgba(78,222,163,0.72)] ${chromeClassName}`}
        >
          <GripVertical size={22} aria-hidden="true" />
        </div>

        <div className="grid min-w-0 gap-1.5 select-none">
          <span className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-[var(--accent-support)]">
            Active Mission
          </span>
          <strong className="truncate text-[2rem] font-semibold leading-none tracking-[-0.06em] text-foreground">
            {title}
          </strong>
          <p className="truncate text-xs text-muted-foreground">{statusLabel}</p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={`h-12 w-12 rounded-[8px] text-[var(--accent-success)] hover:bg-white/[0.07] hover:text-[color-mix(in_srgb,var(--accent-success)_78%,white)] ${chromeClassName}`}
          onClick={onTogglePause}
          disabled={!sessionActive || pauseDisabled}
          data-widget-no-drag
        >
          {focusStateLabel === "PAUSE" ? <Play size={20} /> : <Pause size={20} />}
        </Button>

        <div className="flex items-center gap-3" data-widget-no-drag>
          <div className={`grid min-w-[178px] gap-2 rounded-[8px] border px-4 py-3 ${timerPanelClassName}`}>
            <div className="flex items-end gap-2 font-semibold leading-none">
              <span className="text-[2.1rem] tracking-[-0.08em] text-[var(--accent-success)] tabular-nums">
                {formatClock(remainingSeconds)}
              </span>
              <span className="pb-1 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-[rgba(78,222,163,0.72)]">
                {focusStateLabel}
              </span>
            </div>
            <div className="h-1 rounded-full bg-[var(--accent-success)]" />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={`h-12 w-12 rounded-[8px] text-[var(--accent-support)] hover:bg-white/[0.07] hover:text-white ${chromeClassName}`}
            onClick={onReturnToMain}
            data-widget-no-drag
          >
            <X size={20} />
          </Button>
        </div>
      </section>
    </main>
  );
}
