<!-- ════════════════════════════════════════════════════════════════════════
     CatchStockGame — aire de jeu « Catch Stock ».
     Un 📦 rebondit gauche/droite/haut ; le 🛒 (panier) le rattrape en bas.
     • requestAnimationFrame (dt borné, jamais de blocage de thread).
     • Souris + clavier (← →) + tactile (pointer events).
     • Nettoyage complet des listeners / rAF / ResizeObserver au unmount.
     • Aucune dépendance externe, aucune image, aucun son.
     ════════════════════════════════════════════════════════════════════════ -->
<template>
  <div
    class="cs-game"
    ref="arena"
    tabindex="0"
    role="application"
    aria-label="Jeu Catch Stock — déplacez le panier avec la souris ou les flèches gauche/droite"
    @keydown="onKey"
    @pointermove="onPointer"
    @pointerdown="onPointer"
  >
    <div class="cs-hud" aria-hidden="true">
      <div class="cs-stat"><i class="pi pi-box"></i><span class="cs-stat-k">Score</span><b class="cs-stat-v">{{ score }}</b></div>
      <div class="cs-stat"><i class="pi pi-trophy"></i><span class="cs-stat-k">Record</span><b class="cs-stat-v">{{ Math.max(bestScore, score) }}</b></div>
      <div class="cs-stat cs-stat-lvl" :class="'lvl-' + difficulty"><i class="pi pi-bolt"></i><span class="cs-stat-k">Niveau</span><b class="cs-stat-v">{{ difficulty }}</b></div>
      <div class="cs-stat cs-stat-time" :class="{ low: timeLeft <= 10 }"><i class="pi pi-clock"></i><b class="cs-stat-v">{{ timeLeft }}<span class="cs-stat-u">s</span></b></div>
    </div>

    <div class="cs-box" :style="boxStyle">📦</div>

    <div class="cs-paddle" :style="paddleStyle">
      <span class="cs-paddle-icon">🛒</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  bestScore: { type: Number, default: 0 },
  // Budget de temps de CETTE tentative (s) = temps de pause restant (partagé entre essais).
  durationSec: { type: Number, default: 60 },
})
const emit = defineEmits(['end'])

/* ── Constantes de jeu ── */
const BOX = 38            // taille de l'objet 📦 (px)
const PADDLE_W = 108      // largeur panier de base
const PADDLE_H = 26       // hauteur panier
const PADDLE_GAP = 12     // marge basse du panier
const KEY_STEP = 46       // pas clavier (px)
const BASE_SPEED = 340    // vitesse initiale
const MAX_SPEED = 1000    // vitesse plafonnée
const ACCEL = 1.10        // accélération progressive par rattrapage (+10 %/rattrapage, plafonné MAX_SPEED)
const SHRINK_AT_MS = 30000 // à 30 s de pause survécues (TOTAL) → panier réduit aux 2/3 (difficulté)
const SHRINK_FACTOR = 2 / 3 // largeur conservée après 30 s
const SPEED_L2 = 500       // seuil niveau 2
const SPEED_L3 = 1000      // seuil niveau 3
const MAX_DT = 0.05       // borne dt (≈ changement d'onglet) → pas de saut

/* ── État rendu ── */
const arena = ref(null)
const score = ref(0)
const timeLeft = ref(60)
const boxX = ref(0)
const boxY = ref(0)
const paddleX = ref(0)
const paddleW = ref(PADDLE_W)   // largeur courante du panier (réduite aux 2/3 à 30 s)
const difficulty = ref(1)       // indice de difficulté 1→4 affiché dans le HUD

/* ── État physique (hors réactivité) ── */
let W = 0, H = 0
let vx = 0, vy = 0
let speed = BASE_SPEED
let rafId = null
let lastT = 0
let elapsedMs = 0
let running = false
let ro = null
let shrunk = false   // panier déjà réduit ? (évite de re-déclencher la règle des 30 s)
let durationMs = 60000   // budget temps de la tentative courante (depuis props.durationSec)

const boxStyle = computed(() => ({
  width: BOX + 'px',
  height: BOX + 'px',
  transform: `translate(${boxX.value}px, ${boxY.value}px)`,
}))
const paddleStyle = computed(() => ({
  width: paddleW.value + 'px',
  height: PADDLE_H + 'px',
  bottom: PADDLE_GAP + 'px',
  transform: `translateX(${paddleX.value}px)`,
}))

function clamp(v, min, max) { return v < min ? min : (v > max ? max : v) }

// Indice de difficulté : 4 si panier réduit, sinon 3 (≥1000), 2 (≥500), 1 par défaut.
function refreshDifficulty() {
  difficulty.value = shrunk ? 4 : (speed >= SPEED_L3 ? 3 : (speed >= SPEED_L2 ? 2 : 1))
}

function measure() {
  const el = arena.value
  if (!el) return
  const r = el.getBoundingClientRect()
  W = r.width
  H = r.height
  // garde les éléments dans la zone après un resize
  paddleX.value = clamp(paddleX.value, 0, Math.max(0, W - paddleW.value))
  boxX.value = clamp(boxX.value, 0, Math.max(0, W - BOX))
  boxY.value = clamp(boxY.value, 0, Math.max(0, H - BOX))
}

function paddleTop() { return H - PADDLE_H - PADDLE_GAP }

function launchBox() {
  speed = BASE_SPEED
  boxX.value = W / 2 - BOX / 2
  boxY.value = Math.max(36, H * 0.18)
  // direction diagonale initiale aléatoire mais contrôlée → vers le bas
  const dir = Math.random() < 0.5 ? -1 : 1
  const angle = (38 + Math.random() * 18) * Math.PI / 180   // 38–56° depuis l'horizontale
  vx = dir * speed * Math.cos(angle)
  vy = speed * Math.sin(angle)
}

function start() {
  measure()
  durationMs = Math.max(1, Math.round(props.durationSec * 1000))
  score.value = 0
  timeLeft.value = Math.ceil(durationMs / 1000)
  elapsedMs = 0
  // Chaque (re)lancement repart À ZÉRO : niveau 1 + panier pleine taille (jamais hérité de la tentative précédente).
  shrunk = false
  paddleW.value = PADDLE_W
  paddleX.value = (W - paddleW.value) / 2
  launchBox()
  refreshDifficulty()
  running = true
  lastT = 0
  rafId = requestAnimationFrame(loop)
  nextTick(() => arena.value && arena.value.focus())
}

function loop(t) {
  if (!running) return
  if (!lastT) lastT = t
  let dt = (t - lastT) / 1000
  lastT = t
  if (dt > MAX_DT) dt = MAX_DT   // borne → jamais de téléportation

  // timer (budget de la tentative courante)
  elapsedMs += dt * 1000
  timeLeft.value = Math.max(0, Math.ceil((durationMs - elapsedMs) / 1000))
  if (elapsedMs >= durationMs) { finish(true); return }

  // Règle des 30 s : 30 s survécues DANS CETTE tentative → panier réduit aux 2/3
  if (!shrunk && elapsedMs >= SHRINK_AT_MS) {
    shrunk = true
    const center = paddleX.value + paddleW.value / 2
    paddleW.value = Math.round(PADDLE_W * SHRINK_FACTOR)
    paddleX.value = clamp(center - paddleW.value / 2, 0, Math.max(0, W - paddleW.value))
    refreshDifficulty()
  }

  let nx = boxX.value + vx * dt
  let ny = boxY.value + vy * dt

  // rebonds gauche / droite / haut
  if (nx <= 0) { nx = 0; vx = Math.abs(vx) }
  else if (nx + BOX >= W) { nx = W - BOX; vx = -Math.abs(vx) }
  if (ny <= 0) { ny = 0; vy = Math.abs(vy) }

  // ligne du panier (uniquement quand l'objet descend)
  const pTop = paddleTop()
  if (vy > 0 && ny + BOX >= pTop) {
    const pl = paddleX.value
    const pr = pl + paddleW.value
    const bl = nx
    const br = nx + BOX
    if (br >= pl && bl <= pr) {
      // RATTRAPÉ : +1, rebond vers le haut, vitesse augmentée (plafonnée)
      score.value++
      speed = Math.min(MAX_SPEED, speed * ACCEL)
      refreshDifficulty()
      ny = pTop - BOX
      // ajustement horizontal selon le point d'impact sur le panier (-1 … 1)
      const hit = ((nx + BOX / 2) - (pl + paddleW.value / 2)) / (paddleW.value / 2)
      const angle = (40 + Math.random() * 16) * Math.PI / 180
      const dir = hit >= 0 ? 1 : -1
      vy = -Math.abs(speed * Math.sin(angle))                       // remonte
      vx = dir * Math.sqrt(Math.max(speed * speed - vy * vy, (speed * 0.35) ** 2))
    }
  }

  // touche le bas hors panier → perdu
  if (ny + BOX >= H) {
    boxX.value = nx
    boxY.value = H - BOX
    finish(false)
    return
  }

  boxX.value = nx
  boxY.value = ny
  rafId = requestAnimationFrame(loop)
}

function finish(won) {
  if (!running) return
  running = false
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
  // temps réellement joué dans cette tentative (s) → décrémenté du budget de pause par le parent
  const elapsedSec = Math.min(durationMs, elapsedMs) / 1000
  emit('end', { score: score.value, won, elapsedSec })
}

/* ── Contrôles ── */
function onPointer(e) {
  if (!running) return
  const el = arena.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const x = e.clientX - r.left
  paddleX.value = clamp(x - paddleW.value / 2, 0, Math.max(0, W - paddleW.value))
}

function onKey(e) {
  if (!running) return
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    paddleX.value = clamp(paddleX.value - KEY_STEP, 0, Math.max(0, W - paddleW.value))
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    paddleX.value = clamp(paddleX.value + KEY_STEP, 0, Math.max(0, W - paddleW.value))
  }
}

onMounted(() => {
  nextTick(() => {
    measure()
    if (typeof ResizeObserver !== 'undefined' && arena.value) {
      ro = new ResizeObserver(() => measure())
      ro.observe(arena.value)
    }
    start()
  })
})

onBeforeUnmount(() => {
  running = false
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
  if (ro) { ro.disconnect(); ro = null }
})
</script>

<style scoped>
.cs-game {
  position: relative;
  width: 100%;
  height: clamp(360px, 56vh, 520px);
  background:
    radial-gradient(120% 80% at 50% 0%, #f4f9ff 0%, #eaf1fb 60%, #e3edf8 100%);
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  outline: none;
  user-select: none;
  touch-action: none;          /* le tactile pilote le panier, pas le scroll */
  cursor: pointer;
  font-family: var(--c2-font-sans);
}
.cs-game:focus-visible { box-shadow: 0 0 0 3px rgba(130, 201, 229, .45); }

/* HUD : score / record / (vitesse) / temps — toujours visibles, style « tableau de bord » */
.cs-hud {
  position: absolute;
  top: 10px; left: 10px; right: 10px;
  display: flex; align-items: stretch; justify-content: space-between; gap: 6px;
  pointer-events: none;
  z-index: 3;
}
.cs-stat {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(255, 255, 255, .85);
  -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
  border: 1px solid #e2e8f0; border-radius: 10px; padding: 5px 11px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, .08);
}
.cs-stat i { color: var(--c2-cobalt); font-size: .82rem; }
.cs-stat-k { color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; font-size: .62rem; }
.cs-stat-v { color: var(--c2-deep-ocean); font-weight: 800; font-variant-numeric: tabular-nums; font-size: .88rem; }
.cs-stat-u { color: #94a3b8; font-weight: 600; font-size: .62rem; margin-left: 1px; }

/* Chip Niveau : couleur selon la difficulté (1 vert → 4 rouge) */
.cs-stat-lvl i, .cs-stat-lvl .cs-stat-v { transition: color .25s; }
.cs-stat-lvl.lvl-1 i, .cs-stat-lvl.lvl-1 .cs-stat-v { color: #16a34a; }
.cs-stat-lvl.lvl-2 i, .cs-stat-lvl.lvl-2 .cs-stat-v { color: var(--c2-cobalt); }
.cs-stat-lvl.lvl-3 i, .cs-stat-lvl.lvl-3 .cs-stat-v { color: #ea580c; }
.cs-stat-lvl.lvl-4 i, .cs-stat-lvl.lvl-4 .cs-stat-v { color: #dc2626; }

/* Chrono = chip navy proéminent (compte à rebours) */
.cs-stat-time { background: var(--c2-head-bg); border-color: var(--c2-head-border); }
.cs-stat-time i, .cs-stat-time .cs-stat-v { color: #fff; }
.cs-stat-time .cs-stat-u { color: rgba(255, 255, 255, .72); }
.cs-stat-time.low { background: linear-gradient(180deg, #f97316, #ea580c); border-color: #c2410c; animation: cs-pulse 1s ease-in-out infinite; }
@keyframes cs-pulse { 0%,100% { box-shadow: 0 2px 6px rgba(234, 88, 12, .35); } 50% { box-shadow: 0 2px 14px rgba(234, 88, 12, .65); } }

/* Compact : sur faible largeur, on masque les libellés (icône + valeur suffisent) */
@media (max-width: 560px) {
  .cs-stat { padding: 5px 9px; gap: 4px; }
  .cs-stat-k { display: none; }
}
@media (prefers-reduced-motion: reduce) { .cs-stat-time.low { animation: none; } }

/* Objet 📦 */
.cs-box {
  position: absolute;
  top: 0; left: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; line-height: 1;
  filter: drop-shadow(0 3px 5px rgba(15, 23, 42, .25));
  will-change: transform;
}

/* Panier 🛒 — pilule navy/cobalt avec liseré orange (charte, sobre) */
.cs-paddle {
  position: absolute;
  left: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--c2-head-bg);
  border: 1px solid var(--c2-head-border);
  border-bottom: 3px solid #ea580c;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, .22);
  will-change: transform;
}
.cs-paddle-icon { font-size: 18px; line-height: 1; filter: grayscale(.05); }
</style>
