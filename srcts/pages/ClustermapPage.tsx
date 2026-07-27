import { useMemo, useState } from "react";
import { createClustermap } from "@plotomics/components/clustermap";
import type { PlotomicsData } from "@plotomics/core";
import { useShinyInput, useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { THEME } from "../lib/theme";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

interface MatrixData {
  columns: { values: number[] };
  meta: { nrows: number; ncols: number; rowLabels: string[]; colLabels: string[] };
}

export default function ClustermapPage() {
  const [engine, setEngine] = useState<Engine>("react");
  const [nGenes, setNGenes] = useShinyInput<number>("n_genes", 40);
  const [zscore, setZscore] = useShinyInput<boolean>("zscore", true);

  const data = useShinyOutputValue<MatrixData | undefined>("clustermap_data", undefined);
  const dataStatus = useShinyOutputStatus("clustermap_data");
  const png = useShinyOutputValue<string | undefined>("clustermap_png", undefined);
  const pngStatus = useShinyOutputStatus("clustermap_png");

  const options = useMemo(() => ({
    zScore: zscore, colormap: "ltcdiv",
    clusterRows: true, clusterCols: true,
    showRowDendrogram: true, showColDendrogram: true, theme: THEME,
  }), [zscore]);

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
      <div className="spacer" />
      <span className="control">Rows &amp; columns hierarchically clustered</span>
    </>
  );

  return (
    <PageShell
      title="Clustered heatmap"
      subtitle="The same expression matrix as the heatmap page, but with genes and samples hierarchically clustered and dendrograms drawn - the canonical omics clustermap. React clusters in-browser (plotomics); the classic view uses base-R heatmap()."
      bar={bar}
    >
      {engine === "react" ? (
        data ? <PlotomicsView factory={createClustermap} data={data as unknown as PlotomicsData} options={options} />
             : <Skeleton label={dataStatus === "error" ? "Server error" : "Clustering…"} />
      ) : (
        <GgplotImage uri={png} status={pngStatus} />
      )}
    </PageShell>
  );
}
