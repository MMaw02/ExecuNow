import type { WebBlockEntry, WebBlockingSettings } from "./web-blocking.types.ts";

export const DEFAULT_WEB_BLOCKING_SETTINGS: WebBlockingSettings = {
  entries: [],
};

type WebBlockEntryResult =
  | {
      ok: true;
      entry: WebBlockEntry;
    }
  | {
      ok: false;
      error: string;
    };

type AddWebBlockEntryResult =
  | {
      ok: true;
      entry: WebBlockEntry;
      settings: WebBlockingSettings;
    }
  | {
      ok: false;
      error: string;
      settings: WebBlockingSettings;
    };

export function normalizeWebBlockingSettings(
  value: Partial<WebBlockingSettings> | null | undefined,
): WebBlockingSettings {
  const entries = Array.isArray(value?.entries)
    ? value.entries
        .map((entry) => normalizeWebBlockEntry(entry))
        .filter((entry): entry is WebBlockEntry => entry !== null)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    : DEFAULT_WEB_BLOCKING_SETTINGS.entries;

  return {
    entries: dedupeEntries(entries),
  };
}

export function addWebBlockEntry(
  settings: WebBlockingSettings,
  rawInput: string,
  now = new Date(),
): AddWebBlockEntryResult {
  const nextEntryResult = createWebBlockEntry(rawInput, now);

  if (!nextEntryResult.ok) {
    return {
      ok: false,
      error: nextEntryResult.error,
      settings,
    };
  }

  if (
    settings.entries.some(
      (entry) => entry.normalizedDomain === nextEntryResult.entry.normalizedDomain,
    )
  ) {
    return {
      ok: false,
      error: "This site is already armed for blocking.",
      settings,
    };
  }

  return {
    ok: true,
    entry: nextEntryResult.entry,
    settings: normalizeWebBlockingSettings({
      entries: [nextEntryResult.entry, ...settings.entries],
    }),
  };
}

export function removeWebBlockEntry(
  settings: WebBlockingSettings,
  entryId: string,
): WebBlockingSettings {
  return normalizeWebBlockingSettings({
    entries: settings.entries.filter((entry) => entry.id !== entryId),
  });
}

export function createWebBlockEntry(rawInput: string, now = new Date()): WebBlockEntryResult {
  const trimmedInput = rawInput.trim();

  if (!trimmedInput) {
    return {
      ok: false,
      error: "Paste a URL or domain first.",
    };
  }

  const normalizedDomainResult = normalizeDomainInput(trimmedInput);

  if (!normalizedDomainResult.ok) {
    return normalizedDomainResult;
  }

  return {
    ok: true,
    entry: {
      id: crypto.randomUUID(),
      rawInput: trimmedInput,
      normalizedDomain: normalizedDomainResult.normalizedDomain,
      derivedHosts: deriveHosts(normalizedDomainResult.normalizedDomain),
      createdAt: now.toISOString(),
    },
  };
}

export function deriveHosts(normalizedDomain: string) {
  const withWww = `www.${normalizedDomain}`;

  return withWww === normalizedDomain
    ? [normalizedDomain]
    : [normalizedDomain, withWww];
}

function normalizeWebBlockEntry(value: unknown): WebBlockEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const entry = value as Partial<WebBlockEntry>;
  const rawInput = typeof entry.rawInput === "string" ? entry.rawInput.trim() : "";
  const normalizedDomain =
    typeof entry.normalizedDomain === "string" ? entry.normalizedDomain.trim().toLowerCase() : "";
  const createdAt =
    typeof entry.createdAt === "string" && !Number.isNaN(new Date(entry.createdAt).getTime())
      ? entry.createdAt
      : new Date(0).toISOString();

  if (!rawInput || !isValidHostname(normalizedDomain) || isLocalOrIp(normalizedDomain)) {
    return null;
  }

  return {
    id: typeof entry.id === "string" && entry.id.trim() ? entry.id : crypto.randomUUID(),
    rawInput,
    normalizedDomain,
    derivedHosts: deriveHosts(normalizedDomain),
    createdAt,
  };
}

function dedupeEntries(entries: readonly WebBlockEntry[]) {
  const seenDomains = new Set<string>();

  return entries.filter((entry) => {
    if (seenDomains.has(entry.normalizedDomain)) {
      return false;
    }

    seenDomains.add(entry.normalizedDomain);
    return true;
  });
}

function normalizeDomainInput(value: string):
  | {
      ok: true;
      normalizedDomain: string;
    }
  | {
      ok: false;
      error: string;
    } {
  const lowerValue = value.toLowerCase();
  let hostname = "";

  if (hasExplicitScheme(lowerValue)) {
    try {
      hostname = new URL(value).hostname.toLowerCase();
    } catch {
      return {
        ok: false,
        error: "That URL could not be parsed.",
      };
    }
  } else {
    if (/[/?#]/.test(value)) {
      return {
        ok: false,
        error: "Use a full URL with protocol or just the domain name.",
      };
    }

    hostname = lowerValue;
  }

  const normalizedHostname = hostname.replace(/\.$/, "");
  const normalizedDomain = normalizedHostname.startsWith("www.")
    ? normalizedHostname.slice(4)
    : normalizedHostname;

  if (!normalizedDomain) {
    return {
      ok: false,
      error: "Paste a valid domain.",
    };
  }

  if (isLocalOrIp(normalizedDomain)) {
    return {
      ok: false,
      error: "Localhost and IP addresses are not supported.",
    };
  }

  if (!isValidHostname(normalizedDomain)) {
    return {
      ok: false,
      error: "Paste a valid domain like youtube.com.",
    };
  }

  return {
    ok: true,
    normalizedDomain,
  };
}

function hasExplicitScheme(value: string) {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(value);
}

function isLocalOrIp(value: string) {
  return value === "localhost" || isIpv4Address(value) || isIpv6Address(value);
}

function isIpv4Address(value: string) {
  const segments = value.split(".");

  return (
    segments.length === 4 &&
    segments.every((segment) => {
      if (!/^\d+$/.test(segment)) {
        return false;
      }

      const numericValue = Number.parseInt(segment, 10);
      return numericValue >= 0 && numericValue <= 255;
    })
  );
}

function isIpv6Address(value: string) {
  return value.includes(":");
}

function isValidHostname(value: string) {
  if (value.length > 253 || !value.includes(".")) {
    return false;
  }

  return value.split(".").every((label) => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(label));
}
