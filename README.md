# Plotomics Live - biological visualizations, two ways

A Shiny **React** (TSX) app that shows twenty-six biological-data visualizations, each
rendered **two ways** so you can compare them side by side via an engine toggle:

- **Shiny React** - an interactive, GPU-accelerated TSX component (plotomics /
  WebGL, sigma, igv.js, 3Dmol.js), and
- **ggplot2 (classic)** - a server-rendered image (the traditional R path).

The whole UI is React; there is **no bslib / Bootstrap**. ggplot2 plots are
rendered server-side to base64 PNGs and shown in `<img>`, so the two engines
always visualize the *same* server-side computation.

## The visualizations

The 26 visualizations are grouped into five analysis areas (the same grouping
drives the category dropdown nav and the home page).

### Single-cell & spatial

| Page | Shiny React (TSX) | ggplot2 / classic |
|------|-------------------|-------------------|
| Single-cell UMAP | **584,207 real cells** streamed as binary typed arrays → WebGL | ggplot2 (40k subsample) |
| Tahoe-100M perturbation | drug×cell-line coverage clustermap **+ a 380k-cell cell-cycle scatter** (real Tahoe data) | ggplot2 `geom_tile` |
| Visium spatial transcriptomics | plotomics `spatial` (H&E underlay + canvas spots, one shared transform) | ggplot2 `annotation_raster` + `geom_point` |
| Xenium single-molecule transcripts | plotomics `embedding` (WebGL, 1M mRNA detections streamed as binary blobs) | ggplot2 `geom_point` on a 40k subsample |
| Marker gene dot plot | plotomics `dotplot` (canvas dots, area-proportional size + colour) | ggplot2 `geom_point` with `scale_size_area` |
| Stacked violin | plotomics `violin` (canvas densities, per-feature y ranges) | ggplot2 `geom_polygon` from the same densities, faceted |

### Gene expression

| Page | Shiny React (TSX) | ggplot2 / classic |
|------|-------------------|-------------------|
| Volcano | plotomics `volcano` (WebGL) | ggplot2 + ggrepel |
| Expression heatmap | plotomics `heatmap` | ggplot2 `geom_tile` |
| Clustered heatmap | plotomics `clustermap` (in-browser clustering + dendrograms) | base-R `heatmap()` |
| PCA explorer | plotomics `embedding` for scores, `profile` for scree and loadings | ggplot2 `geom_point` + `stat_ellipse`, `geom_col` |

### Cancer genomics

| Page | Shiny React (TSX) | ggplot2 / classic |
|------|-------------------|-------------------|
| Oncoplot (OncoPrint) | plotomics `oncoplot` (canvas grid + marginal bars + clinical strips) | five ggplot2 panels aligned with `patchwork` |
| Domain lollipop | plotomics `lollipop` (canvas stems + Pfam domains + PTM track) | ggplot2 `geom_segment` + `geom_point` + `ggrepel` |
| Mutation treemap | plotomics `treemap` | hand-rolled ggplot2 treemap |
| Mutational signatures (SBS96) | plotomics `profile` (96 canvas bars + six-block banner) | ggplot2 `geom_col` + hand-rolled banner |
| Driver co-occurrence (UpSet) | plotomics `upset` (canvas bars + membership matrix) | three ggplot2 panels aligned with `patchwork` |
| Kaplan-Meier survival | plotomics `km` (canvas step curves + Greenwood band + risk table) | ggplot2 `geom_line` on expanded steps + `patchwork` risk table |

### Genome & epigenome

| Page | Shiny React (TSX) | ggplot2 / classic |
|------|-------------------|-------------------|
| Manhattan + QQ (GWAS) | canvas-2D scatter with a chromosome axis | ggplot2 by chromosome + QQ |
| eQTL / pQTL effect map | plotomics `heatmap` (diverging β) | ggplot2 `geom_tile` |
| Genome browser (IGV) | igv.js (hg19 + variant track) | ggplot2 variant needle plot |
| Gosling genome view | Gosling.js declarative JSON spec (loaded from CDN) | (spec-driven; no classic equivalent) |
| Hi-C contact matrix | plotomics `heatmap` (log contacts) | ggplot2 `geom_raster` |
| Single-cell ATAC coverage | canvas-2D per-cluster coverage tracks | ggplot2 faceted `geom_area` |

### Structure & networks

| Page | Shiny React (TSX) | ggplot2 / classic |
|------|-------------------|-------------------|
| Protein structure | 3Dmol.js (AlphaFold, coloured by pLDDT) | ggplot2 per-residue pLDDT profile |
| AlphaFold PAE matrix | plotomics `heatmap` (residue × residue error) + canvas row profile | ggplot2 `geom_raster` + `geom_area` profile |
| Gene network | plotomics `network` (sigma/WebGL, ~1.5k nodes / 7.4k edges) | igraph layout + ggplot2 |
| N-dimensional array viewer | plotomics `heatmap` slice + channel slider + per-pixel spectrum (WebGL) | ggplot2 `geom_raster` + spectrum |

The **UMAP** is the headline: ~584k real cells arrive as ~7 MB of binary column
blobs over plain HTTP and render on the GPU instantly, while ggplot2 can only
show a static subsample - the contrast is the point.

Every visualization panel has a **full-screen** button, and a floating **advisory
chat assistant** (bottom-right) answers questions about the app, each
visualization, roughly how much each can render, and which to pick for a given
dataset (deterministic knowledge base - no API key, advice-only, no UI control).

## Architecture

- **Backend:** R + [`shinyreact`](https://github.com/posit-dev/shinyreact),
  `ui.tsx` pattern. `app.R` is compute-only: one `reactive_output()` feed per
  visualization (both the plotomics data contract *and* a ggplot2 PNG). The
  React client reads them via `useShinyOutputValue` off `window.shinyreact`.
- **Frontend:** TSX built with Vite (IIFE, React externalized to
  `window.shinyreact`). React Router `HashRouter`; one route per viz. The
  visualizations are grouped into five analysis-area categories (single-cell &
  spatial, gene expression, cancer genomics, genome & epigenome, structure &
  networks): the top nav is a dropdown menu per category and the home page lays
  the cards out under the same headers. Theme is a light, organic palette
  derived from the [LTC color palettes](https://github.com/loukesio/ltc-color-palettes).
- **Reuse:** the [plotomics](../visualization-components) headless component
  factories (wrapped with one thin `PlotomicsView` lifecycle component),
  ggplot2 renderers adapted from `lifescience-shiny-gallery`, and a Tahoe
  coverage matrix prepared from `tahoe-explorer` via duckdb.

```
app.R                server: reactive_output feeds + ggplot2->PNG
R/{data,plots,palettes}.R   shiny-free data + rendering layer
data/                bundled CSVs + data/prep/ refresh scripts (+ PROVENANCE.md)
www/                 index.html, built app.js, app.css, data/ (UMAP binary blobs)
srcts/               main.tsx, App.tsx, lib/, components/, pages/ (TSX sources)
```

## Run

```bash
# 1. build the frontend (Node 18+)
npm install
npm run build            # -> www/app.js

# 2. run the Shiny app (R 4.x)
R -e "shiny::runApp('.', port = 8000)"
# open http://127.0.0.1:8000
```

Refresh / regenerate data with the scripts in `data/prep/` (see
`data/prep/PROVENANCE.md`). The UMAP blobs and Tahoe matrix are committed so the
app runs offline out of the box.

## Notes / known limits

- WebGL views need a hardware-accelerated browser; the software renderer used by
  some headless setups mis-draws them. An error boundary keeps a failed view
  from blanking the app.
- The Hi-C React view uses the heatmap factory (a contact map *is* a heatmap);
  the dedicated `hic` factory needs `OES_texture_float`, which current Chrome no
  longer exposes.
- The IGV browser streams its genome reference from igv.js's data servers, so it
  needs open network access to those hosts.

## Large / high-dimensional data

The N-dimensional array viewer demonstrates the microscopy/geoscience angle
(zarr / xarray / HyperSpy) with a WebGL slice + spectrum, no Python. For datasets
beyond WebGL's client-side limit (tens of millions to billions of points),
[datashader](https://datashader.org) is the right tool but is Python-only and
server-rasterizes; the clean way to use it here would be offline pre-rasterized
image tiles served statically, not a live in-app renderer.

## Future visualizations (easy to add)

A GO / pathway enrichment plot and an MDS ordination.

## License

The code is MIT (see `LICENSE`). The bundled datasets are not: each keeps the
license of its source, listed per dataset in `data/prep/PROVENANCE.md`.
