import { useEffect, useMemo, useState } from "react";
import { createEmbedding } from "plotomics/embedding";
import type { PlotomicsData } from "plotomics/core";
import { useShinyInput, useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { fitUnitCoords } from "../lib/coords";
import { THEME } from "../lib/theme";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

interface FieldMeta { label: string; file: string; levels: string[]; colors: string[] }
interface AxisMeta { file: string; scale: number; offset: number }
interface XeniumMeta {
  dataset: string; source: string; license: string; panel: string;
  n: number; nTotal: number; nPassing: number; nGenes: number; qvMin: number;
  coords: { x: AxisMeta; y: AxisMeta };
  fields: Record<string, FieldMeta>;
}
interface Loaded {
  meta: XeniumMeta;
  x: Float32Array;
  y: Float32Array;
  codes: Record<string, Int16Array>;
}

async function fetchBin(url: string): Promise<ArrayBuffer> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch ${url}: ${r.status}`);
  return r.arrayBuffer();
}

// Undo the Int16 coordinate quantization the prep script applied. Over a 7.5 mm
// section the step is 0.11 um, finer than the instrument resolves a molecule to,
// so this costs nothing measurable and halves what crosses the wire.
function dequantize(buf: ArrayBuffer, axis: AxisMeta): Float32Array {
  const codes = new Int16Array(buf);
  const out = new Float32Array(codes.length);
  for (let i = 0; i < codes.length; i++) {
    out[i] = (codes[i] + 32768) * axis.scale + axis.offset;
  }
  return out;
}

// Same trick as the UMAP page, one level further: the coordinates here are not
// an abstract embedding but real micrometres on a tissue section.
function useXenium(): { data: Loaded | null; error: string | null } {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meta: XeniumMeta = await (await fetch("data/xenium_meta.json")).json();
        const [xb, yb] = await Promise.all([
          fetchBin(`data/${meta.coords.x.file}`),
          fetchBin(`data/${meta.coords.y.file}`),
        ]);
        const codes: Record<string, Int16Array> = {};
        for (const key of Object.keys(meta.fields)) {
          codes[key] = new Int16Array(await fetchBin(`data/${meta.fields[key].file}`));
        }
        if (!cancelled) {
          setData({
            meta,
            x: dequantize(xb, meta.coords.x),
            // Flip y: the instrument writes image coordinates, so leaving it
            // alone would mirror the section top to bottom against the ggplot.
            y: dequantize(yb, meta.coords.y).map((v) => -v),
            codes,
          });
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return { data, error };
}

export default function XeniumPage() {
  const [engine, setEngine] = useState<Engine>("react");
  const [colorBy, setColorBy] = useShinyInput<string>("xenium_color", "class");
  const { data, error } = useXenium();

  const png = useShinyOutputValue<{ uri: string; n: number; secs: number } | undefined>("xenium_png", undefined);
  const pngStatus = useShinyOutputStatus("xenium_png");

  const field = data?.meta.fields[colorBy];

  const plotData = useMemo<PlotomicsData | null>(() => {
    if (!data || !field) return null;
    const codes = data.codes[colorBy];
    const levels = field.levels;
    const n = codes.length;
    const color = new Array<string>(n);
    for (let i = 0; i < n; i++) color[i] = levels[codes[i]] ?? "Other";
    // Micrometre coordinates span ~7500; scale to unit-ish range so the fitted
    // camera does not zoom out past where points collapse. See lib/coords.
    const { x, y } = fitUnitCoords(data.x, data.y);
    return { columns: { x, y, color, label: color } };
  }, [data, field, colorBy]);

  // The level order and the palette both come from the sidecar the prep script
  // wrote, which is the same file the ggplot side reads. Passing `categories`
  // pins colour to category rather than to whichever one the first row happens
  // to carry, so the two engines cannot disagree about what red means.
  const options = useMemo(() => ({
    pointSize: 1.4,
    // Literal pixels regardless of zoom, so molecules stay visible.
    pointScaleMode: "constant",
    opacity: 0.55,
    colorMode: "categorical",
    categories: field?.levels ?? null,
    showAxes: false,
    showLegend: true,
    padding: 0.03,
    // x and y are micrometres on the slide, so one unit must be one unit in
    // either direction. Stretching to fill would distort the section's real
    // geometry. Matches coord_fixed on the ggplot side.
    aspect: "equal",
    theme: { ...THEME, categorical: field?.colors ?? THEME.categorical },
  }), [field]);

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine} />
      <div className="control">
        <label>Colour by</label>
        <select value={colorBy} onChange={(e) => setColorBy(e.target.value)}>
          {Object.entries(data?.meta.fields ?? {}).map(([k, f]) => (
            <option value={k} key={k}>{f.label}</option>
          ))}
        </select>
      </div>
      <div className="spacer" />
      <span className="control">
        {engine === "react"
          ? "WebGL - one million molecules, interactive (scroll to zoom)"
          : "ggplot2 - capped subsample, static"}
      </span>
    </>
  );

  const statbar = (
    <>
      <span><b>{data ? data.meta.nTotal.toLocaleString() : "…"}</b> detections in the run</span>
      <span><b>{data ? data.meta.nGenes : "…"}</b> gene panel</span>
      {engine === "react"
        ? <span>React draws <b>{data ? data.meta.n.toLocaleString() : "…"}</b> of them on the GPU</span>
        : png && <span>ggplot2 rendered <b>{png.n.toLocaleString()}</b> (subsample) in <b>{png.secs}s</b></span>}
      {data && <span style={{ color: "#8A9384" }}>{data.meta.panel}</span>}
    </>
  );

  return (
    <PageShell
      title="Xenium single-molecule transcripts"
      subtitle="Every point is one mRNA molecule at the micrometre where it was detected in a breast cancer section, not a cell and not an embedding. The run found 42.6 million of them across a 313-gene panel; a million are drawn here on the GPU while the ggplot2 engine has to fall back to a subsample. Zoom in far enough and the tumour nests resolve into individual transcripts."
      bar={bar}
      stats={statbar}
    >
      {engine === "react" ? (
        error ? <Skeleton label={`Error: ${error}`} />
              : plotData ? <PlotomicsView factory={createEmbedding} data={plotData} options={options} />
                         : <Skeleton label="Streaming a million molecules…" />
      ) : (
        <GgplotImage uri={png?.uri} status={pngStatus} />
      )}
    </PageShell>
  );
}
