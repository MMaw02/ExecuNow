import { useEffect, useState } from "react";
import { getSessionWidgetSnapshotChannel } from "./session-widget.channel.ts";
import { getCurrentWindowKind } from "../widget/widget.runtime.ts";
import type { SessionWidgetSnapshot } from "./session-widget.types.ts";

export function useSessionWidgetSnapshot() {
  const windowLabel = getCurrentWindowKind();
  const channel = getSessionWidgetSnapshotChannel();
  const [snapshot, setSnapshot] = useState<SessionWidgetSnapshot>(() =>
    channel.readInitialSnapshot(),
  );

  useEffect(() => channel.subscribeSnapshot(windowLabel, setSnapshot), [channel, windowLabel]);

  return snapshot;
}
