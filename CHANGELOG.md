# Changelog

All notable changes to this project are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and version
numbers follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.2] - 2026-09-10

### Added

- A demo clip at `assets/demo.mp4`, for the Demo button in the bioinformatics
  gallery. `assets` is in `.rscignore`, so the clip stays out of the manifest
  and out of a deployment.

### Changed

- The chat guide's floating button now shows a small robot icon instead of a
  face-like one.
- The chat guide now opens as a sidebar that shrinks the page next to it,
  instead of a panel that covers it.
- Simplified the author line in the README.
- Reworded the enforcement line in the Code of Conduct.
- Added Posit Software, PBC to the copyright notice, next to the author.

### Fixed

- `shinyreact` now requires `index.html` to be a full HTML document with a
  placeholder meta tag. Updated the file and refreshed `manifest.json` to
  match (posit-dev/shinyreact#269).

## [0.1.1] - 2026-08-15

### Fixed

- `manifest.json` recorded `htmltools` as a personal fork
  (`samuelbharti/htmltools`, version 0.5.9.9000) instead of the CRAN release.
  That was a stray `renv::snapshot()` result, not a deliberate choice. It now
  records CRAN htmltools 0.5.9, like every other package in the manifest.
  `shinyreact` only uses `HTML()`, `htmlDependency()`, `tagList()` and `tags`,
  all of which the CRAN release exports.

### Changed

- Shortened the Code of Conduct and rewrote the contributing guide.
- Added a security policy and a plain-text citation file.
- `LICENSE` is now plain MIT so GitHub detects it; the dataset terms moved to
  `DATA-LICENSES.md`, unchanged.
- Swapped the Zenodo DOI badge for a shields.io badge, which GitHub can proxy.

## [0.1.0] - 2026-08-14

### Added

- 26 visualization pages across five categories (expression, genomics,
  large-data, protein, n-dimensional array), each shown two ways: a classic
  ggplot2 image and an interactive React/WebGL view.
- A bring-your-own-key chat assistant (ellmer backend) that answers questions
  about the visualizations.
- Posit Connect / Connect Cloud deployment support (`manifest.json`,
  `.rscignore`).
- CI workflow (type-check, frontend build, R syntax check, Markdown lint) and
  a gitleaks secret-scan workflow.

### Changed

- Migrated the frontend to depend on the published `plotomics` npm package
  instead of local copies.

### Fixed

- Kept an equal aspect ratio on the PCA and Xenium embedding views.
- Corrected the footer copyright holder to match the LICENSE.

### Security

- Bumped `nanoid` (pulled in via `vite` -> `postcss`) to 3.3.18, fixing a
  high-severity advisory where the ID generator could loop indefinitely.
