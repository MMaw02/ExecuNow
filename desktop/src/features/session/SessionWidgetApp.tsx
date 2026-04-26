import { SessionWidgetView } from "./SessionWidgetView.tsx";
import { useSessionWidgetController } from "./useSessionWidgetController.ts";
import { useSessionWidgetWindowPolicy } from "./useSessionWidgetWindowPolicy.ts";

export function SessionWidgetApp() {
  const { handlers, runtime, viewModel } = useSessionWidgetController();
  useSessionWidgetWindowPolicy(runtime);

  return <SessionWidgetView {...viewModel} {...handlers} />;
}
