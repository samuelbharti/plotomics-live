// Lightweight canvas-2D scatter renderers for the GWAS plots. Canvas 2D draws
// 50k points comfortably and gives us full control over the chromosome axis a
// Manhattan plot needs (which the generic embedding can't label). Colours match
// the light LTC theme.
import { useEffect, useRef } from "react";

const TEAL = "#0E7175", SAGE = "#9BB29E", RED = "#C63F3E";
const INK = "#233038", MUTED = "#6E7B72", GRID = "#E6DCC8";

function useCanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const parent = cv.parentElement!;
    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth, h = parent.clientHeight;
      if (w === 0 || h === 0) return;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      cv.style.width = w + "px"; cv.style.height = h + "px";
      const ctx = cv.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      draw(ctx, w, h);
    };
    render();
    const ro = new ResizeObserver(render); ro.observe(parent);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

export interface ManhattanData { columns: { x: number[]; y: number[]; chr: number[] };
  meta: { chrCentres: number[]; genomeLen: number; sig: number; n: number } }

export function ManhattanCanvas({ data }: { data: ManhattanData }) {
  const ref = useCanvas((ctx, w, h) => {
    const { x, y, chr } = data.columns;
    const { chrCentres, genomeLen, sig } = data.meta;
    const mL = 46, mR = 12, mT = 12, mB = 26;
    const iw = w - mL - mR, ih = h - mT - mB;
    const maxY = Math.max(sig + 1, Math.max(...y)) * 1.05;
    const px = (v: number) => mL + (v / genomeLen) * iw;
    const py = (v: number) => mT + (1 - v / maxY) * ih;
    // y grid + ticks
    ctx.strokeStyle = GRID; ctx.fillStyle = MUTED; ctx.font = "10px system-ui"; ctx.lineWidth = 1;
    for (let t = 0; t <= maxY; t += Math.ceil(maxY / 6)) {
      ctx.beginPath(); ctx.moveTo(mL, py(t)); ctx.lineTo(w - mR, py(t)); ctx.stroke();
      ctx.fillText(String(t), 6, py(t) + 3);
    }
    // points
    for (let i = 0; i < x.length; i++) {
      ctx.fillStyle = chr[i] % 2 ? TEAL : SAGE;
      ctx.fillRect(px(x[i]), py(y[i]), 1.6, 1.6);
    }
    // significance line
    ctx.strokeStyle = RED; ctx.setLineDash([5, 4]); ctx.beginPath();
    ctx.moveTo(mL, py(sig)); ctx.lineTo(w - mR, py(sig)); ctx.stroke(); ctx.setLineDash([]);
    // chromosome labels
    ctx.fillStyle = MUTED; ctx.textAlign = "center";
    chrCentres.forEach((c, i) => { if (i % 2 === 0 || iw > 700) ctx.fillText(String(i + 1), px(c), h - 8); });
    ctx.textAlign = "left";
    // axis title
    ctx.fillStyle = INK; ctx.save(); ctx.translate(12, mT + ih / 2); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center"; ctx.fillText("-log10 p", 0, 0); ctx.restore(); ctx.textAlign = "left";
  }, [data]);
  return <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />;
}

const PALETTE = ["#0E7175", "#ED773C", "#708C69", "#C63F3E", "#808BC5", "#E4A25B", "#245E55", "#9E3F71"];

export interface AtacData {
  columns: { signal: number[] };
  meta: { nClusters: number; nBins: number; positions: number[]; clusters: string[]; chrom: string };
}

// Signac-style coverage-by-cluster: one filled area track per cluster.
export function CoverageTracksCanvas({ data }: { data: AtacData }) {
  const ref = useCanvas((ctx, w, h) => {
    const { nClusters, nBins, positions, clusters } = data.meta;
    const sig = data.columns.signal;                 // row-major cluster x bin
    const mL = 96, mR = 12, mT = 8, mB = 22;
    const iw = w - mL - mR, trackH = (h - mT - mB) / nClusters;
    const x0 = positions[0], x1 = positions[nBins - 1];
    const px = (p: number) => mL + ((p - x0) / (x1 - x0)) * iw;
    for (let c = 0; c < nClusters; c++) {
      const top = mT + c * trackH, base = top + trackH - 3;
      ctx.fillStyle = PALETTE[c % PALETTE.length];
      ctx.beginPath(); ctx.moveTo(px(positions[0]), base);
      for (let b = 0; b < nBins; b++) {
        const v = sig[c * nBins + b];
        ctx.lineTo(px(positions[b]), base - v * (trackH - 5));
      }
      ctx.lineTo(px(positions[nBins - 1]), base); ctx.closePath(); ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = INK; ctx.font = "10px system-ui"; ctx.fillText(clusters[c], 6, top + trackH / 2 + 3);
    }
    ctx.fillStyle = MUTED; ctx.font = "10px system-ui"; ctx.textAlign = "center";
    for (let t = 0; t <= 4; t++) {
      const p = x0 + (t / 4) * (x1 - x0);
      ctx.fillText(`${(p / 1e6).toFixed(2)} Mb`, px(p), h - 6);
    }
    ctx.textAlign = "left"; ctx.fillText(data.meta.chrom, mL, h - 6);
  }, [data]);
  return <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />;
}

// A single per-pixel spectrum (intensity across channels).
export function SpectrumCanvas({ values }: { values: number[] | Float32Array }) {
  const ref = useCanvas((ctx, w, h) => {
    const n = values.length, m = 40, iw = w - m - 12, ih = h - m - 12;
    let max = 0; for (let i = 0; i < n; i++) max = Math.max(max, values[i]); max = max || 1;
    const px = (i: number) => m + (i / (n - 1)) * iw;
    const py = (v: number) => 12 + (1 - v / (max * 1.05)) * ih;
    ctx.strokeStyle = GRID; ctx.beginPath(); ctx.moveTo(m, py(0)); ctx.lineTo(w - 12, py(0)); ctx.stroke();
    ctx.strokeStyle = TEAL; ctx.lineWidth = 1.6; ctx.beginPath();
    for (let i = 0; i < n; i++) { const X = px(i), Y = py(values[i]); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
    ctx.stroke();
    ctx.fillStyle = "#ED773C"; for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(px(i), py(values[i]), 2, 0, 6.283); ctx.fill(); }
    ctx.fillStyle = MUTED; ctx.font = "10px system-ui"; ctx.fillText("channel", w / 2 - 20, h - 6);
  }, [values]);
  return <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />;
}

export interface PaeProfileData {
  columns: { values: number[] };
  meta: { residue: number; maxPae: number };
}

// One row of the PAE matrix as a filled area: how confidently the rest of the
// chain is placed relative to the selected residue. Low = same rigid body.
export function PaeProfileCanvas({ data, residues }: { data: PaeProfileData; residues: number }) {
  const ref = useCanvas((ctx, w, h) => {
    const v = data.columns.values;
    const n = v.length;
    const { maxPae } = data.meta;
    const mL = 44, mR = 14, mT = 16, mB = 30;
    const iw = w - mL - mR, ih = h - mT - mB;
    // Bins map back onto residue positions, so the x axis reads in residues.
    const px = (i: number) => mL + (n <= 1 ? 0 : (i / (n - 1)) * iw);
    const py = (val: number) => mT + (1 - val / (maxPae || 1)) * ih;
    ctx.strokeStyle = GRID; ctx.fillStyle = MUTED; ctx.font = "10px system-ui"; ctx.lineWidth = 1;
    for (let t = 0; t <= 4; t++) {
      const val = (t / 4) * maxPae;
      ctx.beginPath(); ctx.moveTo(mL, py(val)); ctx.lineTo(w - mR, py(val)); ctx.stroke();
      ctx.fillText(val.toFixed(0), 8, py(val) + 3);
    }
    ctx.fillStyle = "#8BC8CB"; ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.moveTo(px(0), py(0));
    for (let i = 0; i < n; i++) ctx.lineTo(px(i), py(v[i]));
    ctx.lineTo(px(n - 1), py(0)); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = TEAL; ctx.lineWidth = 1.4; ctx.beginPath();
    for (let i = 0; i < n; i++) { const X = px(i), Y = py(v[i]); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
    ctx.stroke();
    // marker at the residue this row is aligned on
    const mi = residues > 1 ? ((data.meta.residue - 1) / (residues - 1)) * (n - 1) : 0;
    ctx.strokeStyle = RED; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(px(mi), mT); ctx.lineTo(px(mi), mT + ih); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = MUTED; ctx.textAlign = "center";
    for (let t = 0; t <= 4; t++) {
      const r = Math.round(1 + (t / 4) * (residues - 1));
      ctx.fillText(String(r), px((t / 4) * (n - 1)), h - 10);
    }
    ctx.fillText("residue", mL + iw / 2, h - 1);
    ctx.textAlign = "left";
    ctx.fillStyle = INK; ctx.font = "11px system-ui";
    ctx.fillText(`aligned on ${data.meta.residue}`, mL + 6, mT + 12);
  }, [data, residues]);
  return <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />;
}

export interface QqData { columns: { x: number[]; y: number[] }; meta: { lambda: number } }

export function QqCanvas({ data }: { data: QqData }) {
  const ref = useCanvas((ctx, w, h) => {
    const { x, y } = data.columns;
    const m = 42, iw = w - m - 12, ih = h - m - 12;
    const max = Math.max(Math.max(...x), Math.max(...y)) * 1.05;
    const px = (v: number) => m + (v / max) * iw;
    const py = (v: number) => 12 + (1 - v / max) * ih;
    ctx.strokeStyle = "#C9C1B1"; ctx.beginPath(); ctx.moveTo(px(0), py(0)); ctx.lineTo(px(max), py(max)); ctx.stroke();
    ctx.fillStyle = TEAL;
    for (let i = 0; i < x.length; i++) { ctx.beginPath(); ctx.arc(px(x[i]), py(y[i]), 1.5, 0, 6.283); ctx.fill(); }
    ctx.fillStyle = MUTED; ctx.font = "10px system-ui";
    ctx.fillText("expected -log10 p", w / 2 - 40, h - 6);
    ctx.fillStyle = INK; ctx.font = "12px system-ui";
    ctx.fillText(`λ = ${data.meta.lambda}`, w - 70, 22);
  }, [data]);
  return <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />;
}
