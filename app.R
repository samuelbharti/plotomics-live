# Biological Visualizations - a Shiny React (ui.tsx) app.
#
# The React client (www/app.js, built from srcts/*.tsx) owns all UI. This server
# is compute-only: it publishes one reactive_output() feed per visualization
# (both the plotomics data contract for the React engine AND a ggplot2 PNG
# data-URI for the classic engine), reacting to the client's shared controls.
#
# Run:  R -e "shiny::runApp('.', port = 8000)"

library(shiny)
library(shinyreact)
library(ggplot2)

# Pure logic + rendering layers (no shiny:: inside these).
source("R/palettes.R", local = TRUE)
source("R/data.R", local = TRUE)
source("R/plots.R", local = TRUE)

ui <- page_react_html("www/index.html")

server <- function(input, output, session) {

  # ---- shared controls (defaults mirror the plotomics defaults) ----
  fc      <- reactive(if (is.null(input$fc)) 1 else input$fc)
  pcut    <- reactive(if (is.null(input$p)) 0.05 else input$p)
  n_genes <- reactive(if (is.null(input$n_genes)) 40 else input$n_genes)
  zscore  <- reactive(if (is.null(input$zscore)) TRUE else isTRUE(input$zscore))
  umap_by <- reactive(if (is.null(input$umap_color)) "cell_type" else input$umap_color)
  nd_ch <- reactive(if (is.null(input$nd_channel)) 15L else as.integer(input$nd_channel))
  nd_px <- reactive(if (is.null(input$nd_px)) 28L else as.integer(input$nd_px))
  nd_py <- reactive(if (is.null(input$nd_py)) 30L else as.integer(input$nd_py))
  igv_gene <- reactive(if (is.null(input$igv_gene)) "TP53" else input$igv_gene)
  prot_acc <- reactive(if (is.null(input$protein_uniprot)) "P04637" else input$protein_uniprot)
  prot_res <- reactive(input$protein_residue)
  pae_acc <- reactive(if (is.null(input$pae_uniprot)) "P04637" else input$pae_uniprot)
  pae_res <- reactive(if (is.null(input$pae_residue)) NA_integer_ else as.integer(input$pae_residue))

  # ---- VOLCANO -------------------------------------------------------------
  output$volcano_data <- reactive_output({
    v <- biov_volcano(fc = fc(), p = pcut())
    list(columns = list(x = v$logFC, y = v$neg_log10_p, label = v$gene))
  })
  output$volcano_png <- reactive_output({
    plot_volcano_gg(fc = fc(), p = pcut())
  })
  output$volcano_stats <- reactive_output({
    v <- biov_volcano(fc = fc(), p = pcut())
    tab <- table(v$status)
    list(n = length(v$gene), up = unname(tab["Up"]), down = unname(tab["Down"]))
  })

  # ---- HEATMAP -------------------------------------------------------------
  output$heatmap_data <- reactive_output({
    h <- biov_heatmap(n_genes = n_genes())
    list(
      columns = list(values = h$values),
      meta = list(nrows = h$nrows, ncols = h$ncols,
                  rowLabels = h$rowLabels, colLabels = h$colLabels)
    )
  })
  output$heatmap_png <- reactive_output({
    plot_heatmap_gg(n_genes = n_genes(), z_score = zscore())
  })

  # ---- CLUSTERMAP (clustered heatmap + dendrograms) ------------------------
  output$clustermap_data <- reactive_output({
    h <- biov_heatmap(n_genes = n_genes())
    list(
      columns = list(values = h$values),
      meta = list(nrows = h$nrows, ncols = h$ncols,
                  rowLabels = h$rowLabels, colLabels = h$colLabels)
    )
  })
  output$clustermap_png <- reactive_output({
    plot_clustermap_gg(n_genes = n_genes(), z_score = zscore())
  })

  # ---- HI-C ----------------------------------------------------------------
  # Rendered with the plotomics heatmap factory (a contact map IS a heatmap);
  # this avoids the hic factory's OES_texture_float requirement, unavailable in
  # current Chrome. Values are log1p-transformed so the structure pops.
  output$hic_data <- reactive_output({
    hic <- biov_hic()
    list(columns = list(values = log1p(hic$values)),
         meta = list(nrows = hic$n, ncols = hic$n))
  })
  output$hic_png <- reactive_output({ plot_hic_gg() })
  output$hic_stats <- reactive_output({
    hic <- biov_hic(); list(n = hic$n, chrom = hic$chrom)
  })

  # ---- TAHOE perturbation coverage (real Tahoe-100M data) ------------------
  output$tahoe_data <- reactive_output({
    t <- biov_tahoe()
    list(columns = list(values = t$values),
         meta = list(nrows = t$nrows, ncols = t$ncols,
                     rowLabels = t$rowLabels, colLabels = t$colLabels))
  })
  output$tahoe_png <- reactive_output({ plot_tahoe_gg() })
  output$tahoe_stats <- reactive_output({
    t <- biov_tahoe(); list(drugs = t$nrows, cells = t$ncols)
  })

  # ---- TREEMAP -------------------------------------------------------------
  output$treemap_data <- reactive_output({
    tm <- biov_treemap()
    list(
      columns = list(id = tm$id, parent = tm$parent, value = tm$value),
      meta = list(labels = tm$labels)
    )
  })
  output$treemap_png <- reactive_output({
    plot_treemap_gg()
  })

  # ---- UMAP ----------------------------------------------------------------
  # The React side fetches the binary blobs in www/data directly; the server
  # only renders the (deliberately capped) ggplot2 counterpart.
  output$umap_png <- reactive_output({
    uri <- plot_umap_gg(colour_by = umap_by())
    list(uri = unclass(uri), n = attr(uri, "n"), secs = attr(uri, "secs"))
  })

  # ---- MANHATTAN + QQ (GWAS) -----------------------------------------------
  output$gwas_data <- reactive_output({
    g <- biov_gwas()
    list(
      columns = list(x = g$x, y = g$neglog10p, chr = g$chr),
      meta = list(chrCentres = g$chr_centres, chrBounds = g$chr_bounds,
                  genomeLen = g$genome_len, sig = g$sig, n = g$n)
    )
  })
  output$manhattan_png <- reactive_output({ plot_manhattan_gg() })
  output$qq_data <- reactive_output({
    q <- biov_qq(); list(columns = list(x = q$expected, y = q$observed), meta = list(lambda = q$lambda))
  })
  output$qq_png <- reactive_output({ plot_qq_gg() })

  # ---- eQTL / pQTL ---------------------------------------------------------
  output$eqtl_data <- reactive_output({
    e <- biov_eqtl()
    list(columns = list(values = e$values),
         meta = list(nrows = e$nrows, ncols = e$ncols,
                     rowLabels = e$rowLabels, colLabels = e$colLabels))
  })
  output$eqtl_png <- reactive_output({ plot_eqtl_gg() })

  # ---- scATAC coverage-by-cluster ------------------------------------------
  output$atac_data <- reactive_output({
    a <- biov_atac()
    list(
      columns = list(signal = a$signal),
      meta = list(nClusters = a$n_clusters, nBins = a$n_bins, positions = a$positions,
                  clusters = a$clusters, chrom = a$chrom, start = a$start, end = a$end)
    )
  })
  output$atac_png <- reactive_output({ plot_atac_gg() })

  # ---- N-D array (hyperspectral) -------------------------------------------
  # React fetches the cube blob directly; the server renders the ggplot slice +
  # spectrum for the same channel / probe pixel the client selects.
  output$nd_meta <- reactive_output({
    nd <- biov_ndarray(); list(ny = nd$ny, nx = nd$nx, nch = nd$nch)
  })
  output$nd_slice_png <- reactive_output({ plot_ndslice_gg(nd_ch()) })
  output$nd_spectrum_png <- reactive_output({ plot_ndspectrum_gg(nd_px(), nd_py()) })

  # ---- IGV -----------------------------------------------------------------
  output$igv_genes <- reactive_output({ biov_mutation_genes() })
  output$igv_config <- reactive_output({ biov_igv_config(igv_gene()) })
  output$igv_needle_png <- reactive_output({ plot_igv_needle_gg(igv_gene()) })

  # ---- NETWORK -------------------------------------------------------------
  output$network_data <- reactive_output({
    net <- biov_network()
    list(
      columns = list(
        id = net$id, x = net$x, y = net$y, size = net$size,
        source = net$source, target = net$target
      ),
      meta = list(nodeGroup = net$group, nodeLabels = net$id)
    )
  })
  output$network_png <- reactive_output({
    uri <- plot_network_gg()
    list(uri = unclass(uri), nodes = attr(uri, "nodes"),
         edges = attr(uri, "edges"), secs = attr(uri, "secs"))
  })
  output$network_stats <- reactive_output({
    net <- biov_network()
    list(nodes = net$n_nodes, edges = net$n_edges)
  })

  # ---- PROTEIN (classic pLDDT profile; React side is 3Dmol) ----------------
  output$protein_plddt_png <- reactive_output({
    plot_protein_plddt_gg(prot_acc(), prot_res())
  })

  # ---- ALPHAFOLD PAE -------------------------------------------------------
  # Both engines read the SAME binned matrix from biov_pae(); the client never
  # talks to AlphaFold directly, so it cannot end up plotting the unbinned one.
  output$pae_data <- reactive_output({
    p <- biov_pae(pae_acc())
    if (is.null(p)) return(NULL)
    list(columns = list(values = p$values),
         meta = list(nrows = p$nrows, ncols = p$ncols,
                     rowLabels = p$rowLabels, colLabels = p$colLabels))
  })
  output$pae_profile_data <- reactive_output({
    p <- biov_pae(pae_acc())
    if (is.null(p)) return(NULL)
    pos <- as.integer(p$rowLabels)
    res <- pae_res()
    i <- if (is.null(res) || is.na(res)) 1L else which.min(abs(pos - res))
    list(columns = list(values = unname(p$matrix[i, ])),
         meta = list(residue = pos[i], maxPae = p$maxPae))
  })
  output$pae_png <- reactive_output({ plot_pae_gg(pae_acc(), pae_res()) })
  output$pae_profile_png <- reactive_output({
    plot_pae_profile_gg(pae_acc(), pae_res())
  })
  output$pae_stats <- reactive_output({
    p <- biov_pae(pae_acc())
    if (is.null(p)) return(list(ok = FALSE))
    list(ok = TRUE, residues = p$residues, binned = p$nrows, bin = p$bin,
         cells = p$residues * p$residues, maxPae = p$maxPae,
         mean = round(mean(p$matrix), 2))
  })
}

shinyApp(ui = ui, server = server)
