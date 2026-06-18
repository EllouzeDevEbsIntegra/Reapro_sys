<!-- ════════════════════════════════════════════════════════════════════════
     PathBasketGame — mini-jeu « Chemin Panier » (Pause Reapro). 100% frontend.
     Grille 4×4 de tuyaux : tourne les pièces pour relier la pièce 📦 au panier 🛒.
     Chemin relié → la pièce 📦 file vers le panier, +1, nouveau puzzle. 60 s.
     Toujours solvable. Rotation TOUJOURS horaire (compteur de tours monotone).
     Souris + tactile + clavier. CSS/SVG, aucune dépendance, aucune API.
     ════════════════════════════════════════════════════════════════════════ -->
<template>
  <div class="pb" ref="pbRoot">
    <div class="pb-hud" aria-hidden="true">
      <div class="pb-stat" ref="scoreChip"><i class="pi pi-check-circle"></i><span class="pb-stat-k">Score</span><b class="pb-stat-v">{{ score }}</b></div>
      <div class="pb-stat"><i class="pi pi-trophy"></i><span class="pb-stat-k">Best</span><b class="pb-stat-v">{{ Math.max(bestScore, score) }}</b></div>
      <div class="pb-stat pb-stat-time" :class="{ low: timeLeft <= 10 }"><i class="pi pi-clock"></i><b class="pb-stat-v">{{ timeLeft }}<span class="pb-stat-u">s</span></b></div>
    </div>

    <div class="pb-grid-wrap">
      <div class="pb-grid" ref="grid" tabindex="0" role="application"
        aria-label="Chemin Panier — tourne les tuyaux pour relier la pièce au panier"
        @keydown="onKey">
        <div v-for="(cell, i) in cells" :key="i"
          class="pb-cell"
          :class="{
            rotatable: isRotatable(cell),
            'on-path': solvedPath.includes(i),
            'is-start': cell.kind === 'start',
            'is-end': cell.kind === 'end',
            'is-empty': cell.kind === 'empty',
            selected: selectedIdx === i,
          }"
          @click="rotateCell(i)">
          <div class="pb-pipe" :style="{ transform: `rotate(${cell.turns * 90}deg)` }">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <template v-if="cell.kind === 'straight'">
                <line x1="50" y1="0" x2="50" y2="100" />
                <circle cx="50" cy="50" r="9" stroke="none" />
              </template>
              <template v-else-if="cell.kind === 'elbow'">
                <path d="M50 0 L50 50 L100 50" fill="none" />
                <circle cx="50" cy="50" r="9" stroke="none" />
              </template>
              <template v-else-if="cell.kind === 'start' || cell.kind === 'end'">
                <line x1="50" y1="2" x2="50" y2="52" />
              </template>
            </svg>
          </div>
          <span v-if="cell.kind === 'start'" class="pb-icon pb-icon-start" :class="{ hidden: tokenVisible }">📦</span>
          <span v-else-if="cell.kind === 'end'" class="pb-icon pb-icon-end">🛒</span>
          <span v-else-if="cell.kind === 'empty'" class="pb-dot" aria-hidden="true"></span>
        </div>

        <!-- la pièce elle-même qui file vers le panier -->
        <span v-if="tokenVisible" class="pb-token" :style="tokenStyle" aria-hidden="true">📦</span>
      </div>
    </div>

    <!-- au succès : un duplicata de la pièce « sort » du panier et vole vers le Score (+1) -->
    <span v-if="flyVisible" class="pb-fly" :style="flyStyle" aria-hidden="true">📦</span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  bestScore: { type: Number, default: 0 },
  durationSec: { type: Number, default: 60 },
})
const emit = defineEmits(['end'])

const GRID = 4
const ORDER = ['N', 'E', 'S', 'W']
const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' }
const BASE = {
  straight: ['N', 'S'],
  elbow: ['N', 'E'],
  start: ['N'],
  end: ['N'],
  empty: [],
}

const score = ref(0)
const timeLeft = ref(props.durationSec)
const cells = ref([])           // 16 cellules { kind, turns }  (turns = compteur monotone → rotation toujours horaire)
const solutionPath = ref([])    // indices ordonnés départ→arrivée
const solvedPath = ref([])      // indices illuminés (pendant la résolution)
const selectedIdx = ref(0)
const grid = ref(null)
const pbRoot = ref(null)
const scoreChip = ref(null)

const tokenVisible = ref(false)
const tokenIdx = ref(0)
const tokenStyle = computed(() => {
  const r = Math.floor(tokenIdx.value / GRID), c = tokenIdx.value % GRID
  return { left: (c * 25 + 12.5) + '%', top: (r * 25 + 12.5) + '%' }
})

// pièce « +1 » qui vole du panier vers le Score
const flyVisible = ref(false)
const flyX = ref(0)
const flyY = ref(0)
const flyStyle = computed(() => ({ left: flyX.value + 'px', top: flyY.value + 'px' }))

let rafId = null
let startT = 0
let solveTimer = null
let flyTimer = null
let solving = false
let ended = false
let startIdx = 0                 // case départ (aléatoire par puzzle)
let endIdx = GRID * GRID - 1     // case arrivée (aléatoire par puzzle)

/* ── Helpers ── */
const rowOf = i => Math.floor(i / GRID)
const colOf = i => i % GRID
const mod4 = n => ((n % 4) + 4) % 4
function rotateDir(d, r) { return ORDER[(ORDER.indexOf(d) + mod4(r)) % 4] }
function conns(cell) { return BASE[cell.kind].map(d => rotateDir(d, cell.turns)) }
function isRotatable(cell) { return cell.kind === 'straight' || cell.kind === 'elbow' }

function neighbors(i) {
  const r = rowOf(i), c = colOf(i), out = []
  if (r > 0) out.push({ idx: i - GRID, dir: 'N' })
  if (r < GRID - 1) out.push({ idx: i + GRID, dir: 'S' })
  if (c > 0) out.push({ idx: i - 1, dir: 'W' })
  if (c < GRID - 1) out.push({ idx: i + 1, dir: 'E' })
  return out
}
function dirBetween(a, b) {
  if (b === a - GRID) return 'N'
  if (b === a + GRID) return 'S'
  if (b === a - 1) return 'W'
  if (b === a + 1) return 'E'
  return null
}
function shuffleArr(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }
  return a
}
function rotationFor(kind, target) {
  const want = [...target].sort().join('')
  for (let r = 0; r < 4; r++) {
    const got = BASE[kind].map(d => rotateDir(d, r)).sort().join('')
    if (got === want) return r
  }
  return 0
}

function manhattan(a, b) { return Math.abs(rowOf(a) - rowOf(b)) + Math.abs(colOf(a) - colOf(b)) }

/* Départ/arrivée ALÉATOIRES n'importe où (y compris au CENTRE) ; juste pas adjacents.
   La longueur du chemin (difficulté) est gérée séparément par targetLen + le DFS. */
function pickEndpoints() {
  const total = GRID * GRID
  const s = Math.floor(Math.random() * total)
  let e, tries = 0
  do { e = Math.floor(Math.random() * total); tries++ }
  while ((e === s || manhattan(s, e) < 2) && tries < 60)
  return [s, e]
}

/* ── Génération d'un chemin auto-évitant départ→arrivée ── */
function findPath(start, end) {
  const path = [], visited = new Array(GRID * GRID).fill(false)
  function dfs(i) {
    path.push(i); visited[i] = true
    if (i === end) return true
    for (const n of shuffleArr(neighbors(i))) {
      if (!visited[n.idx] && dfs(n.idx)) return true
    }
    path.pop(); visited[i] = false; return false
  }
  dfs(start)
  return path
}
function targetLen(s) {
  if (s < 3) return [4, 7]
  if (s < 6) return [6, 10]
  return [8, 13]
}

function newPuzzle() {
  const [start, end] = pickEndpoints()
  startIdx = start; endIdx = end
  const [min, max] = targetLen(score.value)
  let path = findPath(start, end)
  for (let a = 0; a < 40 && !(path.length >= min && path.length <= max); a++) {
    const p = findPath(start, end)
    if (p.length >= min && p.length <= max) { path = p; break }
    if (Math.abs(p.length - (min + max) / 2) < Math.abs(path.length - (min + max) / 2)) path = p
  }

  const grid16 = Array.from({ length: GRID * GRID }, () => ({ kind: 'empty', turns: 0 }))
  for (let k = 0; k < path.length; k++) {
    const idx = path[k]
    const dirs = []
    if (k > 0) dirs.push(dirBetween(idx, path[k - 1]))
    if (k < path.length - 1) dirs.push(dirBetween(idx, path[k + 1]))
    let kind
    if (dirs.length === 1) kind = (k === 0) ? 'start' : 'end'
    else kind = (OPP[dirs[0]] === dirs[1]) ? 'straight' : 'elbow'
    grid16[idx] = { kind, turns: rotationFor(kind, dirs) }
  }

  solutionPath.value = path
  cells.value = grid16
  scramble()
  // sélection clavier sur le 1ᵉʳ tuyau tournable (jamais sur la case départ → pas de halo derrière 📦)
  const firstRot = path.find(i => isRotatable(grid16[i]))
  selectedIdx.value = (firstRot != null) ? firstRot : path[0]
}

/* Mélange : tours aléatoires des pièces (start/end fixes). Jamais pré-résolu. */
function scramble() {
  for (const cell of cells.value) {
    if (isRotatable(cell)) cell.turns = Math.floor(Math.random() * 4)
  }
  let guard = 0
  while (isSolved() && guard++ < 20) {
    const rot = cells.value.filter(isRotatable)
    if (!rot.length) break
    rot[Math.floor(Math.random() * rot.length)].turns++
  }
}

/* ── Détection : chemin continu départ→arrivée (BFS ouvertures mutuelles) ── */
function isSolved() {
  const start = startIdx, end = endIdx
  const seen = new Array(GRID * GRID).fill(false)
  const queue = [start]; seen[start] = true
  while (queue.length) {
    const cur = queue.shift()
    if (cur === end) return true
    const cc = conns(cells.value[cur])
    for (const n of neighbors(cur)) {
      if (seen[n.idx]) continue
      if (cc.includes(n.dir) && conns(cells.value[n.idx]).includes(OPP[n.dir])) {
        seen[n.idx] = true; queue.push(n.idx)
      }
    }
  }
  return seen[end]
}

/* ── Interaction : rotation TOUJOURS horaire (turns++ → +90°) ── */
function rotateCell(i) {
  if (solving || ended) return
  const cell = cells.value[i]
  if (!isRotatable(cell)) return
  selectedIdx.value = i
  cell.turns++
  if (isSolved()) runSolve()
}

function onKey(e) {
  if (solving || ended) return
  const i = selectedIdx.value
  if (e.key === 'ArrowRight') { e.preventDefault(); if (colOf(i) < GRID - 1) selectedIdx.value = i + 1 }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); if (colOf(i) > 0) selectedIdx.value = i - 1 }
  else if (e.key === 'ArrowDown') { e.preventDefault(); if (rowOf(i) < GRID - 1) selectedIdx.value = i + GRID }
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (rowOf(i) > 0) selectedIdx.value = i - GRID }
  else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); rotateCell(selectedIdx.value) }
}

/* ── Résolution : illumine + la pièce 📦 file vers le panier ── */
function runSolve() {
  solving = true
  solvedPath.value = solutionPath.value.slice()
  tokenIdx.value = solutionPath.value[0]
  tokenVisible.value = true
  let step = 1
  const stepMs = 170
  const move = () => {
    if (step >= solutionPath.value.length) {
      // arrivée au panier → un duplicata de la pièce ressort et file vers le Score (+1)
      solveTimer = setTimeout(() => {
        tokenVisible.value = false
        flyToScore(() => {
          score.value++
          solvedPath.value = []
          newPuzzle()
          solving = false
        })
      }, 250)
      return
    }
    tokenIdx.value = solutionPath.value[step]
    step++
    solveTimer = setTimeout(move, stepMs)
  }
  solveTimer = setTimeout(move, 260)
}

/* Anime une pièce du panier vers la pastille Score, puis exécute `done` (qui ajoute le point). */
function flyToScore(done) {
  const root = pbRoot.value
  const chip = scoreChip.value
  const basket = grid.value && grid.value.querySelector('.pb-cell.is-end')
  if (!root || !chip || !basket) { done(); return }
  const rr = root.getBoundingClientRect()
  const br = basket.getBoundingClientRect()
  const cr = chip.getBoundingClientRect()
  flyX.value = br.left + br.width / 2 - rr.left
  flyY.value = br.top + br.height / 2 - rr.top
  flyVisible.value = true
  // 2 frames pour poser la position de départ avant d'animer vers le Score
  requestAnimationFrame(() => requestAnimationFrame(() => {
    flyX.value = cr.left + cr.width / 2 - rr.left
    flyY.value = cr.top + cr.height / 2 - rr.top
  }))
  flyTimer = setTimeout(() => { flyVisible.value = false; done() }, 580)
}

/* ── Timer 60 s ── */
function startTimer() {
  startT = performance.now()
  const tick = (now) => {
    if (ended) return
    const elapsed = (now - startT) / 1000
    timeLeft.value = Math.max(0, Math.ceil(props.durationSec - elapsed))
    if (elapsed >= props.durationSec) { finish(); return }
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
}
function finish() {
  if (ended) return
  ended = true
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
  if (solveTimer) { clearTimeout(solveTimer); solveTimer = null }
  // fin au timeout → temps joué = durée allouée (= budget restant passé par le parent)
  emit('end', { score: score.value, won: true, elapsedSec: props.durationSec })
}

onMounted(() => {
  newPuzzle()
  startTimer()
  nextTick(() => grid.value && grid.value.focus())
})
onBeforeUnmount(() => {
  ended = true
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
  if (solveTimer) { clearTimeout(solveTimer); solveTimer = null }
  if (flyTimer) { clearTimeout(flyTimer); flyTimer = null }
})
</script>

<style scoped>
.pb {
  position: relative; width: 100%; height: 100%; min-height: clamp(380px, 58vh, 540px);
  display: flex; flex-direction: column; gap: 10px; font-family: var(--c2-font-sans);
  /* empêche la sélection de texte (emoji) au double-clic rapide → plus de surlignage bleu */
  user-select: none; -webkit-user-select: none;
}

/* HUD */
.pb-hud { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.pb-stat { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 5px 11px; box-shadow: 0 2px 6px rgba(15,23,42,.06); }
.pb-stat i { color: var(--c2-cobalt); font-size: .82rem; }
.pb-stat-k { color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; font-size: .62rem; }
.pb-stat-v { color: var(--c2-deep-ocean); font-weight: 800; font-variant-numeric: tabular-nums; font-size: .88rem; }
.pb-stat-u { color: #94a3b8; font-weight: 600; font-size: .62rem; margin-left: 1px; }
.pb-stat-time { background: var(--c2-head-bg); border-color: var(--c2-head-border); }
.pb-stat-time i, .pb-stat-time .pb-stat-v { color: #fff; }
.pb-stat-time .pb-stat-u { color: rgba(255,255,255,.72); }
.pb-stat-time.low { background: linear-gradient(180deg, #f97316, #ea580c); border-color: #c2410c; }

/* Grille 4×4 — occupe le MAX d'espace (carrée, bornée par largeur ET hauteur) */
.pb-grid-wrap { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; }
.pb-grid {
  position: relative; display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr); gap: 8px;
  width: min(100%, 460px); max-width: 52vh; aspect-ratio: 1 / 1;
  padding: 12px; border-radius: 20px; outline: none;
  background: radial-gradient(130% 100% at 50% 0%, #f3f9ff, #e6eef9);
  border: 1px solid #dbe6f3; box-shadow: inset 0 1px 0 #fff, 0 8px 22px rgba(15,23,42,.10);
}
.pb-grid:focus-visible { box-shadow: inset 0 1px 0 #fff, 0 0 0 3px rgba(130,201,229,.5); }

.pb-cell {
  position: relative; min-width: 0; min-height: 0; border-radius: 13px; background: #ffffff; border: 1px solid #e8edf3;
  display: flex; align-items: center; justify-content: center; cursor: default; overflow: hidden;
  transition: transform .12s, border-color .15s, box-shadow .15s, background .2s;
}
.pb-cell.rotatable { cursor: pointer; }
.pb-cell.rotatable:hover { border-color: var(--c2-frozen); box-shadow: 0 4px 12px rgba(24,89,179,.16); transform: translateY(-1px); }
/* halo de sélection UNIQUEMENT sur les tuyaux tournables (jamais derrière 📦/🛒) */
.pb-cell.rotatable.selected { box-shadow: 0 0 0 2.5px var(--c2-frozen); }
.pb-cell.is-empty { background: #eef3fa; border-color: #e3eaf3; }
.pb-cell.is-start { background: linear-gradient(180deg,#eaf4ff,#dcebfb); }
.pb-cell.is-end { background: linear-gradient(180deg,#fff3e6,#ffe7cf); }

/* tuyau (SVG) — rotation animée, toujours horaire */
.pb-pipe { position: absolute; inset: 0; transition: transform .22s cubic-bezier(.34,1.2,.4,1); color: #1859B3; }
.pb-pipe svg { width: 100%; height: 100%; display: block; }
.pb-pipe svg line, .pb-pipe svg path { stroke: currentColor; stroke-width: 17; stroke-linecap: round; stroke-linejoin: round; }
.pb-pipe svg circle { fill: currentColor; }
.pb-cell.on-path .pb-pipe { color: #ea580c; }
.pb-cell.on-path { background: linear-gradient(180deg,#fff5ea,#ffe9d2); border-color: #fdba74; box-shadow: 0 0 0 1px #fdba74 inset, 0 4px 14px rgba(234,88,12,.18); }
.pb-cell.is-start .pb-pipe, .pb-cell.is-end .pb-pipe { color: #94a3b8; }
.pb-cell.on-path.is-start .pb-pipe, .pb-cell.on-path.is-end .pb-pipe { color: #ea580c; }

/* Icônes départ / arrivée — badge rond blanc (version précédente conservée) */
.pb-icon {
  position: relative; z-index: 2; display: inline-flex; align-items: center; justify-content: center;
  width: 62%; height: 62%; max-width: 46px; max-height: 46px; border-radius: 50%;
  background: #fff; box-shadow: 0 3px 9px rgba(15,23,42,.16);
  font-size: clamp(1.2rem, 4.2vw, 1.7rem); line-height: 1;
}
.pb-icon-start.hidden { opacity: 0; }    /* la pièce « part » : on masque l'icône départ pendant le trajet */
.pb-dot { width: 6px; height: 6px; border-radius: 50%; background: #c3d2e6; }

/* la pièce 📦 qui se déplace le long du chemin */
.pb-token {
  position: absolute; z-index: 4; width: 30px; height: 30px; margin: -15px 0 0 -15px;
  display: flex; align-items: center; justify-content: center; font-size: 1.45rem; line-height: 1;
  filter: drop-shadow(0 4px 8px rgba(15,23,42,.30));
  transition: left .17s linear, top .17s linear;
}

/* pièce « +1 » (📦) qui vole du panier vers le Score */
.pb-fly {
  position: absolute; z-index: 7; margin: -12px 0 0 -12px;
  display: flex; align-items: center; justify-content: center; font-size: 1.4rem; line-height: 1;
  filter: drop-shadow(0 4px 9px rgba(15,23,42,.3));
  transition: left .56s cubic-bezier(.4,0,.2,1), top .56s cubic-bezier(.4,0,.2,1);
}

@media (max-width: 560px) { .pb-stat-k { display: none; } }
@media (prefers-reduced-motion: reduce) { .pb-pipe, .pb-token, .pb-cell { transition: none; } }
</style>
