import type { LucideIcon } from "lucide-react";
import {
  ChartColumn,
  History,
  House,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
} from "lucide-react";
import type {
  NavigationItem,
  NavView,
  View,
} from "../session/session.types.ts";

type SidebarProps = {
  navItems: readonly NavigationItem[];
  activeView: NavView;
  isCollapsed: boolean;
  canNavigateTo: (target: View) => boolean;
  onNavigate: (target: NavView) => void;
  onToggleCollapsed: () => void;
};

const ICONS: Record<NavView, LucideIcon> = {
  today: House,
  history: History,
  summary: ChartColumn,
  blocking: Shield,
  settings: Settings,
};

export function Sidebar({
  navItems,
  activeView,
  isCollapsed,
  canNavigateTo,
  onNavigate,
  onToggleCollapsed,
}: SidebarProps) {
  const primaryItems = navItems.filter((item) => item.id !== "settings");
  const settingsItem = navItems.find((item) => item.id === "settings");

  return (
    <aside className={isCollapsed ? "sidebar collapsed" : "sidebar"}>
      <div className="sidebar-header">
        <button
          type="button"
          className="sidebar-collapse"
          onClick={onToggleCollapsed}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={18} aria-hidden="true" />
          ) : (
            <PanelLeftClose size={18} aria-hidden="true" />
          )}
        </button>

        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true" />
          {!isCollapsed && (
            <div className="brand-copy">
              <strong>EXECUNOW</strong>
              <span>Peak performance</span>
            </div>
          )}
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        {primaryItems.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            icon={ICONS[item.id]}
            activeView={activeView}
            isCollapsed={isCollapsed}
            disabled={!canNavigateTo(item.id)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {settingsItem ? (
        <div className="sidebar-footer">
          <SidebarItem
            item={settingsItem}
            icon={ICONS.settings}
            activeView={activeView}
            isCollapsed={isCollapsed}
            disabled={!canNavigateTo(settingsItem.id)}
            onNavigate={onNavigate}
          />
        </div>
      ) : null}
    </aside>
  );
}

type SidebarItemProps = {
  item: NavigationItem;
  icon: LucideIcon;
  activeView: NavView;
  isCollapsed: boolean;
  disabled: boolean;
  onNavigate: (target: NavView) => void;
};

function SidebarItem({
  item,
  icon: Icon,
  activeView,
  isCollapsed,
  disabled,
  onNavigate,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      className={item.id === activeView ? "sidebar-item active" : "sidebar-item"}
      onClick={() => onNavigate(item.id)}
      disabled={disabled}
      aria-current={item.id === activeView ? "page" : undefined}
      aria-label={item.label}
      title={isCollapsed ? item.label : undefined}
    >
      <Icon size={18} strokeWidth={2.1} aria-hidden="true" />
      {!isCollapsed && <span>{item.label}</span>}
    </button>
  );
}
