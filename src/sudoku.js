/* Mini Sudoku: 6x6 with 2x3 boxes (4x4 and 9x9 also supported). */
(() => {
  const LGS = window.LGS;
  const BOXES = { 4: [2, 2], 6: [2, 3], 9: [3, 3] };
  const pop = (m) => { let c = 0; while (m) { m &= m - 1; c++; } return c; };

  /** vals: 0 = empty. Returns solved array or null. */
  function solveSudoku(n, br, bc, vals) {
    const g = vals.slice(), full = (1 << n) - 1;
    const row = new Array(n).fill(0), col = new Array(n).fill(0), box = new Array(n).fill(0);
    const boxOf = (r, c) => Math.floor(r / br) * (n / bc) + Math.floor(c / bc);
    for (let i = 0; i < n * n; i++) {
      if (!g[i]) continue;
      const r = Math.floor(i / n), c = i % n, b = boxOf(r, c), bit = 1 << (g[i] - 1);
      if ((row[r] | col[c] | box[b]) & bit) return null;
      row[r] |= bit; col[c] |= bit; box[b] |= bit;
    }
    function dfs() {
      let best = -1, bestMask = 0, bestCnt = 99;
      for (let i = 0; i < n * n; i++) {
        if (g[i]) continue;
        const r = Math.floor(i / n), c = i % n;
        const mask = full & ~(row[r] | col[c] | box[boxOf(r, c)]);
        const cnt = pop(mask);
        if (cnt === 0) return false;
        if (cnt < bestCnt) { best = i; bestMask = mask; bestCnt = cnt; }
      }
      if (best < 0) return true;
      const r = Math.floor(best / n), c = best % n, b = boxOf(r, c);
      for (let d = 0; d < n; d++) {
        const bit = 1 << d;
        if (!(bestMask & bit)) continue;
        g[best] = d + 1; row[r] |= bit; col[c] |= bit; box[b] |= bit;
        if (dfs()) return true;
        g[best] = 0; row[r] &= ~bit; col[c] &= ~bit; box[b] &= ~bit;
      }
      return false;
    }
    return dfs() ? g : null;
  }
  LGS.solvers.sudoku = solveSudoku;
  LGS.solvers.sudokuBoxes = BOXES;

  LGS.games.sudoku = {
    id: 'sudoku',
    name: 'Mini Sudoku',
    solve(board) {
      const { grid, R, C } = board;
      if (R !== C || !BOXES[R]) throw new Error('Unexpected Sudoku board size.');
      const [br, bc] = BOXES[R];
      const current = grid.map((c) => {
        const t = (c.el.innerText || c.el.textContent || '').trim();
        return /^[1-9]$/.test(t) ? parseInt(t, 10) : 0;
      });
      const flagged = grid.map((c) => /prefill|given|locked|readonly/i.test(LGS.cls(c.el)));
      const givens = flagged.some(Boolean) ? current.map((v, i) => (flagged[i] ? v : 0)) : current;
      const sol = solveSudoku(R, br, bc, givens);
      if (!sol) throw new Error('No solution found. Clear any wrong digits you typed and try again.');
      return {
        summary: `${R}×${R} · ${givens.filter(Boolean).length} given`,
        render(svg) {
          sol.forEach((d, i) => {
            if (current[i] === d) return;
            const b = LGS.box(grid[i]), s = b.w;
            svg.appendChild(LGS.mk('rect', {
              x: b.x - s * 0.4, y: b.y - s * 0.4, width: s * 0.8, height: s * 0.8, rx: s * 0.12,
              fill: '#fff', 'fill-opacity': '0.8'
            }));
            const t = LGS.mk('text', {
              x: b.x, y: b.y + s * 0.18, 'font-size': s * 0.5, 'font-family': 'sans-serif',
              'font-weight': '700', fill: '#0a66c2', 'text-anchor': 'middle'
            });
            t.textContent = d;
            svg.appendChild(t);
          });
        }
      };
    }
  };
})();
