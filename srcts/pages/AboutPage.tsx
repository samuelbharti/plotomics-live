interface Entry {
  title: string;
  what: string;
  react: string;
  ggplot: string;
  data: string;
  refs: { label: string; href: string }[];
}

const ENTRIES: Entry[] = [
  {
    title: "Single-cell UMAP",
    what: "A UMAP embedding of ~584,207 single cells spanning whole-body human tissues, coloured by cell type or organ.",
    react: "plotomics embedding (regl-scatterplot / WebGL). Coordinates + category codes are streamed as compact binary typed arrays (~7 MB) over HTTP and drawn on the GPU - all 584k points at once.",
    ggplot: "geom_point on a 40,000-cell subsample (rendering the full set statically is slow - that contrast is the point).",
    data: "Human Cell Landscape (HCL) - a single-cell transcriptome atlas of major human tissues. Coordinates + metadata obtained from the UCSC Cell Browser.",
    refs: [
      { label: "Han et al., Nature 581:303–309 (2020) - Construction of a human cell landscape", href: "https://doi.org/10.1038/s41586-020-2157-4" },
      { label: "UCSC Cell Browser - human-cellular-landscape", href: "https://cells.ucsc.edu/?ds=human-cellular-landscape" },
      { label: "Speir et al., Nucleic Acids Res (2021) - UCSC Cell Browser", href: "https://doi.org/10.1093/nar/gkaa1002" },
    ],
  },
  {
    title: "Tahoe-100M drug perturbation",
    what: "A drug × cell-line coverage matrix - how many cells were profiled for each drug/cell-line combination (log10), hierarchically clustered.",
    react: "plotomics clustermap / heatmap (WebGL) with in-browser clustering and dendrograms.",
    ggplot: "geom_tile of the same matrix.",
    data: "Tahoe-100M - a ~100-million-cell single-cell drug-perturbation atlas (Vevo Therapeutics / Arc Institute), 379 drugs across 50 cancer cell lines. The coverage matrix is aggregated from the pre-computed obs_cell_grid via duckdb.",
    refs: [
      { label: "Tahoe-100M dataset (Arc Institute)", href: "https://arcinstitute.org/tools/virtualcellatlas" },
      { label: "Tahoe-100M on Hugging Face", href: "https://huggingface.co/datasets/tahoebio/Tahoe-100M" },
    ],
  },
  {
    title: "Gene network",
    what: "A large modular gene-interaction network (~1,500 nodes, ~7,400 edges) with community structure.",
    react: "plotomics network (sigma / WebGL), interactive pan/zoom + hover.",
    ggplot: "the same igraph layout drawn with geom_segment + geom_point.",
    data: "Simulated: a seeded stochastic block model (igraph::sample_sbm) with 12 modules, laid out once with igraph's DrL algorithm. Illustrative of a gene-regulatory / co-expression module network.",
    refs: [
      { label: "Csárdi & Nepusz - the igraph software package", href: "https://igraph.org" },
      { label: "sigma.js - graph drawing", href: "https://www.sigmajs.org" },
    ],
  },
  {
    title: "Hi-C contact matrix",
    what: "A chromatin contact map: interaction frequency between genomic bins, with distance decay, nested TADs and long-range loops.",
    react: "plotomics heatmap (WebGL) over log-transformed contacts.",
    ggplot: "geom_raster of the same matrix.",
    data: "Simulated: a seeded synthetic contact matrix (polymer distance decay + nested topologically-associating domains + loops). Illustrative of a real Hi-C map's structure.",
    refs: [
      { label: "Lieberman-Aiden et al., Science 326:289–293 (2009) - comprehensive mapping of the genome via Hi-C", href: "https://doi.org/10.1126/science.1181369" },
    ],
  },
  {
    title: "Protein structure",
    what: "Interactive 3D structures of BRCA driver proteins (TP53, PIK3CA, PTEN, GATA3), coloured by AlphaFold pLDDT confidence, with the recurrent-variant residue highlighted.",
    react: "3Dmol.js WebGL viewer; structures fetched live from the AlphaFold Protein Structure Database by UniProt accession.",
    ggplot: "per-residue pLDDT profile parsed from the AlphaFold PDB (B-factor column).",
    data: "AlphaFold DB predicted structures (model v6).",
    refs: [
      { label: "Jumper et al., Nature 596:583–589 (2021) - AlphaFold", href: "https://doi.org/10.1038/s41586-021-03819-2" },
      { label: "Varadi et al., Nucleic Acids Res (2022) - AlphaFold Protein Structure Database", href: "https://doi.org/10.1093/nar/gkab1061" },
      { label: "3Dmol.js", href: "https://3dmol.csb.pitt.edu" },
    ],
  },
  {
    title: "Oncoplot (OncoPrint)",
    what: "The alteration landscape of the TCGA breast cancer cohort: the recurrently altered drivers across 967 tumours, with per-sample burden above, per-gene frequency to the right, and subtype and stage annotating the samples below.",
    react: "plotomics oncoplot: the grid, marginal barplots and annotation strips are drawn on one canvas (25 × 967 is over 24,000 cells), with labels and legend as an SVG overlay.",
    ggplot: "five aligned ggplot2 panels composed with patchwork: geom_tile for the grid and the clinical strips, geom_col for the two marginal barplots.",
    data: "cBioPortal REST API, study brca_tcga_pan_can_atlas_2018 (Breast Invasive Carcinoma, TCGA PanCancer Atlas, hg19). Somatic mutations collapsed to the standard alteration classes, plus GISTIC deep deletions and amplifications; a sample carrying two classes in one gene is called multi-hit. Gene and sample ordering (the cBioPortal memo sort) is computed server-side and shipped to both engines, so neither can tie-break differently. Observed frequencies match the literature: PIK3CA 38% and TP53 37%.",
    refs: [
      { label: "Cerami et al., Cancer Discov 2:401–404 (2012) - the cBioPortal", href: "https://doi.org/10.1158/2159-8290.CD-12-0095" },
      { label: "Gao et al., Sci Signal 6:pl1 (2013) - integrative analysis with cBioPortal", href: "https://doi.org/10.1126/scisignal.2004088" },
      { label: "TCGA Network, Nature 490:61–70 (2012) - molecular portraits of human breast tumours", href: "https://doi.org/10.1038/nature11412" },
      { label: "Hoadley et al., Cell 173:291–304 (2018) - the PanCancer Atlas", href: "https://doi.org/10.1016/j.cell.2018.03.022" },
    ],
  },
  {
    title: "Domain lollipop",
    what: "Where the TCGA-BRCA variants land on six driver proteins, drawn over their Pfam domain architecture with UniProt modification sites underneath. The contrast between genes is the point: all five of TP53's top hotspots fall inside its DNA-binding domain, while CDH1 is truncated across its cadherin repeats.",
    react: "plotomics lollipop: backbone, domain rectangles, stems and PTM ticks on a canvas, with labels, axis and legend as an SVG overlay. Head area scales with recurrence.",
    ggplot: "one ggplot2 panel using two independent discrete scales, fill for domains and colour for variant classes, with the domain and PTM tracks below zero and clipping off.",
    data: "Variant positions from the same cBioPortal TCGA-BRCA fetch as the oncoplot (proteinPosStart). Pfam domains from the InterPro REST API (CC0), PTM sites from UniProtKB MOD_RES features (CC BY 4.0). Which stems get a text label is resolved server-side, so ggrepel and the canvas label the same variants rather than each picking its own top-N. Note that PIK3CA's H1047R sits just past the end of Pfam PF00454 (798-1015); the plot shows Pfam's boundary rather than the wider UniProt kinase-domain range.",
    refs: [
      { label: "Paysan-Lafosse et al., Nucleic Acids Res (2023) - InterPro", href: "https://doi.org/10.1093/nar/gkac993" },
      { label: "UniProt Consortium, Nucleic Acids Res (2023) - UniProt", href: "https://doi.org/10.1093/nar/gkac1052" },
      { label: "Mermel et al., Genome Biol 12:R41 (2011) - GISTIC2", href: "https://doi.org/10.1186/gb-2011-12-4-r41" },
    ],
  },
  {
    title: "AlphaFold PAE matrix",
    what: "The predicted aligned error matrix for the same BRCA driver proteins: entry (x, y) is the expected position error at residue x when the prediction is superposed on residue y. Dark diagonal blocks are confidently-folded domains; a bright block between two dark ones means both domains are individually confident but their relative orientation is not.",
    react: "plotomics heatmap (WebGL) on the residue × residue matrix, plus a canvas profile of a single row.",
    ggplot: "geom_raster on the same matrix with the same LTC ramp and the same colour limits, plus a geom_area profile.",
    data: "AlphaFold DB predicted aligned error (JSON), fetched live by UniProt accession and cached. The file URL is resolved from the AlphaFold API rather than hardcoded, since the model version has already moved from v4 to v6. Matrices larger than 400 residues per side are block-averaged before plotting, and the binning factor is shown in the control bar; both engines plot the binned matrix so they cannot disagree.",
    refs: [
      { label: "Jumper et al., Nature 596:583–589 (2021) - AlphaFold", href: "https://doi.org/10.1038/s41586-021-03819-2" },
      { label: "Varadi et al., Nucleic Acids Res (2022) - AlphaFold Protein Structure Database", href: "https://doi.org/10.1093/nar/gkab1061" },
      { label: "AlphaFold DB FAQ - interpreting PAE", href: "https://alphafold.ebi.ac.uk/faq" },
    ],
  },
  {
    title: "Genome browser (IGV)",
    what: "The breast-cancer somatic variants along the genome (hg19), as a live genome browser and as a variant needle/lollipop plot.",
    react: "igv.js embedded as a TSX component (via plotomics igv); the hg19 reference is streamed from igv.js's data servers, with an inline track of the variants.",
    ggplot: "a needle/lollipop plot of variant recurrence vs genomic position (geom_segment + geom_point + labels).",
    data: "Recurrent BRCA somatic variants (gene, genomic position, protein change, recurrence) sourced from the lifescience-shiny-gallery BRCA mutation dataset (derived from TCGA-BRCA / COSMIC hotspots).",
    refs: [
      { label: "Robinson et al., Nat Biotechnol 29:24–26 (2011) - Integrative Genomics Viewer", href: "https://doi.org/10.1038/nbt.1754" },
      { label: "igv.js", href: "https://github.com/igvteam/igv.js" },
      { label: "The Cancer Genome Atlas (TCGA-BRCA)", href: "https://www.cancer.gov/tcga" },
    ],
  },
  {
    title: "Clustered heatmap & Expression heatmap",
    what: "Expression of the most-variable genes across tumour and normal breast samples, optionally z-scored; the clustered version reorders genes & samples by hierarchical clustering with dendrograms.",
    react: "plotomics heatmap / clustermap (WebGL), LTC colour ramp.",
    ggplot: "geom_tile (heatmap) and base-R heatmap() with dendrograms (clustermap).",
    data: "TCGA breast-cancer (BRCA) RNA-seq: differential expression + a log2-CPM expression matrix (40 samples), from the lifescience-shiny-gallery de-brca dataset.",
    refs: [
      { label: "The Cancer Genome Atlas (TCGA-BRCA)", href: "https://www.cancer.gov/tcga" },
      { label: "recount3 - uniformly processed RNA-seq", href: "https://rna.recount.bio" },
    ],
  },
  {
    title: "Volcano plot & Mutation treemap",
    what: "The volcano shows differential expression (log2 fold-change vs −log10 p) for 16,087 genes; the treemap shows the BRCA mutation landscape as a gene → variant hierarchy sized by recurrence.",
    react: "plotomics volcano and treemap (WebGL / D3).",
    ggplot: "ggplot2 + ggrepel (volcano) and a hand-rolled slice-and-dice treemap (geom_rect).",
    data: "TCGA-BRCA differential-expression results and recurrent somatic variants (same sources as above).",
    refs: [
      { label: "The Cancer Genome Atlas (TCGA-BRCA)", href: "https://www.cancer.gov/tcga" },
    ],
  },
  {
    title: "Manhattan + QQ (GWAS)",
    what: "Genome-wide association: -log10 p for 50,000 SNPs along the genome coloured by chromosome with a genome-wide significance line, plus a Q-Q plot with the genomic-inflation factor lambda.",
    react: "canvas-2D scatter with a proper chromosome axis (50k points draw fine on canvas).",
    ggplot: "geom_point coloured by chromosome + significance line; QQ via geom_point + diagonal.",
    data: "Simulated GWAS summary statistics with a handful of injected association peaks. Real data would come from the GWAS Catalog or a study's summary stats.",
    refs: [
      { label: "GWAS Catalog (EBI/NHGRI)", href: "https://www.ebi.ac.uk/gwas/" },
    ],
  },
  {
    title: "eQTL / pQTL effect map",
    what: "Cis-QTL effect sizes (beta) as a variant x gene/protein heatmap, diverging around zero, with blocks of co-regulated pairs.",
    react: "plotomics heatmap (WebGL), diverging LTC ramp.",
    ggplot: "geom_tile with a symmetric diverging scale.",
    data: "Simulated QTL effect sizes with block structure. Real data would come from GTEx (eQTL) or a pQTL study.",
    refs: [
      { label: "GTEx Consortium, Science 369:1318-1330 (2020)", href: "https://doi.org/10.1126/science.aaz1776" },
      { label: "GTEx Portal", href: "https://gtexportal.org" },
    ],
  },
  {
    title: "Single-cell ATAC coverage",
    what: "Pseudobulk chromatin-accessibility tracks across a genomic window, split by cell cluster (the Signac CoveragePlot view): a shared promoter peak plus cluster-specific enhancer peaks.",
    react: "canvas-2D filled area tracks, one per cluster.",
    ggplot: "geom_area faceted by cluster.",
    data: "Simulated scATAC pseudobulk signal. Real data would be per-cluster fragment coverage (bigWig) from a scATAC experiment.",
    refs: [
      { label: "Stuart et al., Nat Methods 18:1333-1341 (2021) - Signac", href: "https://doi.org/10.1038/s41592-021-01282-5" },
    ],
  },
  {
    title: "N-dimensional array viewer",
    what: "A 2-D slice of a hyperspectral image cube (100 x 100 x 24 channels) with a channel slider and a per-pixel spectrum - the kind of large multi-dimensional array used in microscopy and geoscience.",
    react: "plotomics heatmap (WebGL) re-slicing the cube on the GPU + a canvas spectrum; the whole cube streams once as a binary blob.",
    ggplot: "geom_raster of the slice + a geom_line spectrum, rendered server-side for the same channel/pixel.",
    data: "Synthetic hyperspectral cube (spatial Gaussian features, each peaking in a different channel). Real data would be a zarr / xarray / HyperSpy array.",
    refs: [
      { label: "Zarr - chunked N-D arrays", href: "https://zarr.dev" },
      { label: "Hoyer & Hamman, J Open Res Softw (2017) - xarray", href: "https://doi.org/10.5334/jors.148" },
      { label: "HyperSpy - multidimensional analysis", href: "https://hyperspy.org" },
    ],
  },
  {
    title: "Gosling genome view",
    what: "A declarative, JSON-spec genome track (Gosling): the visualization is described entirely as data. Here a Manhattan track is defined by a spec, with no plotting code.",
    react: "Gosling.js (pixi/higlass) loaded from a CDN at runtime and driven by the JSON spec; falls back to showing the spec if the CDN is unreachable.",
    ggplot: "not applicable (spec-driven, no classic equivalent).",
    data: "Inline GWAS-style points in the Gosling spec.",
    refs: [
      { label: "L'Yi et al., Nat Methods 19:513-520 (2022) - Gosling", href: "https://doi.org/10.1038/s41592-022-01480-9" },
      { label: "Gosling", href: "http://gosling-lang.org" },
    ],
  },
];

export default function AboutPage() {
  return (
    <div>
      <div className="page__head">
        <div>
          <h2 className="page__title">About Plotomics Live</h2>
          <p className="page__sub">
            Plotomics Live pairs a classic <b>ggplot2</b> rendering with an interactive
            <b> Shiny&nbsp;React</b> (TSX / WebGL) rendering of the same data, so you can
            compare the two approaches across eighteen common biological visualizations.
            All datasets are public; each is described and referenced below.
          </p>
        </div>
      </div>

      <div className="about">
        {ENTRIES.map((e) => (
          <section className="about__card" key={e.title}>
            <h3>{e.title}</h3>
            <p>{e.what}</p>
            <div className="about__grid">
              <div><span className="about__k">Shiny React</span> {e.react}</div>
              <div><span className="about__k">ggplot2</span> {e.ggplot}</div>
              <div><span className="about__k">Data</span> {e.data}</div>
            </div>
            <ul className="about__refs">
              {e.refs.map((r) => (
                <li key={r.href}><a href={r.href} target="_blank" rel="noreferrer">{r.label} ↗</a></li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
