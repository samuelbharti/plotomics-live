import { useState } from "react";
import { useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { CoverageTracksCanvas, type AtacData } from "../components/CanvasPlots";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

export default function AtacPage() {
  const [engine, setEngine] = useState<Engine>("react");
  const data = useShinyOutputValue<AtacData | undefined>("atac_data", undefined);
  const dataStatus = useShinyOutputStatus("atac_data");
  const png = useShinyOutputValue<string | undefined>("atac_png", undefined);
  const pngStatus = useShinyOutputStatus("atac_png");

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine} reactLabel="Shiny React (canvas)" />
      <div className="spacer" />
      {data && <span className="control">{data.meta.nClusters} clusters · {data.meta.chrom}</span>}
    </>
  );

  return (
    <PageShell
      title="Single-cell ATAC coverage"
      subtitle="Pseudobulk chromatin accessibility across a genomic window, split by cell cluster (the Signac CoveragePlot view): a shared promoter peak plus cluster-specific enhancer peaks. Simulated scATAC signal."
      bar={bar}
    >
      {engine === "react" ? (
        data ? <CoverageTracksCanvas data={data} />
             : <Skeleton label={dataStatus === "error" ? "Server error" : "Loading coverage…"} />
      ) : <GgplotImage uri={png} status={pngStatus} />}
    </PageShell>
  );
}
