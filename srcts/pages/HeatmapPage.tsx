import { useMemo, useState } from "react";
import { createHeatmap } from "@plotomics/components/heatmap";
import type { PlotomicsData } from "@plotomics/core";
import { useShinyInput, useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { THEME } from "../lib/theme";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

interface HeatmapData {
  columns: { values: number[] };
  meta: { nrows: number; ncols: number; rowLabels: string[]; colLabels: string[] };
}

export default function HeatmapPage() {
  const [engine, setEngine] = useState<Engine>("react");
  const [nGenes, setNGenes] = useShinyInput<number>("n_genes", 40);
  const [zscore, setZscore] = useShinyInput<boolean>("zscore", true);
  const [colormap, setColormap] = useState("ltcdiv");

  const data = useShinyOutputValue<HeatmapData | undefined>("heatmap_data", undefined);
  const dataStatus = useShinyOutputStatus("heatmap_data");
  const png = useShinyOutputValue<string | undefined>("heatmap_png", undefined);
  const pngStatus = useShinyOutputStatus("heatmap_png");

  const options = useMemo(() => ({
    colormap, zScore: zscore, showColorbar: true, theme: THEME,
  }), [colormap, zscore]);

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine} />
      <div className="control">
        <label>Genes: {nGenes}</label>
        <input type="range" min={10} max={80} step={5} value={nGenes}
          onChange={(e) => setNGenes(Number(e.target.value))} />
      </div>
      <label className="control">
        <input type="checkbox" checked={zscore} onChange={(e) => setZscore(e.target.checked)} />
        z-score rows
      </label>
      {engine === "react" && (
        <div className="control">
          <label>Colormap</label>
          <select value={colormap} onChange={(e) => setColormap(e.target.value)}>
            <option value="ltcdiv">LTC diverging</option>
            <option value="ltc">LTC sequential</option>
            <option value="rdbu">RdBu</option>
            <option value="viridis">viridis</option>
          </select>
        </div>
      )}
    </>
  );

  return (
    <PageShell
      title="Expression heatmap"
      subtitle="Most-variable genes across TCGA breast samples (tumour vs normal), optionally z-scored per gene."
      bar={bar}
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
