import { useMemo, useState } from "react";
import { createDotplot } from "@plotomics/components/dotplot";
import type { PlotomicsData } from "@plotomics/core";
import { useShinyInput, useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { THEME } from "../lib/theme";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

interface DotplotData {
  columns: { gene: string[]; cluster: string[]; pct: number[]; value: number[] };
  meta: { genes: string[]; clusters: string[]; valueLabel: string; sizeLabel: string };
}
interface DotplotStats {
  genes: number; clusters: number; spots: number; dots: number;
  valueLabel: string; dataset: string;
}

export default function DotplotPage() {
  const [engine, setEngine] = useState<Engine>("react");
  const [scaleBy, setScaleBy] = useShinyInput<string>("dot_scale", "gene");

  const data = useShinyOutputValue<DotplotData | undefined>("dotplot_data", undefined);
  const dataStatus = useShinyOutputStatus("dotplot_data");
  const png = useShinyOutputValue<string | undefined>("dotplot_png", undefined);
  const pngStatus = useShinyOutputStatus("dotplot_png");
  const stats = useShinyOutputValue<DotplotStats | undefined>("dotplot_stats", undefined);

  const options = useMemo(() => ({
    colormap: "ltc",
    maxRadius: 8,
    showGrid: true,
    // Scaled mode is already 0-1 for every gene, so pinning the domain keeps
    // the colourbar meaningful instead of re-fitting it to whatever is on screen.
    valueDomain: scaleBy === "gene" ? ([0, 1] as [number, number]) : null,
    theme: THEME,
  }), [scaleBy]);

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine} />
      <div className="control">
        <label>Colour scale</label>
        <select value={scaleBy} onChange={(e) => setScaleBy(e.target.value)}>
          <option value="gene">Scaled within gene</option>
          <option value="raw">Raw mean expression</option>
        </select>
      </div>
    </>
  );

  const statbar = stats && (
    <>
      <span><b>{stats.genes}</b> marker genes</span>
      <span><b>{stats.clusters}</b> spatial clusters</span>
      <span><b>{stats.spots.toLocaleString()}</b> spots summarised</span>
      <span style={{ color: "#8A9384" }}>{stats.valueLabel}</span>
    </>
  );

  return (
    <PageShell
      title="Marker gene dot plot"
      subtitle="The other half of the Visium story: the spot map says where the spatial domains are, this says what defines them. Dot size is the share of spots in a cluster with any detection, colour is the expression level. Two channels, because colour alone cannot tell a gene that is high in a few spots from one that is moderate in all of them. Genes are ordered by the cluster they best mark, which is what turns the grid into a diagonal."
      bar={bar}
      stats={statbar}
    >
      {engine === "react" ? (
        data ? <PlotomicsView factory={createDotplot}
                 data={data as unknown as PlotomicsData} options={options} />
             : <Skeleton label={dataStatus === "error" ? "Server error" : "Summarising clusters…"} />
      ) : <GgplotImage uri={png} status={pngStatus} />}
    </PageShell>
  );
}
