import { useState } from "react";
import { useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { ManhattanCanvas, QqCanvas, type ManhattanData, type QqData } from "../components/CanvasPlots";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

function ManhattanPanel() {
  const [engine, setEngine] = useState<Engine>("react");
  const data = useShinyOutputValue<ManhattanData | undefined>("gwas_data", undefined);
  const dataStatus = useShinyOutputStatus("gwas_data");
  const png = useShinyOutputValue<string | undefined>("manhattan_png", undefined);
  const pngStatus = useShinyOutputStatus("manhattan_png");

  const bar = (
    <>
      <EngineToggle engine={engine} onChange={setEngine} reactLabel="Shiny React (canvas)" />
      <div className="spacer" />
      {data && <span className="control">{data.meta.n.toLocaleString()} SNPs · genome-wide sig. 5×10⁻⁸</span>}
    </>
  );
  return (
    <PageShell
      title="Manhattan plot (GWAS)"
      subtitle="Genome-wide association results: -log10 p for every SNP along the genome, coloured by chromosome, with the genome-wide significance threshold. Simulated summary statistics with a handful of real-looking association peaks."
      bar={bar}
    >
      {engine === "react" ? (
        data ? <ManhattanCanvas data={data} />
             : <Skeleton label={dataStatus === "error" ? "Server error" : "Loading summary stats…"} />
      ) : <GgplotImage uri={png} status={pngStatus} />}
    </PageShell>
  );
}

function QqPanel() {
  const [engine, setEngine] = useState<Engine>("react");
  const data = useShinyOutputValue<QqData | undefined>("qq_data", undefined);
  const dataStatus = useShinyOutputStatus("qq_data");
  const png = useShinyOutputValue<string | undefined>("qq_png", undefined);
  const pngStatus = useShinyOutputStatus("qq_png");
  return (
    <div style={{ marginTop: "1.5rem" }}>
      <PageShell
        title="Q-Q plot"
        subtitle="Observed vs expected -log10 p. Points hug the diagonal under the null and lift off in the tail where true associations live; the genomic-inflation factor λ should sit near 1."
        bar={<EngineToggle engine={engine} onChange={setEngine} reactLabel="Shiny React (canvas)" />}
      >
        {engine === "react" ? (
          data ? <QqCanvas data={data} />
               : <Skeleton label={dataStatus === "error" ? "Server error" : "Loading…"} />
        ) : <GgplotImage uri={png} status={pngStatus} />}
      </PageShell>
    </div>
  );
}

export default function ManhattanPage() {
  return <div><ManhattanPanel /><QqPanel /></div>;
}
