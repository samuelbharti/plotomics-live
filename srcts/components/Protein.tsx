// Imperative React wrapper around 3Dmol.js - the same "own the element, forward
// prop changes" pattern as the plotomics wrapper, but for a WebGL molecular
// viewer. Loads an AlphaFold predicted structure by UniProt accession and
// optionally highlights a variant residue.
import { useEffect, useRef, useState } from "react";
// 3dmol ships a UMD/ESM bundle; types are loose, but Vite transpiles (no
// type-check) so this is fine at build time.
import * as $3Dmol from "3dmol";
import { Skeleton } from "./ui";

const AF_URL = (uniprot: string) =>
  `https://alphafold.ebi.ac.uk/files/AF-${uniprot}-F1-model_v6.pdb`;

export function Protein({ uniprot, residue, style }: {
  uniprot: string;
  residue?: number | null;
  style: "cartoon-plddt" | "cartoon-spectrum" | "surface";
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [msg, setMsg] = useState("");

  // Create the viewer once.
  useEffect(() => {
    if (!elRef.current) return;
    viewerRef.current = $3Dmol.createViewer(elRef.current, { backgroundColor: "#FFFFFF" });
    return () => { try { viewerRef.current?.clear(); } catch { /* noop */ } viewerRef.current = null; };
  }, []);

  // (Re)load the model whenever the UniProt accession changes.
  useEffect(() => {
    let cancelled = false;
    const v = viewerRef.current;
    if (!v) return;
    setStatus("loading");
    fetch(AF_URL(uniprot))
      .then((r) => { if (!r.ok) throw new Error(`AlphaFold ${r.status}`); return r.text(); })
      .then((pdb) => {
        if (cancelled) return;
        v.removeAllModels();
        v.addModel(pdb, "pdb");
        applyStyle(v, style, residue);
        v.zoomTo(residue ? { resi: residue } : {});
        v.zoom(0.8);   // pull the camera back a little so the whole fold breathes
        v.render();
        setStatus("ready");
      })
      .catch((e) => { if (!cancelled) { setStatus("error"); setMsg(String(e)); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniprot]);

  // Restyle (style / residue) without refetching.
  useEffect(() => {
    const v = viewerRef.current;
    if (!v || status !== "ready") return;
    applyStyle(v, style, residue);
    if (residue) { v.zoomTo({ resi: residue }); v.zoom(0.8); }
    v.render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style, residue]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={elRef} style={{ width: "100%", height: "100%", position: "relative" }} />
      {status === "loading" && <div style={{ position: "absolute", inset: 0 }}><Skeleton label={`Fetching AlphaFold structure ${uniprot}…`} /></div>}
      {status === "error" && <div style={{ position: "absolute", inset: 0 }}><Skeleton label={`Could not load ${uniprot}: ${msg}`} /></div>}
    </div>
  );
}

function applyStyle(v: any, style: string, residue?: number | null) {
  v.setStyle({}, {});
  if (style === "surface") {
    v.setStyle({}, { cartoon: { color: "#4f8cff", opacity: 0.9 } });
    v.addSurface($3Dmol.SurfaceType.VDW, { opacity: 0.75, color: "#22c9a0" });
  } else if (style === "cartoon-plddt") {
    // AlphaFold stores pLDDT in the B-factor column; colour by it.
    v.setStyle({}, { cartoon: { colorfunc: (atom: any) => plddtColor(atom.b) } });
  } else {
    v.setStyle({}, { cartoon: { colorscheme: "spectrum" } });
  }
  if (residue) {
    v.setStyle({ resi: residue }, { stick: { colorscheme: "orangeCarbon" }, cartoon: { color: "#ff6b6b" } });
  }
}

function plddtColor(b: number): string {
  if (b >= 90) return "#0053D6";   // very high
  if (b >= 70) return "#65CBF3";   // confident
  if (b >= 50) return "#FFDB13";   // low
  return "#FF7D45";                // very low
}
