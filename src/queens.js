/* Queens: one queen per row, column and colour region; no two queens touching. */
(() => {
  const LGS = window.LGS;

  /** regions: array of region ids (length n*n). Returns array of cell indices, one per row. */
  function solveQueens(n, regions) {
    const ids = [...new Set(regions)];
    if (ids.length !== n) throw new Error(`Found ${ids.length} colour regions, expected ${n}.`);
    const rid = regions.map((r) => ids.indexOf(r));
    const colUsed = new Uint8Array(n), regUsed = new Uint8Array(n);
    const cols = [];
    function dfs(r) {
      if (r === n) return true;
      for (let c = 0; c < n; c++) {
        if (colUsed[c]) continue;
        const g = rid[r * n + c];
        if (regUsed[g]) continue;
        if (r > 0 && Math.abs(c - cols[r - 1]) <= 1) continue;
        colUsed[c] = 1; regUsed[g] = 1; cols.push(c);
        if (dfs(r + 1)) return true;
        colUsed[c] = 0; regUsed[g] = 0; cols.pop();
      }
      return false;
    }
    if (!dfs(0)) throw new Error('No solution found (colour regions may have been misread).');
    return cols.map((c, r) => r * n + c);
  }
  LGS.solvers.queens = solveQueens;

  function bg(el) {
    for (const n of [el, ...el.querySelectorAll('*')]) {
      const c = getComputedStyle(n).backgroundColor;
      if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c;
    }
    return 'none';
  }

  function readRegions(grid, n) {
    // 1) colour index in class names (e.g. "cell-color-3")
    const byClass = grid.map((c) => {
      for (const node of [c.el, ...c.el.querySelectorAll('*')]) {
        const m = LGS.cls(node).match(/cell-color-(\d+)/i);
        if (m) return m[1];
      }
      return null;
    });
    if (byClass.every((v) => v !== null) && new Set(byClass).size === n) return byClass;
    // 2) computed background colour
    return grid.map((c) => bg(c.el));
  }

  LGS.games.queens = {
    id: 'queens',
    name: 'Queens',
    solve(board) {
      const { grid, R, C } = board;
      if (R !== C) throw new Error('Queens board is not square.');
      const regions = readRegions(grid, R);
      const cells = solveQueens(R, regions);
      return {
        summary: `${R}×${R} · ${R} regions`,
        render(svg) {
          for (const i of cells) {
            const b = LGS.box(grid[i]);
            const s = b.w;
            svg.appendChild(LGS.mk('circle', { cx: b.x, cy: b.y, r: s * 0.36, fill: '#fff', 'fill-opacity': '0.6', stroke: '#16a34a', 'stroke-width': s * 0.05 }));
            const pts = [[-.26, .17], [-.30, -.14], [-.13, .02], [0, -.2], [.13, .02], [.30, -.14], [.26, .17]]
              .map(([dx, dy]) => `${b.x + dx * s},${b.y + dy * s}`).join(' ');
            svg.appendChild(LGS.mk('polygon', { points: pts, fill: '#facc15', stroke: '#111', 'stroke-width': s * 0.035, 'stroke-linejoin': 'round' }));
          }
        }
      };
    }
  };
})();
