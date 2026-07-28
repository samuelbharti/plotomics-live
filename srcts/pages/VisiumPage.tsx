import { useMemo, useState } from "react";
import { createSpatial } from "@plotomics/components/spatial";
import type { PlotomicsData } from "@plotomics/core";
import { useShinyInput, useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { THEME } from "../lib/theme";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

interface VisiumData {
  columns: { x: number[]; y: number[]; color: string[] | number[]; label: string[] };
  meta: {
    image: string; imgWidth: number; imgHeight: number; spotDiameter: number;
    levels?: string[]; colors?: string[];
  };
}
interface VisiumStats {
  spots: number; genes: number; clusters: number;
  gene: string; geneList: string[]; exprMax: number; dataset: string;
}

export default function VisiumPage() {
  const [engine, setEngine] = useState<Engine>("react");
  const [colourBy, setColourBy] = useShinyInput<string>("visium_by", "cluster");
  const [gene, setGene] = useShinyInput<string>("visium_gene", "ERBB2");
  // Presentation only: it changes no number, and fading the spots to read the
  // histology underneath is exactly what a static PNG cannot offer.
  const [spotOpacity, setSpotOpacity] = useState(0.85);

  const data = useShinyOutputValue<VisiumData | undefined>("visium_data", undefined);
  const dataStatus = useShinyOutputStatus("visium_data");
  const png = useShinyOutputValue<string | undefined>("visium_png", undefined);
  const pngStatus = useShinyOutputStatus("visium_png");
  const stats = useShinyOutputValue<VisiumStats | undefined>("visium_stats", undefined);

  const options = useMemo(() => ({
    colorMode: colourBy === "gene" ? "continuous" : "categorical",
    colormap: "ltc",
    spotScale: 1.6,
    spotOpacity,
    imageOpacity: 1,
    theme: THEME,
  }), [colourBy, spotOpacity]);

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine} />
      <div className="control">
        <label>Colour by</label>
        <select value={colourBy} onChange={(e) => setColourBy(e.target.value)}>
          <option value="cluster">Cluster</option>
          <option value="gene">Gene expression</option>
        </select>
      </div>
      {colourBy === "gene" && (
        <div className="control">
          <label>Gene</label>
          <select value={gene} onChange={(e) => setGene(e.target.value)}>
            {(stats?.geneList ?? [gene]).map((g) => <option value={g} key={g}>{g}</option>)}
          </select>
        </div>
      )}
      {engine === "react" && (
        <div className="control">
          <label>Spot opacity {spotOpacity.toFixed(2)}</label>
          <input type="range" min={0.1} max={1} step={0.05} value={spotOpacity}
            onChange={(e) => setSpotOpacity(Number(e.target.value))} />
        </div>
      )}
    </>
  );

  const statbar = stats && (
    <>
      <span><b>{stats.spots.toLocaleString()}</b> capture spots</span>
      <span><b>{stats.clusters}</b> clusters</span>
      <span><b>{stats.genes}</b> genes in panel</span>
      {colourBy === "gene" && <span>max <b>{stats.exprMax}</b> log1p CP10K</span>}
    </>
  );

  return (
    <PageShell
      title="Visium spatial transcriptomics"
      subtitle="Capture spots at their real coordinates on a breast cancer section, drawn over the H&E they came from. For a spatial assay the tissue is the axis: a cluster that traces the edge of an invasive front means something no embedding can say. Colour by graph-based cluster or by a gene, and fade the spots to read the histology underneath."
      bar={bar}
      stats={statbar}
    >
      {engine === "react" ? (
        data ? <PlotomicsView factory={createSpatial}
                 data={data as unknown as PlotomicsData} options={options} />
             : <Skeleton label={dataStatus === "error" ? "Server error" : "Loading tissue…"} />
      ) : <GgplotImage uri={png} status={pngStatus} />}
    </PageShell>
  );
}
