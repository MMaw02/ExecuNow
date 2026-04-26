import { useEffect, useMemo, useState } from "react";
import { Pause, Square, TimerOff } from "lucide-react";
import { Button } from "../../../shared/components/ui/button.tsx";
import {
  eyebrowClassName,
  summaryLabelClassName,
  supportTextClassName,
} from "../../../shared/components/ui/styles.ts";
import { cn } from "../../../shared/lib/cn.ts";
import { formatClock } from "../../../shared/utils/formatClock.ts";
import { PomodoroIndicator } from "../../pomodoro/PomodoroIndicator.tsx";
import { getPomodoroSessionTimeline } from "../../pomodoro/pomodoro.model.ts";
import type {
  PomodoroSessionPhase,
  PomodoroSettings,
} from "../../pomodoro/pomodoro.types.ts";
import type { SessionOutcome } from "../session.types.ts";

const LOCAL_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

type ActiveSessionViewProps = {
  remainingSeconds: number;
  sessionTask: string;
  sessionDuration: number;
  sessionPomodoroSettings: PomodoroSettings;
  sessionPhase: PomodoroSessionPhase;
  sessionSegmentIndex: number;
  elapsedFocusSeconds: number;
  focusedMinutes: number;
  isPaused: boolean;
  pauseUsed: boolean;
  strictBlocking: boolean;
  onTogglePause: () => void;
  onCloseSession: (result: SessionOutcome) => void;
  onOpenWidget: () => void;
};

export function ActiveSessionView({
  remainingSeconds,
  sessionTask,
  sessionDuration,
  sessionPomodoroSettings,
  sessionPhase,
  sessionSegmentIndex,
  elapsedFocusSeconds,
  focusedMinutes,
  isPaused,
  pauseUsed,
  strictBlocking,
  onTogglePause,
  onCloseSession,
  onOpenWidget,
}: ActiveSessionViewProps) {
  const [localTime, setLocalTime] = useState(() => new Date());
  const pomodoroTimeline = useMemo(
    () => getPomodoroSessionTimeline(sessionDuration, sessionPomodoroSettings),
    [sessionDuration, sessionPomodoroSettings],
  );
  const pomodoroBreakdown = pomodoroTimeline.breakdown;
  const currentSegment =
    pomodoroTimeline.segments[sessionSegmentIndex] ??
    pomodoroTimeline.segments[pomodoroTimeline.segments.length - 1] ??
    null;
  const isBreakPhase = sessionPhase === "break";
  const currentBlockNumber = currentSegment ? currentSegment.pomodoroIndex + 1 : 1;
  const phaseLabel = isBreakPhase
    ? `Break ${Math.min(currentBlockNumber, pomodoroBreakdown.breakCount)} of ${pomodoroBreakdown.breakCount}`
    : `Focus ${currentBlockNumber} of ${pomodoroBreakdown.pomodoroCount}`;
  const phaseMinutes = Math.max(Math.round((currentSegment?.durationSeconds ?? 0) / 60), 0);

  useEffect(() => {
    let timerId = 0;

    const scheduleUpdate = () => {
      const now = new Date();
      const delay =
        (59 - now.getSeconds()) * 1000 + (1000 - now.getMilliseconds());
      timerId = window.setTimeout(() => {
        setLocalTime(new Date());
        scheduleUpdate();
      }, Math.max(delay, 250));
    };

    scheduleUpdate();

    return () => window.clearTimeout(timerId);
  }, []);

  const sessionStatusLabel = isPaused
    ? "Paused"
    : isBreakPhase
      ? "Recovery block live"
    : strictBlocking
      ? "Strict focus live"
      : "Focus block live";

  const supportHint = isBreakPhase
    ? "The next focus block starts automatically when this break ends."
    : pauseUsed
      ? isPaused
        ? "Resume when ready. This session has used its only pause."
        : "Pause already used for this session."
      : "One short pause is available if execution stalls.";

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(25,120,229,0.14),transparent_26%),linear-gradient(180deg,#06121f_0%,#08111b_100%)] text-foreground">
      <div className="grid min-h-screen grid-rows-[auto_1fr_auto] gap-8 px-5 py-5 sm:px-6 md:px-8 md:py-7 xl:px-12 xl:py-10">
        <header className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            <span className={eyebrowClassName}>Local Time</span>
            <strong className="text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl">
              {formatLocalTime(localTime)}
            </strong>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="border-border/70 bg-background/10 px-5 text-foreground/85 backdrop-blur-sm"
            onClick={onOpenWidget}
          >
            Open Widget
          </Button>
        </header>

        <main className="grid place-items-center py-4">
          <div className="grid w-full max-w-6xl justify-items-center gap-6 text-center">
            <span className={eyebrowClassName}>{sessionStatusLabel}</span>

            <div className="grid max-w-4xl gap-3">
              <h1 className="text-balance text-3xl font-semibold tracking-[-0.05em] text-foreground sm:text-4xl md:text-5xl xl:text-6xl">
                {sessionTask}
              </h1>
              <div className="grid justify-items-center gap-3">
                <PomodoroIndicator
                  taskMinutes={sessionDuration}
                  timeCompletedMinutes={elapsedFocusSeconds / 60}
                  settings={sessionPomodoroSettings}
                  className="justify-center"
                />
                <p className={cn(supportTextClassName, "mx-auto max-w-2xl text-center text-sm")}>
                  {phaseLabel}
                  {phaseMinutes > 0 ? ` • ${phaseMinutes} min block` : ""}
                  {pomodoroBreakdown.breakCount > 0
                    ? ` • ${pomodoroBreakdown.breakCount} scheduled break${pomodoroBreakdown.breakCount === 1 ? "" : "s"}`
                    : " • Continuous focus"}
                </p>
              </div>
            </div>

            <div
              className={cn(
                "text-[clamp(5rem,16vw,15rem)] font-semibold leading-[0.88] tracking-[-0.09em] tabular-nums",
                isBreakPhase ? "text-[var(--accent-support)]" : "text-foreground",
              )}
            >
              {formatClock(remainingSeconds)}
            </div>

            <p className={cn(supportTextClassName, "max-w-xl text-center")}>{supportHint}</p>

            <div className="flex w-full max-w-4xl flex-col items-stretch justify-center gap-3 pt-2 md:flex-row">
              <Button
                variant="default"
                size="lg"
                className="h-14 flex-1 text-base md:h-16"
                onClick={() => onCloseSession("completed")}
              >
                <Square size={16} fill="currentColor" />
                Complete Session
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="h-14 flex-1 text-base md:h-16"
                onClick={onTogglePause}
                disabled={pauseUsed && !isPaused}
              >
                <Pause size={16} />
                {isPaused ? "Resume" : pauseUsed ? "Pause used" : "Pause once"}
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="h-14 flex-1 text-base md:h-16"
                onClick={() => onCloseSession("abandoned")}
              >
                <TimerOff size={16} />
                Abandon
              </Button>
            </div>
          </div>
        </main>

        <footer className="grid gap-3 md:grid-cols-3">
          <MetricPanel
            label="Focused Time"
            value={formatFocusedMinutes(focusedMinutes)}
            detail="Total captured across saved sessions plus this live block."
          />
          <MetricPanel
            label="Current Block"
            value={phaseLabel}
            detail={
              isBreakPhase
                ? "Recovery is part of the execution plan, not a drift window."
                : strictBlocking
                  ? "Notification filtering and blocking stay firm."
                  : "Blocking is visible but less restrictive."
            }
          />
          <MetricPanel
            label="Session Plan"
            value={`${pomodoroBreakdown.pomodoroCount}P / ${pomodoroBreakdown.breakCount}B`}
            detail={`${pomodoroBreakdown.totalMinutesWithBreaks} total minutes including breaks.`}
          />
        </footer>
      </div>
    </section>
  );
}

function MetricPanel({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="grid gap-2 rounded-[var(--radius-large)] border border-border/70 bg-background/20 px-4 py-4 backdrop-blur-sm sm:px-5 sm:py-5">
      <span className={summaryLabelClassName}>{label}</span>
      <strong className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
        {value}
      </strong>
      <p className={supportTextClassName}>{detail}</p>
    </div>
  );
}

function formatLocalTime(value: Date) {
  return LOCAL_TIME_FORMATTER.format(value);
}

function formatFocusedMinutes(totalMinutes: number) {
  const safeMinutes = Math.max(Math.trunc(totalMinutes), 0);
  return `${safeMinutes} min`;
}
