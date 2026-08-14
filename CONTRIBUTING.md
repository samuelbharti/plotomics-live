# Contributing Guidelines

## Branching

- Create feature branches from `main`.
- Open pull requests into `main` unless instructed otherwise.

## Local Setup

1. Install the frontend dependencies and build the bundle:

   ```bash
   npm install
   npm run build            # -> www/app.js
   ```

2. Run the app with R 4.x:

   ```bash
   R -e "shiny::runApp('.', port = 8000)"
   ```

## Code Style

- Keep server-side, Shiny-free logic in `R/` (`data.R`, `plots.R`,
  `palettes.R`, `chat.R`); `app.R` stays compute-only, one `reactive_output()`
  feed per visualization.
- Keep the frontend in `srcts/` (`components/`, `pages/`, `lib/`); build with
  `npm run build` before you commit, so `www/app.js` matches the source.
- Type-check the TSX sources with `npx tsc` before you open a pull request.

## Data

- Datasets live in `data/`. Refresh or regenerate them with the scripts in
  `data/prep/`.
- Every dataset must be public, and its license and source must be listed in
  `data/prep/PROVENANCE.md`. See that file before you add a new dataset.
- Never commit a raw download to `data/raw/`; it is gitignored on purpose.

## Continuous Integration

Every push and pull request runs the `CI` workflow
(`.github/workflows/ci.yaml`): a TypeScript type-check, a frontend build, an
R syntax check, and a Markdown lint. A separate `Secret scan` workflow runs
gitleaks against the full history. Make sure these pass locally before you
open a pull request.

## Pull Request Checklist

- [ ] `npm run build` succeeds and the app runs locally.
- [ ] `npx tsc` reports no type errors.
- [ ] New or changed code follows the project structure above.
- [ ] README / docs updated if behavior changed.
- [ ] If a dataset changed, `data/prep/PROVENANCE.md` is updated to match.
