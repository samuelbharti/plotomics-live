import { useMemo, useState } from "react";
import { createUpset } from "plotomics/upset";
import type { PlotomicsData } from "plotomics/core";
import { useShinyInput, useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { THEME } from "../lib/theme";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

interface UpsetData {
  columns: { size: number[] };
  meta: { sets: string[]; setSizes: number[]; membership: number[]; total: number };
}
interface Pairs {
  a: string[]; b: string[];
  observed: number[]; expected: number[]; p: number[];
}
interface UpsetStats {
  total: number; altered: number; unaltered: number;
  intersections: number; shown: number; pairs?: Pairs;
}

export default function UpsetPage() {
  const [engine, setEngine] = useState<Engine>("react");
  const [nGenes, setNGenes] = useShinyInput<number>("upset_genes", 8);

  const data = useShinyOutputValue<UpsetData | undefined>("upset_data", undefined);
  const dataStatus = useShinyOutputStatus("upset_data");
  const png = useShinyOutputValue<string | undefined>("upset_png", undefined);
  const pngStatus = useShinyOutputStatus("upset_png");
  const stats = useShinyOutputValue<UpsetStats | undefined>("upset_stats", undefined);

  const options = useMemo(() => ({
    barFraction: 0.55,
    showSetSizes: true,
    dotRadius: 5,
    yLabel: "samples",
    theme: THEME,
  }), []);

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine} />
      <div className="control">
        <label>Drivers {nGenes}</label>
        <input type="range" min={4} max={12} step={1} value={nGenes}
          onChange={(e) => setNGenes(Number(e.target.value))} />
      </div>
    </>
  );

  // The strongest pair is the point of the figure, so it goes in the stat bar
  // rather than being left for the reader to eyeball off the bars.
  const top = stats?.pairs && stats.pairs.p.length > 0
    ? {
        a: stats.pairs.a[0], b: stats.pairs.b[0],
        observed: stats.pairs.observed[0], expected: stats.pairs.expected[0],
        p: stats.pairs.p[0],
      }
    : null;

  const statbar = stats && (
    <>
      <span><b>{stats.altered.toLocaleString()}</b> of {stats.total.toLocaleString()} tumours altered</span>
      <span><b>{stats.intersections}</b> distinct combinations, showing top <b>{stats.shown}</b></span>
      {top && (
        <span style={{ color: "#8A9384" }}>
          strongest: <b>{top.a} + {top.b}</b> {top.observed} observed vs {top.expected} expected
          {top.observed < top.expected ? " (exclusive)" : " (co-occurring)"}, p ={" "}
          {top.p < 0.001 ? top.p.toExponential(1) : top.p}
        </span>
      )}
    </>
  );

  return (
    <PageShell
      title="Driver co-occurrence (UpSet)"
      subtitle="Which breast cancer drivers turn up together, and which avoid each other. Each column is an exclusive combination: a tumour is counted once, under precisely the genes it carries, so the bars sum rather than double-count. That is what makes the claim checkable. A Venn diagram gives up at four sets; this reads at twelve."
      bar={bar}
      stats={statbar}
    >
      {engine === "react" ? (
        data ? <PlotomicsView factory={createUpset}
                 data={data as unknown as PlotomicsData} options={options} />
             : <Skeleton label={dataStatus === "error" ? "Server error" : "Counting intersections…"} />
      ) : <GgplotImage uri={png} status={pngStatus} />}
    </PageShell>
  );
}
