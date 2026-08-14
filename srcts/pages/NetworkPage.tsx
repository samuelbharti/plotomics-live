import { useMemo, useState } from "react";
import { createNetwork } from "plotomics/network";
import type { PlotomicsData } from "plotomics/core";
import { useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { THEME } from "../lib/theme";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

interface NetworkData {
  columns: { id: string[]; x: number[]; y: number[]; size: number[]; source: string[]; target: string[] };
  meta: { nodeGroup: string[]; nodeLabels: string[] };
}
interface NetworkPng { uri: string; nodes: number; edges: number; secs: number }

export default function NetworkPage() {
  const [engine, setEngine] = useState<Engine>("react");
  const data = useShinyOutputValue<NetworkData | undefined>("network_data", undefined);
  const dataStatus = useShinyOutputStatus("network_data");
  const png = useShinyOutputValue<NetworkPng | undefined>("network_png", undefined);
  const pngStatus = useShinyOutputStatus("network_png");
  const stats = useShinyOutputValue<{ nodes: number; edges: number } | undefined>("network_stats", undefined);

  // Coordinates are precomputed server-side (igraph) so both engines share the
  // exact same layout - sigma just draws it (no in-browser force sim needed).
  const options = useMemo(() => ({
    layout: "precomputed", defaultEdgeColor: "#D8CFBE",
    labelThreshold: 14, theme: THEME,
  }), []);

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine} reactLabel="Shiny React (sigma/WebGL)" />
      <div className="spacer" />
      <span className="control">
        {engine === "react" ? "WebGL - pan/zoom, hover nodes" : "ggplot2 - static render"}
      </span>
    </>
  );

  const statbar = stats && (
    <>
      <span><b>{stats.nodes.toLocaleString()}</b> nodes</span>
      <span><b>{stats.edges.toLocaleString()}</b> edges</span>
      {engine === "ggplot" && png && <span>ggplot2 drew it in <b>{png.secs}s</b></span>}
    </>
  );

  return (
    <PageShell
      title="Gene network"
      subtitle="A large modular gene network (stochastic block model, laid out once with igraph). The React engine renders it on the GPU with sigma and stays interactive; the ggplot2 engine draws the identical layout as a static image."
      bar={bar}
      stats={statbar}
    >
      {engine === "react" ? (
        data ? <PlotomicsView factory={createNetwork} data={data as unknown as PlotomicsData} options={options} />
             : <Skeleton label={dataStatus === "error" ? "Server error" : "Loading network…"} />
      ) : (
        <GgplotImage uri={png?.uri} status={pngStatus} />
      )}
    </PageShell>
  );
}
