/* Tango: fill with suns (1) and moons (2). Equal counts per line, no three in a row, "=" and "x" clues. */
(() => {
  const LGS = window.LGS;

  /** vals: 0 empty / 1 sun / 2 moon. edges: [[a, b, '=' | 'x'], ...]. Returns solved values or null. */
  function solveTango(n, vals, edges) {
    const N = n * n, half = n / 2, v = vals.slice();
    const nb = Array.from({ length: N }, () => []);
    for (const [a, b, t] of edges) { nb[a].push([b, t]); nb[b].push([a, t]); }

    function ok(i, x) {
      const r = Math.floor(i / n), c = i % n;
      let rc = 0, cc = 0;
      for (let k = 0; k < n; k++) {
        if (v[r * n + k] === x) rc++;
        if (v[k * n + c] === x) cc++;
      }
      if (rc + 1 > half || cc + 1 > half) return false;
      for (let s = c - 2; s <= c; s++) {
        if (s < 0 || s + 2 >= n) continue;
        let all = true;
        for (let k = s; k <= s + 2; k++) if ((k === c ? x : v[r * n + k]) !== x) { all = false; break; }
        if (all) return false;
      }
      for (let s = r - 2; s <= r; s++) {
        if (s < 0 || s + 2 >= n) continue;
        let all = true;
        for (let k = s; k <= s + 2; k++) if ((k === r ? x : v[k * n + c]) !== x) { all = false; break; }
        if (all) return false;
      }
      for (const [j, t] of nb[i]) {
        if (v[j] === 0) continue;
        if (t === '=' ? v[j] !== x : v[j] === x) return false;
      }
      return true;
    }

    for (let i = 0; i < N; i++) {
      if (v[i] === 0) continue;
      const x = v[i];
      v[i] = 0;
      if (!ok(i, x)) return null;
      v[i] = x;
    }
    function dfs(from) {
      let i = from;
      while (i < N && v[i] !== 0) i++;
      if (i === N) return true;
      for (const x of [1, 2]) {
        if (!ok(i, x)) continue;
        v[i] = x;
        if (dfs(i + 1)) return true;
        v[i] = 0;
      }
      return false;
    }
    return dfs(0) ? v : null;
  }
  LGS.solvers.tango = solveTango;

  function labelsOf(el) {
    const parts = [el.getAttribute('aria-label') || ''];
    el.querySelectorAll('[aria-label]').forEach((n) => parts.push(n.getAttribute('aria-label') || ''));
    el.querySelectorAll('title').forEach((n) => parts.push(n.textContent || ''));
    return parts.join(' ');
  }

  function readValue(el) {
    const labels = labelsOf(el);
    if (/empty/i.test(labels)) return 0;
    if (/\bsun\b/i.test(labels)) return 1;
    if (/\bmoon\b/i.test(labels)) return 2;
    const classes = [LGS.cls(el), ...[...el.querySelectorAll('*')].map(LGS.cls)].join(' ');
    if (/sun/i.test(classes)) return 1;
    if (/moon/i.test(classes)) return 2;
    return 0;
  }

  function readEdges(grid, R, C) {
    const dirs = { right: [0, 1], left: [0, -1], top: [-1, 0], up: [-1, 0], bottom: [1, 0], down: [1, 0] };
    const seen = new Set(), edges = [];
    grid.forEach((cell, i) => {
      const r = Math.floor(i / C), c = i % C;
      for (const n of [cell.el, ...cell.el.querySelectorAll('*')]) {
        const k = LGS.cls(n);
        if (!/edge/i.test(k)) continue;
        const dm = k.match(/right|left|top|bottom|up|down/i);
        if (!dm) continue;
        const text = [n.getAttribute('aria-label') || '', k, n.textContent || '',
          (n.innerHTML.match(/<title>.*?<\/title>/i) || [''])[0]].join(' ');
        const type = /equal|=|same/i.test(text) ? '=' : /cross|×|✕|✖|opposite|differ/i.test(text) ? 'x' : null;
        if (!type) continue;
        const [dr, dc] = dirs[dm[0].toLowerCase()];
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
        const j = nr * C + nc;
        const key = Math.min(i, j) + '|' + Math.max(i, j);
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push([i, j, type]);
      }
    });
    return edges;
  }

  LGS.games.tango = {
    id: 'tango',
    name: 'Tango',
    solve(board) {
      const { grid, R, C } = board;
      if (R !== C || R % 2) throw new Error('Tango board has an unexpected size.');
      const vals = grid.map((c) => readValue(c.el));
      const edges = readEdges(grid, R, C);
      const sol = solveTango(R, vals, edges);
      if (!sol) throw new Error('No solution found (symbols or clues may have been misread).');
      return {
        summary: `${R}×${R} · ${vals.filter(Boolean).length} given · ${edges.length} clues`,
        render(svg) {
          sol.forEach((x, i) => {
            if (vals[i]) return;
            const b = LGS.box(grid[i]), s = b.w;
            if (x === 1) {
              for (let k = 0; k < 8; k++) {
                const a = (k * Math.PI) / 4;
                svg.appendChild(LGS.mk('line', {
                  x1: b.x + Math.cos(a) * s * 0.26, y1: b.y + Math.sin(a) * s * 0.26,
                  x2: b.x + Math.cos(a) * s * 0.37, y2: b.y + Math.sin(a) * s * 0.37,
                  stroke: '#f59e0b', 'stroke-width': s * 0.045, 'stroke-linecap': 'round'
                }));
              }
              svg.appendChild(LGS.mk('circle', { cx: b.x, cy: b.y, r: s * 0.2, fill: '#f59e0b', stroke: '#fff', 'stroke-width': s * 0.02 }));
            } else {
              const r = s * 0.27;
              svg.appendChild(LGS.mk('path', {
                d: `M ${b.x} ${b.y - r} A ${r} ${r} 0 1 0 ${b.x} ${b.y + r} A ${r * 1.3} ${r * 1.3} 0 0 1 ${b.x} ${b.y - r} Z`,
                fill: '#3b82f6', stroke: '#fff', 'stroke-width': s * 0.02
              }));
            }
          });
        }
      };
    }
  };
})();
