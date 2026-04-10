import "./App.css";
import { BlockingSettingsView } from "./features/blocking/BlockingSettingsView.tsx";
import { AppShell } from "./features/shell/AppShell.tsx";
import { Sidebar } from "./features/shell/Sidebar.tsx";
import { Topbar } from "./features/shell/Topbar.tsx";
import { useSessionFlow } from "./features/session/useSessionFlow.ts";
import { ActiveSessionView } from "./features/session/views/ActiveSessionView.tsx";
import { HomeView } from "./features/session/views/HomeView.tsx";
import { OutcomeView } from "./features/session/views/OutcomeView.tsx";

function App() {
  const { state, derived, actions } = useSessionFlow();

  let content = null;

  switch (state.view) {
    case "home":
      content = (
        <HomeView
          taskTitle={state.taskTitle}
          selectedDuration={state.selectedDuration}
          strictBlocking={state.strictBlocking}
          sessionPrepared={derived.sessionPrepared}
          onTaskTitleChange={actions.setTaskTitle}
          onSuggestedTaskSelect={actions.setTaskTitle}
          onDurationSelect={actions.selectDuration}
          onStrictBlockingToggle={actions.toggleStrictBlocking}
          onStartSession={actions.startSession}
        />
      );
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
  }

  return (
    <AppShell
      isSessionMode={derived.isSessionMode}
      sidebar={
        <Sidebar
          navItems={derived.navItems}
          activeView={state.view}
          canNavigateTo={derived.canNavigateTo}
          onNavigate={actions.navigateTo}
          blockingModeLabel={derived.blockingModeLabel}
          blockingModeDescription={derived.blockingModeDescription}
          completedTodayLabel={derived.completedTodayLabel}
          focusMinutes={state.stats.focusMinutes}
        />
      }
      topbar={
        <Topbar
          copy={derived.currentViewCopy}
          statusLabel={derived.topbarStatusLabel}
        />
      }
    >
      {content}
    </AppShell>
  );
}

export default App;
