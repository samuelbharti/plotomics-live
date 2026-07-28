import { useMemo, useState } from "react";
import { createProfile } from "@plotomics/components/profile";
import type { PlotomicsData } from "@plotomics/core";
import { useShinyInput, useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { THEME } from "../lib/theme";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

interface SbsData {
  columns: { value: number[]; group: string[]; label: string[] };
  meta: { groups: string[]; groupColors: string[]; title: string };
}
interface SbsStats {
  profile: string; choices: string[]; yLabel: string;
  isCatalogue: boolean; tumours: number; snv: number; share: number | null;
}

// What each de novo signature resembles among the published processes. Stated
// as a resemblance, not a label: these were extracted from this cohort, they
// are not COSMIC reference signatures and are not named as if they were.
const RESEMBLES: Record<string, string> = {
  "BRCA-A": "mixed, with a clock-like CpG C>T component",
  "BRCA-B": "clock-like CpG deamination (compare SBS1)",
  "BRCA-C": "APOBEC, the C>G arm (compare SBS13)",
  "BRCA-D": "APOBEC, the C>T arm (compare SBS2)",
};

export default function SignaturesPage() {
  const [engine, setEngine] = useState<Engine>("react");
  const [profile, setProfile] = useShinyInput<string>("sbs_profile", "catalogue");

  const data = useShinyOutputValue<SbsData | undefined>("sbs_data", undefined);
  const dataStatus = useShinyOutputStatus("sbs_data");
  const png = useShinyOutputValue<string | undefined>("sbs_png", undefined);
  const pngStatus = useShinyOutputStatus("sbs_png");
  const stats = useShinyOutputValue<SbsStats | undefined>("sbs_stats", undefined);

  const options = useMemo(() => ({
    barWidth: 0.62,
    asFraction: !(stats?.isCatalogue ?? true),
    yLabel: stats?.yLabel ?? "mutations",
    theme: THEME,
  }), [stats?.isCatalogue, stats?.yLabel]);

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine} />
      <div className="control">
        <label>Profile</label>
        <select value={profile} onChange={(e) => setProfile(e.target.value)}>
          {(stats?.choices ?? ["catalogue"]).map((c) => (
            <option value={c} key={c}>
              {c === "catalogue" ? "Observed catalogue" : c}
            </option>
          ))}
        </select>
      </div>
      <div className="spacer" />
      {stats && !stats.isCatalogue && (
        <span className="control">{RESEMBLES[stats.profile] ?? ""}</span>
      )}
    </>
  );

  const statbar = stats && (
    <>
      <span><b>{stats.tumours}</b> tumours</span>
      <span><b>{stats.snv.toLocaleString()}</b> SNVs</span>
      {stats.share != null && (
        <span><b>{stats.share}%</b> of cohort mutations</span>
      )}
    </>
  );

  return (
    <PageShell
      title="Mutational signatures (SBS96)"
      subtitle="The 96 trinucleotide contexts under the six substitution blocks, the layout every signature paper uses. The observed catalogue is the whole TCGA-BRCA cohort; the four signatures below it were extracted de novo by NMF from those same spectra. Two of them come out as the C>T and C>G arms of APOBEC and one as clock-like CpG deamination, recovered without being told to look for them. These are not COSMIC reference signatures, whose licence forbids redistribution."
      bar={bar}
      stats={statbar}
    >
      {engine === "react" ? (
        data ? <PlotomicsView factory={createProfile}
                 data={data as unknown as PlotomicsData} options={options} />
             : <Skeleton label={dataStatus === "error" ? "Server error" : "Loading spectra…"} />
      ) : <GgplotImage uri={png} status={pngStatus} />}
    </PageShell>
  );
}
