// Light, organic theme for the plotomics WebGL/SVG components, derived from the
// LTC color palettes (loukesio/ltc-color-palettes). Matches the CSS custom
// properties in www/app.css so canvases blend into the warm-paper surface.

// Organic categorical palette (LTC seafarer / trio / minou / casa_natal hues),
// ordered so the leading colours contrast strongly.
export const CATEGORICAL = [
  "#0E7175", "#ED773C", "#708C69", "#C63F3E", "#808BC5", "#E4A25B",
  "#245E55", "#9E3F71", "#56B4E9", "#EAC119", "#5B5F8D", "#9BB29E",
  "#013D5A", "#DA6B51", "#66A182", "#EAA7C7", "#89973D", "#9298BA",
];

export const THEME = {
  background: "#FFFFFF",
  foreground: "#233038",
  muted: "#6E7B72",
  grid: "#E6DCC8",
  axis: "#8A9384",
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', ui-serif, Georgia, system-ui, sans-serif",
  fontSize: 12,
  categorical: CATEGORICAL,
};
