import { Link } from "react-router-dom";

interface CardDef {
  to: string;
  key: string;
  title: string;
  desc: string;
  engines: ("react" | "ggplot")[];
}

// Ordered by value / visual impact - most impressive & data-rich first,
// common staples last. This array drives both the home cards and the nav.
export const VIZ: CardDef[] = [
  { to: "/umap", key: "umap", title: "Single-cell UMAP",
    desc: "584,207 real cells (Human Cell Landscape). WebGL renders all of them instantly; ggplot2 must subsample.",
    engines: ["react", "ggplot"] },
  { to: "/tahoe", key: "tahoe", title: "Tahoe-100M perturbation",
    desc: "Real drug × cell-line coverage from the Tahoe-100M single-cell atlas, clustered - prepared from the 100M-cell grid via duckdb.",
    engines: ["react", "ggplot"] },
  { to: "/visium", key: "visium", title: "Visium spatial transcriptomics",
    desc: "3,798 real capture spots on a breast cancer section, drawn over the H&E they came from. Colour by cluster or by any gene in the panel.",
    engines: ["react", "ggplot"] },
  { to: "/survival", key: "survival", title: "Kaplan-Meier survival",
    desc: "Overall survival for 1,067 real TCGA breast tumours, stratified by stage, subtype, age or driver alteration, with the number-at-risk table.",
    engines: ["react", "ggplot"] },
  { to: "/xenium", key: "xenium", title: "Xenium single-molecule transcripts",
    desc: "One million individual mRNA molecules at their real position in a breast cancer section, out of the 42.6M the run detected. WebGL draws them all; ggplot2 subsamples.",
    engines: ["react", "ggplot"] },
  { to: "/ndarray", key: "ndarray", title: "N-dimensional array",
    desc: "A hyperspectral image cube (100×100×24) - the large multi-dimensional array format used in microscopy and geoscience. Re-slice any channel instantly on the GPU.",
    engines: ["react", "ggplot"] },
  { to: "/oncoplot", key: "oncoplot", title: "Oncoplot (OncoPrint)",
    desc: "The cohort alteration landscape: 25 drivers × 967 real TCGA breast tumours, memo-sorted so mutual exclusivity reads as a staircase.",
    engines: ["react", "ggplot"] },
  { to: "/signatures", key: "signatures", title: "Mutational signatures (SBS96)",
    desc: "The 96 trinucleotide contexts under the six substitution blocks, plus four signatures extracted de novo from 120 real breast tumours. APOBEC falls out on its own.",
    engines: ["react", "ggplot"] },
  { to: "/network", key: "network", title: "Gene network",
    desc: "A large modular gene network (~1,500 nodes, ~7,400 edges). WebGL/sigma stays interactive; ggplot2 renders it statically.",
    engines: ["react", "ggplot"] },
  { to: "/hic", key: "hic", title: "Hi-C contact matrix",
    desc: "Chromatin contact map with TADs and loops - WebGL rendering vs a ggplot2 raster.",
    engines: ["react", "ggplot"] },
  { to: "/protein", key: "protein", title: "Protein structure",
    desc: "Interactive 3D AlphaFold structures (3Dmol.js) vs a ggplot2 per-residue pLDDT confidence profile.",
    engines: ["react", "ggplot"] },
  { to: "/pae", key: "pae", title: "AlphaFold PAE matrix",
    desc: "Predicted aligned error: which parts of a structure are confidently placed relative to each other. Domain blocks the pLDDT profile cannot show.",
    engines: ["react", "ggplot"] },
  { to: "/lollipop", key: "lollipop", title: "Domain lollipop",
    desc: "Variants along a protein over its Pfam architecture, with PTM sites. TP53 piles into the DNA-binding domain; CDH1 is truncated across its cadherin repeats.",
    engines: ["react", "ggplot"] },
  { to: "/manhattan", key: "manhattan", title: "Manhattan + QQ (GWAS)",
    desc: "Genome-wide association: -log10 p for 50,000 SNPs along the genome with a significance line, plus a Q-Q plot.",
    engines: ["react", "ggplot"] },
  { to: "/igv", key: "igv", title: "Genome browser (IGV)",
    desc: "igv.js browsing hg19 with the breast-cancer variant track (TP53, PIK3CA…) vs a ggplot2 variant needle plot.",
    engines: ["react", "ggplot"] },
  { to: "/gosling", key: "gosling", title: "Gosling genome view",
    desc: "A declarative JSON-spec genome track (Gosling): the visualization is data, not code. Manhattan track from a spec.",
    engines: ["react"] },
  { to: "/atac", key: "atac", title: "Single-cell ATAC coverage",
    desc: "Pseudobulk chromatin accessibility across a locus, split by cell cluster (Signac CoveragePlot style).",
    engines: ["react", "ggplot"] },
  { to: "/clustermap", key: "clustermap", title: "Clustered heatmap",
    desc: "The canonical omics clustermap: genes & samples hierarchically clustered with dendrograms.",
    engines: ["react", "ggplot"] },
  { to: "/eqtl", key: "eqtl", title: "eQTL / pQTL effect map",
    desc: "Cis-QTL effect sizes (β) as a variant × gene heatmap; blocks of co-regulated pairs stand out.",
    engines: ["react", "ggplot"] },
  { to: "/volcano", key: "volcano", title: "Volcano plot",
    desc: "Differential expression: log2 fold-change vs significance for 16,087 genes (TCGA breast cancer).",
    engines: ["react", "ggplot"] },
  { to: "/heatmap", key: "heatmap", title: "Expression heatmap",
    desc: "Top variable genes × samples, z-scored, tumour vs normal.",
    engines: ["react", "ggplot"] },
  { to: "/treemap", key: "treemap", title: "Mutation treemap",
    desc: "BRCA mutation landscape as a gene → variant hierarchy sized by recurrence.",
    engines: ["react", "ggplot"] },
];

export default function Home() {
  return (
    <div>
      <div className="hero">
        <h1><span className="accent">Plotomics</span> Live</h1>
        <p>
          Plotomics, made interactive. Twenty-two visualizations of real biological datasets,
          each rendered two ways - a classic <b>ggplot2</b> image and an interactive
          <b> Shiny&nbsp;React</b> (TSX) component powered by plotomics / WebGL. Pick a
          visualization, then flip the engine toggle to compare. The headline is the
          single-cell UMAP: ~584k cells the React engine draws instantly.
        </p>
      </div>
      <div className="cards">
        {VIZ.map((c) => (
          <Link className="card" to={c.to} key={c.to}>
            <div className="card__thumb">
              <img src={`thumbs/${c.key}.png`} alt={`${c.title} preview`} loading="lazy" />
            </div>
            <div className="card__title">{c.title}</div>
            <p className="card__desc">{c.desc}</p>
            <div className="card__tags">
              {c.engines.includes("react") && <span className="tag react">Shiny React</span>}
              {c.engines.includes("ggplot") && <span className="tag ggplot">ggplot2</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
