# LinkedIn Games Solution Overlay (Unofficial)

A browser extension that solves **Zip**, **Queens**, **Tango** and **Mini Sudoku** and shows the answer as an overlay on the game board. Everything runs locally in your browser. The extension never clicks, types or changes the game: it only draws the solution on top of the page.

> ## Legal notice and non-affiliation
> **This is an independent, unofficial, community project. It is not affiliated with, authorized, maintained, sponsored, or endorsed by LinkedIn Corporation, Microsoft Corporation, or any of their affiliates.**
> LinkedIn®, Zip, Queens, Tango and Mini Sudoku, and all related names, logos and game designs, are trademarks or property of their respective owners. They are used here only to describe which games the software works with, and no endorsement or association is implied.
> This repository contains no LinkedIn code, assets or data.
> Using automated aids on a website may violate that website's terms of service, and your account could be affected. You are solely responsible for how you use this software. See [DISCLAIMER.md](DISCLAIMER.md).

## Supported games

| Game | What the overlay shows |
|---|---|
| **Zip** | The full path through the grid, with start, end and step numbers |
| **Queens** | A crown on each cell where a queen belongs |
| **Tango** | A sun or moon in every empty cell |
| **Mini Sudoku** | The missing digits |

All four solvers are exact. They find a valid solution in milliseconds and are covered by automated tests (see [Testing](#testing)).

## Installation

Works on Chrome, Brave, Edge and other Chromium browsers.

### Option A: download a release (easiest)
1. Open the [Releases](https://github.com/UTKARSH-RAJ-1/linkedin-zip-solver/releases) page and download `linkedin-games-overlay-v1.2.0.zip`.
2. Extract it. You should see `manifest.json` and a `src` folder directly inside.
3. Open `chrome://extensions` (or `brave://extensions`, `edge://extensions`).
4. Turn on **Developer mode**.
5. Click **Load unpacked** and select the extracted folder, the one that **directly contains `manifest.json`**.

### Option B: clone the repository
```bash
git clone https://github.com/UTKARSH-RAJ-1/linkedin-zip-solver.git
```
Then follow steps 3–5 above, selecting the cloned folder.

### Updating from an earlier version
Extract the new version over the old folder (or load the new folder), then click the reload icon on the extension's card in `chrome://extensions` and refresh the game page.

## Usage

1. Open one of the supported games and start the puzzle.
2. A small panel appears at the bottom-right showing which game was detected.
3. Press **Solve**. The solution is drawn over the board.
4. **Hide / Show** toggles the overlay, **Clear** removes it, **Debug** copies diagnostic information to the clipboard (useful for bug reports).

When a new puzzle loads, press **Solve** again.

## How it works

1. **Detection:** the extension recognises the game from the page URL and markup, then finds the board's cells and maps them to rows and columns from their on-screen positions.
2. **Reading:** it reads the clues from the page: numbers and walls (Zip), colour regions (Queens), symbols and `=` / `×` markers (Tango), digits (Mini Sudoku).
3. **Solving:** each game has its own solver, shown below.
4. **Drawing:** an SVG layer is placed above the page, outside the game's own elements, and follows scrolling and resizing.

| Game | Approach |
|---|---|
| Zip | Depth-first search for a Hamiltonian path, pruned by connectivity, distance to the next number and number ordering |
| Queens | Row-by-row backtracking over columns and colour regions, rejecting touching queens |
| Tango | Backtracking with line-count, no-three-in-a-row and `=` / `×` checks |
| Mini Sudoku | Backtracking with bitmask candidates and fewest-candidates-first cell choice |

## Project structure

```
.
├── manifest.json        # Manifest V3 configuration
├── src/
│   ├── common.js        # board detection, grid mapping, overlay layer
│   ├── zip.js           # Zip reader, solver, renderer
│   ├── queens.js        # Queens reader, solver, renderer
│   ├── tango.js         # Tango reader, solver, renderer
│   ├── sudoku.js        # Mini Sudoku reader, solver, renderer
│   └── main.js          # game detection and control panel
├── tests/
│   └── solvers.test.js  # solver tests (Node, no browser needed)
├── README.md
├── DISCLAIMER.md
├── PRIVACY.md
├── CHANGELOG.md
└── LICENSE
```

## Testing

The solvers are plain functions and can be tested without a browser:

```bash
node tests/solvers.test.js
```

The tests generate boards for all four games (including walls, clues and partially filled grids), solve them and check every rule on the result.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Manifest file is missing or unreadable" | You selected the wrong folder. Pick the one that directly contains `manifest.json`. |
| No panel appears | Refresh the game page after installing. Make sure the puzzle has started and the extension is enabled. |
| "Board not found" or "Could not tell which game this is" | The site's markup may have changed. Press **Debug** and open an issue. |
| "No solution found" | Something was misread (colours, symbols, walls). Press **Debug** and open an issue. For Mini Sudoku, clear any wrong digits you typed first. |
| Overlay misaligned | Scroll or resize the window once. Avoid changing browser zoom after solving. |

## Known limitations

- The extension depends on the page's structure. LinkedIn can change it at any time, which may break detection until the code is updated.
- The page-reading code for Queens, Tango and Mini Sudoku has been written from the games' public behaviour and generic detection rules. If a game is not read correctly on your machine, the **Debug** output makes it straightforward to fix.
- It shows the solution only. It does not play the game for you.
- Zip, Queens, Tango and Mini Sudoku only. Wend, Patches, Crossclimb and Pinpoint are not supported.

## Contributing

Issues and pull requests are welcome. For detection problems, please include:

- your browser and version,
- the game and the extension version,
- the text copied by the **Debug** button,
- the console output (F12), looking for `[LinkedIn Games Overlay]`.

To work on the code, edit the files in `src/`, click the reload icon on the extension card in `chrome://extensions`, and refresh the game page. Run `node tests/solvers.test.js` before opening a pull request.

## Responsible use

These games have streaks and leaderboards that assume you solve the puzzles yourself. This project exists to explore constraint solving and browser extension development. Please do not use it to misrepresent your results to others, and respect the terms of the website you use it on.

## For rights holders

If you represent LinkedIn or another rights holder and have a concern about this repository, please open an issue or contact the maintainer through GitHub, and it will be addressed promptly.

## Privacy

The extension runs entirely in your browser. It collects nothing and makes no network requests. See [PRIVACY.md](PRIVACY.md).

## License

Released under the [MIT License](LICENSE). The license covers this repository's code only and grants no rights to any third-party trademarks, games or content.
