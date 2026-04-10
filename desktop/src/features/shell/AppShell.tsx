import type { ReactNode } from "react";

type AppShellProps = {
  isSessionMode: boolean;
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
};

export function AppShell({
  isSessionMode,
  sidebar,
  topbar,
  children,
}: AppShellProps) {
  return (
    <main className="app-shell">
      <section className={isSessionMode ? "stage session-mode" : "stage"}>
        {sidebar}
        <div className="content-stage">
          {topbar}
          {children}
        </div>
      </section>
    </main>
  );
}
