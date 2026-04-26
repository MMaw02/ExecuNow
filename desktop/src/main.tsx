import React from "react";
import ReactDOM from "react-dom/client";
import "./global.css";
import App from "./App";
import { SessionWidgetApp } from "./features/session/SessionWidgetApp.tsx";
import { StartupWidgetApp } from "./features/widget/StartupWidgetApp.tsx";
import {
  getCurrentWindowKind,
  SESSION_WIDGET_WINDOW_KIND,
  STARTUP_WIDGET_WINDOW_KIND,
} from "./features/widget/widget.runtime.ts";

const currentWindowLabel = getCurrentWindowKind();
const rootElement = document.getElementById("root");

document.body.classList.remove(
  "window-main",
  "window-startup-widget",
  "window-session-widget",
);
document.body.classList.add(
  currentWindowLabel === STARTUP_WIDGET_WINDOW_KIND
    ? "window-startup-widget"
    : currentWindowLabel === SESSION_WIDGET_WINDOW_KIND
      ? "window-session-widget"
      : "window-main",
);

ReactDOM.createRoot(rootElement as HTMLElement).render(
  <React.StrictMode>
    {currentWindowLabel === STARTUP_WIDGET_WINDOW_KIND ? (
      <StartupWidgetApp />
    ) : currentWindowLabel === SESSION_WIDGET_WINDOW_KIND ? (
      <SessionWidgetApp />
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
