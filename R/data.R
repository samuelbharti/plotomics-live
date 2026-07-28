# Shiny-free data layer: load the bundled CSVs and shape them into the exact
# contracts the plotomics factories expect (columns + meta). The SAME shaped
# data backs both the React feeds (via reactive_output) and the ggplot2
# renderings, so the two engines always show the same numbers.
#
# All paths are relative to the app working directory (shiny::runApp sets it).

.data_path <- function(f) file.path("data", f)

# ---- differential expression (volcano) -----------------------------------
biov_de <- local({
  cache <- NULL
  function() {
    if (is.null(cache)) {
      cache <<- utils::read.csv(.data_path("de_results.csv"),
                                stringsAsFactors = FALSE)
    }
    cache
  }
})

# Tidy the DE table into volcano columns. Returns a list with x (log2FC),
# y (-log10 p), gene, status. `label` is left to the React factory (labelTopN)
# and to ggrepel on the ggplot side.
biov_volcano <- function(fc = 1, p = 0.05, p_col = "padj") {
  de <- biov_de()
  p_raw <- de[[p_col]]
  neg_log10_p <- -log10(pmax(p_raw, .Machine$double.xmin))
  status <- ifelse(de$logFC >= fc & p_raw < p, "Up",
             ifelse(de$logFC <= -fc & p_raw < p, "Down", "NS"))
  list(
    gene = as.character(de$gene),
    logFC = de$logFC,
    p = p_raw,
    neg_log10_p = neg_log10_p,
    status = factor(status, levels = c("Down", "NS", "Up"))
  )
}

# ---- expression matrix + sample metadata (heatmap) ------------------------
biov_expression <- local({
  cache <- NULL
  function() {
    if (is.null(cache)) {
      df <- utils::read.csv(.data_path("expression.csv"),
                            stringsAsFactors = FALSE, check.names = FALSE)
      genes <- df[[1]]
      m <- as.matrix(df[, -1, drop = FALSE])
      rownames(m) <- genes
      cache <<- m
    }
    cache
  }
})

biov_metadata <- local({
  cache <- NULL
  function() {
    if (is.null(cache)) {
      cache <<- utils::read.csv(.data_path("metadata.csv"),
                                stringsAsFactors = FALSE)
    }
    cache
  }
})

# Select the `n_genes` most variable genes, order samples by group, and return
# both the raw matrix (genes x samples) and the plotomics heatmap contract
# (row-major values + meta). z-scoring is left to the consumer so the ggplot2
# and React sides apply it identically.
biov_heatmap <- function(n_genes = 40) {
  m <- biov_expression()
  meta <- biov_metadata()
  # order columns by group so the two blocks are visually contiguous
  grp <- meta$group[match(colnames(m), meta$sample)]
  col_ord <- order(grp)
  m <- m[, col_ord, drop = FALSE]
  grp <- grp[col_ord]
  v <- apply(m, 1, stats::var)
  top <- utils::head(order(v, decreasing = TRUE), n_genes)
  sub <- m[top, , drop = FALSE]
  list(
    matrix = sub,                       # genes x samples (for ggplot2)
    groups = grp,
    values = as.numeric(t(sub)),        # row-major: gene r, sample c -> r*ncols + c
    nrows = nrow(sub),
    ncols = ncol(sub),
    rowLabels = rownames(sub),
    colLabels = colnames(sub)
  )
}

# ---- mutations (treemap + igv) --------------------------------------------
biov_mutations <- local({
  cache <- NULL
  function() {
    if (is.null(cache)) {
      cache <<- utils::read.csv(.data_path("mutations.csv"),
                                stringsAsFactors = FALSE)
    }
    cache
  }
})

# Build the treemap hierarchy: one root ("BRCA") -> gene -> variant leaf, leaf
# value = mutation count. stratify() requires exactly one root, so the root row
# carries an empty parent.
biov_treemap <- function() {
  mut <- biov_mutations()
  # collapse duplicate protein changes just in case
  agg <- stats::aggregate(count ~ gene + protein_change, data = mut, FUN = sum)
  gene_tot <- stats::aggregate(count ~ gene, data = agg, FUN = sum)
  gene_tot <- gene_tot[order(-gene_tot$count), ]

  ids <- c("BRCA", gene_tot$gene, paste(agg$gene, agg$protein_change, sep = ":"))
  parents <- c("", rep("BRCA", nrow(gene_tot)), agg$gene)
  values <- c(0, rep(0, nrow(gene_tot)), agg$count)
  labels <- c("BRCA", gene_tot$gene, agg$protein_change)
  list(
    id = ids, parent = parents, value = values, labels = labels,
    # for the ggplot2 renderer (flat gene->variant)
    df = data.frame(gene = agg$gene, variant = agg$protein_change,
                    count = agg$count, stringsAsFactors = FALSE),
    gene_order = gene_tot$gene
  )
}

# igv.js config: hg19 (mutations are hg19), centred on the selected gene, and a
# single inline 'annotation' track built from the mutation sites so both the
# classic (needle plot) and React (igv.js) genome views show the same variants.
biov_igv_config <- function(gene = "TP53") {
  mut <- biov_mutations()
  features <- lapply(seq_len(nrow(mut)), function(i) {
    list(
      chr = mut$chrom[i],
      start = mut$pos[i] - 1L,           # igv features are 0-based start
      end = mut$pos[i],
      name = paste0(mut$gene[i], " ", mut$protein_change[i]),
      score = mut$count[i]
    )
  })
  # locus spans the selected gene's variants (with padding)
  sub <- mut[mut$gene == gene, , drop = FALSE]
  if (!nrow(sub)) sub <- mut
  pad <- 2000
  locus <- sprintf("%s:%d-%d", sub$chrom[1], min(sub$pos) - pad, max(sub$pos) + pad)
  list(
    genome = "hg19",
    locus = locus,
    tracks = list(list(
      name = "BRCA mutations",
      type = "annotation",
      displayMode = "EXPANDED",
      color = "#ff6b6b",
      features = features
    ))
  )
}

# genes present in the mutation set, most-recurrent first (for the gene picker).
biov_mutation_genes <- function() {
  mut <- biov_mutations()
  tot <- stats::aggregate(count ~ gene, data = mut, FUN = sum)
  tot$gene[order(-tot$count)]
}

# ---- large gene network (treemap/igv share BRCA; this is its own graph) ----
# A large simulated gene-regulatory network with community structure: a
# stochastic block model of `k` modules, laid out ONCE with igraph so the React
# (sigma/WebGL) and classic (ggplot2) engines share identical coordinates. This
# is the network analogue of the UMAP showcase - many thousands of edges that
# WebGL keeps interactive while ggplot2 renders slowly.
biov_network <- local({
  cache <- NULL
  function(n_per = 130, k = 12) {
    if (!is.null(cache)) return(cache)
    stopifnot(requireNamespace("igraph", quietly = TRUE))
    set.seed(42)
    sizes <- rep(n_per, k)
    n <- sum(sizes)
    # dense within-module, sparse between-module connections
    p_in <- 0.06; p_out <- 0.0012
    pm <- matrix(p_out, k, k); diag(pm) <- p_in
    g <- igraph::sample_sbm(n, pref.matrix = pm, block.sizes = sizes)
    g <- igraph::simplify(g)
    # keep the giant component so the layout is coherent
    comp <- igraph::components(g)
    g <- igraph::induced_subgraph(g, which(comp$membership == which.max(comp$csize)))
    module <- rep(seq_len(k), times = sizes)[as.integer(igraph::V(g))]
    deg <- igraph::degree(g)
    # fast large-graph layout
    lay <- igraph::layout_with_drl(g)
    lay <- scale(lay)  # center/normalize
    ids <- paste0("G", seq_len(igraph::vcount(g)))
    el <- igraph::as_edgelist(g, names = FALSE)
    cache <<- list(
      id = ids,
      x = as.numeric(lay[, 1]),
      y = as.numeric(lay[, 2]),
      size = as.numeric(2 + 6 * (deg - min(deg)) / (max(deg) - min(deg) + 1)),
      group = paste0("module ", module),
      source = ids[el[, 1]],
      target = ids[el[, 2]],
      n_nodes = igraph::vcount(g),
      n_edges = igraph::ecount(g),
      layout = lay,
      edge_index = el
    )
    cache
  }
})

# ---- Tahoe-100M perturbation coverage (real data via prep script) ---------
# Drug x cell-line matrix of cells profiled (log10), from Tahoe-100M's
# obs_cell_grid (see data/prep/prepare-tahoe.R). The Tahoe explorer app's
# flagship "coverage" view; here it drives both engines as a heatmap.
biov_tahoe <- local({
  cache <- NULL
  function() {
    if (is.null(cache)) {
      df <- utils::read.csv(.data_path("tahoe_perturbation.csv"),
                            check.names = FALSE, stringsAsFactors = FALSE)
      drugs <- df[[1]]
      m <- as.matrix(df[, -1, drop = FALSE])
      rownames(m) <- drugs
      lm <- log10(m + 1)
      cache <<- list(
        matrix = lm, drugs = drugs, cells = colnames(m),
        values = as.numeric(t(lm)),           # row-major
        nrows = nrow(lm), ncols = ncol(lm),
        rowLabels = drugs, colLabels = colnames(m)
      )
    }
    cache
  }
})

# ---- Hi-C contact matrix (simulated chromatin interactions) ---------------
# A synthetic but realistic Hi-C map: distance decay along the diagonal, nested
# topologically-associating domains (TADs), and a few off-diagonal loops. Returned
# row-major so both the plotomics `hic` (WebGL) and ggplot2 (geom_raster) engines
# read the identical matrix.
biov_hic <- local({
  cache <- NULL
  function(n = 180L, chrom = "chr8", bin_size = 100000L) {
    if (!is.null(cache)) return(cache)
    set.seed(7)
    idx <- seq_len(n)
    d <- abs(outer(idx, idx, "-"))
    M <- 1 / (d + 1)^0.9                     # polymer distance decay
    # nested TAD blocks: boost within-domain contacts
    bounds <- unique(c(1, sort(sample(6:(n - 6), 10)), n + 1))
    for (b in seq_len(length(bounds) - 1)) {
      lo <- bounds[b]; hi <- bounds[b + 1] - 1
      M[lo:hi, lo:hi] <- M[lo:hi, lo:hi] + 0.5
    }
    # a handful of long-range loops (corner peaks)
    for (k in seq_len(6)) {
      i <- sample(idx, 1); j <- min(n, i + sample(15:45, 1))
      M[i, j] <- M[i, j] + 0.8; M[j, i] <- M[i, j]
    }
    M <- M * matrix(stats::rgamma(n * n, shape = 8, rate = 8), n, n)  # noise
    M <- (M + t(M)) / 2                       # enforce symmetry
    cache <<- list(
      values = as.numeric(t(M)),              # row-major
      n = n, chrom = chrom, bin_size = bin_size,
      matrix = M
    )
    cache
  }
})

# ---- UMAP ggplot sample (the deliberately slower classic side) ------------
biov_umap_sample <- local({
  cache <- NULL
  function() {
    if (is.null(cache)) {
      cache <<- utils::read.csv(.data_path("umap_ggplot_sample.csv"),
                                stringsAsFactors = FALSE)
    }
    cache
  }
})

# ---- GWAS summary statistics (Manhattan + QQ) -----------------------------
# Simulated genome-wide association results: SNPs across 22 chromosomes with a
# handful of genuine association peaks. Seeded so both engines see identical
# data. Returns per-SNP arrays plus the cumulative x-position and per-chromosome
# tick centres a Manhattan plot needs.
biov_gwas <- local({
  cache <- NULL
  function(n = 50000L) {
    if (!is.null(cache)) return(cache)
    set.seed(11)
    # approximate hg38 chromosome lengths (Mb) for realistic spacing
    chr_len <- c(248,242,198,190,181,171,159,145,138,133,135,133,114,107,
                 101,90,83,80,58,64,46,50)
    chr <- sample(seq_len(22), n, replace = TRUE, prob = chr_len)
    pos <- floor(runif(n) * chr_len[chr] * 1e6) + 1
    # null p-values (uniform); then inject peaks on a few chromosomes
    p <- runif(n)
    peaks <- data.frame(chr = c(2, 6, 6, 9, 15, 19),
                        at = c(135, 32, 130, 22, 78, 45) * 1e6)
    for (i in seq_len(nrow(peaks))) {
      near <- which(chr == peaks$chr[i] & abs(pos - peaks$at[i]) < 3e6)
      if (length(near)) {
        k <- sample(near, min(length(near), 60))
        d <- abs(pos[k] - peaks$at[i]) / 3e6
        p[k] <- 10^(-(runif(length(k), 6, 14) * (1 - d)))
      }
    }
    p <- pmin(pmax(p, .Machine$double.xmin), 1)
    ord <- order(chr, pos)
    chr <- chr[ord]; pos <- pos[ord]; p <- p[ord]
    # cumulative x offset per chromosome
    offs <- cumsum(c(0, chr_len[-22])) * 1e6
    x <- pos + offs[chr]
    centres <- offs + chr_len * 1e6 / 2
    list(chr = chr, pos = pos, p = p, x = x,
         neglog10p = -log10(p), n = length(p),
         chr_centres = centres, chr_bounds = c(offs, sum(chr_len) * 1e6),
         genome_len = sum(chr_len) * 1e6, sig = -log10(5e-8))
  }
})

# Q-Q data: observed vs expected -log10 p (thinned for plotting).
biov_qq <- function() {
  g <- biov_gwas()
  o <- sort(g$p)
  m <- length(o)
  expected <- -log10((seq_len(m) - 0.5) / m)
  observed <- -log10(o)
  # thin the bulk (keep all of the informative tail)
  keep <- unique(c(seq(1, m, length.out = 4000L), (m - 2000L):m))
  keep <- keep[keep >= 1 & keep <= m]
  list(expected = expected[keep], observed = observed[keep],
       lambda = round(stats::median(stats::qchisq(1 - o, 1)) / stats::qchisq(0.5, 1), 3))
}

# ---- N-dimensional array cube (hyperspectral) -----------------------------
# Reads the Float32 cube written by data/prep/prepare-ndarray.R (channel-major,
# y-major within channel) and exposes a 2-D channel slice and a per-pixel
# spectrum. Same blob the React client fetches, so both engines agree.
biov_ndarray <- local({
  cache <- NULL
  function() {
    if (is.null(cache)) {
      meta <- jsonlite::fromJSON(.data_path(file.path("..", "www", "data", "ndarray_meta.json")))
      con <- file(.data_path(file.path("..", "www", "data", "ndarray.f32")), "rb")
      cube <- readBin(con, "numeric", n = meta$ny * meta$nx * meta$nch, size = 4, endian = "little")
      close(con)
      ny <- meta$ny; nx <- meta$nx; nch <- meta$nch
      cache <<- list(
        ny = ny, nx = nx, nch = nch,
        slice = function(ch) {
          ch <- max(1L, min(nch, as.integer(ch)))
          block <- cube[((ch - 1L) * ny * nx + 1L):(ch * ny * nx)]
          matrix(block, nrow = ny, ncol = nx, byrow = TRUE)   # m[y, x]
        },
        spectrum = function(px, py) {
          px <- max(1L, min(nx, as.integer(px))); py <- max(1L, min(ny, as.integer(py)))
          idx <- (seq_len(nch) - 1L) * ny * nx + (py - 1L) * nx + (px - 1L) + 1L
          cube[idx]
        }
      )
    }
    cache
  }
})

# ---- single-cell ATAC coverage-by-cluster ---------------------------------
# Simulated pseudobulk accessibility (Signac CoveragePlot style): per-cluster
# signal across a genomic window, with shared promoter peaks and a few
# cluster-specific enhancer peaks. Returns the coverage matrix (cluster x bin)
# plus bin positions and a simple gene model.
biov_atac <- local({
  cache <- NULL
  function(n_bins = 600L, n_clusters = 8L, chrom = "chr11", start = 65200000L) {
    if (!is.null(cache)) return(cache)
    set.seed(31)
    bp <- start + round(seq(0, 60000, length.out = n_bins))
    clusters <- paste0("cluster ", seq_len(n_clusters))
    peak <- function(centre, width, height) height * exp(-0.5 * ((bp - centre) / width)^2)
    m <- matrix(0, n_clusters, n_bins)
    shared <- peak(start + 12000, 800, 1)          # a promoter shared by all
    for (c in seq_len(n_clusters)) {
      row <- shared * runif(1, 0.6, 1) +
        peak(start + sample(c(20000, 30000, 42000, 52000), 1), 1200, runif(1, 0.4, 1.1)) +
        peak(start + 5000 + c * 6500, 700, runif(1, 0.5, 1.3))   # cluster-specific enhancer
      m[c, ] <- row + abs(stats::rnorm(n_bins, 0, 0.03))
    }
    m <- m / max(m)
    genes <- data.frame(name = "GENE", xstart = start + 11000, xend = start + 46000,
                        exons_s = c(11000, 24000, 45000) + start,
                        exons_e = c(13000, 26000, 46000) + start)
    list(matrix = m, positions = bp, clusters = clusters,
         signal = as.numeric(t(m)), n_clusters = n_clusters, n_bins = n_bins,
         chrom = chrom, start = min(bp), end = max(bp), genes = genes)
  }
})

# ---- eQTL / pQTL effect matrix --------------------------------------------
# Simulated cis-QTL effect sizes: variants (rows) x genes/proteins (cols),
# signed effect (beta). A block structure gives clusters of co-regulated
# variant-gene pairs. Returns the plotomics heatmap contract + the raw matrix.
biov_eqtl <- local({
  cache <- NULL
  function(n_var = 45L, n_gene = 30L) {
    if (!is.null(cache)) return(cache)
    set.seed(21)
    m <- matrix(stats::rnorm(n_var * n_gene, 0, 0.25), n_var, n_gene)
    # a few strong QTL blocks
    for (b in list(list(1:12, 1:8, 1.4), list(15:26, 10:18, -1.2),
                   list(30:40, 20:28, 1.1))) {
      m[b[[1]], b[[2]]] <- m[b[[1]], b[[2]]] +
        matrix(stats::rnorm(length(b[[1]]) * length(b[[2]]), b[[3]], 0.2),
               length(b[[1]]), length(b[[2]]))
    }
    rownames(m) <- sprintf("rs%d", sample(1e6:9e6, n_var))
    colnames(m) <- sprintf("GENE%02d", seq_len(n_gene))
    list(matrix = m, values = as.numeric(t(m)), nrows = n_var, ncols = n_gene,
         rowLabels = rownames(m), colLabels = colnames(m))
  }
})

# ---- AlphaFold predicted aligned error (PAE) ------------------------------
# The other half of an AlphaFold prediction. Entry (x, y) is the expected
# position error at residue x when the prediction is superposed on residue y.
# Low blocks along the diagonal are confidently-folded domains; a high
# off-diagonal block between two low blocks means both domains are individually
# confident but their relative orientation is not. That is the read the pLDDT
# profile on the protein page cannot give you.

# AlphaFold bumps its model version periodically (v4 is already retired and
# returns 404), so ask the API for the current file URLs instead of guessing.
# Falls back to the known v6 pattern when the API is unreachable, and caches
# per accession so an offline session pays the timeout once.
.af_urls <- local({
  cache <- new.env(parent = emptyenv())
  function(uniprot) {
    hit <- cache[[uniprot]]
    if (!is.null(hit)) return(hit)
    urls <- list(
      pdb = sprintf("https://alphafold.ebi.ac.uk/files/AF-%s-F1-model_v6.pdb", uniprot),
      pae = sprintf("https://alphafold.ebi.ac.uk/files/AF-%s-F1-predicted_aligned_error_v6.json",
                    uniprot))
    tmp <- tempfile(fileext = ".json")
    on.exit(unlink(tmp), add = TRUE)
    old <- options(timeout = 15); on.exit(options(old), add = TRUE)
    # A miss here is expected and handled (we fall back to the v6 pattern), so
    # don't let download.file's warning reach the Shiny console.
    got <- suppressWarnings(try(utils::download.file(
      sprintf("https://alphafold.ebi.ac.uk/api/prediction/%s", uniprot),
      tmp, mode = "wb", quiet = TRUE), silent = TRUE))
    if (!inherits(got, "try-error") && file.exists(tmp) && file.info(tmp)$size > 0) {
      j <- try(jsonlite::fromJSON(tmp), silent = TRUE)
      if (!inherits(j, "try-error") && is.data.frame(j) && nrow(j) >= 1) {
        if (!is.null(j$pdbUrl)) urls$pdb <- j$pdbUrl[1]
        if (!is.null(j$paeDocUrl)) urls$pae <- j$paeDocUrl[1]
      }
    }
    cache[[uniprot]] <- urls
    urls
  }
})

.af_pae_path <- function(uniprot) {
  dir.create(.data_path("raw"), showWarnings = FALSE, recursive = TRUE)
  dest <- .data_path(file.path("raw", paste0("PAE-", uniprot, ".json")))
  if (!file.exists(dest) || file.info(dest)$size == 0) {
    suppressWarnings(try(
      utils::download.file(.af_urls(uniprot)$pae, dest, mode = "wb", quiet = TRUE),
      silent = TRUE))
  }
  dest
}

# Block-mean a square matrix down to at most n_max per side. PIK3CA is 1,068
# residues, i.e. a 1.14M-cell matrix - far more than a screen can resolve or
# than is worth pushing over the websocket. Binning is reported in the stat bar
# rather than being applied silently, and both engines plot the binned matrix so
# they cannot disagree.
.bin_square <- function(m, n_max = 400L) {
  n <- nrow(m)
  if (n <= n_max) return(list(m = m, bin = 1L))
  f <- ceiling(n / n_max)
  idx <- rep(seq_len(ceiling(n / f)), each = f)[seq_len(n)]
  k <- as.numeric(table(idx))
  agg <- rowsum(m, idx) / k
  list(m = t(rowsum(t(agg), idx) / k), bin = as.integer(f))
}

biov_pae <- local({
  cache <- new.env(parent = emptyenv())
  function(uniprot = "P04637", n_max = 400L) {
    key <- paste0(uniprot, "_", n_max)
    hit <- cache[[key]]
    if (!is.null(hit)) return(hit)
    path <- .af_pae_path(uniprot)
    if (!file.exists(path) || file.info(path)$size == 0) return(NULL)
    j <- try(jsonlite::fromJSON(path), silent = TRUE)
    if (inherits(j, "try-error") || is.null(j$predicted_aligned_error)) return(NULL)
    full <- as.matrix(j$predicted_aligned_error[[1]])
    b <- .bin_square(full, n_max)
    # Round the matrix ITSELF, not just the feed copy, for two reasons: both
    # engines then plot bit-identical numbers, and the feed stays small. Shiny
    # serializes at 16 significant digits, so an unrounded binned mean costs ~15
    # bytes instead of ~4 (PIK3CA: 1.84 MB vs 0.47 MB). AlphaFold reports PAE as
    # integers anyway, so 0.1 A is already finer than the source.
    m <- round(b$m, 1)
    n <- nrow(m)
    # Label each binned row/col with the residue it centres on.
    labs <- as.character(round(seq(1, nrow(full), length.out = n)))
    out <- list(matrix = m, values = as.numeric(t(m)),
                nrows = n, ncols = n, rowLabels = labs, colLabels = labs,
                residues = nrow(full), bin = b$bin,
                maxPae = as.numeric(j$max_predicted_aligned_error[1]))
    cache[[key]] <- out
    out
  }
})
