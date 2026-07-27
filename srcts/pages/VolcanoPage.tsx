import { useMemo, useState } from "react";
import { createVolcano } from "@plotomics/components/volcano";
import type { PlotomicsData } from "@plotomics/core";
import { useShinyInput, useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { THEME } from "../lib/theme";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

interface VolcanoData { columns: { x: number[]; y: number[]; label: string[] } }
interface VolcanoStats { n: number; up: number; down: number }

export default function VolcanoPage() {
  const [engine, setEngine] = useState<Engine>("react");
  // Shared controls drive BOTH engines: the server re-renders the ggplot PNG
  // and re-sends the data, and the React factory reads the same thresholds.
  const [fc, setFc] = useShinyInput<number>("fc", 1);
  const [p, setP] = useShinyInput<number>("p", 0.05);

  const data = useShinyOutputValue<VolcanoData | undefined>("volcano_data", undefined);
  const dataStatus = useShinyOutputStatus("volcano_data");
  const png = useShinyOutputValue<string | undefined>("volcano_png", undefined);
  const pngStatus = useShinyOutputStatus("volcano_png");
  const stats = useShinyOutputValue<VolcanoStats | undefined>("volcano_stats", undefined);

  const options = useMemo(() => ({
    fcThreshold: fc, pThreshold: p, labelTopN: 12, pointSize: 3.5, opacity: 0.8,
    colors: { up: "#C63F3E", down: "#0E7175", ns: "#C9C1B1" },
    theme: THEME,
  }), [fc, p]);

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine} />
      <div className="control">
        <label>|log2FC| ≥ {fc.toFixed(1)}</label>
        <input type="range" min={0} max={4} step={0.5} value={fc}
          onChange={(e) => setFc(Number(e.target.value))} />
      </div>
      <div className="control">
        <label>p &lt; {p}</label>
        <input type="range" min={0.001} max={0.1} step={0.001} value={p}
          onChange={(e) => setP(Number(e.target.value))} />
      </div>
      <div className="spacer" />
      <span className="control">Engine: {engine === "react" ? "plotomics WebGL" : "ggplot2 + ggrepel"}</span>
    </>
  );

  const statbar = stats && (
    <>
      <span><b>{stats.n.toLocaleString()}</b> genes</span>
      <span style={{ color: "#ff6b6b" }}><b>{stats.up}</b> up</span>
      <span style={{ color: "#4f8cff" }}><b>{stats.down}</b> down</span>
    </>
  );

  return (
    <PageShell
      title="Volcano plot"
      subtitle="Differential expression (TCGA breast tumour vs normal). Move the thresholds - both engines update from the same server-side computation."
      bar={bar}
      stats={statbar}
    >
      {engine === "react" ? (
        data ? <PlotomicsView factory={createVolcano} data={data as PlotomicsData} options={options} />
             : <Skeleton label={dataStatus === "error" ? "Server error" : "Loading data…"} />
      ) : (
        <GgplotImage uri={png} status={pngStatus} />
      )}
    </PageShell>
  );
}
