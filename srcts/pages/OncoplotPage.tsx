import { useMemo, useState } from "react";
import { createOncoplot } from "@plotomics/components/oncoplot";
import type { PlotomicsData } from "@plotomics/core";
import { useShinyInput, useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { THEME } from "../lib/theme";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

interface OncoData {
  columns: { codes: number[]; tmb: number[]; freq: number[] };
  meta: {
    nrows: number; ncols: number;
    genes: string[]; samples: string[];
    classes: string[]; classColors: string[];
    annotations: { name: string; levels: string[]; codes: number[]; colors: string[] }[];
  };
}
interface OncoStats {
  genes: number; samples: number; cohort: number;
  altered: number; events: number; medianTmb: number;
}

export default function OncoplotPage() {
  const [engine, setEngine] = useState<Engine>("react");
  // Shared with the server so the ggplot2 view re-renders the same gene set.
  const [nGenes, setNGenes] = useShinyInput<number>("onco_genes", 25);

  const data = useShinyOutputValue<OncoData | undefined>("oncoplot_data", undefined);
  const dataStatus = useShinyOutputStatus("oncoplot_data");
  const png = useShinyOutputValue<string | undefined>("oncoplot_png", undefined);
  const pngStatus = useShinyOutputStatus("oncoplot_png");
  const stats = useShinyOutputValue<OncoStats | undefined>("oncoplot_stats", undefined);

  const options = useMemo(() => ({
    emptyColor: "#EFE9DC",
    burdenColor: "#0E7175",
    frequencyColor: "#ED773C",
    xLabel: "samples",
    theme: THEME,
  }), []);

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine} />
      <div className="control">
        <label>Genes: {nGenes}</label>
        <input type="range" min={10} max={30} step={1} value={nGenes}
          onChange={(e) => setNGenes(Number(e.target.value))} />
      </div>
      <div className="spacer" />
      {stats && (
        <span className="control">
          {stats.samples.toLocaleString()} altered of {stats.cohort.toLocaleString()} sequenced
        </span>
      )}
    </>
  );

  const statbar = stats && (
    <>
      <span><b>{stats.genes}</b> genes</span>
      <span><b>{stats.samples.toLocaleString()}</b> samples</span>
      <span><b>{stats.events.toLocaleString()}</b> alterations</span>
      <span>median <b>{stats.medianTmb}</b> per sample</span>
    </>
  );

  return (
    <PageShell
      title="Oncoplot (OncoPrint)"
      subtitle="The cohort alteration landscape for TCGA breast cancer: somatic mutations plus GISTIC deep deletions and amplifications across the recurrently altered drivers. Genes are ordered by frequency and samples by the memo sort, which is what makes the mutual exclusivity between PIK3CA and TP53 read as a staircase. Burden per sample runs along the top, frequency per gene down the right, and subtype and stage annotate the cohort below."
      bar={bar}
      stats={statbar}
    >
      {engine === "react" ? (
        data ? <PlotomicsView factory={createOncoplot}
                 data={data as unknown as PlotomicsData} options={options} />
             : <Skeleton label={dataStatus === "error" ? "Server error" : "Loading cohort…"} />
      ) : <GgplotImage uri={png} status={pngStatus} />}
    </PageShell>
  );
}
