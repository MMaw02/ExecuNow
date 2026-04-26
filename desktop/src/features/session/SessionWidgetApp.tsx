import { SessionWidgetView } from "./SessionWidgetView.tsx";
import { useSessionWidgetController } from "./useSessionWidgetController.ts";
import { useSessionWidgetWindowPolicy } from "./useSessionWidgetWindowPolicy.ts";

export function SessionWidgetApp() {
  const { handlers, viewModel, windowPolicy } = useSessionWidgetController();
  useSessionWidgetWindowPolicy(windowPolicy);

  return <SessionWidgetView {...viewModel} {...handlers} />;
}
