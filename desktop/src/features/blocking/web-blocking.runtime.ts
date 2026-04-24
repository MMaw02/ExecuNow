import { invoke } from "@tauri-apps/api/core";
import { isTauriRuntime } from "../widget/widget.events.ts";
import type {
  BlockingApplyResult,
  WebBlockingStatus,
} from "./web-blocking.types.ts";

const UNSUPPORTED_STATUS: WebBlockingStatus = {
  supported: false,
  applied: false,
  provider: "hosts",
  blockedDomains: [],
  blockedHosts: [],
  stale: false,
};

export async function applyWebBlocking(
  domains: string[],
): Promise<BlockingApplyResult> {
  if (!isTauriRuntime()) {
    return {
      applied: false,
      provider: "hosts",
      blockedDomains: [],
      blockedHosts: [],
    };
  }

  return invoke<BlockingApplyResult>("apply_web_blocking", {
    domains,
  });
}

export async function clearWebBlocking() {
  if (!isTauriRuntime()) {
    return;
  }

  await invoke("clear_web_blocking");
}

export async function getWebBlockingStatus() {
  if (!isTauriRuntime()) {
    return UNSUPPORTED_STATUS;
  }

  return invoke<WebBlockingStatus>("get_web_blocking_status");
}
