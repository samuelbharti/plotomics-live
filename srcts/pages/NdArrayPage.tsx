import { useEffect, useMemo, useState } from "react";
import { createHeatmap } from "@plotomics/components/heatmap";
import type { PlotomicsData } from "@plotomics/core";
import { useShinyInput, useShinyOutputValue, useShinyOutputStatus } from "../lib/shiny";
import { PlotomicsView } from "../lib/plotomics";
import { SpectrumCanvas } from "../components/CanvasPlots";
import { THEME } from "../lib/theme";
import { PageShell, EngineToggle, GgplotImage, Skeleton, type Engine } from "../components/ui";

interface Cube { ny: number; nx: number; nch: number; data: Float32Array }

function useCube() {
  const [cube, setCube] = useState<Cube | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meta = await (await fetch("data/ndarray_meta.json")).json();
        const buf = await (await fetch("data/ndarray.f32")).arrayBuffer();
        if (!cancelled) setCube({ ...meta, data: new Float32Array(buf) });
      } catch (e) { if (!cancelled) setError(String(e)); }
    })();
    return () => { cancelled = true; };
  }, []);
  return { cube, error };
}

export default function NdArrayPage() {
  const { cube, error } = useCube();
  const [sliceEngine, setSliceEngine] = useState<Engine>("react");
  const [specEngine, setSpecEngine] = useState<Engine>("react");
  // shared with the server so the ggplot renderings match
  const [channel, setChannel] = useShinyInput<number>("nd_channel", 15);
  const [px, setPx] = useShinyInput<number>("nd_px", 28);
  const [py, setPy] = useShinyInput<number>("nd_py", 30);

  const slicePng = useShinyOutputValue<string | undefined>("nd_slice_png", undefined);
  const slicePngStatus = useShinyOutputStatus("nd_slice_png");
  const specPng = useShinyOutputValue<string | undefined>("nd_spectrum_png", undefined);
  const specPngStatus = useShinyOutputStatus("nd_spectrum_png");

  // 2-D slice for the selected channel (contiguous block of the cube).
  const sliceData = useMemo<PlotomicsData | null>(() => {
    if (!cube) return null;
    const { ny, nx } = cube;
    const ch = Math.max(1, Math.min(cube.nch, channel)) - 1;
    const values = cube.data.subarray(ch * ny * nx, (ch + 1) * ny * nx);
    return { columns: { values }, meta: { nrows: ny, ncols: nx } };
  }, [cube, channel]);

  const spectrum = useMemo<number[] | null>(() => {
    if (!cube) return null;
    const { ny, nx, nch } = cube;
    const x = Math.max(1, Math.min(nx, px)) - 1, y = Math.max(1, Math.min(ny, py)) - 1;
    const out = new Array<number>(nch);
    for (let c = 0; c < nch; c++) out[c] = cube.data[c * ny * nx + y * nx + x];
    return out;
  }, [cube, px, py]);

  const options = useMemo(() => ({ zScore: false, colormap: "ltc", showColorbar: true, theme: THEME }), []);

  const sliceBar = (
    <>
      <EngineToggle engine={sliceEngine} onChange={setSliceEngine} />
      <div className="control">
        <label>Channel: {channel}{cube ? ` / ${cube.nch}` : ""}</label>
        <input type="range" min={1} max={cube?.nch ?? 24} value={channel}
          onChange={(e) => setChannel(Number(e.target.value))} />
      </div>
    </>
  );
  const specBar = (
    <>
      <EngineToggle engine={specEngine} onChange={setSpecEngine} reactLabel="Shiny React (canvas)" />
      <div className="control">
        <label>x: {px}</label>
        <input type="range" min={1} max={cube?.nx ?? 100} value={px} onChange={(e) => setPx(Number(e.target.value))} />
      </div>
      <div className="control">
        <label>y: {py}</label>
        <input type="range" min={1} max={cube?.ny ?? 100} value={py} onChange={(e) => setPy(Number(e.target.value))} />
      </div>
    </>
  );

  return (
    <div>
      <PageShell
        title="N-dimensional array viewer"
        subtitle="A hyperspectral image cube (100 × 100 × 24 channels), the kind of large multi-dimensional array used in microscopy and geoscience (zarr / xarray). The React engine streams the whole cube once and re-slices any channel instantly on the GPU; move the channel slider to scan the spectral axis."
        bar={sliceBar}
      >
        {sliceEngine === "react" ? (
          error ? <Skeleton label={`Error: ${error}`} />
            : sliceData ? <PlotomicsView factory={createHeatmap} data={sliceData} options={options} />
                        : <Skeleton label="Streaming cube…" />
        ) : <GgplotImage uri={slicePng} status={slicePngStatus} />}
      </PageShell>

      <div style={{ marginTop: "1.5rem" }}>
        <PageShell
          title="Per-pixel spectrum"
          subtitle="The intensity profile across all 24 channels at one pixel. Drag the x / y sliders to probe different spatial features - each lights up in a different channel."
          bar={specBar}
        >
          {specEngine === "react" ? (
            spectrum ? <SpectrumCanvas values={spectrum} /> : <Skeleton label="…" />
          ) : <GgplotImage uri={specPng} status={specPngStatus} />}
        </PageShell>
      </div>
    </div>
  );
}
