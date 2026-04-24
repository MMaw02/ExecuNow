import React from "react";
import ReactDOM from "react-dom/client";
import "./global.css";
import App from "./App";
import { SessionWidgetApp } from "./features/session/SessionWidgetApp.tsx";
import { StartupWidgetApp } from "./features/widget/StartupWidgetApp.tsx";
import {
  getCurrentWindowLabel,
  SESSION_WIDGET_WINDOW_LABEL,
  STARTUP_WIDGET_WINDOW_LABEL,
} from "./features/widget/widget.events.ts";

const currentWindowLabel = getCurrentWindowLabel();
const rootElement = document.getElementById("root");

document.body.classList.remove(
  "window-main",
  "window-startup-widget",
  "window-session-widget",
);
document.body.classList.add(
  currentWindowLabel === STARTUP_WIDGET_WINDOW_LABEL
    ? "window-startup-widget"
    : currentWindowLabel === SESSION_WIDGET_WINDOW_LABEL
      ? "window-session-widget"
    : "window-main",
);

ReactDOM.createRoot(rootElement as HTMLElement).render(
  <React.StrictMode>
    {currentWindowLabel === STARTUP_WIDGET_WINDOW_LABEL ? (
      <StartupWidgetApp />
    ) : currentWindowLabel === SESSION_WIDGET_WINDOW_LABEL ? (
      <SessionWidgetApp />
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
