import type { ReactNode } from "react";

type AppShellProps = {
  isSessionMode: boolean;
  isSidebarCollapsed: boolean;
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
};

export function AppShell({
  isSessionMode,
  isSidebarCollapsed,
  sidebar,
  topbar,
  children,
}: AppShellProps) {
  const className = [
    "app-shell",
    isSessionMode ? "session-mode" : "",
    isSidebarCollapsed ? "sidebar-collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={className}>
      <section className="app-frame">
        {sidebar}
        <div className="shell-stage">
          {topbar}
          <div className="app-content">{children}</div>
        </div>
      </section>
    </main>
  );
}
