import type {
  NavigationItem,
  View,
} from "../session/session.types.ts";

type SidebarProps = {
  navItems: readonly NavigationItem[];
  activeView: View;
  canNavigateTo: (target: View) => boolean;
  onNavigate: (target: View) => void;
  blockingModeLabel: string;
  blockingModeDescription: string;
  completedTodayLabel: string;
  focusMinutes: number;
};

export function Sidebar({
  navItems,
  activeView,
  canNavigateTo,
  onNavigate,
  blockingModeLabel,
  blockingModeDescription,
  completedTodayLabel,
  focusMinutes,
}: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Primary sidebar">
      <div className="sidebar-brand">
        <p className="eyebrow">ExecuNow</p>
        <h1>Execution Console</h1>
        <p className="support">
          See task, start focus, hold the line, then close the loop.
        </p>
      </div>

      <div className="sidebar-section">
        <span className="sidebar-section-label">Navigation</span>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const disabled = !canNavigateTo(item.id);
            const className = item.id === activeView ? "nav-item active" : "nav-item";

            return (
              <button
                key={item.id}
                type="button"
                className={className}
                onClick={() => onNavigate(item.id)}
                disabled={disabled}
                aria-current={item.id === activeView ? "page" : undefined}
              >
                <strong>{item.label}</strong>
                <span>{item.support}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-meta">
        <div className="sidebar-section">
          <span className="sidebar-section-label">Session status</span>
          <div className="sidebar-state">
            <span className="summary-label">Blocking</span>
            <strong>{blockingModeLabel}</strong>
            <p>{blockingModeDescription}</p>
          </div>
        </div>

        <div className="sidebar-section">
          <span className="sidebar-section-label">Today</span>
          <div className="sidebar-stat-grid" aria-label="Today status">
            <div className="sidebar-stat">
              <span className="strip-label">Completed</span>
              <strong>{completedTodayLabel}</strong>
            </div>
            <div className="sidebar-stat">
              <span className="strip-label">Focused</span>
              <strong>{focusMinutes} min</strong>
            </div>
            <div className="sidebar-stat">
              <span className="strip-label">Rule</span>
              <strong>1 pause max</strong>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
