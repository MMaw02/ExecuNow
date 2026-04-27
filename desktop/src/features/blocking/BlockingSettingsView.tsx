import { Globe2, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { InfoHint } from "../../shared/components/InfoHint.tsx";
import { Badge } from "../../shared/components/ui/badge.tsx";
import { Button } from "../../shared/components/ui/button.tsx";
import { Card, CardContent } from "../../shared/components/ui/card.tsx";
import { Input } from "../../shared/components/ui/input.tsx";
import { Label } from "../../shared/components/ui/label.tsx";
import {
  emptyPanelClassName,
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
} from "../../shared/components/ui/styles.ts";
import { cn } from "../../shared/lib/cn.ts";
import type { WebBlockEntry } from "./web-blocking.types.ts";

type BlockingSettingsViewProps = {
  strictBlocking: boolean;
  sessionFlowLocked: boolean;
  onStrictBlockingToggle: () => void;
  entries: readonly WebBlockEntry[];
  onAddEntry: (rawInput: string) => { ok: boolean; error?: string };
  onRemoveEntry: (entryId: string) => void;
  permissionSupported: boolean;
  permissionGranted: boolean;
  permissionLoading: boolean;
  permissionGranting: boolean;
  onGrantPermission: () => void;
};

export function BlockingSettingsView({
  strictBlocking,
  sessionFlowLocked,
  onStrictBlockingToggle,
  entries,
  onAddEntry,
  onRemoveEntry,
  permissionSupported,
  permissionGranted,
  permissionLoading,
  permissionGranting,
  onGrantPermission,
}: BlockingSettingsViewProps) {
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextResult = onAddEntry(inputValue);

    if (!nextResult.ok) {
      setErrorMessage(nextResult.error ?? "That site could not be added.");
      return;
    }

    setInputValue("");
    setErrorMessage("");
  }

  return (
    <section className={pageClassName}>
      <header className={pageHeaderClassName}>
        <p className={eyebrowClassName}>Blocking</p>
        <h1 className={pageTitleClassName}>Arm the sites you want gone during focus.</h1>
        <p className={pageCopyClassName}>
          Keep the rule firm and the list small enough to trust without thinking twice.
        </p>
      </header>

      <Card className="bg-card/92">
        <CardContent className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
          <div className="grid gap-1.5">
            <div className="flex items-center gap-2">
              <Label>Focus rule</Label>
              <InfoHint label="This applies to the next session. During an active block, the rule stays locked." />
            </div>
            <p className={supportTextClassName}>
              {strictBlocking
                ? "Strict mode is armed for the next block."
                : "Relaxed mode is ready for the next block."}
            </p>
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

      <Card className="bg-card/92">
        <CardContent className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
          <div className="grid gap-1.5">
            <div className="flex items-center gap-2">
              <Label>Windows permission</Label>
              <InfoHint label="Grant this once so strict sessions can update the hosts file without showing UAC every time." />
            </div>
            <p className={supportTextClassName}>
              {!permissionSupported
                ? "This helper is only needed on Windows."
                : permissionGranted
                  ? "The elevated helper is ready. Future strict sessions can start without another Windows permission prompt."
                  : "Grant this here once first. Strict sessions will stay blocked until the helper is ready instead of opening UAC during start."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={permissionGranted ? "info" : "warning"}>
              {permissionLoading
                ? "Checking"
                : permissionGranted
                  ? "Ready"
                  : "Needs approval"}
            </Badge>
            <Button
              variant="outline"
              className="min-w-[148px]"
              onClick={onGrantPermission}
              disabled={!permissionSupported || permissionGranting}
            >
              {permissionGranted ? "Refresh helper" : "Grant once"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/92">
        <CardContent className="grid gap-5 pt-5">
          <div className={sectionHeadingClassName}>
            <div className="flex items-center gap-2">
              <Label>Blocked websites</Label>
              <InfoHint label="Paste a full URL or a domain. ExecuNow normalizes it to the root host plus www." />
            </div>
            <p className={supportTextClassName}>
              These domains are written into the system block only while a strict focus block is active.
            </p>
          </div>

          <form
            className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"
            onSubmit={handleSubmit}
          >
            <div className="grid gap-2">
              <Label htmlFor="blocking-site-input" className="sr-only">
                Website to block
              </Label>
              <Input
                id="blocking-site-input"
                value={inputValue}
                onChange={(event) => {
                  setInputValue(event.currentTarget.value);
                  if (errorMessage) {
                    setErrorMessage("");
                  }
                }}
                placeholder="https://www.youtube.com or reddit.com"
                disabled={sessionFlowLocked}
                invalid={Boolean(errorMessage)}
                aria-label="Website to block"
              />
            </div>

            <Button type="submit" className="min-w-[148px]" disabled={sessionFlowLocked}>
              <Plus size={16} />
              Add site
            </Button>
          </form>

          {errorMessage ? <p className={validationTextClassName}>{errorMessage}</p> : null}

          {entries.length > 0 ? (
            <div className="grid gap-3" role="list" aria-label="Blocked websites">
              {entries.map((entry) => (
                <article
                  key={entry.id}
                  className="grid gap-3 rounded-[var(--radius-large)] border border-border bg-muted/28 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                >
                  <div className="grid gap-1.5 min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <Globe2 size={15} className="shrink-0 text-muted-foreground" />
                      <strong className="truncate text-foreground">{entry.normalizedDomain}</strong>
                      <Badge variant="warning" className="px-2.5 py-1 text-[0.66rem]">
                        {entry.derivedHosts.length} hosts
                      </Badge>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      Source: {entry.rawInput}
                    </p>
                    <p className="text-xs text-muted-foreground/90">
                      {entry.derivedHosts.join("  ")}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="min-w-[120px]"
                    onClick={() => onRemoveEntry(entry.id)}
                    disabled={sessionFlowLocked}
                  >
                    <Trash2 size={15} />
                    Remove
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            <div className={emptyPanelClassName}>
              <div className="grid gap-2">
                <span className={sectionLabelClassName}>No sites armed yet</span>
                <p className="text-sm text-muted-foreground">
                  Add only the pages that reliably pull you out of the block.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/88">
        <CardContent className={cn(rowListClassName, "pt-5")}>
          <div className={listRowClassName}>
            <strong>Web distractions</strong>
            <span>
              {strictBlocking
                ? entries.length > 0
                  ? `${entries.length} site${entries.length === 1 ? "" : "s"} ready to block`
                  : "Strict mode is on, but no sites are armed"
                : "Strict mode is off for the next block"}
            </span>
          </div>
          <div className={listRowClassName}>
            <strong>System method</strong>
            <span>Windows hosts file, applied only while the block runs</span>
          </div>
          <div className={listRowClassName}>
            <strong>During an active block</strong>
            <span>
              {sessionFlowLocked
                ? "The list is locked until the session exits"
                : "The list stays editable until the timer starts"}
            </span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
