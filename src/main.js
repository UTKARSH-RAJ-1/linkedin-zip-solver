/* Game detection and the floating control panel. */
(() => {
  const LGS = window.LGS;
  if (LGS.started) return;
  LGS.started = true;

  const HINTS = {
    zip: '[class*="trail-"]',
    queens: '[class*="queens-"]',
    tango: '[class*="lotka-"]',
    sudoku: '[class*="sudoku-"]'
  };

  function detectGame() {
    const url = location.href;
    if (/\/games\//i.test(url)) {
      if (/sudoku/i.test(url)) return LGS.games.sudoku;
      if (/queens/i.test(url)) return LGS.games.queens;
      if (/tango/i.test(url)) return LGS.games.tango;
      if (/zip/i.test(url)) return LGS.games.zip;
    }
    for (const id in HINTS) if (document.querySelector(HINTS[id])) return LGS.games[id];
    return null;
  }

  let panel = null, titleEl = null, statusEl = null, currentId = null;
  const setStatus = (m) => { if (statusEl) statusEl.textContent = m; };

  function onSolve() {
    try {
      const game = detectGame();
      if (!game) throw new Error('Could not tell which game this is.');
      const els = LGS.findCells();
      if (!els) throw new Error('Board not found on this page.');
      const board = LGS.mapGrid(els);
      const t0 = performance.now();
      const res = game.solve(board);
      LGS.state = { grid: board.grid, render: res.render };
      LGS.visible = true;
      LGS.ensureSvg();
      LGS.redraw();
      setStatus(`${res.summary} · solved in ${Math.round(performance.now() - t0)} ms`);
    } catch (err) {
      console.warn('[LinkedIn Games Overlay]', err);
      setStatus(err.message);
    }
  }

  function onDebug() {
    const game = detectGame();
    const info = JSON.stringify(LGS.debugInfo(game ? game.id : null), null, 2);
    console.log('[LinkedIn Games Overlay] debug info\n' + info);
    navigator.clipboard.writeText(info).then(
      () => setStatus('Debug info copied to clipboard.'),
      () => setStatus('Debug info printed to the console (F12).')
    );
  }

  function btn(label, fn, secondary) {
    const b = document.createElement('button');
    b.textContent = label;
    b.onclick = fn;
    b.style.cssText = 'padding:6px 10px;border:0;border-radius:6px;font:600 12px sans-serif;cursor:pointer;' +
      (secondary ? 'background:#e5e7eb;color:#111;' : 'background:#0a66c2;color:#fff;');
    return b;
  }

  function createPanel() {
    panel = document.createElement('div');
    panel.style.cssText =
      'position:fixed;right:16px;bottom:16px;z-index:2147483001;display:flex;flex-direction:column;gap:6px;' +
      'padding:10px;background:#fff;color:#222;border:1px solid #ccc;border-radius:10px;' +
      'box-shadow:0 4px 16px rgba(0,0,0,.2);font:12px sans-serif;max-width:260px;';
    titleEl = document.createElement('div');
    titleEl.style.cssText = 'font-weight:700;';
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;';
    row.append(
      btn('Solve', onSolve),
      btn('Hide / Show', () => { LGS.visible = !LGS.visible; LGS.redraw(); }, true),
      btn('Clear', () => { LGS.state = null; LGS.redraw(); setStatus('Cleared.'); }, true),
      btn('Debug', onDebug, true)
    );
    statusEl = document.createElement('div');
    const note = document.createElement('div');
    note.textContent = 'Unofficial · not affiliated with LinkedIn';
    note.style.cssText = 'font-size:10px;color:#6b7280;';
    panel.append(titleEl, row, statusEl, note);
    document.documentElement.appendChild(panel);
  }

  setInterval(() => {
    const game = detectGame();
    const found = !!(game && LGS.findCells());
    if (found && !panel) createPanel();
    if (!found && panel) {
      panel.remove(); panel = null; LGS.state = null; currentId = null;
      if (LGS.svg) LGS.svg.replaceChildren();
    }
    if (found && game.id !== currentId) {
      currentId = game.id;
      LGS.state = null;
      if (LGS.svg) LGS.svg.replaceChildren();
      titleEl.textContent = game.name + ' board detected';
      setStatus('Press Solve.');
    }
    if (LGS.state && LGS.redraw() === 'stale') setStatus('Board changed — press Solve again.');
  }, 700);

  window.addEventListener('resize', () => LGS.redraw());
  window.addEventListener('scroll', () => LGS.redraw(), true);
})();
