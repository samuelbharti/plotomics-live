import { useMemo, useState } from "react";
import { createLollipop } from "plotomics/lollipop";
import type { PlotomicsData } from "plotomics/core";
import { useShinyInput, useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { THEME } from "../lib/theme";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

interface LollipopData {
  columns: { position: number[]; count: number[]; class: string[]; label: string[] };
  meta: {
    length: number; gene: string; uniprot: string;
    classes: string[]; classColors: string[];
    domains: { name: string; start: number; end: number }[];
    domainColors: string[];
    ptms: { position: number; type: string }[];
    labelIndex: number[];
  };
}
interface LollipopStats {
  gene: string; uniprot: string; length: number;
  variants: number; samples: number; domains: number; ptms: number;
}

export default function LollipopPage() {
  const [engine, setEngine] = useState<Engine>("react");
  const [gene, setGene] = useShinyInput<string>("lolli_gene", "TP53");

  const genes = useShinyOutputValue<string[] | undefined>("lollipop_genes", undefined);
  const data = useShinyOutputValue<LollipopData | undefined>("lollipop_data", undefined);
  const dataStatus = useShinyOutputStatus("lollipop_data");
  const png = useShinyOutputValue<string | undefined>("lollipop_png", undefined);
  const pngStatus = useShinyOutputStatus("lollipop_png");
  const stats = useShinyOutputValue<LollipopStats | undefined>("lollipop_stats", undefined);

  const options = useMemo(() => ({
    minHeadRadius: 3,
    maxHeadRadius: 12,
    yLabel: "samples",
    theme: THEME,
  }), []);

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine} />
      <div className="control">
        <label>Gene</label>
        <select value={gene} onChange={(e) => setGene(e.target.value)}>
          {(genes ?? [gene]).map((g) => <option value={g} key={g}>{g}</option>)}
        </select>
      </div>
      <div className="spacer" />
      {stats && (
        <span className="control">
          {stats.uniprot} · {stats.length} aa · {stats.domains} Pfam domains
        </span>
      )}
    </>
  );

  const statbar = stats && (
    <>
      <span><b>{stats.variants}</b> distinct variants</span>
      <span><b>{stats.samples}</b> samples carrying them</span>
      <span><b>{stats.ptms}</b> PTM sites</span>
    </>
  );

  return (
    <PageShell
      title="Domain lollipop"
      subtitle="Where the variants land on the protein. Stems rise from a backbone carrying the Pfam domain architecture, head area scales with how many tumours carry that change, and UniProt modification sites run underneath. TP53's hotspots pile into the DNA-binding domain while CDH1 is truncated across its cadherin repeats, which is the difference between a gain-of-function and a loss-of-function driver in one picture."
      bar={bar}
      stats={statbar}
    >
      {engine === "react" ? (
        data ? <PlotomicsView factory={createLollipop}
                 data={data as unknown as PlotomicsData} options={options} />
             : <Skeleton label={dataStatus === "error" ? "Server error" : "Loading variants…"} />
      ) : <GgplotImage uri={png} status={pngStatus} />}
    </PageShell>
  );
}
