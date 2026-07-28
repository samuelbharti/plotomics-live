# Plotomics Live — biological visualizations, two ways

A Shiny **React** (TSX) app that shows seventeen biological-data visualizations, each
rendered **two ways** so you can compare them side by side via an engine toggle:

- **Shiny React** — an interactive, GPU-accelerated TSX component (plotomics /
  WebGL, sigma, igv.js, 3Dmol.js), and
- **ggplot2 (classic)** — a server-rendered image (the traditional R path).

The whole UI is React; there is **no bslib / Bootstrap**. ggplot2 plots are
rendered server-side to base64 PNGs and shown in `<img>`, so the two engines
always visualize the *same* server-side computation.

## The visualizations

| Page | Shiny React (TSX) | ggplot2 / classic |
|------|-------------------|-------------------|
| Volcano | plotomics `volcano` (WebGL) | ggplot2 + ggrepel |
| Single-cell UMAP | **584,207 real cells** streamed as binary typed arrays → WebGL | ggplot2 (40k subsample) |
| Expression heatmap | plotomics `heatmap` | ggplot2 `geom_tile` |
| Clustered heatmap | plotomics `clustermap` (in-browser clustering + dendrograms) | base-R `heatmap()` |
| Mutation treemap | plotomics `treemap` | hand-rolled ggplot2 treemap |
| Oncoplot (OncoPrint) | plotomics `oncoplot` (canvas grid + marginal bars + clinical strips) | five ggplot2 panels aligned with `patchwork` |
| Hi-C contact matrix | plotomics `heatmap` (log contacts) | ggplot2 `geom_raster` |
| Tahoe-100M perturbation | drug×cell-line coverage clustermap **+ a 380k-cell cell-cycle scatter** (real Tahoe data) | ggplot2 `geom_tile` |
| Gene network | plotomics `network` (sigma/WebGL, ~1.5k nodes / 7.4k edges) | igraph layout + ggplot2 |
| Genome browser (IGV) | igv.js (hg19 + variant track) | ggplot2 variant needle plot |
| Protein structure | 3Dmol.js (AlphaFold, coloured by pLDDT) | ggplot2 per-residue pLDDT profile |
| AlphaFold PAE matrix | plotomics `heatmap` (residue × residue error) + canvas row profile | ggplot2 `geom_raster` + `geom_area` profile |
| Manhattan + QQ (GWAS) | canvas-2D scatter with a chromosome axis | ggplot2 by chromosome + QQ |
| eQTL / pQTL effect map | plotomics `heatmap` (diverging β) | ggplot2 `geom_tile` |
| Single-cell ATAC coverage | canvas-2D per-cluster coverage tracks | ggplot2 faceted `geom_area` |
| N-dimensional array viewer | plotomics `heatmap` slice + channel slider + per-pixel spectrum (WebGL) | ggplot2 `geom_raster` + spectrum |
| Gosling genome view | Gosling.js declarative JSON spec (loaded from CDN) | (spec-driven; no classic equivalent) |

The **UMAP** is the headline: ~584k real cells arrive as ~7 MB of binary column
blobs over plain HTTP and render on the GPU instantly, while ggplot2 can only
show a static subsample — the contrast is the point.

Every visualization panel has a **full-screen** button, and a floating **advisory
chat assistant** (bottom-right) answers questions about the app, each
visualization, roughly how much each can render, and which to pick for a given
dataset (deterministic knowledge base — no API key, advice-only, no UI control).

## Architecture

- **Backend:** R + [`shinyreact`](https://github.com/posit-dev/shinyreact),
  `ui.tsx` pattern. `app.R` is compute-only: one `reactive_output()` feed per
  visualization (both the plotomics data contract *and* a ggplot2 PNG). The
  React client reads them via `useShinyOutputValue` off `window.shinyreact`.
- **Frontend:** TSX built with Vite (IIFE, React externalized to
  `window.shinyreact`). React Router `HashRouter`; a card home page + one route
  per viz. Theme is a light, organic palette derived from the
  [LTC color palettes](https://github.com/loukesio/ltc-color-palettes).
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

## Future visualizations (available in sibling projects, easy to add)

PCA/MDS scatter, Kaplan–Meier survival, box/violin group comparison, single-cell
dotplot, and enrichment lollipop.
