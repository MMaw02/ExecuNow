import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect, useEffectEvent, useState } from "react";
import { BlockingSettingsView } from "./features/blocking/BlockingSettingsView.tsx";
import { useWebBlockingSettings } from "./features/blocking/useWebBlockingSettings.ts";
import { AppShell } from "./features/shell/AppShell.tsx";
import { Sidebar } from "./features/shell/Sidebar.tsx";
import { getElapsedMinutes } from "./features/session/session.model.ts";
import {
  createSessionWidgetSnapshot,
  normalizeSessionWidgetControl,
} from "./features/session/session-widget.model.ts";
import { getSessionWidgetSnapshotChannel } from "./features/session/session-widget.channel.ts";
import type { SessionWidgetControlPayload } from "./features/session/session-widget.types.ts";
import { useSessionFlow } from "./features/session/useSessionFlow.ts";
import { ActiveSessionView } from "./features/session/views/ActiveSessionView.tsx";
import { HistoryView } from "./features/session/views/HistoryView.tsx";
import { HomeView } from "./features/session/views/HomeView.tsx";
import { OutcomeView } from "./features/session/views/OutcomeView.tsx";
import { SettingsView } from "./features/session/views/SettingsView.tsx";
import { SummaryView } from "./features/session/views/SummaryView.tsx";
import { TasksView } from "./features/widget/TasksView.tsx";
import { Toaster } from "./shared/components/ui/sonner.tsx";
import {
  MAIN_WINDOW_LABEL,
  getWidgetRuntime,
  isTauriRuntime,
} from "./features/widget/widget.runtime.ts";

function App() {
  const { state, derived, actions } = useSessionFlow();
  const { settings: webBlockingSettings, addEntry, removeEntry } = useWebBlockingSettings();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const focusedMinutes = state.stats.focusMinutes + getElapsedMinutes(state);
  const sessionWidgetSnapshot = createSessionWidgetSnapshot(state);
  const widgetRuntime = getWidgetRuntime();
  const sessionWidgetChannel = getSessionWidgetSnapshotChannel();

  const processPendingWidgetAction = useEffectEvent(() => {
    const pendingAction = widgetRuntime.consumePendingAction();

    if (!pendingAction) {
      return;
    }

    if (pendingAction.type === "open-tasks") {
      actions.navigateTo("tasks");
      return;
    }

    actions.startSessionFromWidgetTask(pendingAction.payload);
  });

  const processSessionWidgetControl = useEffectEvent(
    (payload: SessionWidgetControlPayload) => {
      const control = normalizeSessionWidgetControl(payload.control);

      if (!control) {
        return;
      }

      if (control === "toggle-pause") {
        actions.togglePause();
        return;
      }

      void widgetRuntime.showMainWindow();
    },
  );

  useEffect(() => {
    if (!isTauriRuntime() || getCurrentWebviewWindow().label !== MAIN_WINDOW_LABEL) {
      return;
    }
    const handleFocus = () => {
      processPendingWidgetAction();
    };

    processPendingWidgetAction();

    window.addEventListener("focus", handleFocus);
    const unsubscribeVisibility = () => {
      if (document.visibilityState === "visible") {
        processPendingWidgetAction();
      }
    };
    document.addEventListener("visibilitychange", unsubscribeVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", unsubscribeVisibility);
    };
  }, []);

  useEffect(() => {
    void sessionWidgetChannel.publishSnapshot(sessionWidgetSnapshot, MAIN_WINDOW_LABEL);
  }, [
    sessionWidgetSnapshot.isPaused,
    sessionWidgetSnapshot.pauseUsed,
    sessionWidgetSnapshot.remainingSeconds,
    sessionWidgetSnapshot.sessionPhase,
    sessionWidgetSnapshot.sessionDuration,
    sessionWidgetSnapshot.sessionTask,
    sessionWidgetSnapshot.strictBlocking,
    sessionWidgetSnapshot.view,
    sessionWidgetChannel,
  ]);

  useEffect(() => {
    if (!isTauriRuntime() || getCurrentWebviewWindow().label !== MAIN_WINDOW_LABEL) {
      return;
    }

    return sessionWidgetChannel.subscribeControl(
      MAIN_WINDOW_LABEL,
      (payload: SessionWidgetControlPayload) => {
        processSessionWidgetControl(payload);
      },
    );
  }, [processSessionWidgetControl, sessionWidgetChannel]);

  useEffect(() => {
    if (state.view !== "outcome") {
      return;
    }

    void widgetRuntime.showMainWindow();
  }, [state.view, widgetRuntime]);

  let content = null;

  switch (state.view) {
    case "today":
      content = (
        <HomeView
          taskTitle={state.taskTitle}
          selectedDuration={state.selectedDuration}
          strictBlocking={state.strictBlocking}
          history={state.history}
          onTaskTitleChange={actions.setTaskTitle}
          onDurationSelect={actions.selectDuration}
          onStrictBlockingToggle={actions.toggleStrictBlocking}
          onExecuteTask={actions.startSessionFromWidgetTask}
        />
      );
      break;
    case "tasks":
      content = <TasksView onExecuteTask={actions.startSessionFromWidgetTask} />;
      break;
    case "history":
      content = <HistoryView history={state.history} />;
      break;
    case "summary":
      content = <SummaryView stats={state.stats} history={state.history} />;
      break;
    case "active":
      content = (
        <ActiveSessionView
          remainingSeconds={state.remainingSeconds}
          sessionTask={state.sessionTask}
          sessionDuration={state.sessionDuration}
          sessionPomodoroSettings={state.sessionPomodoroSettings}
          sessionPhase={state.sessionPhase}
          sessionSegmentIndex={state.sessionSegmentIndex}
          elapsedFocusSeconds={state.elapsedFocusSeconds}
          focusedMinutes={focusedMinutes}
          isPaused={state.isPaused}
          pauseUsed={state.pauseUsed}
          strictBlocking={state.strictBlocking}
          onTogglePause={actions.togglePause}
          onCloseSession={actions.closeSession}
          onOpenWidget={() => void widgetRuntime.showSessionWidgetWindow()}
        />
      );
      break;
    case "outcome":
      content = (
        <OutcomeView
          sessionTask={state.sessionTask}
          sessionResult={state.sessionResult}
          failureReason={state.failureReason}
          stats={state.stats}
          onSessionResultSelect={actions.selectSessionResult}
          onFailureReasonSelect={actions.selectFailureReason}
          onSaveOutcome={actions.saveOutcome}
        />
      );
      break;
    case "blocking":
      content = (
        <BlockingSettingsView
          strictBlocking={state.strictBlocking}
          sessionFlowLocked={derived.sessionFlowLocked}
          onStrictBlockingToggle={actions.toggleStrictBlocking}
          entries={webBlockingSettings.entries}
          onAddEntry={addEntry}
          onRemoveEntry={removeEntry}
        />
      );
      break;
    case "settings":
      content = (
        <SettingsView
          selectedDuration={state.selectedDuration}
          strictBlocking={state.strictBlocking}
          sessionFlowLocked={derived.sessionFlowLocked}
          onDurationSelect={actions.selectDuration}
          onStrictBlockingToggle={actions.toggleStrictBlocking}
        />
      );
      break;
  }

  if (state.view === "active") {
    return (
      <>
        {content}
        <Toaster />
      </>
    );
  }

  return (
    <>
      <AppShell
        isSessionMode={derived.isSessionMode}
        isSidebarCollapsed={isSidebarCollapsed}
        sidebar={
          <Sidebar
            navItems={derived.navItems}
            activeView={derived.activeNav}
            isCollapsed={isSidebarCollapsed}
            canNavigateTo={derived.canNavigateTo}
            isWidgetActionDisabled={derived.sessionFlowLocked}
            onNavigate={actions.navigateTo}
            onOpenWidget={() => void widgetRuntime.showStartupWidgetWindow()}
            onToggleCollapsed={() => setIsSidebarCollapsed((value) => !value)}
          />
        }
      >
        {content}
      </AppShell>
      <Toaster />
    </>
  );
}

export default App;
