export type WebBlockEntry = {
  id: string;
  rawInput: string;
  normalizedDomain: string;
  derivedHosts: string[];
  createdAt: string;
};

export type WebBlockingSettings = {
  entries: WebBlockEntry[];
};

export type BlockingApplyResult = {
  applied: boolean;
  provider: string;
  blockedDomains: string[];
  blockedHosts: string[];
};

export type WebBlockingStatus = {
  supported: boolean;
  applied: boolean;
  provider: string;
  blockedDomains: string[];
  blockedHosts: string[];
  stale: boolean;
  permissionGranted: boolean;
  permissionStrategy: string;
};

export type WebBlockingPermissionStatus = {
  supported: boolean;
  granted: boolean;
  strategy: string;
};
