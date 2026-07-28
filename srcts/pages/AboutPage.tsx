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
    title: "Visium spatial transcriptomics",
    what: "3,798 Visium capture spots on a human breast cancer section, at their real slide coordinates over the H&E image, coloured by graph-based cluster or by a gene from a 72-gene marker panel.",
    react: "plotomics spatial: the tissue image and the spots share one contain-fit transform computed once, so histology and overlay cannot drift apart on resize or full-screen. A spot-opacity control fades the overlay to read the histology underneath.",
    ggplot: "annotation_raster of the same PNG the browser fetches, with geom_point on top and coord_fixed. y is negated in the data rather than using scale_y_reverse, which would flip the raster's mapping and draw the tissue upside down under correctly-placed spots.",
    data: "10x Genomics public dataset, Human Breast Cancer (Block A Section 1), Visium Spatial Gene Expression v1.1.0, CC BY 4.0. Spot coordinates and the low-res H&E come from the spatial bundle with the published scale factor applied; clusters and the marker panel come from 10x's own graph-based clustering and differential expression, so the cluster assignment is the dataset's rather than ours; markers are ranked among genes clearing a 0.25 mean-count detection floor, without which a fold-change ranking fills up with genes seen in a handful of spots. Expression is log1p CP10K computed against each spot's total counts. The selected gene's per-spot vector is computed server-side and sent, so the two engines colour from one computation.",
    refs: [
      { label: "10x Genomics - Human Breast Cancer (Block A Section 1)", href: "https://www.10xgenomics.com/datasets/human-breast-cancer-block-a-section-1-1-standard" },
      { label: "Ståhl et al., Science 353:78–82 (2016) - spatially resolved transcriptomics", href: "https://doi.org/10.1126/science.aaf2403" },
    ],
  },
  {
    title: "Marker gene dot plot",
    what: "72 marker genes across the 11 Visium spatial clusters. Dot size is the share of spots in that cluster with any detection, colour is the mean expression, either scaled within each gene or as raw values.",
    react: "plotomics dotplot: dots on canvas, labels, gridlines and both legends as an SVG overlay. Dot area rather than radius is proportional to the percentage, so a 50% dot really is half the ink of a 100% one.",
    ggplot: "geom_point with scale_size_area, which is the ggplot2 equivalent of that same choice. Plain scale_size maps radius and would overstate the biggest dots.",
    data: "The same 10x Visium breast cancer section and the same graph-based clusters as the spot map, summarised per cluster. The gene panel is 10x's own per-cluster differential expression, but ranked among genes clearing a detection floor of 0.25 mean counts: without that floor the top of a fold-change ranking is genes seen in a handful of spots and nowhere else, and the panel fills up with lncRNAs and immunoglobulin segments rather than markers anyone can read. Gene ordering, the detection percentages and the within-gene scaling are computed server-side once, so both engines draw the same diagonal.",
    refs: [
      { label: "10x Genomics - Human Breast Cancer (Block A Section 1)", href: "https://www.10xgenomics.com/datasets/human-breast-cancer-block-a-section-1-1-standard" },
      { label: "Wolf et al., Genome Biol 19:15 (2018) - SCANPY", href: "https://doi.org/10.1186/s13059-017-1382-1" },
    ],
  },
  {
    title: "Kaplan-Meier survival",
    what: "Overall survival for 1,067 TCGA breast tumours with usable follow-up, stratified by tumour stage, PAM50 subtype, age band, or whether one of the twelve most-altered drivers is hit. Censoring ticks, a 95% band, medians, the log-rank test and the number-at-risk table.",
    react: "plotomics km: step curves and the confidence band on canvas, axes, risk table and legend as an SVG overlay. Hovering reads off every stratum's estimate at that time.",
    ggplot: "the steps are expanded into explicit vertices in R and drawn with geom_line plus a geom_ribbon band, because a ribbon has no step variant and would otherwise draw diagonal edges the estimator never asserts. The risk table is a second panel sharing the x scale via patchwork.",
    data: "Same cBioPortal cohort as the oncoplot, so 'altered' on this page means exactly what that page shows. Estimation happens once server-side with the survival package: Kaplan-Meier curves, Greenwood confidence limits, at-risk counts and the log-rank p, all shipped to both engines so the two cannot step in different places. Medians are the first time a curve reaches 50%, reported as 'not reached' when it never does rather than being replaced by the last follow-up time. Patients with missing or non-positive follow-up are dropped, which is why the count is 1,067 rather than the full 1,080. The gene strata are worth reading honestly: TP53 alteration is not prognostic for overall survival in this cohort (p = 0.66), which is the sort of null result a gallery figure usually hides.",
    refs: [
      { label: "Kaplan & Meier, J Am Stat Assoc 53:457–481 (1958) - nonparametric estimation from incomplete observations", href: "https://doi.org/10.1080/01621459.1958.10501452" },
      { label: "Therneau & Grambsch (2000) - Modeling Survival Data, the survival package", href: "https://doi.org/10.1007/978-1-4757-3294-8" },
      { label: "Cerami et al., Cancer Discov 2:401–404 (2012) - the cBioPortal", href: "https://doi.org/10.1158/2159-8290.CD-12-0095" },
    ],
  },
  {
    title: "Xenium single-molecule transcripts",
    what: "One million individual mRNA detections at their micrometre coordinates in a human breast cancer section, drawn from the 42.6 million the run reported. Colour by curated marker class, by the twelve most abundant genes, or by whether the molecule fell inside a nucleus.",
    react: "plotomics embedding, the same WebGL scatter the UMAP page uses, here on real tissue coordinates rather than an abstract embedding. Coordinates and category codes are fetched as binary blobs over plain HTTP, never over the websocket. The category order and palette are passed explicitly so a class keeps its colour when you switch fields.",
    ggplot: "geom_point on a 40,000-row subsample with coord_fixed and scale_y_reverse, reading its levels and colours from the same sidecar the browser reads. The subsample is the honest limit of the static engine, and the stat bar names it.",
    data: "10x Genomics public dataset, Xenium In Situ, Human Breast Cancer Rep 1 (Xenium Analyzer 1.0.1, 313-gene breast panel), CC BY 4.0. Detections are filtered to the vendor-recommended QV 20 and to real genes, dropping the 228 negative-control, blank, antisense and unused-codeword features, which leaves 34.4M of the 42.6M. The million shown are a seeded Bernoulli sample of those, shuffled so no class is systematically drawn over another. Coordinates are quantized to Int16 over the section bounds, a 0.11 um step that is finer than the instrument localizes a molecule to. Marker classes are our curation of the panel, and deliberately leave broadly expressed genes in Other rather than forcing them into a lineage.",
    refs: [
      { label: "10x Genomics - Xenium human breast cancer (FFPE, add-on panel)", href: "https://www.10xgenomics.com/datasets/ffpe-human-breast-with-custom-add-on-panel-1-standard" },
      { label: "Janesick et al., Nat Commun 14:8353 (2023) - high resolution mapping of the breast tumour microenvironment", href: "https://doi.org/10.1038/s41467-023-43458-x" },
    ],
  },
  {
    title: "Mutational signatures (SBS96)",
    what: "The 96 trinucleotide contexts under the six substitution blocks. The observed catalogue is 21,330 SNVs across 120 TCGA breast tumours; the four profiles below it were extracted de novo from those spectra by NMF. Two come out as the C>T and C>G arms of APOBEC and one as clock-like CpG deamination, recovered from the data rather than matched to a catalogue.",
    react: "plotomics profile: 96 canvas bars under a six-block banner, with the group colours that every published signature figure uses.",
    ggplot: "geom_col over a continuous x with the banner hand-rolled as a geom_rect layer, rather than facet_grid, which would introduce six panel strips and inter-panel gaps the convention does not have.",
    data: "GDC open-access TCGA-BRCA Masked Somatic Mutation MAFs (250 files, no account needed). GDC MAFs carry a CONTEXT column with an 11-base reference window, so the trinucleotide context is a substring and no BSgenome package is required. Signatures are fitted with seeded Lee-and-Seung multiplicative-update NMF at rank 4, reconstructing the catalogue at cosine similarity 0.999. These are NOT COSMIC reference signatures: COSMIC's terms (clause 4.7) forbid redistributing any part of COSMIC, so nothing from it is shipped and the profiles are named BRCA-A to BRCA-D rather than borrowing SBS numbers.",
    refs: [
      { label: "Alexandrov et al., Nature 500:415–421 (2013) - signatures of mutational processes", href: "https://doi.org/10.1038/nature12477" },
      { label: "Alexandrov et al., Nature 578:94–101 (2020) - the repertoire of mutational signatures", href: "https://doi.org/10.1038/s41586-020-1943-3" },
      { label: "Lee & Seung, Nature 401:788–791 (1999) - non-negative matrix factorization", href: "https://doi.org/10.1038/44565" },
      { label: "NCI Genomic Data Commons", href: "https://gdc.cancer.gov" },
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
    data: "Recurrent BRCA somatic variants (gene, genomic position, protein change, recurrence) sourced from the lifescience-shiny-gallery BRCA mutation dataset, which pulls the TCGA-BRCA PanCancer Atlas study from the public cBioPortal REST API. Nothing here comes from COSMIC.",
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
    data: "TCGA breast-cancer (BRCA) RNA-seq from the lifescience-shiny-gallery de-brca dataset: recount3 counts analysed with DESeq2, tumour vs normal, on a balanced 20 + 20 sample subset. The matrix is DESeq2's variance-stabilizing transform, not log2-CPM.",
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
            compare the two approaches across twenty-three common biological visualizations.
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
