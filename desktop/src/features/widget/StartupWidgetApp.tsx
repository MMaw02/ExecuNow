import { StartupWidgetView } from "./StartupWidgetView.tsx";
import { useStartupWidgetController } from "./useStartupWidgetController.ts";

export function StartupWidgetApp() {
  const { handlers, viewModel } = useStartupWidgetController();

  return <StartupWidgetView {...viewModel} {...handlers} />;
}
