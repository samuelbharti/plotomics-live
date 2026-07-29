import { useEffect, useRef, useState } from "react";
import { HashRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import { useShinyInitialized } from "./lib/shiny";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Assistant } from "./components/Assistant";
import Home, { GROUPS, vizByGroup, type GroupId } from "./pages/Home";
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
import SurvivalPage from "./pages/SurvivalPage";
import DotplotPage from "./pages/DotplotPage";
import UpsetPage from "./pages/UpsetPage";
import ViolinPage from "./pages/ViolinPage";
import PcaPage from "./pages/PcaPage";
import ManhattanPage from "./pages/ManhattanPage";
import EqtlPage from "./pages/EqtlPage";
import AtacPage from "./pages/AtacPage";
import NdArrayPage from "./pages/NdArrayPage";
import GoslingPage from "./pages/GoslingPage";
import AboutPage from "./pages/AboutPage";

function Nav() {
  const location = useLocation();
  // Which category dropdown is open (null = none). One at a time.
  const [open, setOpen] = useState<GroupId | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Close on navigation.
  useEffect(() => { setOpen(null); }, [location.pathname]);

  // Close on outside click or Escape (only while a menu is open).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <nav className="nav" ref={navRef}>
      <NavLink to="/" className="nav__brand">
        <span className="dot" /> Plotomics&nbsp;Live
      </NavLink>
      <div className="nav__links">
        {GROUPS.map((g) => {
          const items = vizByGroup(g.id);
          const groupActive = items.some((v) => v.to === location.pathname);
          const isOpen = open === g.id;
          return (
            <div className="nav__group" key={g.id}
              onMouseEnter={() => setOpen(g.id)}
              onMouseLeave={() => setOpen((cur) => (cur === g.id ? null : cur))}>
              <button type="button"
                className={"nav__link nav__grouptrig" + (groupActive ? " active" : "")}
                aria-haspopup="true" aria-expanded={isOpen}
                onClick={() => setOpen((cur) => (cur === g.id ? null : g.id))}>
                {g.label}<span className="nav__caret" aria-hidden="true">▾</span>
              </button>
              {isOpen && (
                <div className="nav__menu" role="menu">
                  {items.map((v) => (
                    <NavLink key={v.to} to={v.to} role="menuitem"
                      className={({ isActive }) => "nav__menuitem" + (isActive ? " active" : "")}>
                      {v.title}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
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
        <Route path="/survival" element={<SurvivalPage />} />
        <Route path="/dotplot" element={<DotplotPage />} />
        <Route path="/upset" element={<UpsetPage />} />
        <Route path="/violin" element={<ViolinPage />} />
        <Route path="/pca" element={<PcaPage />} />
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
