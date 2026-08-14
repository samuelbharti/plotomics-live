import { useMemo, useState } from "react";
import { createKm } from "plotomics/km";
import type { PlotomicsData } from "plotomics/core";
import { useShinyInput, useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { THEME } from "../lib/theme";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

interface SurvivalData {
  columns: {
    time: number[]; surv: number[]; lower: number[]; upper: number[];
    group: string[];
  };
  meta: {
    groups: string[]; groupColors: string[];
    censorTime: number[]; censorSurv: number[]; censorGroup: string[];
    riskTimes: number[]; riskCounts: number[];
    pLabel: string;
  };
}
interface SurvivalStats {
  n: number; events: number; strata: number; p?: number;
  levels: string[]; counts: number[]; eventsPer: number[];
  medians: number[]; geneList: string[];
}

const GROUPINGS = [
  { value: "stage", label: "Tumour stage" },
  { value: "subtype", label: "PAM50 subtype" },
  { value: "age", label: "Age at diagnosis" },
  { value: "gene", label: "Gene alteration" },
];

export default function SurvivalPage() {
  const [engine, setEngine] = useState<Engine>("react");
  const [groupBy, setGroupBy] = useShinyInput<string>("surv_group", "stage");
  const [gene, setGene] = useShinyInput<string>("surv_gene", "TP53");
  const [showCI, setShowCI] = useState(true);

  const data = useShinyOutputValue<SurvivalData | undefined>("survival_data", undefined);
  const dataStatus = useShinyOutputStatus("survival_data");
  const png = useShinyOutputValue<string | undefined>("survival_png", undefined);
  const pngStatus = useShinyOutputStatus("survival_png");
  const stats = useShinyOutputValue<SurvivalStats | undefined>("survival_stats", undefined);

  const options = useMemo(() => ({
    showCI,
    showCensors: true,
    showRiskTable: true,
    yFromZero: true,
    xLabel: "months since diagnosis",
    yLabel: "overall survival",
    theme: THEME,
  }), [showCI]);

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine} />
      <div className="control">
        <label>Stratify by</label>
        <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
          {GROUPINGS.map((g) => <option value={g.value} key={g.value}>{g.label}</option>)}
        </select>
      </div>
      {groupBy === "gene" && (
        <div className="control">
          <label>Gene</label>
          <select value={gene} onChange={(e) => setGene(e.target.value)}>
            {(stats?.geneList ?? [gene]).map((g) => <option value={g} key={g}>{g}</option>)}
          </select>
        </div>
      )}
      {engine === "react" && (
        <div className="control">
          <label>
            <input type="checkbox" checked={showCI}
              onChange={(e) => setShowCI(e.target.checked)} /> 95% band
          </label>
        </div>
      )}
    </>
  );

  // A median of -1 is the server saying the curve never fell to 50%. Printing
  // "not reached" is the honest rendering; printing the last follow-up time
  // would invent a number.
  const median = (v: number) => (v < 0 ? "not reached" : `${v} mo`);

  const statbar = stats && (
    <>
      <span><b>{stats.n.toLocaleString()}</b> patients</span>
      <span><b>{stats.events}</b> deaths</span>
      <span><b>{stats.strata}</b> strata</span>
      {stats.p !== undefined && (
        <span>log-rank <b>p = {stats.p < 0.001 ? "<0.001" : stats.p}</b></span>
      )}
      <span style={{ color: "#8A9384" }}>
        median {stats.levels.map((l, i) => `${l} ${median(stats.medians[i])}`).join(" · ")}
      </span>
    </>
  );

  return (
    <PageShell
      title="Kaplan-Meier survival"
      subtitle="Overall survival for the same 1,067 TCGA breast tumours the oncoplot reads, stratified by stage, PAM50 subtype, age, or whether a driver is altered. The number-at-risk table is not decoration: by 180 months most strata are down to single digits, and the tail of a curve means very little once you can see that. Ticks mark censoring."
      bar={bar}
      stats={statbar}
    >
      {engine === "react" ? (
        data ? <PlotomicsView factory={createKm}
                 data={data as unknown as PlotomicsData} options={options} />
             : <Skeleton label={dataStatus === "error" ? "Server error" : "Fitting curves…"} />
      ) : <GgplotImage uri={png} status={pngStatus} />}
    </PageShell>
  );
}
