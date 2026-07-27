import { useMemo, useState } from "react";
import { createTreemap } from "@plotomics/components/treemap";
import type { PlotomicsData } from "@plotomics/core";
import { useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { THEME } from "../lib/theme";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

interface TreemapData {
  columns: { id: string[]; parent: string[]; value: number[] };
  meta: { labels: string[] };
}

export default function TreemapPage() {
  const [engine, setEngine] = useState<Engine>("react");
  const [tile, setTile] = useState<"squarify" | "binary">("squarify");

  const data = useShinyOutputValue<TreemapData | undefined>("treemap_data", undefined);
  const dataStatus = useShinyOutputStatus("treemap_data");
  const png = useShinyOutputValue<string | undefined>("treemap_png", undefined);
  const pngStatus = useShinyOutputStatus("treemap_png");

  const options = useMemo(() => ({
    tile, colorBy: "parent", labelMinSize: 26, theme: THEME,
  }), [tile]);

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine} />
      {engine === "react" && (
        <div className="control">
          <label>Tiling</label>
          <select value={tile} onChange={(e) => setTile(e.target.value as "squarify" | "binary")}>
            <option value="squarify">squarify</option>
            <option value="binary">binary</option>
          </select>
        </div>
      )}
      <div className="spacer" />
      <span className="control">Gene → variant, sized by recurrence. Click a gene to zoom (React).</span>
    </>
  );

  return (
    <PageShell
      title="Mutation treemap"
      subtitle="BRCA mutation landscape as a hierarchy: each gene block is subdivided into its recurrent protein-change variants."
      bar={bar}
    >
      {engine === "react" ? (
        data ? <PlotomicsView factory={createTreemap} data={data as unknown as PlotomicsData} options={options} />
             : <Skeleton label={dataStatus === "error" ? "Server error" : "Loading hierarchy…"} />
      ) : (
        <GgplotImage uri={png} status={pngStatus} />
      )}
    </PageShell>
  );
}
