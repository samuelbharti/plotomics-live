import { useEffect, useMemo, useRef, useState } from "react";
import { PageShell, EngineToggle, Skeleton, type Engine } from "../components/ui";

// Gosling is a declarative, JSON-spec grammar for genomics (ideograms, Manhattan
// tracks, linked multi-track views). The library is very large (pixi.js +
// higlass), so we load it from a CDN at runtime rather than bundling it - that
// keeps our app bundle lean and isolates any failure to this page.

// A self-contained Gosling spec: a Manhattan-style point track over a small
// inline GWAS dataset (no remote data needed).
function buildSpec() {
  const chrLen = [248, 242, 198, 190, 181, 171, 159, 145, 138, 133, 135, 133, 114, 107, 101, 90, 83, 80, 58, 64, 46, 50];
  const peaks: Record<number, number> = { 2: 135, 6: 32, 9: 22, 15: 78 };
  const values: { chr: string; pos: number; p: number }[] = [];
  for (let i = 0; i < 2200; i++) {
    const c = 1 + Math.floor(Math.random() * 22);
    const pos = Math.floor(Math.random() * chrLen[c - 1] * 1e6);
    let p = Math.random();
    if (peaks[c] && Math.abs(pos - peaks[c] * 1e6) < 4e6) p = Math.pow(10, -(6 + Math.random() * 8));
    values.push({ chr: `chr${c}`, pos, p: -Math.log10(Math.max(p, 1e-16)) });
  }
  return {
    title: "GWAS (Gosling declarative spec)",
    subtitle: "A Manhattan track defined entirely by a JSON spec",
    assembly: "hg38",
    width: 800, height: 340,
    tracks: [{
      data: { type: "json", values, chromosomeField: "chr", genomicFields: ["pos"] },
      mark: "point",
      x: { field: "pos", type: "genomic", axis: "bottom" },
      y: { field: "p", type: "quantitative", axis: "left", grid: true },
      size: { value: 2 },
      color: { field: "chr", type: "nominal" },
      opacity: { value: 0.7 },
    }],
  };
}

function GoslingView({ spec }: { spec: object }) {
  const elRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = "https://esm.sh/gosling.js@0.17.0";
        const gosling: any = await import(/* @vite-ignore */ url);
        if (cancelled || !elRef.current) return;
        const embed = gosling.embed ?? gosling.default?.embed;
        if (!embed) throw new Error("gosling.embed not found");
        await embed(elRef.current, spec);
        if (!cancelled) setStatus("ready");
      } catch (e) {
        if (!cancelled) { setStatus("error"); setMsg(String(e)); }
      }
    })();
    return () => { cancelled = true; };
  }, [spec]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "auto", background: "#fff" }}>
      <div ref={elRef} style={{ padding: "0.5rem" }} />
      {status === "loading" && <div style={{ position: "absolute", inset: 0 }}><Skeleton label="Loading Gosling from CDN…" /></div>}
      {status === "error" && (
        <div className="note">
          <b>Couldn't load the live Gosling renderer</b>
          <p>Gosling is fetched from a CDN and needs network access to it. The declarative
          JSON spec that would drive the view is shown below - this is the whole point of
          Gosling: the visualization is data, not code.</p>
          <pre>{JSON.stringify(spec, (k, v) => (k === "values" ? `[${(v as unknown[]).length} inline points]` : v), 2)}</pre>
          <p style={{ fontSize: "0.8rem" }}>{msg}</p>
        </div>
      )}
    </div>
  );
}

export default function GoslingPage() {
  const [engine, setEngine] = useState<Engine>("react");
  const spec = useMemo(buildSpec, []);
  return (
    <PageShell
      title="Gosling genome view (JSON spec)"
      subtitle="Gosling is a declarative grammar for genomics: you describe the visualization as a JSON spec and the library renders linked, interactive genome tracks. Here a Manhattan track is defined entirely by the spec on the right - no plotting code."
      bar={<EngineToggle engine={engine} onChange={setEngine} reactLabel="Shiny React (Gosling)" ggplotDisabled ggplotLabel="(spec-driven)" />}
    >
      <GoslingView spec={spec} />
    </PageShell>
  );
}
