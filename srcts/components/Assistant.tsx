// A small, self-contained advisory chat assistant. It does NOT control the app
// or any inputs - it only answers questions about Plotomics Live: what the app is,
// what each visualization shows, roughly how much each can render, and which
// visualization to pick for a given dataset. Deterministic knowledge base (no
// external LLM / API key), so it always works offline.
import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { GROUPS, vizByGroup } from "../pages/Home";
import { useShinyInput, useShinyOutputValue } from "../lib/shiny";

interface Viz {
  route: string; name: string; kw: string[];
  what: string; capacity: string; pick: string;
}

const KB: Viz[] = [
  { route: "/umap", name: "Single-cell UMAP", kw: ["umap", "tsne", "t-sne", "embedding", "single cell", "single-cell", "scrna", "cells", "cluster", "cell type", "atlas"],
    what: "a 2-D cell embedding coloured by cell type / organ.",
    capacity: "~584k cells here; the WebGL engine comfortably handles hundreds of thousands to ~1M points.",
    pick: "you have a single-cell embedding (UMAP/t-SNE/PCA coords) with a categorical label and want to explore many cells interactively." },
  { route: "/tahoe", name: "Tahoe-100M perturbation", kw: ["perturbation", "drug", "screen", "dose", "compound", "treatment", "coverage", "tahoe"],
    what: "a drug × cell-line coverage heatmap plus a 380k-cell scatter from a 100M-cell atlas.",
    capacity: "the coverage matrix is small; the per-cell scatter draws ~380k cells on the GPU.",
    pick: "you have drug/perturbation screen data (counts per condition) or a very large per-cell table." },
  { route: "/network", name: "Gene network", kw: ["network", "graph", "interaction", "edges", "nodes", "ppi", "co-expression", "regulatory", "knowledge graph"],
    what: "a node–link graph with community structure.",
    capacity: "~1.5k nodes / 7.4k edges here; sigma/WebGL scales to tens of thousands of edges.",
    pick: "your data is relationships (gene–gene, protein–protein, pathway) rather than a table." },
  { route: "/hic", name: "Hi-C contact matrix", kw: ["hi-c", "hic", "contact", "chromatin", "tad", "loop", "3d genome", "interaction matrix"],
    what: "a genomic contact matrix (interaction frequency between bins).",
    capacity: "hundreds of bins per axis here; the WebGL matrix renderer scales to thousands.",
    pick: "you have a square interaction/contact matrix or any dense symmetric matrix." },
  { route: "/protein", name: "Protein structure", kw: ["protein", "structure", "3d", "pdb", "alphafold", "residue", "fold", "molecule", "plddt"],
    what: "an interactive 3-D structure (AlphaFold) plus a per-residue confidence profile.",
    capacity: "one structure at a time (thousands of atoms), fetched live from AlphaFold.",
    pick: "you want to inspect a protein's 3-D fold, domains, or a variant residue." },
  { route: "/oncoplot", name: "Oncoplot (OncoPrint)", kw: ["oncoplot", "oncoprint", "waterfall", "maf", "cohort", "somatic", "driver", "mutation matrix", "tumour", "tumor", "cancer", "tmb", "mutual exclusivity", "memo sort"],
    what: "a gene x sample grid of alteration classes with per-sample burden, per-gene frequency and clinical strips.",
    capacity: "hundreds of genes x thousands of samples; the grid is canvas-drawn, so cohort scale is not a problem.",
    pick: "you have per-sample somatic alterations (a MAF, or mutations plus copy number) and want the cohort landscape." },
  { route: "/visium", name: "Visium spatial transcriptomics", kw: ["spatial", "visium", "10x", "tissue", "histology", "h&e", "he", "slide", "section", "spot", "in situ", "spatial transcriptomics", "microenvironment", "niche"],
    what: "capture spots at their tissue coordinates over the H&E section, coloured by cluster or by a gene.",
    capacity: "thousands of spots here; the canvas layer handles tens of thousands, and Visium HD bins would go the same way.",
    pick: "your measurements have real coordinates on a tissue section and the anatomy is part of the result." },
  { route: "/dotplot", name: "Marker gene dot plot", kw: ["dotplot", "dot plot", "marker", "markers", "marker gene", "scanpy", "seurat", "percent expressing", "pct", "cluster marker", "annotation", "cell type", "signature", "bubble"],
    what: "a gene x cluster grid where dot size is the percent expressing and colour is the expression level.",
    capacity: "hundreds of genes x tens of clusters; dots are canvas-drawn so the grid is not the limit, legibility is.",
    pick: "you have per-cluster expression summaries and want to see which genes mark which group." },
  { route: "/violin", name: "Stacked violin", kw: ["violin", "stacked violin", "distribution", "density", "bimodal", "bimodality", "ridgeline", "box plot", "boxplot", "kde", "spread", "expression distribution"],
    what: "one row per gene, one violin per cluster, showing the whole expression distribution rather than a summary.",
    capacity: "tens of features x tens of groups; the payload is the density grid, not the cell count, so cohort size does not matter.",
    pick: "a mean or median is hiding the shape, especially when a gene is bimodal within a group." },
  { route: "/pca", name: "PCA explorer", kw: ["pca", "principal component", "principal components", "pcs", "scree", "loadings", "loading", "biplot", "scores", "ordination", "dimensionality reduction", "dimension reduction", "variance explained", "eigenvalue", "batch effect", "outlier", "qc", "svd"],
    what: "one decomposition read three ways: sample scores on any pair of components, a scree of variance explained, and the genes loading a chosen axis.",
    capacity: "tens to hundreds of samples x thousands of genes; the fit happens server-side once and all three views read it.",
    pick: "you want to see the dominant structure in a matrix before testing anything, or to check for a batch effect or an outlier sample." },
  { route: "/survival", name: "Kaplan-Meier survival", kw: ["survival", "kaplan", "meier", "kaplan-meier", "km", "censoring", "censored", "time to event", "time-to-event", "prognosis", "prognostic", "outcome", "hazard", "log-rank", "logrank", "at risk", "cox", "os", "pfs", "overall survival", "clinical", "follow-up"],
    what: "overall survival curves per stratum with censoring ticks, a 95% band and the number-at-risk table.",
    capacity: "any cohort size; the curve is a step function over event times, so the point count follows deaths not patients.",
    pick: "you have follow-up time plus an event indicator and want to compare outcome between groups." },
  { route: "/xenium", name: "Xenium single-molecule transcripts", kw: ["xenium", "merfish", "cosmx", "single molecule", "single-molecule", "smfish", "in situ", "imaging-based", "transcript", "molecule", "subcellular", "spatial", "detection", "probe", "segmentation-free"],
    what: "individual mRNA detections at their micrometre coordinates in a tissue section, coloured by marker class, gene, or nuclear position.",
    capacity: "a million molecules on the GPU here, out of 42.6M in the run; the limit is transfer size, not the renderer.",
    pick: "your spatial assay resolves single molecules and you do not want to collapse them into cells or spots first." },
  { route: "/upset", name: "Driver co-occurrence (UpSet)", kw: ["upset", "set", "sets", "intersection", "venn", "overlap", "co-occurrence", "cooccurrence", "mutual exclusivity", "exclusive", "combination", "shared", "union"],
    what: "exclusive set intersections as a bar chart over a membership matrix, with per-set totals.",
    capacity: "dozens of sets; the limit is how many intersections are worth showing, not the renderer.",
    pick: "you want to know how several sets overlap and a Venn diagram has run out of room." },
  { route: "/signatures", name: "Mutational signatures (SBS96)", kw: ["signature", "sbs", "sbs96", "mutational signature", "trinucleotide", "context", "apobec", "clock-like", "cosmic", "nmf", "spectrum", "substitution", "kataegis", "deamination"],
    what: "the 96 trinucleotide contexts under the six substitution blocks, for an observed catalogue or a de novo signature.",
    capacity: "96 bars here; the profile component takes a few thousand bins if you need a binned genomic profile.",
    pick: "you have somatic SNVs with sequence context and want to see which mutational processes are at work." },
  { route: "/lollipop", name: "Domain lollipop", kw: ["lollipop", "needle", "domain", "pfam", "interpro", "hotspot", "protein change", "amino acid", "residue", "ptm", "phospho", "variant position", "truncating"],
    what: "mutation stems along a protein over its Pfam domain architecture, with PTM sites underneath.",
    capacity: "thousands of variants per protein; stems and domains are canvas-drawn.",
    pick: "you have variants with amino-acid positions and want to see whether they cluster in a functional domain." },
  { route: "/pae", name: "AlphaFold PAE matrix", kw: ["pae", "predicted aligned error", "alphafold", "confidence", "domain", "orientation", "contact map", "structure quality", "multimer", "rigid body"],
    what: "the residue x residue predicted aligned error matrix from an AlphaFold prediction.",
    capacity: "proteins of a few thousand residues; larger matrices are block-averaged before plotting.",
    pick: "you want to know whether two confident domains are confidently placed relative to each other." },
  { route: "/igv", name: "Genome browser (IGV)", kw: ["genome", "browser", "igv", "locus", "bam", "vcf", "bed", "bigwig", "track", "variant", "mutation position", "coordinate"],
    what: "a live genome browser (igv.js) plus a variant needle/lollipop plot.",
    capacity: "streams indexed tracks (BAM/VCF/bigWig) on demand - effectively unbounded via tiling.",
    pick: "your data is positioned along a genome (variants, coverage, annotations)." },
  { route: "/clustermap", name: "Clustered heatmap", kw: ["clustermap", "cluster", "dendrogram", "hierarchical", "heatmap"],
    what: "an expression heatmap with genes & samples hierarchically clustered + dendrograms.",
    capacity: "tens to a few hundred rows/cols read well; larger still renders (labels auto-hide).",
    pick: "you have a matrix and want to reveal structure by clustering rows and columns." },
  { route: "/volcano", name: "Volcano plot", kw: ["volcano", "differential", "differential expression", "fold change", "logfc", "p-value", "pvalue", "de", "significance"],
    what: "log2 fold-change vs −log10 p, with significant genes labelled.",
    capacity: "tens of thousands of genes (16k here) render instantly.",
    pick: "you have differential-expression results (fold change + p-value per gene)." },
  { route: "/heatmap", name: "Expression heatmap", kw: ["heatmap", "expression", "matrix", "genes by samples", "z-score", "tiles"],
    what: "a gene × sample expression heatmap, optionally z-scored.",
    capacity: "hundreds × hundreds render smoothly on the GPU.",
    pick: "you have a numeric matrix (genes × samples) and want the raw pattern." },
  { route: "/treemap", name: "Mutation treemap", kw: ["treemap", "mutation", "variant", "hierarchy", "proportion", "nested", "part of whole"],
    what: "a nested rectangle hierarchy sized by a value (e.g. mutation recurrence).",
    capacity: "hundreds to low-thousands of leaves.",
    pick: "your data is hierarchical/part-of-whole (gene to variant, category to subcategory)." },
  { route: "/manhattan", name: "Manhattan + QQ (GWAS)", kw: ["manhattan", "gwas", "association", "snp", "genome-wide", "qq", "q-q", "summary statistics", "locus"],
    what: "a genome-wide -log10 p scatter along the genome with a significance line, plus a Q-Q plot.",
    capacity: "tens of thousands to millions of SNPs (50k here).",
    pick: "you have GWAS summary statistics (SNP, position, p-value)." },
  { route: "/eqtl", name: "eQTL / pQTL effect map", kw: ["eqtl", "pqtl", "qtl", "effect size", "beta", "variant gene", "regulatory", "association matrix"],
    what: "a variant x gene/protein effect-size (beta) heatmap, diverging around zero.",
    capacity: "hundreds x hundreds of variant-gene pairs.",
    pick: "you have QTL effect sizes linking variants to genes/proteins." },
  { route: "/atac", name: "scATAC coverage", kw: ["atac", "atac-seq", "accessibility", "chromatin", "coverage", "signac", "peaks", "pseudobulk", "tracks", "single-cell atac"],
    what: "per-cluster pseudobulk accessibility tracks across a locus (Signac CoveragePlot style).",
    capacity: "many clusters x thousands of genomic bins.",
    pick: "you have single-cell ATAC coverage/accessibility to compare across clusters." },
  { route: "/ndarray", name: "N-dimensional array viewer", kw: ["hyperspectral", "microscopy", "zarr", "xarray", "dask", "n-dimensional", "multidimensional", "array", "cube", "image stack", "channel", "spectral", "geoscience", "tensor", "high dimensional"],
    what: "a 2-D slice of a large N-D array (image cube) with a channel slider and a per-pixel spectrum.",
    capacity: "cubes of millions of voxels; slices stream to the GPU instantly.",
    pick: "you have multi-dimensional array data (microscopy hyperspectral, zarr/xarray, imaging stacks)." },
  { route: "/gosling", name: "Gosling genome view", kw: ["gosling", "json spec", "declarative", "genome track", "multi-track", "ideogram", "spec"],
    what: "a declarative JSON-spec genomics view (Gosling): the visualization is described as data.",
    capacity: "spec-driven; scales like a genome browser.",
    pick: "you want reproducible, spec-driven genome tracks rather than plotting code." },
];

type Msg = { role: "user" | "bot"; text: string; recs?: string[]; pending?: boolean };

type Provider = "gemini" | "openai" | "anthropic";
const PROVIDERS: { id: Provider; label: string }[] = [
  { id: "gemini", label: "Google Gemini" },
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
];
interface ChatRequest { id: number; provider: Provider; key: string; model: string; message: string }
interface ChatResponse { id: number; text?: string; error?: string }

const INTRO =
  "Hi! I'm the Plotomics Live guide 🧬 I can explain the app, describe any of the twenty-six visualizations (grouped into five analysis areas), tell you roughly how much each can render, and help you pick one for your dataset. Try a suggestion below, or tell me about your data.";

function findViz(q: string): Viz[] {
  const s = q.toLowerCase();
  const scored = KB.map((v) => ({ v, score: v.kw.reduce((n, k) => n + (s.includes(k) ? 1 : 0), 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((x) => x.v);
}

function answer(q: string): Msg {
  const s = q.toLowerCase().trim();
  if (!s) return { role: "bot", text: INTRO };

  // category / grouping questions
  if (/categor|grouping|analysis area|(?:what|which|list|show|how many).*\bgroup/.test(s)) {
    const lines = GROUPS.map((g) => `• ${g.label}: ${vizByGroup(g.id).map((v) => v.title).join(", ")}`);
    return { role: "bot", text:
      `The visualizations are grouped into five analysis areas:\n${lines.join("\n")}\n\nEach is a dropdown in the top nav, and the home page lays the cards out under the same headers.` };
  }

  // capacity / size questions
  if (/(how many|how large|how big|capacity|maximum|max |scale|points|render|performance|fast|slow)/.test(s)) {
    const hits = findViz(s);
    if (hits.length) {
      const v = hits[0];
      return { role: "bot", text: `${v.name}: ${v.capacity}`, recs: [v.route] };
    }
    return { role: "bot", text:
      "Rough capacities (Shiny React / WebGL engine):\n• UMAP embedding - hundreds of thousands to ~1M points\n• Tahoe cell scatter - ~380k cells here\n• Gene network - up to tens of thousands of edges\n• Hi-C / heatmaps - hundreds×hundreds (up to thousands)\n• Volcano - tens of thousands of genes\n• IGV - streamed/tiled, effectively unbounded\nThe ggplot2 (classic) engine is fine for small/medium data but is static and slows down well before these limits - that contrast is the whole point of the app." };
  }

  // recommendation / decision scoping
  if (/(which|what).*(use|pick|choose|visuali|plot|chart)|recommend|suggest|help me|decide|i have|my data|dataset|should i|best for/.test(s)) {
    const hits = findViz(s);
    if (hits.length) {
      const top = hits.slice(0, 3);
      const lines = top.map((v) => `• ${v.name} - ${v.what} Good when ${v.pick}`);
      return { role: "bot",
        text: `Based on that, I'd look at:\n${lines.join("\n")}\n\nTip: every page has both an interactive Shiny React view and a classic ggplot2 view - flip the toggle to compare.`,
        recs: top.map((v) => v.route) };
    }
    return { role: "bot", text:
      "Tell me a bit about your data and I'll suggest a view:\n• single cells / an embedding → UMAP\n• differential expression → Volcano\n• a numeric matrix → Heatmap or Clustered heatmap\n• relationships between things → Gene network\n• genomic positions → Genome browser\n• a 3-D protein → Protein structure\n• hierarchy / proportions → Treemap\n• a contact/interaction matrix → Hi-C\n• a drug/perturbation screen → Tahoe perturbation" };
  }

  // about / what is this
  if (/(what is|about|who|why|explain the app|purpose|how does this work|engine|ggplot|shiny react|two ways)/.test(s)) {
    return { role: "bot", text:
      "Plotomics Live shows twenty-six common biological visualizations, each rendered two ways: a classic ggplot2 image (server-side R) and an interactive Shiny React (TSX / WebGL) component. The point is to compare the traditional and modern approaches on the same data - the React engine stays interactive on very large datasets (e.g. ~584k cells) where a static plot can't. All datasets are public and referenced on the About page." };
  }

  // specific visualization info
  const hits = findViz(s);
  if (hits.length) {
    const v = hits[0];
    return { role: "bot", text: `${v.name}: ${v.what}\nCapacity: ${v.capacity}\nReach for it when ${v.pick}`, recs: [v.route] };
  }

  return { role: "bot", text:
    "I can help with what this app is, any of the twenty-six visualizations, how much each can render, or which to pick for your data. Try asking e.g. \"I have single-cell data, what should I use?\" or \"how many points can the UMAP show?\"" };
}

const CHIPS = [
  "What is Plotomics Live?",
  "What categories are there?",
  "I have single-cell data - what should I use?",
  "How many points can the UMAP render?",
  "Which view for a protein structure?",
];

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "bot", text: INTRO }]);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Bring-your-own-key settings. The key lives only in this component's state
  // (and, per message, in the server session); it is never persisted.
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = useState<Provider>("gemini");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const hasKey = apiKey.trim().length > 0;

  // Server round-trip: send a request when a key is set, read the reply back.
  // With no key we never call the server (the KB answers locally).
  const [, setChatReq] = useShinyInput<ChatRequest | null>("chat_request", null, { priority: "event" });
  const resp = useShinyOutputValue<ChatResponse | null>("chat_response", null);
  const reqIdRef = useRef(0);
  const pendingIdRef = useRef<number | null>(null);

  useEffect(() => { bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight); }, [msgs, open]);

  // Splice the model's reply (or a friendly error) into the placeholder bubble.
  useEffect(() => {
    if (!resp || resp.id == null || resp.id !== pendingIdRef.current) return;
    pendingIdRef.current = null;
    setMsgs((m) => {
      const next = m.slice();
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].pending) {
          next[i] = resp.error
            ? { role: "bot", text: "⚠ " + resp.error }
            : { role: "bot", text: resp.text || "(no reply)" };
          break;
        }
      }
      return next;
    });
  }, [resp]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setInput("");
    if (hasKey) {
      // Real LLM: show a thinking placeholder, hand the turn to the server.
      const id = ++reqIdRef.current;
      pendingIdRef.current = id;
      setMsgs((m) => [...m, { role: "user", text: q }, { role: "bot", text: "Thinking…", pending: true }]);
      setChatReq({ id, provider, key: apiKey.trim(), model: model.trim(), message: q });
    } else {
      // Offline: answer from the built-in knowledge base.
      setMsgs((m) => [...m, { role: "user", text: q }, answer(q)]);
    }
  };

  return (
    <>
      <button className={"assistant-fab" + (open ? " hidden" : "")} onClick={() => setOpen(true)}
        aria-label="Open the Plotomics Live guide">
        <svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true">
          <circle cx="24" cy="24" r="22" fill="url(#g)" />
          <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0E7175" /><stop offset="1" stopColor="#ED773C" /></linearGradient></defs>
          <circle cx="17" cy="21" r="3.4" fill="#fff" /><circle cx="31" cy="21" r="3.4" fill="#fff" />
          <circle cx="17.8" cy="21.6" r="1.5" fill="#233038" /><circle cx="31.8" cy="21.6" r="1.5" fill="#233038" />
          <path d="M16 30 q8 7 16 0" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      <div className={"assistant-panel" + (open ? " open" : "")} role="dialog" aria-label="Plotomics Live guide">
        <div className="assistant-head">
          <span className="assistant-title">🧬 Plotomics Live guide</span>
          <button className={"assistant-key" + (hasKey ? " on" : "")} onClick={() => setShowKey((s) => !s)}
            aria-label="Model and API key" aria-expanded={showKey}
            title={hasKey ? `Connected: ${provider}` : "Connect a model (bring your own key)"}>
            {hasKey ? "🔑" : "🔓"}
          </button>
          <button className="assistant-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
        </div>
        {showKey && (
          <div className="assistant-settings">
            <label>
              <span>Provider</span>
              <select value={provider} onChange={(e) => setProvider(e.target.value as Provider)}>
                {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </label>
            <label>
              <span>API key</span>
              <input type="password" value={apiKey} autoComplete="off" spellCheck={false}
                onChange={(e) => setApiKey(e.target.value)} placeholder="Paste your key (this session only)" />
            </label>
            <label>
              <span>Model <em>(optional)</em></span>
              <input type="text" value={model} autoComplete="off" spellCheck={false}
                onChange={(e) => setModel(e.target.value)} placeholder="leave blank for the default" />
            </label>
            <p className="assistant-note">
              {hasKey
                ? "Connected. Your key stays in this browser session and is never stored."
                : "With no key I answer from a built-in guide. Add a key to chat with a live model. Advice only - I never change the app."}
            </p>
            {hasKey && (
              <button className="assistant-forget" onClick={() => { setApiKey(""); setModel(""); }}>
                Forget key
              </button>
            )}
          </div>
        )}

        <div className="assistant-body" ref={bodyRef}>
          {msgs.map((m, i) => (
            <div key={i} className={"bubble " + m.role + (m.pending ? " pending" : "")}>
              {m.text.split("\n").map((line, j) => <div key={j}>{line || " "}</div>)}
              {m.recs && m.recs.length > 0 && (
                <div className="bubble-recs">
                  {m.recs.map((r) => {
                    const v = KB.find((x) => x.route === r)!;
                    return <Link key={r} to={r} className="rec-link" onClick={() => setOpen(false)}>Open {v.name} →</Link>;
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="assistant-chips">
          {CHIPS.map((c) => <button key={c} onClick={() => send(c)}>{c}</button>)}
        </div>
        <form className="assistant-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={hasKey ? "Ask the model about the app or your data…" : "Ask about the app or your data…"}
            aria-label="Message" />
          <button type="submit" aria-label="Send">Send</button>
        </form>
      </div>
    </>
  );
}
