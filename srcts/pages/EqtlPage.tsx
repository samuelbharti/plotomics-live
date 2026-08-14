import { useMemo, useState } from "react";
import { createHeatmap } from "plotomics/heatmap";
import type { PlotomicsData } from "plotomics/core";
import { useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { THEME } from "../lib/theme";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

interface MatrixData {
  columns: { values: number[] };
  meta: { nrows: number; ncols: number; rowLabels: string[]; colLabels: string[] };
}

export default function EqtlPage() {
  const [engine, setEngine] = useState<Engine>("react");
  const data = useShinyOutputValue<MatrixData | undefined>("eqtl_data", undefined);
  const dataStatus = useShinyOutputStatus("eqtl_data");
  const png = useShinyOutputValue<string | undefined>("eqtl_png", undefined);
  const pngStatus = useShinyOutputStatus("eqtl_png");

  // diverging ramp centred on zero effect
  const options = useMemo(() => ({
    zScore: false, colormap: "ltcdiv", showColorbar: true, theme: THEME,
  }), []);

  return (
    <PageShell
      title="eQTL / pQTL effect map"
      subtitle="Cis-QTL effect sizes: each tile is the signed effect (β) of a variant (row) on a gene/protein (column). Blocks of co-regulated variant–gene pairs stand out. Diverging colour is centred on zero effect."
      bar={<EngineToggle engine={engine} onChange={setEngine} />}
    >
      {engine === "react" ? (
        data ? <PlotomicsView factory={createHeatmap} data={data as unknown as PlotomicsData} options={options} />
             : <Skeleton label={dataStatus === "error" ? "Server error" : "Loading QTL effects…"} />
      ) : <GgplotImage uri={png} status={pngStatus} />}
    </PageShell>
  );
}
