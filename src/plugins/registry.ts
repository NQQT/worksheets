// Registration types shared by every subject's plugin list.
//
// One registration pairs an UNINVOKED plugin factory with the SUBJECT
// framework bundle it loads against (see plugins/index.ts for the assembled
// registry and science/index.ts for the science extension contract).
import type { DashboardFramework, PluginFactory } from '../framework';

export type WorksheetRegistration = {
    factory: PluginFactory;
    framework: DashboardFramework;
};
