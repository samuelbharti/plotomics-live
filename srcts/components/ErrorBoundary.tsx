import { Component, type ReactNode } from "react";

// Keeps a single failing visualization (e.g. a WebGL context that can't be
// created) from blanking the whole single-page app. Reset by giving it a `key`
// that changes on navigation.
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="note">
          <b>This visualization failed to render.</b>
          <pre>{String(this.state.error?.message ?? this.state.error)}</pre>
          <p>
            If this mentions WebGL / <code>getExtension</code>, the browser or GPU
            context has no WebGL - the GPU-backed views (volcano, UMAP, heatmap,
            protein) need it. Try a hardware-accelerated browser.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
