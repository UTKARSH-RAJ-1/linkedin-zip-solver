# Zip Puzzle Solution Overlay

A small browser extension that solves the **Zip** puzzle and draws the solution as a transparent overlay on top of the board. It does not click, drag or change the game in any way. It only shows you the path.

> **Disclaimer:** This is an independent, unofficial project. It is not affiliated with, endorsed by, or sponsored by LinkedIn or Microsoft. "LinkedIn" and "Zip" belong to their respective owners. Using tools like this on a website may conflict with that site's terms of service. You are responsible for how you use it. See [Responsible use](#responsible-use).

## Features

- Detects the Zip board automatically and reads the grid, numbered cells and walls
- Solves the puzzle in milliseconds (6×6 and 7×7 boards)
- Draws the path on a separate overlay layer: green = start, red = end, small numbers = step order
- Hide / Show and Clear controls
- Overlay follows the board on scroll and resize
- No data collection, no network requests, no special permissions

## How it works

Zip is a constrained Hamiltonian path problem. The path must:

1. start at cell `1` and visit the numbered cells in order,
2. visit **every** cell exactly once,
3. end on the highest number,
4. never cross a wall.

The solver (`solve()` in `content.js`) uses depth-first search with backtracking and three pruning rules:

- **Connectivity:** after each move, all unvisited cells must still be reachable.
- **Distance:** the Manhattan distance to the next number must not exceed the cells left to visit.
- **Ordering:** a numbered cell can only be entered when it is the next number, and the final number's cell can only be entered last.

Board reading (`findCells()`, `readBoard()`) tries LinkedIn's own cell markup first and falls back to detecting any square grid of equally sized elements.

## Installation

Works on Chrome, Brave, Edge and other Chromium browsers.

1. Download this repository (**Code → Download ZIP**) and extract it, or clone it:
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   ```
2. Open `chrome://extensions` (or `brave://extensions`, `edge://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the folder that **directly contains `manifest.json`**.

## Usage

1. Open the Zip game page.
2. Refresh the page after installing the extension.
3. Press **Solve** in the panel at the bottom-right.
4. Use **Hide / Show** to toggle the overlay, **Clear** to remove it.

When the daily puzzle changes, press **Solve** again.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Manifest file is missing or unreadable" | You selected the wrong folder. Pick the one that directly contains `manifest.json`. |
| No panel appears | Refresh the game page. Check the extension is enabled and the page URL is on `linkedin.com`. |
| "Zip board not found" | The site markup may have changed. See [Contributing](#contributing). |
| "No solution found" | Numbers or walls were probably misread. Open the console (F12) and look for `[Zip overlay]` messages. |
| Overlay misaligned | Resize or scroll once; avoid browser zoom changes mid-solve. |

## Project structure

```
.
├── manifest.json   # Manifest V3 configuration
├── content.js      # Board detection, solver, overlay and UI panel
├── README.md
├── PRIVACY.md
└── LICENSE
```

## Known limitations

- Relies on the page's DOM. If the site changes class names or structure, detection may fail.
- Wall detection looks for elements whose class contains `wall` plus a direction (`left`, `right`, `top`, `bottom`, `up`, `down`).
- Shows the solution only; it does not play the game for you.

## Contributing

Issues and pull requests are welcome.

If detection breaks, the most useful bug report includes:

- the browser and version,
- the console output,
- the HTML of one numbered cell and one cell with a wall (DevTools → right-click → Copy → Copy outerHTML).

To work on the code, edit `content.js`, then click the reload icon on the extension card in `chrome://extensions` and refresh the game page.

## Responsible use

The game has streaks and leaderboards that assume you solve puzzles yourself. This project is meant for learning about constraint solving and browser extensions. Please do not use it to misrepresent your results to others, and check the website's terms before using it on your account.

## Privacy

The extension runs entirely in your browser and sends nothing anywhere. See [PRIVACY.md](PRIVACY.md).

## License

[MIT](LICENSE)
