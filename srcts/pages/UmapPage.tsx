import { useEffect, useMemo, useState } from "react";
import { createEmbedding } from "plotomics/embedding";
import type { PlotomicsData } from "plotomics/core";
import { useShinyInput, useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { THEME } from "../lib/theme";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

interface FieldMeta { label: string; file: string; levels: string[]; colors: string[] }
interface UmapMeta {
  dataset: string; source: string; n: number;
  fields: Record<string, FieldMeta>;
}
interface Loaded {
  meta: UmapMeta;
  x: Float32Array;
  y: Float32Array;
  codes: Record<string, Int16Array>;
}

async function fetchBin(url: string): Promise<ArrayBuffer> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch ${url}: ${r.status}`);
  return r.arrayBuffer();
}

// Load the compact binary column blobs once. Coords are Float32, category codes
// are Int16; the little JSON sidecar carries the category level names + colors.
// This is the whole point of the page: ~584k points arrive as ~7 MB of typed
// arrays over plain HTTP and go straight into the GPU - no JSON-over-websocket.
function useUmap(): { data: Loaded | null; error: string | null } {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meta: UmapMeta = await (await fetch("data/umap_meta.json")).json();
        const [xb, yb] = await Promise.all([
          fetchBin("data/umap_x.f32"),
          fetchBin("data/umap_y.f32"),
        ]);
        const codes: Record<string, Int16Array> = {};
        for (const key of Object.keys(meta.fields)) {
          codes[key] = new Int16Array(await fetchBin(`data/${meta.fields[key].file}`));
        }
        if (!cancelled) {
          setData({ meta, x: new Float32Array(xb), y: new Float32Array(yb), codes });
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return { data, error };
}

export default function UmapPage() {
  const [engine, setEngine] = useState<Engine>("react");
  const [colorBy, setColorBy] = useShinyInput<string>("umap_color", "cell_type");
  const { data, error } = useUmap();

  const png = useShinyOutputValue<{ uri: string; n: number; secs: number } | undefined>("umap_png", undefined);
  const pngStatus = useShinyOutputStatus("umap_png");

  // Build the plotomics data (typed-array coords + a category string column).
  const plotData = useMemo<PlotomicsData | null>(() => {
    if (!data) return null;
    const field = data.meta.fields[colorBy];
    const codes = data.codes[colorBy];
    const levels = field.levels;
    const n = codes.length;
    const color = new Array<string>(n);
    for (let i = 0; i < n; i++) color[i] = levels[codes[i]] ?? "Unknown";
    return { columns: { x: data.x, y: data.y, color, label: color } };
  }, [data, colorBy]);

  const options = useMemo(() => ({
    pointSize: 2, opacity: 0.7, colorMode: "categorical",
    showAxes: false, showLegend: true, padding: 0.12, theme: THEME,
  }), []);

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine} />
      <div className="control">
        <label>Colour by</label>
        <select value={colorBy} onChange={(e) => setColorBy(e.target.value)}>
          <option value="cell_type">Cell type</option>
          <option value="organ">Organ</option>
        </select>
      </div>
      <div className="spacer" />
      <span className="control">
        {engine === "react"
          ? "WebGL - all cells, interactive (scroll to zoom)"
          : "ggplot2 - capped subsample, static"}
      </span>
    </>
  );

  const statbar = (
    <>
      <span><b>{data ? data.meta.n.toLocaleString() : "…"}</b> cells total</span>
      {engine === "react"
        ? <span>React draws <b>all {data ? data.meta.n.toLocaleString() : "…"}</b> on the GPU</span>
        : png && <span>ggplot2 rendered <b>{png.n.toLocaleString()}</b> (subsample) in <b>{png.secs}s</b></span>}
      {data && <span style={{ color: "#8A9384" }}>{data.meta.dataset}</span>}
    </>
  );

  return (
    <PageShell
      title="Single-cell UMAP - 584k cells"
      subtitle="Human Cell Landscape (Han et al. 2020). The React engine streams the full embedding as binary typed arrays and renders every cell on the GPU; the ggplot2 engine can only show a static subsample - the contrast is the point."
      bar={bar}
      stats={statbar}
    >
      {engine === "react" ? (
        error ? <Skeleton label={`Error: ${error}`} />
              : plotData ? <PlotomicsView factory={createEmbedding} data={plotData} options={options} />
                         : <Skeleton label="Streaming 584k cells…" />
      ) : (
        <GgplotImage uri={png?.uri} status={pngStatus} />
      )}
    </PageShell>
  );
}
