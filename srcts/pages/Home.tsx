import { Link } from "react-router-dom";

export type GroupId =
  | "singlecell"
  | "expression"
  | "cancer"
  | "genome"
  | "structure";

interface CardDef {
  to: string;
  key: string;
  title: string;
  desc: string;
  engines: ("react" | "ggplot")[];
  group: GroupId;
}

// The category menus (nav dropdowns) and the home-page sections both read this
// order. Each visualization carries a `group` below; nothing is removed, the
// 26 pages are only bucketed into five analysis areas.
export const GROUPS: { id: GroupId; label: string }[] = [
  { id: "singlecell", label: "Single-cell & spatial" },
  { id: "expression", label: "Gene expression" },
  { id: "cancer", label: "Cancer genomics" },
  { id: "genome", label: "Genome & epigenome" },
  { id: "structure", label: "Structure & networks" },
];

// Ordered by value / visual impact - most impressive & data-rich first,
// common staples last. This array drives both the home cards and the nav; the
// `group` tag buckets each into a category (see GROUPS).
export const VIZ: CardDef[] = [
  { to: "/umap", key: "umap", title: "Single-cell UMAP", group: "singlecell",
    desc: "584,207 real cells (Human Cell Landscape). WebGL renders all of them instantly; ggplot2 must subsample.",
    engines: ["react", "ggplot"] },
  { to: "/tahoe", key: "tahoe", title: "Tahoe-100M perturbation", group: "singlecell",
    desc: "Real drug × cell-line coverage from the Tahoe-100M single-cell atlas, clustered - prepared from the 100M-cell grid via duckdb.",
    engines: ["react", "ggplot"] },
  { to: "/visium", key: "visium", title: "Visium spatial transcriptomics", group: "singlecell",
    desc: "3,798 real capture spots on a breast cancer section, drawn over the H&E they came from. Colour by cluster or by any gene in the panel.",
    engines: ["react", "ggplot"] },
  { to: "/dotplot", key: "dotplot", title: "Marker gene dot plot", group: "singlecell",
    desc: "What defines each Visium spatial domain: 72 markers × 11 clusters, dot size = % of spots expressing, colour = level. Ordered into a diagonal.",
    engines: ["react", "ggplot"] },
  { to: "/violin", key: "violin", title: "Stacked violin", group: "singlecell",
    desc: "The distribution behind the dot plot's two summary numbers: full expression shapes per spatial cluster, each gene on its own y range.",
    engines: ["react", "ggplot"] },
  { to: "/survival", key: "survival", title: "Kaplan-Meier survival", group: "cancer",
    desc: "Overall survival for 1,067 real TCGA breast tumours, stratified by stage, subtype, age or driver alteration, with the number-at-risk table.",
    engines: ["react", "ggplot"] },
  { to: "/xenium", key: "xenium", title: "Xenium single-molecule transcripts", group: "singlecell",
    desc: "One million individual mRNA molecules at their real position in a breast cancer section, out of the 42.6M the run detected. WebGL draws them all; ggplot2 subsamples.",
    engines: ["react", "ggplot"] },
  { to: "/ndarray", key: "ndarray", title: "N-dimensional array", group: "structure",
    desc: "A hyperspectral image cube (100×100×24) - the large multi-dimensional array format used in microscopy and geoscience. Re-slice any channel instantly on the GPU.",
    engines: ["react", "ggplot"] },
  { to: "/oncoplot", key: "oncoplot", title: "Oncoplot (OncoPrint)", group: "cancer",
    desc: "The cohort alteration landscape: 25 drivers × 967 real TCGA breast tumours, memo-sorted so mutual exclusivity reads as a staircase.",
    engines: ["react", "ggplot"] },
  { to: "/upset", key: "upset", title: "Driver co-occurrence (UpSet)", group: "cancer",
    desc: "Which BRCA drivers co-occur and which exclude each other, as exclusive set intersections. TP53 and CDH1 avoid each other at p = 2e-15.",
    engines: ["react", "ggplot"] },
  { to: "/signatures", key: "signatures", title: "Mutational signatures (SBS96)", group: "cancer",
    desc: "The 96 trinucleotide contexts under the six substitution blocks, plus four signatures extracted de novo from 120 real breast tumours. APOBEC falls out on its own.",
    engines: ["react", "ggplot"] },
  { to: "/network", key: "network", title: "Gene network", group: "structure",
    desc: "A large modular gene network (~1,500 nodes, ~7,400 edges). WebGL/sigma stays interactive; ggplot2 renders it statically.",
    engines: ["react", "ggplot"] },
  { to: "/hic", key: "hic", title: "Hi-C contact matrix", group: "genome",
    desc: "Chromatin contact map with TADs and loops - WebGL rendering vs a ggplot2 raster.",
    engines: ["react", "ggplot"] },
  { to: "/protein", key: "protein", title: "Protein structure", group: "structure",
    desc: "Interactive 3D AlphaFold structures (3Dmol.js) vs a ggplot2 per-residue pLDDT confidence profile.",
    engines: ["react", "ggplot"] },
  { to: "/pae", key: "pae", title: "AlphaFold PAE matrix", group: "structure",
    desc: "Predicted aligned error: which parts of a structure are confidently placed relative to each other. Domain blocks the pLDDT profile cannot show.",
    engines: ["react", "ggplot"] },
  { to: "/lollipop", key: "lollipop", title: "Domain lollipop", group: "cancer",
    desc: "Variants along a protein over its Pfam architecture, with PTM sites. TP53 piles into the DNA-binding domain; CDH1 is truncated across its cadherin repeats.",
    engines: ["react", "ggplot"] },
  { to: "/manhattan", key: "manhattan", title: "Manhattan + QQ (GWAS)", group: "genome",
    desc: "Genome-wide association: -log10 p for 50,000 SNPs along the genome with a significance line, plus a Q-Q plot.",
    engines: ["react", "ggplot"] },
  { to: "/igv", key: "igv", title: "Genome browser (IGV)", group: "genome",
    desc: "igv.js browsing hg19 with the breast-cancer variant track (TP53, PIK3CA…) vs a ggplot2 variant needle plot.",
    engines: ["react", "ggplot"] },
  { to: "/gosling", key: "gosling", title: "Gosling genome view", group: "genome",
    desc: "A declarative JSON-spec genome track (Gosling): the visualization is data, not code. Manhattan track from a spec.",
    engines: ["react"] },
  { to: "/atac", key: "atac", title: "Single-cell ATAC coverage", group: "genome",
    desc: "Pseudobulk chromatin accessibility across a locus, split by cell cluster (Signac CoveragePlot style).",
    engines: ["react", "ggplot"] },
  { to: "/clustermap", key: "clustermap", title: "Clustered heatmap", group: "expression",
    desc: "The canonical omics clustermap: genes & samples hierarchically clustered with dendrograms.",
    engines: ["react", "ggplot"] },
  { to: "/pca", key: "pca", title: "PCA explorer", group: "expression",
    desc: "One decomposition read three ways: sample scores, the scree that says how much any axis is worth, and the genes loading it. PC1 splits tumour from normal on adipose loss.",
    engines: ["react", "ggplot"] },
  { to: "/eqtl", key: "eqtl", title: "eQTL / pQTL effect map", group: "genome",
    desc: "Cis-QTL effect sizes (β) as a variant × gene heatmap; blocks of co-regulated pairs stand out.",
    engines: ["react", "ggplot"] },
  { to: "/volcano", key: "volcano", title: "Volcano plot", group: "expression",
    desc: "Differential expression: log2 fold-change vs significance for 16,087 genes (TCGA breast cancer).",
    engines: ["react", "ggplot"] },
  { to: "/heatmap", key: "heatmap", title: "Expression heatmap", group: "expression",
    desc: "Top variable genes × samples, z-scored, tumour vs normal.",
    engines: ["react", "ggplot"] },
  { to: "/treemap", key: "treemap", title: "Mutation treemap", group: "cancer",
    desc: "BRCA mutation landscape as a gene → variant hierarchy sized by recurrence.",
    engines: ["react", "ggplot"] },
];

// All visualizations in a group, in the curated VIZ order. Drives the nav
// dropdowns (App.tsx) and the home-page sections below.
export function vizByGroup(id: GroupId): CardDef[] {
  return VIZ.filter((v) => v.group === id);
}

export default function Home() {
  return (
    <div>
      <div className="hero">
        <h1><span className="accent">Plotomics</span> Live</h1>
        <p>
          Plotomics, made interactive. Twenty-six visualizations of real biological datasets,
          grouped by analysis area, each rendered two ways - a classic <b>ggplot2</b> image
          and an interactive <b>Shiny&nbsp;React</b> (TSX) component powered by plotomics /
          WebGL. Pick a visualization, then flip the engine toggle to compare. The headline
          is the single-cell UMAP: ~584k cells the React engine draws instantly.
        </p>
      </div>
      {GROUPS.map((g) => (
        <section className="section" key={g.id}>
          <h2 className="section__title">{g.label}</h2>
          <div className="cards">
            {vizByGroup(g.id).map((c) => (
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
        </section>
      ))}
    </div>
  );
}
