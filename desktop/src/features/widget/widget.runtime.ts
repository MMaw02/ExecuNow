import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  createWidgetPendingActionStore,
  type WidgetPendingAction,
  type WidgetPendingActionStore,
} from "./widget.pending-action.ts";

export const MAIN_WINDOW_KIND = "main";
export const STARTUP_WIDGET_WINDOW_KIND = "startup-widget";
export const SESSION_WIDGET_WINDOW_KIND = "session-widget";
export const MAIN_WINDOW_LABEL = MAIN_WINDOW_KIND;
export const STARTUP_WIDGET_WINDOW_LABEL = STARTUP_WIDGET_WINDOW_KIND;
export const SESSION_WIDGET_WINDOW_LABEL = SESSION_WIDGET_WINDOW_KIND;

export type SessionWidgetFocusPolicy =
  | "aggressive"
  | "focus-on-open"
  | "passive";

export type SessionWidgetShellVariant =
  | "glass-default"
  | "stable-windows";

export type SessionWidgetProfile = {
  focusPolicy: SessionWidgetFocusPolicy;
  surfaceVariant: SessionWidgetShellVariant;
  transparentWindow: boolean;
};

export type WidgetWindowKind =
  | typeof MAIN_WINDOW_KIND
  | typeof STARTUP_WIDGET_WINDOW_KIND
  | typeof SESSION_WIDGET_WINDOW_KIND;

export type WidgetRuntime = {
  consumePendingAction(): WidgetPendingAction | null;
  getSessionWidgetProfile(): Promise<SessionWidgetProfile>;
  getCurrentWindowKind(): WidgetWindowKind;
  hideSessionWidgetWindow(): Promise<void>;
  isNative: boolean;
  reinforceSessionWidgetZOrder(forceFocus?: boolean): Promise<void>;
  setPendingAction(action: WidgetPendingAction): void;
  showMainWindow(): Promise<void>;
  showSessionWidgetWindow(): Promise<void>;
  showStartupWidgetWindow(): Promise<void>;
  startWindowDrag(): Promise<void>;
};

type WidgetNativeBridge = {
  getCurrentWindowLabel(): string;
  getSessionWidgetProfile(): Promise<SessionWidgetProfile>;
  hideSessionWidgetWindow(): Promise<void>;
  reinforceSessionWidgetZOrder(forceFocus?: boolean): Promise<void>;
  showMainWindow(): Promise<void>;
  showSessionWidgetWindow(): Promise<void>;
  showStartupWidgetWindow(): Promise<void>;
  startWindowDrag(): Promise<void>;
};

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function createBrowserWidgetRuntime(
  options: {
    handoffStore?: WidgetPendingActionStore;
    sessionWidgetProfile?: SessionWidgetProfile;
    windowKind?: WidgetWindowKind;
  } = {},
): WidgetRuntime {
  const handoffStore =
    options.handoffStore ?? createWidgetPendingActionStore();
  const sessionWidgetProfile =
    options.sessionWidgetProfile ?? getDefaultSessionWidgetProfile();
  const windowKind = options.windowKind ?? MAIN_WINDOW_KIND;

  return {
    isNative: false,
    async getSessionWidgetProfile() {
      return sessionWidgetProfile;
    },
    getCurrentWindowKind() {
      return windowKind;
    },
    async hideSessionWidgetWindow() {},
    async reinforceSessionWidgetZOrder() {},
    async showMainWindow() {},
    async showSessionWidgetWindow() {},
    async showStartupWidgetWindow() {},
    async startWindowDrag() {},
    consumePendingAction() {
      return handoffStore.consumePendingAction();
    },
    setPendingAction(action) {
      handoffStore.setPendingAction(action);
    },
  };
}

export function createTauriWidgetRuntime(
  bridge: WidgetNativeBridge = createTauriBridge(),
  handoffStore: WidgetPendingActionStore = createWidgetPendingActionStore(),
): WidgetRuntime {
  let sessionWidgetProfilePromise: Promise<SessionWidgetProfile> | null = null;

  return {
    isNative: true,
    getSessionWidgetProfile() {
      if (!sessionWidgetProfilePromise) {
        sessionWidgetProfilePromise = bridge
          .getSessionWidgetProfile()
          .catch(() => getDefaultSessionWidgetProfile());
      }

      return sessionWidgetProfilePromise;
    },
    getCurrentWindowKind() {
      return normalizeWidgetWindowKind(bridge.getCurrentWindowLabel());
    },
    hideSessionWidgetWindow() {
      return bridge.hideSessionWidgetWindow();
    },
    reinforceSessionWidgetZOrder(forceFocus = false) {
      return bridge.reinforceSessionWidgetZOrder(forceFocus);
    },
    showMainWindow() {
      return bridge.showMainWindow();
    },
    showSessionWidgetWindow() {
      return bridge.showSessionWidgetWindow();
    },
    showStartupWidgetWindow() {
      return bridge.showStartupWidgetWindow();
    },
    startWindowDrag() {
      return bridge.startWindowDrag();
    },
    consumePendingAction() {
      return handoffStore.consumePendingAction();
    },
    setPendingAction(action) {
      handoffStore.setPendingAction(action);
    },
  };
}

export function getWidgetRuntime(): WidgetRuntime {
  if (isTauriRuntime()) {
    return tauriWidgetRuntime;
  }

  return browserWidgetRuntime;
}

export function getCurrentWindowKind(): WidgetWindowKind {
  return getWidgetRuntime().getCurrentWindowKind();
}

export function getDefaultSessionWidgetProfile(): SessionWidgetProfile {
  const operatingSystem = detectOperatingSystem();

  if (operatingSystem === "windows") {
    return {
      focusPolicy: "focus-on-open",
      surfaceVariant: "stable-windows",
      transparentWindow: false,
    };
  }

  return {
    focusPolicy: "focus-on-open",
    surfaceVariant: "glass-default",
    transparentWindow: true,
  };
}

export function normalizeWidgetWindowKind(value: string): WidgetWindowKind {
  if (
    value === STARTUP_WIDGET_WINDOW_KIND ||
    value === SESSION_WIDGET_WINDOW_KIND
  ) {
    return value;
  }

  return MAIN_WINDOW_KIND;
}

function createTauriBridge(): WidgetNativeBridge {
  return {
    getCurrentWindowLabel() {
      return getCurrentWebviewWindow().label;
    },
    async getSessionWidgetProfile() {
      return invoke<SessionWidgetProfile>("get_session_widget_profile");
    },
    async hideSessionWidgetWindow() {
      await invoke("hide_session_widget_window");
    },
    async reinforceSessionWidgetZOrder(forceFocus = false) {
      await invoke("reinforce_session_widget_z_order", {
        force_focus: forceFocus,
      });
    },
    async showMainWindow() {
      await invoke("show_main_window");
    },
    async showSessionWidgetWindow() {
      await invoke("show_session_widget_window");
    },
    async showStartupWidgetWindow() {
      await invoke("show_startup_widget_window");
    },
    async startWindowDrag() {
      await invoke("start_widget_window_drag");
    },
  };
}

function detectOperatingSystem() {
  if (typeof navigator === "undefined") {
    return "unknown";
  }

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("windows")) {
    return "windows";
  }

  if (userAgent.includes("mac")) {
    return "macos";
  }

  if (userAgent.includes("linux")) {
    return "linux";
  }

  return "unknown";
}

const browserWidgetRuntime = createBrowserWidgetRuntime();
const tauriWidgetRuntime = createTauriWidgetRuntime();
