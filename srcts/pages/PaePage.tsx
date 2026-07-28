import { useEffect, useMemo, useState } from "react";
import { createHeatmap } from "@plotomics/components/heatmap";
import type { PlotomicsData } from "@plotomics/core";
import { useShinyInput, useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { THEME } from "../lib/theme";
import { PaeProfileCanvas, type PaeProfileData } from "../components/CanvasPlots";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

// The same four BRCA proteins the structure page offers, so the two pages tell
// one story: 3Dmol shows the fold, pLDDT shows per-residue confidence, and PAE
// shows whether the domains are confidently placed *relative to each other*.
const PROTEINS = [
  { label: "TP53 (P04637)", uniprot: "P04637", residue: 175 },
  { label: "PIK3CA (P42336)", uniprot: "P42336", residue: 1047 },
  { label: "PTEN (P60484)", uniprot: "P60484", residue: 130 },
  { label: "GATA3 (P23771)", uniprot: "P23771", residue: 336 },
];

interface MatrixData {
  columns: { values: number[] };
  meta: { nrows: number; ncols: number; rowLabels: string[]; colLabels: string[] };
}
interface PaeStats {
  ok: boolean; residues: number; binned: number; bin: number;
  cells: number; maxPae: number; mean: number;
}

export default function PaePage() {
  const [engine, setEngine] = useState<Engine>("react");
  const [profileEngine, setProfileEngine] = useState<Engine>("react");
  const [idx, setIdx] = useState(0);
  const p = PROTEINS[idx];

  const [, setAcc] = useShinyInput<string>("pae_uniprot", "P04637");
  const [residue, setResidue] = useShinyInput<number>("pae_residue", 175);
  useEffect(() => { setAcc(p.uniprot); setResidue(p.residue); }, [p.uniprot, p.residue, setAcc, setResidue]);

  const data = useShinyOutputValue<MatrixData | undefined>("pae_data", undefined);
  const dataStatus = useShinyOutputStatus("pae_data");
  const png = useShinyOutputValue<string | undefined>("pae_png", undefined);
  const pngStatus = useShinyOutputStatus("pae_png");
  const profile = useShinyOutputValue<PaeProfileData | undefined>("pae_profile_data", undefined);
  const profilePng = useShinyOutputValue<string | undefined>("pae_profile_png", undefined);
  const profilePngStatus = useShinyOutputStatus("pae_profile_png");
  const stats = useShinyOutputValue<PaeStats | undefined>("pae_stats", undefined);

  // "ltc" is biov_gradient() in R/palettes.R, so both engines use the identical
  // ramp; fixed limits on the ggplot side keep the mapping identical too.
  const options = useMemo(() => ({
    zScore: false, colormap: "ltc", showColorbar: true, theme: THEME,
  }), []);

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine} />
      <div className="control">
        <label>Protein</label>
        <select value={idx} onChange={(e) => setIdx(Number(e.target.value))}>
          {PROTEINS.map((pr, i) => <option value={i} key={pr.uniprot}>{pr.label}</option>)}
        </select>
      </div>
      <div className="spacer" />
      {stats?.ok && (
        <span className="control">
          {stats.residues} residues
          {stats.bin > 1 ? ` · binned ${stats.bin}× to ${stats.binned}²` : ""}
        </span>
      )}
    </>
  );

  const statbar = stats?.ok && (
    <>
      <span><b>{stats.cells.toLocaleString()}</b> residue pairs</span>
      <span>mean PAE <b>{stats.mean} Å</b></span>
      <span>max <b>{stats.maxPae} Å</b></span>
    </>
  );

  const profileBar = (
    <>
      <EngineToggle engine={profileEngine} onChange={setProfileEngine}
        reactLabel="Shiny React (canvas)" />
      <div className="control">
        <label>Aligned on residue: {residue}</label>
        <input type="range" min={1} max={stats?.residues ?? 393} value={residue}
          onChange={(e) => setResidue(Number(e.target.value))} />
      </div>
    </>
  );

  return (
    <div>
      <PageShell
        title="AlphaFold PAE matrix"
        subtitle="Predicted aligned error: entry (x, y) is the expected position error at residue x when the prediction is superposed on residue y. Dark blocks on the diagonal are confidently-folded domains; a bright block between two dark ones means both domains are individually confident but their relative orientation is not - the read the pLDDT profile cannot give you."
        bar={bar}
        stats={statbar}
      >
        {engine === "react" ? (
          data ? <PlotomicsView factory={createHeatmap}
                   data={data as unknown as PlotomicsData} options={options} />
               : <Skeleton label={dataStatus === "error" ? "Server error" : "Fetching PAE from AlphaFold…"} />
        ) : <GgplotImage uri={png} status={pngStatus} />}
      </PageShell>

      <div style={{ marginTop: "1.5rem" }}>
        <PageShell
          title="PAE profile for one residue"
          subtitle="A single row of the matrix. Drag the slider to pick the reference residue: flat low regions move as one rigid body with it, and the steps mark domain boundaries."
          bar={profileBar}
        >
          {profileEngine === "react" ? (
            profile && stats?.ok
              ? <PaeProfileCanvas data={profile} residues={stats.residues} />
              : <Skeleton label="Loading profile…" />
          ) : <GgplotImage uri={profilePng} status={profilePngStatus} />}
        </PageShell>
      </div>
    </div>
  );
}
