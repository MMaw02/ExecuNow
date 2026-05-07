import { ArrowUpRight, GripVertical, Pause, Play } from "lucide-react";
import type { MouseEvent } from "react";
import { PomodoroIndicator } from "../pomodoro/PomodoroIndicator.tsx";
import type { PomodoroSettings } from "../pomodoro/pomodoro.types.ts";
import { Button } from "../../shared/components/ui/button.tsx";
import { cn } from "../../shared/lib/cn.ts";
import { formatClock } from "../../shared/utils/formatClock.ts";

export type SessionWidgetViewProps = {
  elapsedFocusSeconds: number;
  focusStateLabel: string;
  onReturnToMain(): void;
  onTogglePause(): void;
  onWidgetMouseDown(event: MouseEvent<HTMLElement>): void;
  pauseDisabled: boolean;
  remainingSeconds: number;
  sessionDuration: number;
  sessionActive: boolean;
  sessionPomodoroSettings: PomodoroSettings;
  statusLabel: string;
  strictBlocking: boolean;
  title: string;
};

export function SessionWidgetView({
  elapsedFocusSeconds,
  focusStateLabel,
  onReturnToMain,
  onTogglePause,
  onWidgetMouseDown,
  pauseDisabled,
  remainingSeconds,
  sessionDuration,
  sessionActive,
  sessionPomodoroSettings,
  statusLabel,
  strictBlocking,
  title,
}: SessionWidgetViewProps) {
  const paused = focusStateLabel === "PAUSE";
  const onBreak = focusStateLabel === "BREAK";
  const taskDetailsAvailable = sessionActive && sessionDuration > 0;
  const durationLabel = sessionDuration > 0 ? `${sessionDuration} min` : "No active block";
  const sessionTone = sessionActive
    ? "border-[rgba(78,222,163,0.22)] bg-[rgba(78,222,163,0.12)] text-[rgba(180,255,223,0.96)]"
    : "border-[rgba(140,170,222,0.18)] bg-[rgba(140,170,222,0.08)] text-[rgba(212,225,246,0.92)]";
  const blockingTone = strictBlocking
    ? "border-[rgba(25,120,229,0.24)] bg-[rgba(25,120,229,0.12)] text-[rgba(197,223,255,0.94)]"
    : "border-white/10 bg-white/6 text-[rgba(212,225,246,0.72)]";
  const timerToneClassName =
    paused || onBreak ? "text-[var(--accent-support)]" : "text-[var(--accent-success)]";

  return (
    <main className="h-screen w-screen overflow-hidden p-2 text-foreground">
      <section
        className="grid h-full w-full grid-cols-[28px_minmax(0,1fr)_42px] items-center gap-3 rounded-[22px] border border-[rgba(140,170,222,0.18)] bg-[linear-gradient(135deg,rgba(15,34,62,0.97),rgba(6,17,34,0.95))] px-3 py-3 text-foreground shadow-[0_16px_38px_rgba(0,0,0,0.24)] backdrop-blur-[18px]"
        onMouseDown={onWidgetMouseDown}
        data-tauri-drag-region
      >
        <div className="flex h-full select-none items-center justify-center text-[rgba(140,170,222,0.62)]">
          <GripVertical size={16} aria-hidden="true" />
        </div>

        <div className="grid min-w-0 grid-cols-[200px_minmax(0,1fr)] items-center gap-3">
          <div className="relative grid gap-1.5 overflow-hidden rounded-[18px] border border-[rgba(25,120,229,0.24)] bg-[linear-gradient(135deg,rgba(12,38,72,0.98),rgba(7,22,43,0.94))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-[radial-gradient(circle_at_center,rgba(78,222,163,0.2),transparent_72%)]" />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[rgba(140,170,222,0.82)]">
                Session Timer
              </span>
              <span className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-[rgba(212,225,246,0.62)]">
                {focusStateLabel}
              </span>
            </div>
            <span
              className={cn(
                "text-[2.45rem] font-semibold leading-none tracking-[-0.09em] tabular-nums",
                timerToneClassName,
              )}
            >
              {formatClock(remainingSeconds)}
            </span>
            <div className="h-px rounded-full bg-[linear-gradient(90deg,rgba(78,222,163,0.9),rgba(78,222,163,0.08))]" />
          </div>

          <div className="grid min-w-0 gap-1.5 select-none">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.16em]",
                  sessionTone,
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {sessionActive ? "Live" : "Standby"}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.16em]",
                  blockingTone,
                )}
              >
                {strictBlocking ? "Strict" : "Soft"}
              </span>
            </div>

            <strong className="truncate text-[1.06rem] font-semibold leading-none tracking-[-0.04em] text-foreground">
              {title}
            </strong>

            {taskDetailsAvailable ? (
              <div className="flex min-w-0 items-center gap-2 text-[0.74rem] text-muted-foreground">
                <PomodoroIndicator
                  taskMinutes={sessionDuration}
                  timeCompletedMinutes={elapsedFocusSeconds / 60}
                  settings={sessionPomodoroSettings}
                  size="compact"
                  className="shrink-0"
                />
                <span className="truncate">{durationLabel}</span>
                <span className="h-1 w-1 shrink-0 rounded-full bg-white/14" />
                <span className="truncate">{statusLabel}</span>
              </div>
            ) : (
              <p className="truncate text-[0.74rem] text-muted-foreground">{statusLabel}</p>
            )}
          </div>
        </div>

        <div className="grid gap-2" data-widget-no-drag>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-[14px] border border-white/8 bg-[rgba(255,255,255,0.05)] text-[rgba(202,252,229,0.94)] hover:bg-white/[0.09] hover:text-white"
            onClick={onTogglePause}
            disabled={!sessionActive || pauseDisabled}
            data-widget-no-drag
            aria-label={paused ? "Resume session" : "Pause session"}
            title={paused ? "Resume session" : "Pause session"}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-[14px] border border-white/8 bg-[rgba(255,255,255,0.04)] text-[var(--accent-support)] hover:bg-white/[0.09] hover:text-white"
            onClick={onReturnToMain}
            data-widget-no-drag
            aria-label="Open main app"
            title="Open main app"
          >
            <ArrowUpRight size={16} />
          </Button>
        </div>
      </section>
    </main>
  );
}
