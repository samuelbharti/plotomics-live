# Dataset provenance & refresh

All datasets bundled in `data/` are public. They are copied here so the app runs
offline; the scripts below refresh them from source.

| File | What | Source | Refresh |
|---|---|---|---|
| `de_results.csv` | Differential expression (TCGA-BRCA tumour vs normal): `gene, logFC, AveExpr, t, pvalue, padj` | TCGA-BRCA via recount3 / limma-voom | `Rscript data/prep/prepare-brca.R` |
| `expression.csv` | log2-CPM expression matrix, genes × 40 samples | same as above | same |
| `metadata.csv` | sample → group (tumour / normal) | same as above | same |
| `mutations.csv` | Recurrent BRCA somatic variants: `chrom, pos, ref, alt, gene, protein_change, count` (hg19) | COSMIC / TCGA-BRCA MAF, top recurrent sites | `Rscript data/prep/prepare-brca.R` |
| `umap_ggplot_sample.csv` | 40k-cell subsample of the UMAP (for the classic ggplot side) | derived from the blobs below | `Rscript data/prep/prepare-umap.R` |
| `www/data/umap_*.f32/.i16/.json` | 584,207-cell UMAP embedding as binary column blobs | UCSC Cell Browser — Human Cell Landscape (Han et al. 2020) | `Rscript data/prep/prepare-umap.R` |
| `tahoe_perturbation.csv` | Drug × cell-line coverage matrix (cells profiled) | Tahoe-100M `obs_cell_grid` (Arc Institute), aggregated via duckdb | `Rscript data/prep/prepare-tahoe.R` |

The **gene network** and **Hi-C contact matrix** are generated deterministically
in R at app startup (seeded `igraph::sample_sbm` and a synthetic TAD/loop matrix
respectively) — see `R/data.R` (`biov_network`, `biov_hic`); no files to refresh.

The DE / expression / mutation CSVs were sourced from the
`lifescience-shiny-gallery` project's prepared `de-brca` and `brca-mutations`
datasets; see that repo's `data/prep/` for the full TCGA/recount pipeline.

Protein structures are **not** stored: the Protein page fetches AlphaFold
predicted models live from `https://alphafold.ebi.ac.uk/files/AF-<UniProt>-F1-model_v4.pdb`.

Genome tracks for the IGV page are the inline variants from `mutations.csv`;
igv.js streams the hg19 reference itself from the igv.js data server.
