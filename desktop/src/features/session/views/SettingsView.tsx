import { useMemo } from "react";
import { InfoHint } from "../../../shared/components/InfoHint.tsx";
import { Badge } from "../../../shared/components/ui/badge.tsx";
import { Button } from "../../../shared/components/ui/button.tsx";
import { Card, CardContent } from "../../../shared/components/ui/card.tsx";
import { Label } from "../../../shared/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select.tsx";
import {
  eyebrowClassName,
  listRowClassName,
  pageClassName,
  pageCopyClassName,
  pageHeaderClassName,
  pageTitleClassName,
  rowListClassName,
  sectionHeadingClassName,
  sectionLabelClassName,
  supportTextClassName,
} from "../../../shared/components/ui/styles.ts";
import { usePomodoroSettings } from "../../pomodoro/usePomodoroSettings.ts";

type SettingsViewProps = {
  strictBlocking: boolean;
  sessionFlowLocked: boolean;
  onStrictBlockingToggle: () => void;
};

const POMODORO_PRESETS = [
  { focusMinutes: 15, breakMinutes: 3, label: "15/3" },
  { focusMinutes: 25, breakMinutes: 5, label: "25/5" },
  { focusMinutes: 50, breakMinutes: 10, label: "50/10" },
] as const;

export function SettingsView({
  strictBlocking,
  sessionFlowLocked,
  onStrictBlockingToggle,
}: SettingsViewProps) {
  const { settings: pomodoroSettings, updateSettings: updatePomodoroSettings } =
    usePomodoroSettings();
  const focusOptions = useMemo(
    () => createMinuteRange(10, 120, 5),
    [],
  );
  const breakOptions = useMemo(
    () => [3, ...createMinuteRange(5, 30, 1)],
    [],
  );
  const focusSelectItems = useMemo(
    () =>
      focusOptions.includes(pomodoroSettings.focusMinutes)
        ? focusOptions
        : [pomodoroSettings.focusMinutes, ...focusOptions].sort((left, right) => left - right),
    [focusOptions, pomodoroSettings.focusMinutes],
  );
  const breakSelectItems = useMemo(
    () =>
      breakOptions.includes(pomodoroSettings.breakMinutes)
        ? breakOptions
        : [pomodoroSettings.breakMinutes, ...breakOptions].sort((left, right) => left - right),
    [breakOptions, pomodoroSettings.breakMinutes],
  );

  return (
    <section className={pageClassName}>
      <header className={pageHeaderClassName}>
        <p className={eyebrowClassName}>Settings</p>
        <h1 className={pageTitleClassName}>Keep defaults simple.</h1>
        <p className={pageCopyClassName}>
          Task duration now belongs to Today. Settings only keep the focus rhythm and system rules.
        </p>
      </header>

      <Card className="bg-card/92">
        <CardContent className="grid gap-5 pt-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="grid gap-1.5">
              <div className="flex items-center gap-2">
                <Label>Pomodoro rhythm</Label>
                <InfoHint label="Task rows use these values to show focus blocks and estimated break time." />
              </div>
              <p className={supportTextClassName}>
                Start from a recommended rhythm, then adjust the two values manually if needed.
              </p>
            </div>

            <div className="grid w-full gap-4 md:w-[26rem]">
              <div className="grid gap-2">
                <Label>Recommended presets</Label>
                <div className="grid grid-cols-3 gap-2">
                  {POMODORO_PRESETS.map((preset) => {
                    const isActive =
                      pomodoroSettings.focusMinutes === preset.focusMinutes &&
                      pomodoroSettings.breakMinutes === preset.breakMinutes;

                    return (
                      <Button
                        key={preset.label}
                        type="button"
                        variant={isActive ? "default" : "secondary"}
                        className="h-11"
                        disabled={sessionFlowLocked}
                        onClick={() => {
                          updatePomodoroSettings({
                            focusMinutes: preset.focusMinutes,
                            breakMinutes: preset.breakMinutes,
                          });
                        }}
                      >
                        {preset.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="pomodoro-focus-minutes">Focus</Label>
                <Select
                  value={String(pomodoroSettings.focusMinutes)}
                  onValueChange={(value) => {
                    updatePomodoroSettings({ focusMinutes: Number.parseInt(value, 10) });
                  }}
                  disabled={sessionFlowLocked}
                >
                  <SelectTrigger id="pomodoro-focus-minutes" className="bg-card">
                    <SelectValue placeholder="Select focus minutes" />
                  </SelectTrigger>
                  <SelectContent>
                    {focusSelectItems.map((minutes) => (
                      <SelectItem key={minutes} value={String(minutes)}>
                        {minutes} min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="pomodoro-break-minutes">Break</Label>
                <Select
                  value={String(pomodoroSettings.breakMinutes)}
                  onValueChange={(value) => {
                    updatePomodoroSettings({ breakMinutes: Number.parseInt(value, 10) });
                  }}
                  disabled={sessionFlowLocked}
                >
                  <SelectTrigger id="pomodoro-break-minutes" className="bg-card">
                    <SelectValue placeholder="Select break minutes" />
                  </SelectTrigger>
                  <SelectContent>
                    {breakSelectItems.map((minutes) => (
                      <SelectItem key={minutes} value={String(minutes)}>
                        {minutes} min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/92">
        <CardContent className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
          <div className="grid gap-1.5">
            <div className="flex items-center gap-2">
              <Label>Default blocking</Label>
              <InfoHint label="Strict mode is better when you want the app to reduce drift automatically." />
            </div>
            <p className={supportTextClassName}>Set the starting rule for the next focus block.</p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={strictBlocking ? "warning" : "info"}>
              {strictBlocking ? "Strict" : "Relaxed"}
            </Badge>
            <Button
              variant="outline"
              className="min-w-[120px]"
              onClick={onStrictBlockingToggle}
              disabled={sessionFlowLocked}
            >
              Switch mode
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-card/88">
          <CardContent className="grid gap-4 pt-5">
            <div className={sectionHeadingClassName}>
              <span className={sectionLabelClassName}>Interface</span>
            </div>
            <div className={rowListClassName}>
              <div className={listRowClassName}>
                <strong>Duration entry</strong>
                <span>Manual in Today for each task</span>
              </div>
              <div className={listRowClassName}>
                <strong>Copy</strong>
                <span>Compact labels with optional hints</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/88">
          <CardContent className="grid gap-4 pt-5">
            <div className={sectionHeadingClassName}>
              <span className={sectionLabelClassName}>System</span>
            </div>
            <div className={rowListClassName}>
              <div className={listRowClassName}>
                <strong>Widget</strong>
                <span>Operational, not navigational</span>
              </div>
              <div className={listRowClassName}>
                <strong>Pomodoro sync</strong>
                <span>Shared across main app and widget</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function createMinuteRange(start: number, end: number, step: number) {
  const values: number[] = [];

  for (let value = start; value <= end; value += step) {
    values.push(value);
  }

  return values;
}
