import { Timer } from "lucide-react";
import { cn } from "../../shared/lib/cn.ts";
import {
  getPomodoroBreakdown,
  getPomodoroFillSegments,
} from "./pomodoro.model.ts";
import type {
  PomodoroFillSegments,
  PomodoroSettings,
} from "./pomodoro.types.ts";

type PomodoroIndicatorProps = {
  taskMinutes: number;
  timeCompletedMinutes?: number;
  settings: PomodoroSettings;
  size?: "default" | "compact";
  className?: string;
};

export function PomodoroIndicator({
  taskMinutes,
  timeCompletedMinutes = 0,
  settings,
  size = "default",
  className,
}: PomodoroIndicatorProps) {
  const breakdown = getPomodoroBreakdown(taskMinutes, settings);
  const label = `${breakdown.pomodoroCount} ${
    breakdown.pomodoroCount === 1 ? "Pomodoro" : "Pomodoros"
  }, ${breakdown.breakCount} ${
    breakdown.breakCount === 1 ? "break" : "breaks"
  }, ${breakdown.totalMinutesWithBreaks} minutes with breaks`;

  if (breakdown.pomodoroCount > 3) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-medium leading-none",
          size === "default" ? "h-8 text-[1.08rem]" : "h-7 text-[0.95rem]",
          className,
        )}
        aria-label={label}
        title={label}
      >
        <PomodoroIcon
          segments={getPomodoroFillSegments(taskMinutes, timeCompletedMinutes, settings, 0)}
          size={size}
        />
        <span className="tabular-nums text-rose-300">1</span>
        <span className="px-1 text-muted-foreground/75">/</span>
        <PomodoroIcon
          segments={getPomodoroFillSegments(
            taskMinutes,
            timeCompletedMinutes,
            settings,
            breakdown.pomodoroCount - 1,
          )}
          size={size}
        />
        <span className="tabular-nums text-rose-100">{breakdown.pomodoroCount}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        size === "default" ? "h-8" : "h-7",
        className,
      )}
      aria-label={label}
      title={label}
    >
      {Array.from({ length: breakdown.pomodoroCount }, (_, index) => (
        <PomodoroIcon
          key={index}
          segments={getPomodoroFillSegments(
            taskMinutes,
            timeCompletedMinutes,
            settings,
            index,
          )}
          size={size}
        />
      ))}
    </span>
  );
}

function PomodoroIcon({
  segments,
  size,
}: {
  segments: PomodoroFillSegments;
  size: "default" | "compact";
}) {
  const defaultDegrees = toDegrees(segments.defaultRatio);
  const completedEndDegrees = defaultDegrees + toDegrees(segments.completedRatio);
  const background = `conic-gradient(rgb(55 65 81) 0deg ${defaultDegrees}deg, rgb(244 63 94) ${defaultDegrees}deg ${completedEndDegrees}deg, rgb(209 213 219) ${completedEndDegrees}deg 360deg)`;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-rose-100/25 text-rose-50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]",
        size === "default" ? "h-7 w-7" : "h-6 w-6",
      )}
      aria-hidden="true"
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{ background, transform: "scaleX(-1)" }}
      />
      <Timer
        className="relative z-10 mb-0.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]"
        size={size === "default" ? 15 : 13}
        strokeWidth={2.5}
      />
    </span>
  );
}

function toDegrees(ratio: number) {
  return Math.round(Math.min(Math.max(ratio, 0), 1) * 360);
}
