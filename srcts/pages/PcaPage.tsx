import { useMemo, useState } from "react";
import { createEmbedding } from "@plotomics/components/embedding";
import { createProfile } from "@plotomics/components/profile";
import type { PlotomicsData } from "@plotomics/core";
import { useShinyInput, useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { fitUnitCoords } from "../lib/coords";
import { THEME } from "../lib/theme";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

type View = "scores" | "scree" | "loadings";

interface PcaData {
  columns: {
    x?: number[]; y?: number[]; color?: string[]; label?: string[];
    value?: number[]; group?: string[];
  };
  meta?: { groups?: string[]; groupColors?: string[] };
}
interface PcaStats {
  view: View; npc: number; nGenes: number; nSamples: number;
  pcX: number; pcY: number; xLabel: string; yLabel: string;
  varX: number; varY: number; cum2: number;
}

const VIEWS: { key: View; label: string }[] = [
  { key: "scores", label: "Sample scores" },
  { key: "scree", label: "Scree" },
  { key: "loadings", label: "Loadings" },
];

export default function PcaPage() {
  // A 40-sample scatter reads best as the classic plot (points, labels,
  // confidence ellipses); the WebGL engine is built for 100k+ point clouds.
  // Default to ggplot here and keep the React engine one click away.
  const [engine, setEngine] = useState<Engine>("ggplot");
  const [view, setView] = useShinyInput<View>("pca_view", "scores");
  const [pcX, setPcX] = useShinyInput<number>("pca_x", 1);
  const [pcY, setPcY] = useShinyInput<number>("pca_y", 2);
  const [loadN, setLoadN] = useShinyInput<number>("pca_load_n", 20);
  // React-only: it changes how the canvas draws, not what the data says, so it
  // stays client-side rather than costing a server round-trip per drag.
  const [pointSize, setPointSize] = useState(16);

  const data = useShinyOutputValue<PcaData | undefined>("pca_data", undefined);
  const dataStatus = useShinyOutputStatus("pca_data");
  const png = useShinyOutputValue<string | undefined>("pca_png", undefined);
  const pngStatus = useShinyOutputStatus("pca_png");
  const stats = useShinyOutputValue<PcaStats | undefined>("pca_stats", undefined);

  const scoreData = useMemo<PlotomicsData | null>(() => {
    const cx = data?.columns?.x, cy = data?.columns?.y;
    if (!cx || !cy) return null;
    const { x, y } = fitUnitCoords(cx, cy);
    return { columns: { ...data!.columns, x, y } } as unknown as PlotomicsData;
  }, [data]);

  const scoreOptions = useMemo(() => ({
    // A cohort of tens wants far bigger points than the 584k the default is
    // tuned for, and how big is a matter of taste, so it is a control.
    pointSize, opacity: 0.85, colorMode: "categorical" as const,
    // Literal pixels. Under the zoom-scaled default a plot whose data range is
    // nowhere near unit size floors every point at one pixel and pointSize does
    // nothing at all.
    pointScaleMode: "constant" as const,
    showAxes: true, showLegend: true, padding: 0.12,
    xLabel: stats?.xLabel ?? "", yLabel: stats?.yLabel ?? "",
    theme: THEME,
  }), [pointSize, stats?.xLabel, stats?.yLabel]);

  const profileOptions = useMemo(() => ({
    barWidth: 0.62,
    showHeader: view === "loadings",
    yLabel: view === "scree" ? "variance explained (%)" : "loading",
    theme: THEME,
  }), [view]);

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine} />
      <div className="control">
        <label>View</label>
        <select value={view} onChange={(e) => setView(e.target.value as View)}>
          {VIEWS.map((v) => <option value={v.key} key={v.key}>{v.label}</option>)}
        </select>
      </div>
      {view !== "scree" && (
        <div className="control">
          <label>{view === "loadings" ? "Component" : "X"}</label>
          <select value={pcX} onChange={(e) => setPcX(Number(e.target.value))}>
            {Array.from({ length: Math.min(10, stats?.npc ?? 10) }, (_, i) => (
              <option value={i + 1} key={i}>PC{i + 1}</option>
            ))}
          </select>
        </div>
      )}
      {view === "scores" && (
        <div className="control">
          <label>Y</label>
          <select value={pcY} onChange={(e) => setPcY(Number(e.target.value))}>
            {Array.from({ length: Math.min(10, stats?.npc ?? 10) }, (_, i) => (
              <option value={i + 1} key={i}>PC{i + 1}</option>
            ))}
          </select>
        </div>
      )}
      {view === "loadings" && (
        <div className="control">
          <label>Genes {loadN}</label>
          <input type="range" min={10} max={40} step={2} value={loadN}
            onChange={(e) => setLoadN(Number(e.target.value))} />
        </div>
      )}
      {view === "scores" && engine === "react" && (
        <div className="control">
          <label>Point size {pointSize}</label>
          <input type="range" min={4} max={48} step={2} value={pointSize}
            onChange={(e) => setPointSize(Number(e.target.value))} />
        </div>
      )}
    </>
  );

  const statbar = stats && (
    <>
      <span><b>{stats.nSamples}</b> samples</span>
      <span><b>{stats.nGenes.toLocaleString()}</b> most variable genes</span>
      <span><b>{stats.npc}</b> components</span>
      <span style={{ color: "#8A9384" }}>
        {stats.view === "scores"
          ? `PC${stats.pcX} ${stats.varX}% + PC${stats.pcY} ${stats.varY}%`
          : `PC1 + PC2 carry ${stats.cum2}% between them`}
      </span>
    </>
  );

  const body = () => {
    if (engine !== "react") return <GgplotImage uri={png} status={pngStatus} />;
    if (!data) {
      return <Skeleton label={dataStatus === "error" ? "Server error" : "Decomposing…"} />;
    }
    // The scores view is a scatter, the other two are bar profiles, so the
    // factory swaps with the view rather than one component faking both.
    return view === "scores"
      ? (scoreData
          ? <PlotomicsView factory={createEmbedding} data={scoreData} options={scoreOptions} />
          : <Skeleton label="Decomposing…" />)
      : <PlotomicsView factory={createProfile}
          data={data as unknown as PlotomicsData} options={profileOptions} />;
  };

  return (
    <PageShell
      title="PCA explorer"
      subtitle="The same decomposition read three ways. The scores show which samples resemble each other, the scree shows how much of that resemblance any one axis is entitled to claim, and the loadings name the genes doing the work. Reading scores without the scree is how a 4% component gets mistaken for structure. Genes are centred but not scaled, since these are variance-stabilised counts and scaling would give a silent gene the same vote as a marker."
      bar={bar}
      stats={statbar}
    >
      {body()}
    </PageShell>
  );
}
