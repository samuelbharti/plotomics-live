import { HashRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import { useShinyInitialized } from "./lib/shiny";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Assistant } from "./components/Assistant";
import Home, { VIZ } from "./pages/Home";
import VolcanoPage from "./pages/VolcanoPage";
import UmapPage from "./pages/UmapPage";
import HeatmapPage from "./pages/HeatmapPage";
import TreemapPage from "./pages/TreemapPage";
import ClustermapPage from "./pages/ClustermapPage";
import HicPage from "./pages/HicPage";
import TahoePage from "./pages/TahoePage";
import NetworkPage from "./pages/NetworkPage";
import IgvPage from "./pages/IgvPage";
import ProteinPage from "./pages/ProteinPage";
import PaePage from "./pages/PaePage";
import OncoplotPage from "./pages/OncoplotPage";
import LollipopPage from "./pages/LollipopPage";
import SignaturesPage from "./pages/SignaturesPage";
import VisiumPage from "./pages/VisiumPage";
import XeniumPage from "./pages/XeniumPage";
import ManhattanPage from "./pages/ManhattanPage";
import EqtlPage from "./pages/EqtlPage";
import AtacPage from "./pages/AtacPage";
import NdArrayPage from "./pages/NdArrayPage";
import GoslingPage from "./pages/GoslingPage";
import AboutPage from "./pages/AboutPage";

function Nav() {
  return (
    <nav className="nav">
      <NavLink to="/" className="nav__brand">
        <span className="dot" /> Plotomics&nbsp;Live
      </NavLink>
      <div className="nav__links">
        {VIZ.map((v) => (
          <NavLink key={v.to} to={v.to}
            className={({ isActive }) => "nav__link" + (isActive ? " active" : "")}>
            {v.title.split(" ")[0]}
          </NavLink>
        ))}
        <NavLink to="/about"
          className={({ isActive }) => "nav__link" + (isActive ? " active" : "")}>
          About
        </NavLink>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <span>© {new Date().getFullYear()} <b>Posit, PBC</b> · Released under the <a
        href="https://opensource.org/licenses/MIT" target="_blank" rel="noreferrer">MIT License</a></span>
      <span className="footer__sep">·</span>
      <span>Authored by <b>Samuel Bharti</b></span>
      <span className="footer__sep">·</span>
      <span>Built with <a href="https://github.com/posit-dev/shinyreact" target="_blank" rel="noreferrer">shinyreact</a> + plotomics</span>
    </footer>
  );
}

function Shell() {
  const initialized = useShinyInitialized();
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="skeleton" style={{ height: "60vh" }}>
        <div style={{ display: "grid", placeItems: "center", gap: "0.75rem" }}>
          <div className="spinner" />
          <span>Connecting to Shiny…</span>
        </div>
      </div>
    );
  }
  // Reset the boundary on navigation so a crash on one page doesn't stick.
  return (
    <ErrorBoundary key={location.pathname}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/volcano" element={<VolcanoPage />} />
        <Route path="/umap" element={<UmapPage />} />
        <Route path="/heatmap" element={<HeatmapPage />} />
        <Route path="/clustermap" element={<ClustermapPage />} />
        <Route path="/treemap" element={<TreemapPage />} />
        <Route path="/hic" element={<HicPage />} />
        <Route path="/tahoe" element={<TahoePage />} />
        <Route path="/network" element={<NetworkPage />} />
        <Route path="/igv" element={<IgvPage />} />
        <Route path="/protein" element={<ProteinPage />} />
        <Route path="/pae" element={<PaePage />} />
        <Route path="/oncoplot" element={<OncoplotPage />} />
        <Route path="/lollipop" element={<LollipopPage />} />
        <Route path="/signatures" element={<SignaturesPage />} />
        <Route path="/visium" element={<VisiumPage />} />
        <Route path="/xenium" element={<XeniumPage />} />
        <Route path="/manhattan" element={<ManhattanPage />} />
        <Route path="/eqtl" element={<EqtlPage />} />
        <Route path="/atac" element={<AtacPage />} />
        <Route path="/ndarray" element={<NdArrayPage />} />
        <Route path="/gosling" element={<GoslingPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <HashRouter>
      <div className="app">
        <Nav />
        <main className="main"><Shell /></main>
        <Footer />
        <Assistant />
      </div>
    </HashRouter>
  );
}
