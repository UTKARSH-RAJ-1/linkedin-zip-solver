/* Shared helpers: board detection, grid mapping and the overlay layer. */
(() => {
  if (window.LGS) return;
  const NS = 'http://www.w3.org/2000/svg';
  const LGS = (window.LGS = { games: {}, solvers: {}, state: null, visible: true, svg: null });

  const cls = (e) => String((e.getAttribute && e.getAttribute('class')) || '');
  const outermost = (els) => els.filter((e) => !els.some((o) => o !== e && o.contains(e)));
  const isGridSize = (n) => {
    const s = Math.round(Math.sqrt(n));
    return n >= 16 && n <= 144 && s * s === n;
  };
  LGS.cls = cls;

  /** Returns the array of cell elements of the board on screen, or null. */
  LGS.findCells = function () {
    let els = outermost([...document.querySelectorAll('[data-cell-idx]')]);
    if (!isGridSize(els.length)) {
      els = outermost(
        [...document.querySelectorAll('[class*="-cell"]')].filter((e) => !/content|wall|edge|label|icon/i.test(cls(e)))
      );
    }
    if (isGridSize(els.length)) return els;

    // Fallback: a container whose children form a square grid of equally sized squares
    for (const el of document.querySelectorAll('div,ul,section,table')) {
      const kids = [...el.children];
      if (!isGridSize(kids.length)) continue;
      const r0 = kids[0].getBoundingClientRect();
      if (r0.width < 10 || Math.abs(r0.width - r0.height) > 4) continue;
      const same = kids.every((k) => {
        const r = k.getBoundingClientRect();
        return Math.abs(r.width - r0.width) < 2 && Math.abs(r.height - r0.height) < 2;
      });
      if (same) return kids;
    }
    return null;
  };

  /** Maps cell elements to row/column positions using their on-screen geometry. */
  LGS.mapGrid = function (els) {
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
    if (R * C !== els.length) throw new Error('Could not map the cells to a regular grid.');
    const grid = new Array(R * C);
    els.forEach((e, i) => {
      grid[nearest(tops, rects[i].top) * C + nearest(lefts, rects[i].left)] = { el: e };
    });
    return { grid, R, C };
  };

  /* ---------- overlay layer ---------- */

  LGS.mk = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };

  LGS.box = (cell) => {
    const r = cell.el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  };

  LGS.ensureSvg = () => {
    if (LGS.svg && LGS.svg.isConnected) return LGS.svg;
    LGS.svg = document.createElementNS(NS, 'svg');
    LGS.svg.setAttribute('style',
      'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483000;');
    document.documentElement.appendChild(LGS.svg);
    return LGS.svg;
  };

  LGS.redraw = () => {
    if (!LGS.svg) return null;
    LGS.svg.replaceChildren();
    const st = LGS.state;
    if (!st || !LGS.visible) return null;
    if (!st.grid[0].el.isConnected) { LGS.state = null; return 'stale'; }
    st.render(LGS.svg);
    return null;
  };

  /* ---------- debug info (for bug reports) ---------- */

  LGS.debugInfo = (gameId) => {
    const out = { version: '1.2.0', game: gameId, url: location.href };
    const els = LGS.findCells();
    out.cellCount = els ? els.length : 0;
    if (els) {
      const sorted = [...els].sort((a, b) => b.outerHTML.length - a.outerHTML.length);
      out.firstCell = els[0].outerHTML.slice(0, 1200);
      out.largestCell = sorted[0].outerHTML.slice(0, 1200);
      out.edgeOrWallSamples = [...document.querySelectorAll('[class*="edge"],[class*="wall"]')]
        .slice(0, 4).map((n) => n.outerHTML.slice(0, 400));
    }
    return out;
  };
})();
