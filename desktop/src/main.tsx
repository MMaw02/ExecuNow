import React from "react";
import ReactDOM from "react-dom/client";
import "./global.css";
import App from "./App";
import { StartupWidgetApp } from "./features/widget/StartupWidgetApp.tsx";
import {
  getCurrentWindowLabel,
  STARTUP_WIDGET_WINDOW_LABEL,
} from "./features/widget/widget.events.ts";

const currentWindowLabel = getCurrentWindowLabel();
const rootElement = document.getElementById("root");

document.body.classList.remove("window-main", "window-startup-widget");
document.body.classList.add(
  currentWindowLabel === STARTUP_WIDGET_WINDOW_LABEL
    ? "window-startup-widget"
    : "window-main",
);

ReactDOM.createRoot(rootElement as HTMLElement).render(
  <React.StrictMode>
    {currentWindowLabel === STARTUP_WIDGET_WINDOW_LABEL ? (
      <StartupWidgetApp />
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
