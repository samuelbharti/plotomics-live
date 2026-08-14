import { useMemo, useState } from "react";
import { createIgv } from "plotomics/igv";
import { useShinyInput, useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

interface IgvConfig { genome: string; locus: string; tracks: Record<string, unknown>[] }

export default function IgvPage() {
  const [engine, setEngine] = useState<Engine>("react");
  const [gene, setGene] = useShinyInput<string>("igv_gene", "TP53");
  const genes = useShinyOutputValue<string[] | undefined>("igv_genes", undefined);
  const config = useShinyOutputValue<IgvConfig | undefined>("igv_config", undefined);
  const status = useShinyOutputStatus("igv_config");
  const needle = useShinyOutputValue<string | undefined>("igv_needle_png", undefined);
  const needleStatus = useShinyOutputStatus("igv_needle_png");

  // igv is config-driven: pass the whole browser config through `config`.
  const options = useMemo(() => (config ? { config } : undefined), [config]);

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine}
        reactLabel="Shiny React (igv.js)" ggplotLabel="ggplot2 (needle plot)" />
      <div className="control">
        <label>Gene</label>
        <select value={gene} onChange={(e) => setGene(e.target.value)}>
          {(genes ?? ["TP53"]).map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div className="spacer" />
      {config && engine === "react" && <span className="control">{config.genome} · {config.locus}</span>}
    </>
  );

  return (
    <PageShell
      title="Genome browser (IGV)"
      subtitle="The breast-cancer somatic variants shown two ways: a live igv.js browser (hg19, with the variant annotation track) and a classic ggplot2 needle/lollipop plot of recurrence vs genomic position."
      bar={bar}
    >
      {engine === "ggplot" ? (
        <GgplotImage uri={needle} status={needleStatus} />
      ) : options ? (
        <PlotomicsView factory={createIgv} options={options} />
      ) : (
        <Skeleton label={status === "error" ? "Server error" : "Loading genome…"} />
      )}
    </PageShell>
  );
}
