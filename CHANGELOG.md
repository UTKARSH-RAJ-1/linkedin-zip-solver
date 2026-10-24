# Changelog

## 1.2.0 — 2026-10-24
### Added
- **Queens** solver with crown overlay
- **Tango** solver with sun and moon overlay, including `=` and `×` clues
- **Mini Sudoku** solver (6×6 with 2×3 boxes; 4×4 and 9×9 also handled) with digit overlay
- Automatic game detection from the page URL and markup
- **Debug** button that copies diagnostic information for bug reports
- Automated solver tests (`node tests/solvers.test.js`)
- `DISCLAIMER.md` and an expanded non-affiliation notice

### Changed
- Code split into modules under `src/` (one file per game)
- Renamed to "LinkedIn Games Solution Overlay (Unofficial)"
- README rewritten; clone URL fixed

## 1.0.0 — 2026-10-24
- Initial release: Zip solver with path overlay
