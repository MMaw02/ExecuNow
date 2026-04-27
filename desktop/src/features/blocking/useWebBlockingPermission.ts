import { useEffect, useState } from "react";
import {
  ensureWebBlockingPermission,
  getWebBlockingStatus,
} from "./web-blocking.runtime.ts";
import type { WebBlockingStatus } from "./web-blocking.types.ts";

const INITIAL_STATUS: WebBlockingStatus = {
  supported: false,
  applied: false,
  provider: "hosts",
  blockedDomains: [],
  blockedHosts: [],
  stale: false,
  permissionGranted: false,
  permissionStrategy: "unsupported",
};

export function useWebBlockingPermission() {
  const [status, setStatus] = useState<WebBlockingStatus>(INITIAL_STATUS);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    void refreshStatus();
  }, []);

  return {
    status,
    loading,
    granting,
    async refresh() {
      await refreshStatus();
    },
    async grant() {
      setGranting(true);

      try {
        await waitForNextPaint();
        await ensureWebBlockingPermission();
        return await refreshStatus();
      } finally {
        setGranting(false);
      }
    },
  };

  async function refreshStatus() {
    setLoading(true);

    try {
      const nextStatus = await getWebBlockingStatus();
      setStatus(nextStatus);
      return nextStatus;
    } finally {
      setLoading(false);
    }
  }
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}
