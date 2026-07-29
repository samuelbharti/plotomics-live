// Centre a pair of coordinate columns on the origin and scale both by one
// factor so the cloud lands in roughly [-TARGET_SPAN/2, TARGET_SPAN/2]. The
// embedding frames a UMAP-scale cloud (span ~30 near the origin) well; tissue
// micrometres (~7500) or PCA scores (~100s) sit far from that and the fitted
// camera zooms out so far that points collapse to a pixel. One divisor keeps
// the aspect ratio honest. Absolute values are not read off these axes (the
// pages hide them or plot arbitrary-unit scores), so the rescale is invisible.
const TARGET_SPAN = 20;

export function fitUnitCoords(
  x: ArrayLike<number>,
  y: ArrayLike<number>,
): { x: Float32Array; y: Float32Array } {
  const n = Math.min(x.length, y.length);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    const xi = x[i], yi = y[i];
    if (xi < minX) minX = xi;
    if (xi > maxX) maxX = xi;
    if (yi < minY) minY = yi;
    if (yi > maxY) maxY = yi;
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const div = Math.max(maxX - minX, maxY - minY) / TARGET_SPAN || 1;
  const outX = new Float32Array(n);
  const outY = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    outX[i] = (x[i] - cx) / div;
    outY[i] = (y[i] - cy) / div;
  }
  return { x: outX, y: outY };
}
