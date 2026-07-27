// Typed accessors for the hooks the shinyreact bundle publishes on
// `window.shinyreact`. React itself is imported normally (Vite externalizes it
// to window.shinyreact.React), but the Shiny hooks live only on the global, so
// we thread them through here to keep the rest of the app typed and tidy.

type InputOpts = { debounceMs?: number; priority?: "immediate" | "deferred" | "event"; type?: string };

interface ShinyReactGlobal {
  React: typeof import("react");
  ReactDOM: any;
  useShinyInput: <T>(id: string, def: T, opts?: InputOpts) => [T, (v: T) => void];
  useShinyInputValue: <T>(id: string) => T;
  useShinyOutputValue: <T>(id: string, def?: T) => T;
  useShinyOutputStatus: (id: string) => "pending" | "ready" | "recalculating" | "error";
  useShinyInitialized: () => boolean;
  useShinyBusy: () => boolean;
}

declare global {
  interface Window { shinyreact: ShinyReactGlobal }
}

const sr = (): ShinyReactGlobal => {
  const g = (window as any).shinyreact;
  if (!g) throw new Error("window.shinyreact is not available - is the shinyreact dependency loaded?");
  return g;
};

export function useShinyInput<T>(id: string, def: T, opts?: InputOpts) {
  return sr().useShinyInput<T>(id, def, opts);
}
export function useShinyOutputValue<T>(id: string, def?: T) {
  return sr().useShinyOutputValue<T>(id, def);
}
export function useShinyOutputStatus(id: string) {
  return sr().useShinyOutputStatus(id);
}
export function useShinyInitialized() {
  return sr().useShinyInitialized();
}
