import { useEffect, useState } from "react";
import { Protein } from "../components/Protein";
import { useShinyInput, useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PageShell, EngineToggle, GgplotImage, type Engine } from "../components/ui";

// A few BRCA-relevant proteins with a recurrent-variant residue to highlight,
// tying this page back to the mutation treemap / IGV variants.
const PROTEINS = [
  { label: "TP53 (P04637)", uniprot: "P04637", residue: 175, variant: "R175H" },
  { label: "PIK3CA (P42336)", uniprot: "P42336", residue: 1047, variant: "H1047R" },
  { label: "PTEN (P60484)", uniprot: "P60484", residue: 130, variant: "R130*" },
  { label: "GATA3 (P23771)", uniprot: "P23771", residue: 336, variant: "-" },
];

export default function ProteinPage() {
  const [engine, setEngine] = useState<Engine>("react");
  const [idx, setIdx] = useState(0);
  const [style, setStyle] = useState<"cartoon-plddt" | "cartoon-spectrum" | "surface">("cartoon-plddt");
  const [highlight, setHighlight] = useState(true);
  const p = PROTEINS[idx];

  // Mirror the selection to the server so the classic pLDDT profile matches.
  const [, setAcc] = useShinyInput<string>("protein_uniprot", "P04637");
  const [, setRes] = useShinyInput<number | null>("protein_residue", 175);
  useEffect(() => { setAcc(p.uniprot); }, [p.uniprot, setAcc]);
  useEffect(() => { setRes(highlight ? p.residue : null); }, [highlight, p.residue, setRes]);

  const plddt = useShinyOutputValue<string | undefined>("protein_plddt_png", undefined);
  const plddtStatus = useShinyOutputStatus("protein_plddt_png");

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine}
        reactLabel="Shiny React (3Dmol.js)" ggplotLabel="ggplot2 (pLDDT)" />
      <div className="control">
        <label>Protein</label>
        <select value={idx} onChange={(e) => setIdx(Number(e.target.value))}>
          {PROTEINS.map((pr, i) => <option value={i} key={pr.uniprot}>{pr.label}</option>)}
        </select>
      </div>
      {engine === "react" && (
        <>
          <div className="control">
            <label>Style</label>
            <select value={style} onChange={(e) => setStyle(e.target.value as typeof style)}>
              <option value="cartoon-plddt">Cartoon · pLDDT</option>
              <option value="cartoon-spectrum">Cartoon · spectrum</option>
              <option value="surface">Surface</option>
            </select>
          </div>
          <label className="control">
            <input type="checkbox" checked={highlight} onChange={(e) => setHighlight(e.target.checked)} />
            highlight {p.variant !== "-" ? p.variant : `residue ${p.residue}`}
          </label>
        </>
      )}
    </>
  );

  return (
    <PageShell
      title="Protein structure"
      subtitle="AlphaFold predicted structures (coloured by pLDDT confidence) for BRCA driver genes, with the recurrent-variant residue highlighted - the same genes seen in the mutation treemap."
      bar={bar}
    >
      {engine === "ggplot" ? (
        <GgplotImage uri={plddt} status={plddtStatus} />
      ) : (
        <Protein uniprot={p.uniprot} residue={highlight ? p.residue : null} style={style} />
      )}
    </PageShell>
  );
}
