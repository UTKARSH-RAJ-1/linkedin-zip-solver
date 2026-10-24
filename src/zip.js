/* Zip: constrained Hamiltonian path. */
(() => {
  const LGS = window.LGS;

  function solveZip(R, C, nums, blocked, timeoutMs = 8000) {
    const N = R * C;
    if (!nums.size) throw new Error('No numbered cells found.');
    const maxNum = Math.max(...nums.values());
    const pos = {};
    for (const [i, n] of nums) pos[n] = i;
    if (pos[1] === undefined) throw new Error('Cell "1" not found.');

    const key = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
    const adj = Array.from({ length: N }, () => []);
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const i = r * C + c;
      if (c + 1 < C && !blocked.has(key(i, i + 1))) { adj[i].push(i + 1); adj[i + 1].push(i); }
      if (r + 1 < R && !blocked.has(key(i, i + C))) { adj[i].push(i + C); adj[i + C].push(i); }
    }
    const dist = (a, b) => Math.abs(Math.floor(a / C) - Math.floor(b / C)) + Math.abs((a % C) - (b % C));
    const visited = new Uint8Array(N);
    const path = [];
    const deadline = Date.now() + timeoutMs;
    const endCell = pos[maxNum];

    function allReachable(from, remaining) {
      const seen = new Uint8Array(N);
      const stack = [from];
      seen[from] = 1;
      let count = 0;
      while (stack.length) {
        const u = stack.pop();
        for (const v of adj[u]) if (!visited[v] && !seen[v]) { seen[v] = 1; count++; stack.push(v); }
      }
      return count === remaining;
    }

    function dfs(cur, next, count) {
      if (count === N) return cur === endCell;
      if (Date.now() > deadline) throw new Error('Solver timed out.');
      for (const v of adj[cur]) {
        if (visited[v]) continue;
        const label = nums.get(v);
        let nn = next;
        if (label !== undefined) {
          if (label !== next) continue;
          nn = next + 1;
        }
        if (v === endCell && count + 1 < N) continue;
        const remaining = N - (count + 1);
        if (nn <= maxNum && dist(v, pos[nn]) > remaining) continue;
        visited[v] = 1; path.push(v);
        if (allReachable(v, remaining) && dfs(v, nn, count + 1)) return true;
        visited[v] = 0; path.pop();
      }
      return false;
    }

    visited[pos[1]] = 1; path.push(pos[1]);
    if (!dfs(pos[1], 2, 1)) throw new Error('No solution found (walls or numbers may have been misread).');
    return path.slice();
  }
  LGS.solvers.zip = solveZip;

  function read(board) {
    const { grid, R, C } = board;
    const nums = new Map();
    const blocked = new Set();
    const key = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
    const dirs = { right: [0, 1], left: [0, -1], top: [-1, 0], up: [-1, 0], bottom: [1, 0], down: [1, 0] };
    grid.forEach((cell, i) => {
      const m = (cell.el.innerText || cell.el.textContent || '').match(/\d+/);
      if (m) nums.set(i, parseInt(m[0], 10));
      const r = Math.floor(i / C), c = i % C;
      for (const n of [cell.el, ...cell.el.querySelectorAll('*')]) {
        const k = LGS.cls(n);
        if (!/wall/i.test(k)) continue;
        const dm = k.match(/right|left|top|bottom|up|down/i);
        if (!dm) continue;
        const [dr, dc] = dirs[dm[0].toLowerCase()];
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < R && nc >= 0 && nc < C) blocked.add(key(i, nr * C + nc));
      }
    });
    return { nums, blocked };
  }

  LGS.games.zip = {
    id: 'zip',
    name: 'Zip',
    solve(board) {
      const { nums, blocked } = read(board);
      const path = solveZip(board.R, board.C, nums, blocked);
      const grid = board.grid;
      return {
        summary: `${board.R}×${board.C} · ${nums.size} numbers · ${blocked.size} walls`,
        render(svg) {
          const pts = path.map((i) => LGS.box(grid[i]));
          const w = pts[0].w;
          svg.appendChild(LGS.mk('polyline', {
            points: pts.map((p) => p.x + ',' + p.y).join(' '),
            fill: 'none', stroke: '#ff3d71', 'stroke-opacity': '0.7',
            'stroke-width': w * 0.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
          }));
          svg.appendChild(LGS.mk('circle', { cx: pts[0].x, cy: pts[0].y, r: w * 0.16, fill: '#22c55e', stroke: '#fff', 'stroke-width': 2 }));
          const last = pts[pts.length - 1];
          svg.appendChild(LGS.mk('circle', { cx: last.x, cy: last.y, r: w * 0.16, fill: '#ef4444', stroke: '#fff', 'stroke-width': 2 }));
          pts.forEach((p, i) => {
            const t = LGS.mk('text', {
              x: p.x + w * 0.3, y: p.y + w * 0.4, 'font-size': w * 0.2, 'font-family': 'sans-serif',
              'font-weight': '700', fill: '#fff', stroke: '#000', 'stroke-width': w * 0.03,
              'paint-order': 'stroke', 'text-anchor': 'middle'
            });
            t.textContent = i + 1;
            svg.appendChild(t);
          });
        }
      };
    }
  };
})();
