(() => {
  if (window.__zipOverlayLoaded) return;
  window.__zipOverlayLoaded = true;

  const NS = 'http://www.w3.org/2000/svg';
  let state = null;          // { grid, R, C, path }
  let svg = null, panel = null, statusEl = null, visible = true;

  /* ---------- 1. Find the board in the page ---------- */

  const cls = (e) => String(e.getAttribute && e.getAttribute('class') || '');

  function outermost(els) {
    return els.filter((e) => !els.some((o) => o !== e && o.contains(e)));
  }

  function isGridSize(n) {
    const s = Math.round(Math.sqrt(n));
    return n >= 9 && s * s === n;
  }

  function findCells() {
    // Primary: LinkedIn's own markup (cells carry data-cell-idx / "trail-cell" classes)
    let els = [...document.querySelectorAll('[data-cell-idx]')];
    if (!els.length) {
      els = [...document.querySelectorAll('[class*="trail-cell"]')]
        .filter((e) => !/content|wall|label/i.test(cls(e)));
    }
    els = outermost(els);
    if (isGridSize(els.length)) return els;

    // Fallback: any container whose children form a square grid of equal squares
    for (const el of document.querySelectorAll('div,ul,section')) {
      const kids = [...el.children];
      if (!isGridSize(kids.length) || kids.length < 16) continue;
      const r0 = kids[0].getBoundingClientRect();
      if (r0.width < 10 || Math.abs(r0.width - r0.height) > 4) continue;
      const same = kids.every((k) => {
        const r = k.getBoundingClientRect();
        return Math.abs(r.width - r0.width) < 2 && Math.abs(r.height - r0.height) < 2;
      });
      if (same) return kids;
    }
    return null;
  }

  /* ---------- 2. Read numbers + walls ---------- */

  function readBoard(els) {
    const rects = els.map((e) => e.getBoundingClientRect());
    const tol = rects[0].width / 3;
    const uniq = (vals) => {
      const s = [...vals].sort((a, b) => a - b), out = [];
      for (const v of s) if (!out.length || v - out[out.length - 1] > tol) out.push(v);
      return out;
    };
    const nearest = (arr, v) => arr.reduce((b, x, i) => (Math.abs(x - v) < Math.abs(arr[b] - v) ? i : b), 0);

    const tops = uniq(rects.map((r) => r.top));
    const lefts = uniq(rects.map((r) => r.left));
    const R = tops.length, C = lefts.length;
    if (R * C !== els.length) throw new Error('Could not map cells to a regular grid.');

    const grid = new Array(R * C);
    els.forEach((e, i) => {
      grid[nearest(tops, rects[i].top) * C + nearest(lefts, rects[i].left)] = { el: e };
    });

    const nums = new Map();
    const blocked = new Set();
    const key = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
    const dirs = { right: [0, 1], left: [0, -1], top: [-1, 0], up: [-1, 0], bottom: [1, 0], down: [1, 0] };

    grid.forEach((cell, i) => {
      const m = (cell.el.innerText || cell.el.textContent || '').match(/\d+/);
      if (m) nums.set(i, parseInt(m[0], 10));
      const r = Math.floor(i / C), c = i % C;
      for (const n of [cell.el, ...cell.el.querySelectorAll('*')]) {
        const k = cls(n);
        if (!/wall/i.test(k)) continue;
        const dm = k.match(/right|left|top|bottom|up|down/i);
        if (!dm) continue;
        const [dr, dc] = dirs[dm[0].toLowerCase()];
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < R && nc >= 0 && nc < C) blocked.add(key(i, nr * C + nc));
      }
    });
    return { grid, R, C, nums, blocked };
  }

  /* ---------- 3. Solver (constrained Hamiltonian path) ---------- */

  function solve(R, C, nums, blocked, timeoutMs = 8000) {
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

  /* ---------- 4. Overlay drawing ---------- */

  function ensureSvg() {
    if (svg && svg.isConnected) return svg;
    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('style',
      'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483000;');
    document.documentElement.appendChild(svg);
    return svg;
  }

  function mk(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function draw() {
    if (!svg) return;
    svg.replaceChildren();
    if (!state || !visible) return;
    if (!state.grid[0].el.isConnected) { state = null; setStatus('Board changed — press Solve again.'); return; }

    const pts = state.path.map((i) => {
      const r = state.grid[i].el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width };
    });
    const w = pts[0].w;

    svg.appendChild(mk('polyline', {
      points: pts.map((p) => p.x + ',' + p.y).join(' '),
      fill: 'none', stroke: '#ff3d71', 'stroke-opacity': '0.7',
      'stroke-width': w * 0.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }));
    svg.appendChild(mk('circle', { cx: pts[0].x, cy: pts[0].y, r: w * 0.16, fill: '#22c55e', stroke: '#fff', 'stroke-width': 2 }));
    const last = pts[pts.length - 1];
    svg.appendChild(mk('circle', { cx: last.x, cy: last.y, r: w * 0.16, fill: '#ef4444', stroke: '#fff', 'stroke-width': 2 }));

    pts.forEach((p, i) => {
      const t = mk('text', {
        x: p.x + w * 0.3, y: p.y + w * 0.4, 'font-size': w * 0.2, 'font-family': 'sans-serif',
        'font-weight': '700', fill: '#fff', stroke: '#000', 'stroke-width': w * 0.03,
        'paint-order': 'stroke', 'text-anchor': 'middle'
      });
      t.textContent = i + 1;
      svg.appendChild(t);
    });
  }

  /* ---------- 5. Control panel ---------- */

  function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }

  function onSolve() {
    try {
      const els = findCells();
      if (!els) throw new Error('Zip board not found on this page.');
      const b = readBoard(els);
      const t0 = performance.now();
      const path = solve(b.R, b.C, b.nums, b.blocked);
      state = { grid: b.grid, R: b.R, C: b.C, path };
      visible = true;
      ensureSvg();
      draw();
      setStatus(`${b.R}×${b.C} · ${b.nums.size} numbers · ${b.blocked.size} walls · solved in ${Math.round(performance.now() - t0)} ms`);
    } catch (err) {
      console.warn('[Zip overlay]', err);
      setStatus(err.message);
    }
  }

  function btn(label, fn) {
    const b = document.createElement('button');
    b.textContent = label;
    b.onclick = fn;
    b.style.cssText = 'padding:6px 10px;border:0;border-radius:6px;background:#0a66c2;color:#fff;font:600 12px sans-serif;cursor:pointer;';
    return b;
  }

  function createPanel() {
    panel = document.createElement('div');
    panel.style.cssText =
      'position:fixed;right:16px;bottom:16px;z-index:2147483001;display:flex;flex-direction:column;gap:6px;' +
      'padding:10px;background:#fff;color:#222;border:1px solid #ccc;border-radius:10px;' +
      'box-shadow:0 4px 16px rgba(0,0,0,.2);font:12px sans-serif;max-width:240px;';
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:6px;';
    row.append(
      btn('Solve', onSolve),
      btn('Hide / Show', () => { visible = !visible; draw(); }),
      btn('Clear', () => { state = null; draw(); setStatus('Cleared.'); })
    );
    statusEl = document.createElement('div');
    statusEl.textContent = 'Zip board detected.';
    panel.append(row, statusEl);
    document.documentElement.appendChild(panel);
  }

  // Show the panel only while a Zip board is on screen (LinkedIn is a single-page app)
  setInterval(() => {
    const found = !!findCells();
    if (found && !panel) createPanel();
    if (!found && panel) { panel.remove(); panel = null; state = null; if (svg) svg.replaceChildren(); }
    if (state) draw();
  }, 700);

  window.addEventListener('resize', draw);
  window.addEventListener('scroll', draw, true);
})();
