// A thin, non-Shiny-aware React wrapper around any plotomics headless factory.
//
// Every plotomics component is an imperative factory: create<Name>(el, {data,
// options}) -> { setData, setOptions, resize, destroy }. React only manages the
// container lifecycle and forwards prop changes through that imperative API -
// no re-mount, no GPU realloc. This is the entire integration surface, so the
// same wrapper drives volcano / heatmap / treemap / embedding / igv. Pattern
// adapted from plotomics' own examples/shiny-react-embedding/srcts/Embedding.tsx.
import { useEffect, useRef } from "react";
import type { PlotomicsData } from "plotomics/core";

export interface PlotomicsInstance {
  setData(data: PlotomicsData): void;
  setOptions(options: Record<string, unknown>): void;
  resize(width: number, height: number): void;
  destroy(): void;
}
export type PlotomicsFactory = (
  el: HTMLElement,
  initial: { data?: PlotomicsData; options?: Record<string, unknown> },
) => PlotomicsInstance;

export interface PlotomicsViewProps {
  factory: PlotomicsFactory;
  data?: PlotomicsData;
  options?: Record<string, unknown>;
}

export function PlotomicsView({ factory, data, options }: PlotomicsViewProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const instRef = useRef<PlotomicsInstance | null>(null);

  // Create the instance once; data/option changes are pushed imperatively.
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    instRef.current = factory(el, { data, options });
    const ro = new ResizeObserver(() => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        instRef.current?.resize(el.clientWidth, el.clientHeight);
      }
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      instRef.current?.destroy();
      instRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory]);

  useEffect(() => { if (data) instRef.current?.setData(data); }, [data]);
  useEffect(() => { if (options) instRef.current?.setOptions(options); }, [options]);

  return <div ref={elRef} style={{ width: "100%", height: "100%" }} />;
}
