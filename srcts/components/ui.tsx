// Small shared presentational components (no data logic).
import { useEffect, useRef, useState, type ReactNode } from "react";

export type Engine = "react" | "ggplot";

function FullscreenButton({ target }: { target: React.RefObject<HTMLDivElement | null> }) {
  const [fs, setFs] = useState(false);
  useEffect(() => {
    const on = () => setFs(document.fullscreenElement === target.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, [target]);
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else target.current?.requestFullscreen?.();
  };
  return (
    <button className="fsbtn" onClick={toggle} title={fs ? "Exit full screen" : "Full screen"}
      aria-label={fs ? "Exit full screen" : "Full screen"}>
      {fs ? "⤢ Exit" : "⤢ Full screen"}
    </button>
  );
}

export function PageShell(props: {
  title: string;
  subtitle?: ReactNode;
  bar?: ReactNode;
  stats?: ReactNode;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  return (
    <div>
      <div className="page__head">
        <div>
          <h2 className="page__title">{props.title}</h2>
          {props.subtitle && <p className="page__sub">{props.subtitle}</p>}
        </div>
      </div>
      <div className="panel" ref={panelRef}>
        <div className="panel__bar">
          {props.bar}
          <div className="spacer" />
          <FullscreenButton target={panelRef} />
        </div>
        <div className="panel__viz">{props.children}</div>
        {props.stats && <div className="statbar">{props.stats}</div>}
      </div>
    </div>
  );
}

export function EngineToggle(props: {
  engine: Engine;
  onChange: (e: Engine) => void;
  reactLabel?: string;
  ggplotLabel?: string;
  ggplotDisabled?: boolean;
}) {
  return (
    <div className="toggle" role="group" aria-label="Rendering engine">
      <button
        className={props.engine === "react" ? "active" : ""}
        onClick={() => props.onChange("react")}
      >
        {props.reactLabel ?? "Shiny React"}
      </button>
      <button
        className={props.engine === "ggplot" ? "active" : ""}
        disabled={props.ggplotDisabled}
        onClick={() => !props.ggplotDisabled && props.onChange("ggplot")}
      >
        {props.ggplotLabel ?? "ggplot2 (classic)"}
      </button>
    </div>
  );
}

export function Skeleton({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="skeleton">
      <div style={{ display: "grid", placeItems: "center", gap: "0.75rem" }}>
        <div className="spinner" />
        <span>{label}</span>
      </div>
    </div>
  );
}

// A server-rendered ggplot2 PNG (base64 data-URI). Keeps the populated <img>
// mounted while a recompute is in flight (dim it instead of unmounting) so the
// classic view doesn't flash on every control change.
export function GgplotImage({ uri, status }: { uri?: string; status: string }) {
  if (!uri) return <Skeleton label="Rendering ggplot2…" />;
  return (
    <div className="gg-wrap">
      <img
        src={uri}
        alt="ggplot2 rendering"
        className={status === "recalculating" ? "recalculating" : ""}
      />
    </div>
  );
}

export function Legend({ levels, colors, title }: { levels: string[]; colors: string[]; title?: string }) {
  return (
    <div className="legend">
      {title && <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>}
      {levels.map((lv, i) => (
        <div className="legend__row" key={lv + i}>
          <span className="legend__sw" style={{ background: colors[i % colors.length] }} />
          <span className="legend__label" title={lv}>{lv}</span>
        </div>
      ))}
    </div>
  );
}
