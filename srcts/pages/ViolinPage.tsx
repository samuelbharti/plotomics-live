import { useMemo, useState } from "react";
import { createViolin } from "plotomics/violin";
import type { PlotomicsData } from "plotomics/core";
import { useShinyInput, useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { THEME } from "../lib/theme";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

interface ViolinData {
  columns: { feature: string[]; group: string[] };
  meta: {
    grid: number[]; grids: number[]; density: number[];
    features: string[]; groups: string[]; groupColors: string[];
    median: number[];
  };
}
interface ViolinStats {
  genes: number; clusters: number; spots: number; gridN: number; dataset: string;
}

export default function ViolinPage() {
  const [engine, setEngine] = useState<Engine>("react");
  const [nGenes, setNGenes] = useShinyInput<number>("violin_genes", 8);
  const [showMedian, setShowMedian] = useState(true);

  const data = useShinyOutputValue<ViolinData | undefined>("violin_data", undefined);
  const dataStatus = useShinyOutputStatus("violin_data");
  const png = useShinyOutputValue<string | undefined>("violin_png", undefined);
  const pngStatus = useShinyOutputStatus("violin_png");
  const stats = useShinyOutputValue<ViolinStats | undefined>("violin_stats", undefined);

  const options = useMemo(() => ({
    violinWidth: 0.85,
    scalePerViolin: false,
    showMedian,
    showFeatureLabels: true,
    theme: THEME,
  }), [showMedian]);

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine} />
      <div className="control">
        <label>Genes {nGenes}</label>
        <input type="range" min={4} max={12} step={1} value={nGenes}
          onChange={(e) => setNGenes(Number(e.target.value))} />
      </div>
      {engine === "react" && (
        <div className="control">
          <label>
            <input type="checkbox" checked={showMedian}
              onChange={(e) => setShowMedian(e.target.checked)} /> median
          </label>
        </div>
      )}
    </>
  );

  const statbar = stats && (
    <>
      <span><b>{stats.genes}</b> genes</span>
      <span><b>{stats.clusters}</b> spatial clusters</span>
      <span><b>{stats.spots.toLocaleString()}</b> spots</span>
      <span style={{ color: "#8A9384" }}>
        densities on a {stats.gridN}-point grid per gene
      </span>
    </>
  );

  return (
    <PageShell
      title="Stacked violin"
      subtitle="The distribution the dot plot summarises into two numbers. A gene detected in half a cluster at high level and silent in the other half has the same mean as one detected weakly everywhere, and only the shape separates them. Genes here are picked by detection rate rather than fold change: a violin needs a distribution, and the panel's median gene is seen in 16% of spots, so its density would be mostly a spike at zero. Each row keeps its own y range."
      bar={bar}
      stats={statbar}
    >
      {engine === "react" ? (
        data ? <PlotomicsView factory={createViolin}
                 data={data as unknown as PlotomicsData} options={options} />
             : <Skeleton label={dataStatus === "error" ? "Server error" : "Estimating densities…"} />
      ) : <GgplotImage uri={png} status={pngStatus} />}
    </PageShell>
  );
}
