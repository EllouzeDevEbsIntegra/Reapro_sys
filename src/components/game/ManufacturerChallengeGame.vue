<!-- ════════════════════════════════════════════════════════════════════════
     ManufacturerChallengeGame — mini-jeu « Défi Fabricant » (Pause Reapro).
     Associe une référence article RÉELLE au bon fabricant en 30 s.
     • Données via l'endpoint Reapro GET /api/pause-games/manufacturer-challenge
       (le front n'appelle QUE Reapro, jamais TecDoc directement).
     • Logo fabricant si fourni, sinon fallback nom. Feedback doux, sans son.
     • Clavier 1/2/3/4 + clic + tactile. Nettoyage rAF/timeout au unmount.
     ════════════════════════════════════════════════════════════════════════ -->
<template>
  <div class="mcg">
    <!-- Chargement -->
    <div v-if="state === 'loading'" class="mcg-center">
      <div class="mcg-load-emoji">📦</div>
      <p class="mcg-msg">Préparation du défi...</p>
    </div>

    <!-- Erreur API (message doux + fallback Catch Stock) -->
    <div v-else-if="state === 'error'" class="mcg-center">
      <div class="mcg-load-emoji">😅</div>
      <p class="mcg-msg">Impossible de charger le défi pour le moment.</p>
      <div class="mcg-err-actions">
        <button class="mcg-soft-btn primary" type="button" @click="$emit('fallback')">Jouer à Catch Stock</button>
        <button class="mcg-soft-btn" type="button" @click="$emit('close')">Retour au travail</button>
      </div>
    </div>

    <!-- Jeu -->
    <div v-else class="mcg-play" ref="root" tabindex="0" role="application"
      aria-label="Défi Fabricant — choisis le bon fabricant avec les touches 1 à 4 ou la souris"
      @keydown="onKey">
      <div class="mcg-hud" aria-hidden="true">
        <div class="mcg-stat"><i class="pi pi-check-circle"></i><span class="mcg-stat-k">Score</span><b class="mcg-stat-v">{{ score }}</b></div>
        <div class="mcg-stat"><i class="pi pi-trophy"></i><span class="mcg-stat-k">Best</span><b class="mcg-stat-v">{{ Math.max(bestScore, score) }}</b></div>
        <div class="mcg-stat mcg-stat-time" :class="{ low: timeLeft <= 10 }"><i class="pi pi-clock"></i><b class="mcg-stat-v">{{ timeLeft }}<span class="mcg-stat-u">s</span></b></div>
      </div>

      <div class="mcg-ref-card">
        <div class="mcg-part">
          <img v-if="partImage" :key="partImage" :src="partImage" alt="Pièce" class="mcg-part-img" @error="partImage = null" />
          <div v-else class="mcg-part-ph" aria-hidden="true">⚙️</div>
        </div>
        <span class="mcg-ref-label">Référence</span>
        <b class="mcg-ref">{{ current ? (current.reference || current.itemNo) : '—' }}</b>
        <span v-if="current && current.description" class="mcg-ref-desc">{{ current.description }}</span>
        <span class="mcg-instr"><i class="pi pi-arrow-down"></i> Choisis le fabricant</span>
      </div>

      <div class="mcg-choices">
        <button v-for="(c, i) in (current ? current.choices : [])" :key="c.id"
          class="mcg-choice" :class="choiceClass(c)" :disabled="locked" type="button"
          @click="answer(c)">
          <span class="mcg-key">{{ i + 1 }}</span>
          <img v-if="c.logoUrl" :src="c.logoUrl" :alt="c.name" class="mcg-logo" @error="onImgError(c)" />
          <span class="mcg-name" :class="{ big: !c.logoUrl }">{{ c.name }}</span>
        </button>
      </div>

      <transition name="mcg-fb">
        <div v-if="feedback" class="mcg-feedback" :class="feedback.kind">{{ feedback.text }}</div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import apiClient from '../../api/axios'

const props = defineProps({
  bestScore: { type: Number, default: 0 },
  durationSec: { type: Number, default: 30 },
})
const emit = defineEmits(['end', 'close', 'fallback'])

const ADVANCE_MS = 620   // délai avant question suivante (laisse voir le feedback)

const state = ref('loading')   // 'loading' | 'error' | 'playing'
const questions = ref([])
const index = ref(0)
const score = ref(0)
const timeLeft = ref(props.durationSec)
const locked = ref(false)
const chosenId = ref(null)
const feedback = ref(null)     // { kind: 'ok' | 'no', text }
const root = ref(null)

let rafId = null
let startT = 0
let advanceTimer = null
let ended = false

const current = computed(() => questions.value.length ? questions.value[index.value % questions.value.length] : null)

/* Photo de pièce (TecDoc) — lazy, best-effort, cache local, jamais bloquante */
const partImage = ref(null)
const partImgCache = new Map()
function loadPartImage(reference) {
  partImage.value = null            // image par défaut le temps du chargement
  if (!reference) return
  if (partImgCache.has(reference)) { partImage.value = partImgCache.get(reference) || null; return }
  apiClient.get('/api/pause-games/part-image', { params: { reference } })
    .then(({ data }) => {
      const u = (data && data.imageUrl) ? data.imageUrl : null
      partImgCache.set(reference, u || '')
      const cur = current.value ? (current.value.reference || current.value.itemNo) : null
      if (cur === reference) partImage.value = u   // n'applique que si on est toujours sur cette question
    })
    .catch(() => { /* best-effort : on garde l'image par défaut */ })
}
watch(() => (current.value ? (current.value.reference || current.value.itemNo) : null),
  (ref) => loadPartImage(ref), { immediate: true })

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function load() {
  state.value = 'loading'
  ended = false
  try {
    const { data } = await apiClient.get('/api/pause-games/manufacturer-challenge')
    const qs = (data && Array.isArray(data.questions) ? data.questions : [])
      .filter(q => q && Array.isArray(q.choices) && q.choices.length === 4 && q.correctManufacturerId)
    if (!qs.length) { state.value = 'error'; return }
    questions.value = shuffle(qs)
    index.value = 0
    score.value = 0
    timeLeft.value = props.durationSec
    locked.value = false
    chosenId.value = null
    feedback.value = null
    state.value = 'playing'
    startTimer()
    nextTick(() => root.value && root.value.focus())
  } catch (e) {
    state.value = 'error'
  }
}

function startTimer() {
  startT = performance.now()
  const tick = (now) => {
    if (state.value !== 'playing') return
    const elapsed = (now - startT) / 1000
    timeLeft.value = Math.max(0, Math.ceil(props.durationSec - elapsed))
    if (elapsed >= props.durationSec) { finish(); return }
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
}

function answer(choice) {
  if (locked.value || state.value !== 'playing' || !current.value) return
  locked.value = true
  chosenId.value = choice.id
  const correct = choice.id === current.value.correctManufacturerId
  if (correct) {
    score.value++
    feedback.value = { kind: 'ok', text: 'Bien joué !' }
  } else {
    feedback.value = { kind: 'no', text: 'Pas celui-ci' }   // jamais de score négatif
  }
  advanceTimer = setTimeout(nextQuestion, ADVANCE_MS)
}

function nextQuestion() {
  if (state.value !== 'playing') return
  feedback.value = null
  chosenId.value = null
  locked.value = false
  index.value++
  // boucle sur le jeu de questions (re-mélange) si l'utilisateur va très vite
  if (index.value >= questions.value.length) {
    questions.value = shuffle(questions.value)
    index.value = 0
  }
}

function onKey(e) {
  if (state.value !== 'playing' || locked.value || !current.value) return
  const n = parseInt(e.key, 10)
  if (n >= 1 && n <= 4) {
    e.preventDefault()
    const c = current.value.choices[n - 1]
    if (c) answer(c)
  }
}

function onImgError(c) {
  // logo indisponible → fallback nom (le template affiche déjà le nom)
  c.logoUrl = null
}

function choiceClass(c) {
  if (!locked.value || !current.value) return ''
  if (c.id === current.value.correctManufacturerId) return 'is-correct'
  if (c.id === chosenId.value) return 'is-wrong'
  return 'is-dim'
}

function finish() {
  if (ended) return
  ended = true
  state.value = 'done'
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
  if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null }
  // fin au timeout → temps joué = durée allouée (= budget restant passé par le parent)
  emit('end', { score: score.value, won: true, elapsedSec: props.durationSec })
}

onMounted(load)
onBeforeUnmount(() => {
  ended = true
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
  if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null }
})
</script>

<style scoped>
.mcg { width: 100%; height: 100%; min-height: clamp(360px, 56vh, 520px); display: flex; font-family: var(--c2-font-sans); }

/* États loading / erreur */
.mcg-center { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; }
.mcg-load-emoji { font-size: 2.4rem; animation: mcg-bob 1.4s ease-in-out infinite; }
@keyframes mcg-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.mcg-msg { font-size: .95rem; color: #475569; font-weight: 600; margin: 0; }
.mcg-err-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 4px; }
.mcg-soft-btn { height: 38px; padding: 0 1rem; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; color: #475569; font-weight: 600; font-size: .85rem; cursor: pointer; font-family: var(--c2-font-sans); }
.mcg-soft-btn:hover { background: #f1f5f9; }
.mcg-soft-btn.primary { background: var(--c2-primary); border-color: transparent; color: #fff; }
.mcg-soft-btn.primary:hover { background: var(--c2-primary-hover); }
.mcg-soft-btn:focus-visible { outline: 2px solid var(--c2-focus); outline-offset: 2px; }

/* Jeu */
.mcg-play { position: relative; flex: 1; display: flex; flex-direction: column; gap: 12px; outline: none; min-height: 0; }

/* HUD (cohérent avec Catch Stock) */
.mcg-hud { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.mcg-stat { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 5px 11px; box-shadow: 0 2px 6px rgba(15,23,42,.06); }
.mcg-stat i { color: var(--c2-cobalt); font-size: .82rem; }
.mcg-stat-k { color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; font-size: .62rem; }
.mcg-stat-v { color: var(--c2-deep-ocean); font-weight: 800; font-variant-numeric: tabular-nums; font-size: .88rem; }
.mcg-stat-u { color: #94a3b8; font-weight: 600; font-size: .62rem; margin-left: 1px; }
.mcg-stat-time { background: var(--c2-head-bg); border-color: var(--c2-head-border); }
.mcg-stat-time i, .mcg-stat-time .mcg-stat-v { color: #fff; }
.mcg-stat-time .mcg-stat-u { color: rgba(255,255,255,.72); }
.mcg-stat-time.low { background: linear-gradient(180deg, #f97316, #ea580c); border-color: #c2410c; }

/* Carte référence centrale */
.mcg-ref-card {
  flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  background: radial-gradient(120% 90% at 50% 0%, #f4f9ff, #eaf1fb);
  border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; text-align: center;
}
.mcg-part {
  width: 92px; height: 92px; margin-bottom: 8px; border-radius: 16px;
  background: linear-gradient(180deg, #ffffff, #eef4fb);
  border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, .10);
  display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;
}
.mcg-part-img { max-width: 100%; max-height: 100%; object-fit: contain; animation: mcg-img-in .3s ease; }
.mcg-part-ph { font-size: 2.4rem; line-height: 1; filter: grayscale(.1); }
@keyframes mcg-img-in { from { opacity: 0; transform: scale(.9); } to { opacity: 1; transform: scale(1); } }
.mcg-ref-label { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #64748b; }
.mcg-ref { font-size: clamp(1.3rem, 4.4vw, 2rem); font-weight: 800; color: var(--c2-deep-ocean); font-variant-numeric: tabular-nums; letter-spacing: .01em; line-height: 1.1; }
.mcg-ref-desc { font-size: .82rem; color: #64748b; max-width: 90%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mcg-instr { margin-top: 6px; font-size: .8rem; font-weight: 700; color: var(--c2-cobalt); display: inline-flex; align-items: center; gap: 5px; }
.mcg-instr i { font-size: .72rem; }

/* Choix fabricants — grille 2×2, cartes arrondies */
.mcg-choices { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.mcg-choice {
  position: relative; min-height: 64px; display: flex; align-items: center; justify-content: center; gap: 8px;
  background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 10px 12px; cursor: pointer;
  font-family: var(--c2-font-sans); transition: transform .12s, border-color .15s, background .15s, box-shadow .15s;
  box-shadow: 0 1px 3px rgba(15,23,42,.05);
}
.mcg-choice:hover:not(:disabled) { border-color: var(--c2-frozen); transform: translateY(-2px); box-shadow: 0 6px 16px rgba(24,89,179,.14); }
.mcg-choice:focus-visible { outline: 2px solid var(--c2-focus); outline-offset: 2px; }
.mcg-choice:disabled { cursor: default; }
.mcg-key { position: absolute; top: 6px; left: 8px; font-size: .64rem; font-weight: 800; color: #94a3b8; background: #f1f5f9; border-radius: 6px; padding: 1px 6px; }
.mcg-logo { max-height: 38px; max-width: 70%; object-fit: contain; }
.mcg-name { font-size: .92rem; font-weight: 700; color: var(--c2-deep-ocean); text-align: center; }
.mcg-name.big { font-size: 1.05rem; }

/* Feedback (doux, jamais agressif) */
.mcg-choice.is-correct { border-color: #34d399; background: #ecfdf5; box-shadow: 0 6px 16px rgba(16,185,129,.18); }
.mcg-choice.is-wrong { border-color: #fdba74; background: #fff7ed; }
.mcg-choice.is-dim { opacity: .55; }

.mcg-feedback {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  padding: 6px 16px; border-radius: 999px; font-weight: 800; font-size: .9rem;
  pointer-events: none; box-shadow: 0 6px 18px rgba(15,23,42,.18);
}
.mcg-feedback.ok { background: #ecfdf5; color: #15803d; border: 1px solid #bbf7d0; }
.mcg-feedback.no { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
.mcg-fb-enter-active, .mcg-fb-leave-active { transition: opacity .2s, transform .2s; }
.mcg-fb-enter-from, .mcg-fb-leave-to { opacity: 0; transform: translate(-50%, -50%) scale(.9); }

@media (max-width: 560px) {
  .mcg-stat-k { display: none; }
  .mcg-choice { min-height: 56px; }
}
@media (prefers-reduced-motion: reduce) {
  .mcg-load-emoji, .mcg-choice { animation: none; transition: none; }
}
</style>
