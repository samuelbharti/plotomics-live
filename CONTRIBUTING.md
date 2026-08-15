# Contributing

Thanks for looking. This is a solo project, so please open an issue before you
start on anything large. That way I can tell you early whether I want it, and
you do not waste the work. Small fixes are welcome as a pull request straight
away.

Please also read the [Code of Conduct](CODE_OF_CONDUCT.md).

## Setup

```bash
npm install
npm run build                          # -> www/app.js
R -e "shiny::runApp('.', port = 8000)"  # then open http://127.0.0.1:8000
```

The datasets are bundled, so the app runs offline.

## Where code goes

- `R/` for the server-side, Shiny-free logic: `data.R`, `plots.R`,
  `palettes.R`, `chat.R`.
- `app.R` stays compute-only, one `reactive_output()` feed per visualization.
- `srcts/` for the frontend: `components/`, `pages/`, `lib/`.
- `data/` for the datasets, and `data/prep/` for the scripts that build them.

Every dataset must be public, and its license and source must be listed in
`data/prep/PROVENANCE.md`. Read that file before you add one. Never commit a
raw download to `data/raw/`; it is git-ignored on purpose.

## Before you open a pull request

Branch from `main` and open the pull request against `main`. Then check that
all of this passes:

```bash
npx tsc          # no type errors
npm run build    # and commit www/app.js, so the build matches the source
```

The app should still run. If a dataset changed, update
`data/prep/PROVENANCE.md`. If an R dependency changed, regenerate
`manifest.json`; the README's Deployment section says how. If behavior changed,
update the README too.

On every push and pull request, `CI` runs the TypeScript type-check, the
frontend build, an R syntax check, and the Markdown lint, and `Secret scan`
runs gitleaks over the full history.
