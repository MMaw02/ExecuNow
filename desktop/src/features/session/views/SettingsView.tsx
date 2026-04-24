import { useEffect, useState, type ChangeEvent } from "react";
import { InfoHint } from "../../../shared/components/InfoHint.tsx";
import { Badge } from "../../../shared/components/ui/badge.tsx";
import { Button } from "../../../shared/components/ui/button.tsx";
import { Card, CardContent } from "../../../shared/components/ui/card.tsx";
import { Input } from "../../../shared/components/ui/input.tsx";
import { Label } from "../../../shared/components/ui/label.tsx";
import { ToggleGroup, ToggleGroupItem } from "../../../shared/components/ui/toggle-group.tsx";
import {
  MIN_POMODORO_BREAK_MINUTES,
  MIN_POMODORO_FOCUS_MINUTES,
} from "../../pomodoro/pomodoro.model.ts";
import { usePomodoroSettings } from "../../pomodoro/usePomodoroSettings.ts";
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
  validationTextClassName,
} from "../../../shared/components/ui/styles.ts";
import { DURATIONS } from "../session.constants.ts";
import type { DurationOption } from "../session.types.ts";

type SettingsViewProps = {
  selectedDuration: DurationOption;
  strictBlocking: boolean;
  sessionFlowLocked: boolean;
  onDurationSelect: (value: DurationOption) => void;
  onStrictBlockingToggle: () => void;
};

export function SettingsView({
  selectedDuration,
  strictBlocking,
  sessionFlowLocked,
  onDurationSelect,
  onStrictBlockingToggle,
}: SettingsViewProps) {
  const { settings: pomodoroSettings, updateSettings: updatePomodoroSettings } =
    usePomodoroSettings();
  const [focusValue, setFocusValue] = useState(String(pomodoroSettings.focusMinutes));
  const [breakValue, setBreakValue] = useState(String(pomodoroSettings.breakMinutes));
  const parsedFocusMinutes = parseOptionalMinutes(focusValue);
  const parsedBreakMinutes = parseOptionalMinutes(breakValue);
  const focusInvalid =
    parsedFocusMinutes === null || parsedFocusMinutes < MIN_POMODORO_FOCUS_MINUTES;
  const breakInvalid =
    parsedBreakMinutes === null || parsedBreakMinutes < MIN_POMODORO_BREAK_MINUTES;

  useEffect(() => {
    setFocusValue(String(pomodoroSettings.focusMinutes));
    setBreakValue(String(pomodoroSettings.breakMinutes));
  }, [pomodoroSettings]);

  function handleFocusChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = onlyDigits(event.currentTarget.value);
    const nextMinutes = parseOptionalMinutes(nextValue);

    setFocusValue(nextValue);

    if (nextMinutes !== null && nextMinutes >= MIN_POMODORO_FOCUS_MINUTES) {
      updatePomodoroSettings({ focusMinutes: nextMinutes });
    }
  }

  function handleBreakChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = onlyDigits(event.currentTarget.value);
    const nextMinutes = parseOptionalMinutes(nextValue);

    setBreakValue(nextValue);

    if (nextMinutes !== null && nextMinutes >= MIN_POMODORO_BREAK_MINUTES) {
      updatePomodoroSettings({ breakMinutes: nextMinutes });
    }
  }

  function resetInvalidPomodoroInputs() {
    if (focusInvalid) {
      setFocusValue(String(pomodoroSettings.focusMinutes));
    }

    if (breakInvalid) {
      setBreakValue(String(pomodoroSettings.breakMinutes));
    }
  }

  return (
    <section className={pageClassName}>
      <header className={pageHeaderClassName}>
        <p className={eyebrowClassName}>Settings</p>
        <h1 className={pageTitleClassName}>Keep defaults simple.</h1>
        <p className={pageCopyClassName}>Only the settings that help you start faster live here.</p>
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
                Set the focus and break minutes used to factor every registered task.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 md:w-[22rem]">
              <div className="grid gap-2">
                <Label htmlFor="pomodoro-focus-minutes">Focus</Label>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <Input
                    id="pomodoro-focus-minutes"
                    inputMode="numeric"
                    value={focusValue}
                    onChange={handleFocusChange}
                    onBlur={resetInvalidPomodoroInputs}
                    disabled={sessionFlowLocked}
                    invalid={focusInvalid}
                    aria-label="Pomodoro focus minutes"
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="pomodoro-break-minutes">Break</Label>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <Input
                    id="pomodoro-break-minutes"
                    inputMode="numeric"
                    value={breakValue}
                    onChange={handleBreakChange}
                    onBlur={resetInvalidPomodoroInputs}
                    disabled={sessionFlowLocked}
                    invalid={breakInvalid}
                    aria-label="Pomodoro break minutes"
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>
            </div>
          </div>

          {focusInvalid || breakInvalid ? (
            <p className={validationTextClassName}>
              Focus must be at least {MIN_POMODORO_FOCUS_MINUTES} minutes. Break can be 0 or more.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="bg-card/92">
        <CardContent className="flex flex-col gap-4 pt-5 md:flex-row md:items-start md:justify-between">
          <div className="grid gap-1.5">
            <div className="flex items-center gap-2">
              <Label>Default block</Label>
              <InfoHint label="This becomes the starting duration the next time you open Today." />
            </div>
            <p className={supportTextClassName}>Choose the duration you reach for most often.</p>
          </div>

          <ToggleGroup
            type="single"
            value={String(selectedDuration)}
            onValueChange={(value) => {
              if (value) {
                onDurationSelect(Number.parseInt(value, 10));
              }
            }}
            className="justify-start"
          >
            {DURATIONS.map((duration) => (
              <ToggleGroupItem
                key={duration}
                value={String(duration)}
                disabled={sessionFlowLocked}
                aria-label={`${duration} minutes`}
              >
                {duration} min
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
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
                <strong>Navigation</strong>
                <span>Sidebar with a calmer single-pane workspace</span>
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
                <strong>Calendar setup</strong>
                <span>Reserved for a compact future step</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function onlyDigits(value: string) {
  return value.replace(/\D+/g, "");
}

function parseOptionalMinutes(value: string) {
  if (value.trim().length === 0) {
    return null;
  }

  const minutes = Number.parseInt(value, 10);

  return Number.isFinite(minutes) ? minutes : null;
}
