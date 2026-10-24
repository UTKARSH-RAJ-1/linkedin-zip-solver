// Run with: node tests/solvers.test.js
// Loads the solver modules in Node (no browser needed) and checks them on generated puzzles.
const path = require('path');
global.window = {};
for (const f of ['common', 'zip', 'queens', 'tango', 'sudoku']) require(path.join(__dirname, '..', 'src', f + '.js'));
const { solvers } = window.LGS;

let seed = 12345;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const assert = (c, m) => { if (!c) { console.error('FAIL:', m); process.exit(1); } };
let passed = 0;
const pass = (m) => { passed++; console.log('ok  -', m); };

// ---- Queens: grow regions around a known valid solution, then check the solver's answer ----
function queensCheck(n, regions, cells) {
  const rows = new Set(), cols = new Set(), regs = new Set();
  cells.forEach((i) => { rows.add(Math.floor(i / n)); cols.add(i % n); regs.add(regions[i]); });
  if (rows.size !== n || cols.size !== n || regs.size !== n) return false;
  for (let a = 0; a < cells.length; a++) for (let b = a + 1; b < cells.length; b++) {
    const dr = Math.abs(Math.floor(cells[a] / n) - Math.floor(cells[b] / n));
    const dc = Math.abs((cells[a] % n) - (cells[b] % n));
    if (dr <= 1 && dc <= 1) return false;
  }
  return true;
}
for (const n of [5, 7, 8, 9, 10]) {
  for (let t = 0; t < 5; t++) {
    // random valid placement
    let cols;
    for (;;) {
      cols = [...Array(n).keys()].sort(() => rand() - 0.5);
      if (cols.every((c, r) => r === 0 || Math.abs(c - cols[r - 1]) > 1)) break;
    }
    const regions = new Array(n * n).fill(-1);
    const q = [];
    cols.forEach((c, r) => { regions[r * n + c] = r; q.push(r * n + c); });
    while (q.length) {
      const i = q.splice(Math.floor(rand() * q.length), 1)[0];
      const r = Math.floor(i / n), c = i % n;
      for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= n || nc < 0 || nc >= n || regions[nr * n + nc] !== -1) continue;
        regions[nr * n + nc] = regions[i]; q.push(nr * n + nc);
      }
    }
    const sol = solvers.queens(n, regions);
    assert(queensCheck(n, regions, sol), `queens ${n}x${n} trial ${t}`);
  }
}
pass('Queens: 25 generated boards (5x5 to 10x10) solved and verified');

// ---- Sudoku ----
function sudokuValid(n, br, bc, g) {
  const sets = [];
  for (let k = 0; k < n; k++) {
    const row = [], col = [], box = [];
    for (let m = 0; m < n; m++) {
      row.push(g[k * n + m]); col.push(g[m * n + k]);
      const r = Math.floor(k / (n / bc)) * br + Math.floor(m / bc), c = (k % (n / bc)) * bc + (m % bc);
      box.push(g[r * n + c]);
    }
    sets.push(row, col, box);
  }
  return sets.every((s) => new Set(s).size === n && s.every((x) => x >= 1 && x <= n));
}
for (const [n, br, bc] of [[4, 2, 2], [6, 2, 3], [9, 3, 3]]) {
  for (let t = 0; t < 5; t++) {
    const full = solvers.sudoku(n, br, bc, new Array(n * n).fill(0));
    assert(full && sudokuValid(n, br, bc, full), `sudoku ${n} full grid`);
    const puzzle = full.map((v) => (rand() < (n === 9 ? 0.55 : 0.5) ? 0 : v));
    const sol = solvers.sudoku(n, br, bc, puzzle);
    assert(sol && sudokuValid(n, br, bc, sol), `sudoku ${n} trial ${t}`);
    assert(puzzle.every((v, i) => !v || v === sol[i]), 'givens preserved');
  }
}
const classic = '530070000600195000098000060800060003400803001700020006060000280000419005000080079'.split('').map(Number);
const classicSol = solvers.sudoku(9, 3, 3, classic);
assert(classicSol.join('').startsWith('534678912672195348'), 'classic 9x9');
assert(solvers.sudoku(6, 2, 3, [1, 1, ...new Array(34).fill(0)]) === null, 'conflicting givens rejected');
pass('Mini Sudoku: 4x4, 6x6 (2x3 boxes) and 9x9 solved, verified; conflicts rejected');

// ---- Tango ----
function tangoValid(n, g, edges, givens) {
  for (let k = 0; k < n; k++) {
    const row = g.slice(k * n, k * n + n), col = [...Array(n).keys()].map((r) => g[r * n + k]);
    for (const line of [row, col]) {
      if (line.filter((x) => x === 1).length !== n / 2) return false;
      for (let i = 0; i + 2 < n; i++) if (line[i] && line[i] === line[i + 1] && line[i] === line[i + 2]) return false;
    }
  }
  for (const [a, b, t] of edges) if ((t === '=') !== (g[a] === g[b])) return false;
  return givens.every((v, i) => !v || v === g[i]);
}
for (const n of [4, 6, 8]) {
  for (let t = 0; t < 8; t++) {
    const base = solvers.tango(n, new Array(n * n).fill(0), []);
    assert(base && tangoValid(n, base, [], new Array(n * n).fill(0)), 'tango blank');
    const edges = [];
    for (let i = 0; i < n * n; i++) {
      if (i % n + 1 < n && rand() < 0.12) edges.push([i, i + 1, base[i] === base[i + 1] ? '=' : 'x']);
      if (i + n < n * n && rand() < 0.12) edges.push([i, i + n, base[i] === base[i + n] ? '=' : 'x']);
    }
    const givens = base.map((v) => (rand() < 0.25 ? v : 0));
    const sol = solvers.tango(n, givens, edges);
    assert(sol && tangoValid(n, sol, edges, givens), `tango ${n} trial ${t}`);
  }
}
assert(solvers.tango(4, [1, 1, 1, 0, ...new Array(12).fill(0)], []) === null, 'tango invalid givens rejected');
pass('Tango: 4x4, 6x6, 8x8 with random clues solved and verified; invalid givens rejected');

// ---- Zip ----
function zipValid(R, C, nums, blocked, path) {
  const N = R * C;
  if (path.length !== N || new Set(path).size !== N) return false;
  const key = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
  let next = 1;
  for (let i = 0; i < N; i++) {
    if (i) {
      const dr = Math.abs(Math.floor(path[i] / C) - Math.floor(path[i - 1] / C));
      const dc = Math.abs((path[i] % C) - (path[i - 1] % C));
      if (dr + dc !== 1 || blocked.has(key(path[i], path[i - 1]))) return false;
    }
    if (nums.has(path[i])) { if (nums.get(path[i]) !== next++) return false; }
  }
  return next === Math.max(...nums.values()) + 1 && nums.get(path[N - 1]) === next - 1;
}
for (const [R, C] of [[6, 6], [7, 7]]) {
  for (let t = 0; t < 5; t++) {
    // Build a random Hamiltonian path with a snake and random 2-opt-free tweak: use a serpentine path
    const path = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) path.push(r * C + (r % 2 ? C - 1 - c : c));
    const picks = [0, ...Array.from({ length: 3 }, () => 1 + Math.floor(rand() * (R * C - 2))), R * C - 1]
      .sort((a, b) => a - b).filter((v, i, a) => a.indexOf(v) === i);
    const nums = new Map(picks.map((p, i) => [path[p], i + 1]));
    const onPath = new Set();
    path.forEach((v, i) => i && onPath.add(Math.min(v, path[i - 1]) + '|' + Math.max(v, path[i - 1])));
    const blocked = new Set();
    for (let i = 0; i < R * C; i++) {
      for (const j of [i + 1 < R * C && i % C + 1 < C ? i + 1 : -1, i + C < R * C ? i + C : -1]) {
        if (j < 0) continue;
        const k = i + '|' + j;
        if (!onPath.has(k) && rand() < 0.3) blocked.add(k);
      }
    }
    const sol = solvers.zip(R, C, nums, blocked);
    assert(zipValid(R, C, nums, blocked, sol), `zip ${R}x${C} trial ${t}`);
  }
}
pass('Zip: 6x6 and 7x7 boards with numbers and walls solved and verified');

console.log(`\nAll ${passed} test groups passed.`);
