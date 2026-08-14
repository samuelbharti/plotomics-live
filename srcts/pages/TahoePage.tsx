import { useEffect, useMemo, useState } from "react";
import { createHeatmap } from "plotomics/heatmap";
import { createClustermap } from "plotomics/clustermap";
import { createEmbedding } from "plotomics/embedding";
import type { PlotomicsData } from "plotomics/core";
import { useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { THEME } from "../lib/theme";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

interface MatrixData {
  columns: { values: number[] };
  meta: { nrows: number; ncols: number; rowLabels: string[]; colLabels: string[] };
}

// ---- panel 1: drug × cell-line coverage heatmap --------------------------
function CoveragePanel() {
  const [engine, setEngine] = useState<Engine>("react");
  const [cluster, setCluster] = useState(true);
  const data = useShinyOutputValue<MatrixData | undefined>("tahoe_data", undefined);
  const dataStatus = useShinyOutputStatus("tahoe_data");
  const png = useShinyOutputValue<string | undefined>("tahoe_png", undefined);
  const pngStatus = useShinyOutputStatus("tahoe_png");
  const stats = useShinyOutputValue<{ drugs: number; cells: number } | undefined>("tahoe_stats", undefined);

  const options = useMemo(() => (
    cluster
      ? { zScore: false, colormap: "ltc", clusterRows: true, clusterCols: true,
          showRowDendrogram: true, showColDendrogram: true, theme: THEME }
      : { zScore: false, colormap: "ltc", showColorbar: true, theme: THEME }
  ), [cluster]);

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine} />
      {engine === "react" && (
        <label className="control">
          <input type="checkbox" checked={cluster} onChange={(e) => setCluster(e.target.checked)} />
          cluster drugs &amp; cell lines
        </label>
      )}
    </>
  );

  return (
    <PageShell
      title="Tahoe-100M drug perturbation coverage"
      subtitle="Real data from the Tahoe-100M single-cell drug atlas (Arc Institute): how many cells were profiled for each drug × cell-line combination (log10). Prepared from obs_cell_grid via duckdb."
      bar={bar}
      stats={stats && <><span><b>{stats.drugs}</b> drugs</span><span><b>{stats.cells}</b> cell lines</span></>}
    >
      {engine === "react" ? (
        data ? <PlotomicsView factory={cluster ? createClustermap : createHeatmap}
                              data={data as unknown as PlotomicsData} options={options} />
             : <Skeleton label={dataStatus === "error" ? "Server error" : "Loading Tahoe matrix…"} />
      ) : (
        <GgplotImage uri={png} status={pngStatus} />
      )}
    </PageShell>
  );
}

// ---- panel 2: 380k individual cells (the large-data showcase) ------------
interface AxisSpec { label: string; x: string; y: string; xLabel: string; yLabel: string }
interface FieldSpec { label: string; file: string; levels: string[]; colors: string[] }
interface CellsMeta { dataset: string; n: number; axes: Record<string, AxisSpec>; fields: Record<string, FieldSpec> }
interface CellsLoaded { meta: CellsMeta; cols: Record<string, Float32Array>; codes: Record<string, Int16Array> }

async function fetchBin(u: string) { const r = await fetch(u); if (!r.ok) throw new Error(`${u}: ${r.status}`); return r.arrayBuffer(); }

function useTahoeCells() {
  const [data, setData] = useState<CellsLoaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meta: CellsMeta = await (await fetch("data/tahoe_cells_meta.json")).json();
        const files = new Set<string>();
        Object.values(meta.axes).forEach((a) => { files.add(a.x); files.add(a.y); });
        const cols: Record<string, Float32Array> = {};
        await Promise.all([...files].map(async (f) => { cols[f] = new Float32Array(await fetchBin(`data/${f}`)); }));
        const codes: Record<string, Int16Array> = {};
        await Promise.all(Object.entries(meta.fields).map(async ([k, fld]) => {
          codes[k] = new Int16Array(await fetchBin(`data/${fld.file}`));
        }));
        if (!cancelled) setData({ meta, cols, codes });
      } catch (e) { if (!cancelled) setError(String(e)); }
    })();
    return () => { cancelled = true; };
  }, []);
  return { data, error };
}

function CellsPanel() {
  const { data, error } = useTahoeCells();
  const [colorBy, setColorBy] = useState("phase");
  const axis = "cellcycle";

  const plotData = useMemo<PlotomicsData | null>(() => {
    if (!data) return null;
    const a = data.meta.axes[axis];
    const codes = data.codes[colorBy];
    const levels = data.meta.fields[colorBy].levels;
    const color = new Array<string>(codes.length);
    for (let i = 0; i < codes.length; i++) color[i] = levels[codes[i]] ?? "NA";
    return { columns: { x: data.cols[a.x], y: data.cols[a.y], color, label: color } };
  }, [data, colorBy]);

  const options = useMemo(() => {
    const a = data?.meta.axes[axis];
    return {
      pointSize: 2, opacity: 0.55, colorMode: "categorical",
      showAxes: false, showLegend: true, padding: 0.06,
      xLabel: a?.xLabel ?? "", yLabel: a?.yLabel ?? "", theme: THEME,
    };
  }, [data]);

  const bar = (
    <>
      <div className="control">
        <label>Colour by</label>
        <select value={colorBy} onChange={(e) => setColorBy(e.target.value)}>
          <option value="phase">Cell-cycle phase</option>
          <option value="cell_line">Cell line</option>
        </select>
      </div>
      <div className="spacer" />
      <span className="control">S phase score × G2M phase score</span>
    </>
  );

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <PageShell
        title="…and 380,078 individual cells"
        subtitle="A uniform sample of 380k single cells from the 100-million-cell atlas - each cell's cell-cycle scores (S vs G2M), streamed as binary typed arrays and drawn on the GPU. Pan and zoom stay smooth - the kind of large-data interactivity Shiny React unlocks that a static ggplot2 image cannot. (React-only by design.)"
        bar={bar}
        stats={data && <>
          <span><b>{data.meta.n.toLocaleString()}</b> cells on the GPU</span>
          <span style={{ color: "#8A9384" }}>{data.meta.dataset}</span>
        </>}
      >
        {error ? <Skeleton label={`Error: ${error}`} />
          : plotData ? <PlotomicsView factory={createEmbedding} data={plotData} options={options} />
                     : <Skeleton label="Streaming 380k cells…" />}
      </PageShell>
    </div>
  );
}

export default function TahoePage() {
  return (
    <div>
      <CoveragePanel />
      <CellsPanel />
    </div>
  );
}
