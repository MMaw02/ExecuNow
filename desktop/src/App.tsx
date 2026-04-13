import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect, useEffectEvent, useState } from "react";
import { BlockingSettingsView } from "./features/blocking/BlockingSettingsView.tsx";
import { AppShell } from "./features/shell/AppShell.tsx";
import { Sidebar } from "./features/shell/Sidebar.tsx";
import { Topbar } from "./features/shell/Topbar.tsx";
import { useSessionFlow } from "./features/session/useSessionFlow.ts";
import { ActiveSessionView } from "./features/session/views/ActiveSessionView.tsx";
import { HistoryView } from "./features/session/views/HistoryView.tsx";
import { HomeView } from "./features/session/views/HomeView.tsx";
import { OutcomeView } from "./features/session/views/OutcomeView.tsx";
import { SettingsView } from "./features/session/views/SettingsView.tsx";
import { SummaryView } from "./features/session/views/SummaryView.tsx";
import { TasksView } from "./features/widget/TasksView.tsx";
import {
  consumePendingWidgetAction,
  isTauriRuntime,
  MAIN_WINDOW_LABEL,
  openStartupWidgetWindowFromMain,
} from "./features/widget/widget.events.ts";

function App() {
  const { state, derived, actions } = useSessionFlow();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const processPendingWidgetAction = useEffectEvent(() => {
    const pendingAction = consumePendingWidgetAction();

    if (!pendingAction) {
      return;
    }

    if (pendingAction.type === "open-tasks") {
      actions.navigateTo("tasks");
      return;
    }

    actions.startSessionFromWidgetTask(pendingAction.payload);
  });

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

  let content = null;

  switch (state.view) {
    case "today":
      content = (
        <HomeView
          taskTitle={state.taskTitle}
          selectedDuration={state.selectedDuration}
          strictBlocking={state.strictBlocking}
          sessionPrepared={derived.sessionPrepared}
          history={state.history}
          onTaskTitleChange={actions.setTaskTitle}
          onSuggestedTaskSelect={actions.setTaskTitle}
          onDurationSelect={actions.selectDuration}
          onStrictBlockingToggle={actions.toggleStrictBlocking}
          onStartSession={actions.startSession}
        />
      );
      break;
    case "tasks":
      content = <TasksView />;
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
          isPaused={state.isPaused}
          pauseUsed={state.pauseUsed}
          strictBlocking={state.strictBlocking}
          onTogglePause={actions.togglePause}
          onCloseSession={actions.closeSession}
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

  return (
    <AppShell
      isSessionMode={derived.isSessionMode}
      isSidebarCollapsed={isSidebarCollapsed}
      sidebar={
        <Sidebar
          navItems={derived.navItems}
          activeView={derived.activeNav}
          isCollapsed={isSidebarCollapsed}
          canNavigateTo={derived.canNavigateTo}
          onNavigate={actions.navigateTo}
          onToggleCollapsed={() => setIsSidebarCollapsed((value) => !value)}
        />
      }
      topbar={
        <Topbar
          currentLabel={
            derived.navItems.find((item) => item.id === derived.activeNav)?.label ??
            "Today"
          }
          statusLabel={derived.topbarStatusLabel}
          onOpenWidget={
            derived.sessionFlowLocked ? undefined : () => void openStartupWidgetWindowFromMain()
          }
        />
      }
    >
      {content}
    </AppShell>
  );
}

export default App;
