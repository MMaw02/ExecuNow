import { readWebBlockingSettings } from "../blocking/web-blocking.storage.ts";
import type { BlockingApplyResult } from "../blocking/web-blocking.types.ts";
import type { SessionState } from "./session.types.ts";

export type SessionBlockingRuntime = {
  apply(domains: string[]): Promise<BlockingApplyResult>;
  clear(): Promise<void>;
};

type SessionBlockingStartResult =
  | {
      ok: true;
      applied: boolean;
      result: BlockingApplyResult | null;
    }
  | {
      ok: false;
      error: string;
    };

type SessionBlockingClearResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

export async function prepareBlockingForSession(
  state: Pick<SessionState, "strictBlocking">,
  runtime: Pick<SessionBlockingRuntime, "apply">,
  storage?: Storage | null,
): Promise<SessionBlockingStartResult> {
  if (!state.strictBlocking) {
    return {
      ok: true,
      applied: false,
      result: null,
    };
  }

  const settings = readWebBlockingSettings(storage);
  const domains = settings.entries.map((entry) => entry.normalizedDomain);

  if (domains.length === 0) {
    return {
      ok: true,
      applied: false,
      result: null,
    };
  }

  try {
    return {
      ok: true,
      applied: true,
      result: await runtime.apply(domains),
    };
  } catch (error) {
    return {
      ok: false,
      error: toErrorMessage(error),
    };
  }
}

export async function releaseBlockingAfterSession(
  runtime: Pick<SessionBlockingRuntime, "clear">,
): Promise<SessionBlockingClearResult> {
  try {
    await runtime.clear();

    return {
      ok: true,
    };
  } catch (error) {
    return {
      ok: false,
      error: toErrorMessage(error),
    };
  }
}

function toErrorMessage(error: unknown) {
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "ExecuNow could not update the system blocking rules.";
}
