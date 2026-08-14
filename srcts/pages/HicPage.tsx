import { useMemo, useState } from "react";
// A contact matrix is a heatmap; we use the heatmap factory (no float-texture
// requirement) rather than the hic factory, which needs OES_texture_float that
// current Chrome no longer exposes.
import { createHeatmap } from "plotomics/heatmap";
import type { PlotomicsData } from "plotomics/core";
import { useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { THEME } from "../lib/theme";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

interface HicData {
  columns: { values: number[] };
  meta: { nrows: number; ncols: number };
}

export default function HicPage() {
  const [engine, setEngine] = useState<Engine>("react");
  const [colormap, setColormap] = useState("ltc");
  const data = useShinyOutputValue<HicData | undefined>("hic_data", undefined);
  const dataStatus = useShinyOutputStatus("hic_data");
  const png = useShinyOutputValue<string | undefined>("hic_png", undefined);
  const pngStatus = useShinyOutputStatus("hic_png");
  const stats = useShinyOutputValue<{ n: number; chrom: string } | undefined>("hic_stats", undefined);

  const options = useMemo(() => ({
    colormap, zScore: false, showColorbar: true, theme: THEME,
  }), [colormap]);

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine} />
      {engine === "react" && (
        <div className="control">
          <label>Colormap</label>
          <select value={colormap} onChange={(e) => setColormap(e.target.value)}>
            <option value="ltc">LTC</option>
            <option value="viridis">viridis</option>
          </select>
        </div>
      )}
      <div className="spacer" />
      {stats && <span className="control">{stats.chrom} · {stats.n}×{stats.n} bins</span>}
    </>
  );

  return (
    <PageShell
      title="Hi-C contact matrix"
      subtitle="A chromatin contact map (simulated): distance decay along the diagonal, nested topologically-associating domains (TADs) and a few long-range loops. WebGL float-texture rendering (plotomics) vs a ggplot2 raster."
      bar={bar}
      stats={stats && <><span><b>{(stats.n * stats.n).toLocaleString()}</b> contacts</span></>}
    >
      {engine === "react" ? (
        data ? <PlotomicsView factory={createHeatmap} data={data as unknown as PlotomicsData} options={options} />
             : <Skeleton label={dataStatus === "error" ? "Server error" : "Loading matrix…"} />
      ) : (
        <GgplotImage uri={png} status={pngStatus} />
      )}
    </PageShell>
  );
}
