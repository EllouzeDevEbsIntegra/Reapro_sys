<!-- ════════════════════════════════════════════════════════════════════════
     ReaproPauseGameDialog — proposition de micro-pause + hôte du jeu Catch Stock.
     Composant GLOBAL autonome, monté une fois (App.vue). Discret, non bloquant,
     optionnel. Teleport <body> (z 1200/1201), header Deep Ocean texte blanc,
     fond clair, charte C2. Aucun backend, aucune donnée sensible.

     3 phases : 'intro' (proposition) · 'playing' (jeu 60 s) · 'over' (score final).
     ════════════════════════════════════════════════════════════════════════ -->
<template>
  <teleport to="body">
    <div
      v-if="pause.showDialog.value"
      class="rpg-overlay"
      @click.self="onClose"
      @keydown.esc="onClose"
    >
      <div
        class="rpg-modal"
        ref="modal"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rpg-title"
      >
        <!-- Header -->
        <div class="rpg-head">
          <div class="rpg-head-titles">
            <h2 id="rpg-title" class="rpg-title">Coin Détente</h2>
          </div>
          <button class="rpg-close" type="button" aria-label="Fermer" @click="onClose">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <!-- Phase INTRO : proposition de pause (ne lance pas le jeu directement) -->
        <div v-if="phase === 'intro'" class="rpg-body rpg-intro">
          <!-- Fond corporate sobre — SVG inline (aucune image externe), discret et pro -->
          <svg class="rpg-bg" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <pattern id="rpgDots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.3" fill="#1859B3" opacity=".10" />
              </pattern>
            </defs>
            <rect width="400" height="320" fill="url(#rpgDots)" />
            <circle cx="360" cy="34" r="110" fill="#82C9E5" opacity=".16" />
            <circle cx="40" cy="304" r="120" fill="#1859B3" opacity=".07" />
          </svg>

          <p class="rpg-hello">Bonjour <b>{{ userName }}</b> <span class="rpg-wave">👋</span></p>

          <!-- Médaillon thématique du jeu : illustration SVG significative du mécanisme du jeu -->
          <div class="rpg-medal" :key="currentGame.id">
            <svg class="rpg-medal-svg" viewBox="0 0 100 100" aria-hidden="true">
              <!-- Catch Stock : objet qui tombe + barre (panier) + sens du mouvement -->
              <g v-if="currentGame.id === 'catchStock'">
                <path d="M50 15 V39 M44 32 L50 40 L56 32" fill="none" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".85" />
                <rect x="40" y="39" width="20" height="20" rx="5" fill="#fb923c" />
                <rect x="26" y="74" width="48" height="11" rx="5.5" fill="#82C9E5" />
              </g>
              <!-- Défi Fabricant : deux éléments associés + coche de validation -->
              <g v-else-if="currentGame.id === 'manufacturerChallenge'">
                <rect x="14" y="40" width="26" height="26" rx="6" fill="#82C9E5" />
                <rect x="60" y="40" width="26" height="26" rx="6" fill="#ffffff" />
                <circle cx="50" cy="53" r="13.5" fill="#22c55e" />
                <path d="M43.5 53 L48.5 58 L57 47.5" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
              </g>
              <!-- Chemin Panier : pipeline (chemin de tuyaux) -->
              <g v-else>
                <path d="M22 32 H50 V62 H78" fill="none" stroke="#82C9E5" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="22" cy="32" r="8" fill="#fb923c" />
                <circle cx="78" cy="62" r="8" fill="#ffffff" />
              </g>
            </svg>
          </div>

          <p class="rpg-q">Besoin d'une pause ?</p>
          <div class="rpg-gamechip"><i class="pi pi-play-circle"></i> {{ currentGame.name }}</div>
          <p class="rpg-text">{{ currentGame.desc }}</p>
          <div class="rpg-best-pill"><i class="pi pi-trophy"></i> Meilleur score <b>{{ currentBest }}</b></div>

          <div class="rpg-actions">
            <button class="rpg-btn rpg-btn-primary" type="button" ref="firstBtn" @click="startGame">
              {{ currentGame.playLabel }}
            </button>
            <button class="rpg-btn rpg-btn-secondary" type="button" @click="pause.playLater()">
              Plus tard
            </button>
          </div>
          <div class="rpg-actions rpg-actions-minor">
            <button class="rpg-link" type="button" @click="pause.hideToday()">
              Ne plus afficher aujourd'hui
            </button>
          </div>

          <!-- Flèches de navigation entre les jeux (centre vertical, bords du dialog) -->
          <button v-if="GAMES.length > 1" class="rpg-nav rpg-nav-left" type="button"
            aria-label="Jeu précédent" @click="prevGame">
            <i class="pi pi-chevron-left"></i>
          </button>
          <button v-if="GAMES.length > 1" class="rpg-nav rpg-nav-right" type="button"
            aria-label="Jeu suivant" @click="nextGame">
            <i class="pi pi-chevron-right"></i>
          </button>
        </div>

        <!-- Phase PLAYING : le jeu -->
        <div v-else-if="phase === 'playing'" class="rpg-body rpg-play">
          <CatchStockGame
            v-if="currentGame.id === 'catchStock'"
            :key="gameKey"
            :best-score="currentBest"
            :duration-sec="remainingDisplay"
            @end="onGameEnd"
          />
          <ManufacturerChallengeGame
            v-else-if="currentGame.id === 'manufacturerChallenge'"
            :key="gameKey"
            :best-score="currentBest"
            :duration-sec="remainingDisplay"
            @end="onGameEnd"
            @close="onClose"
            @fallback="fallbackToCatchStock"
          />
          <PathBasketGame
            v-else
            :key="gameKey"
            :best-score="currentBest"
            :duration-sec="remainingDisplay"
            @end="onGameEnd"
          />
        </div>

        <!-- Phase OVER : fin de partie -->
        <div v-else class="rpg-body rpg-over">
          <!-- Même fond corporate sobre que l'écran de démarrage -->
          <svg class="rpg-bg" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <pattern id="rpgDotsOver" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.3" fill="#1859B3" opacity=".10" />
              </pattern>
            </defs>
            <rect width="400" height="320" fill="url(#rpgDotsOver)" />
            <circle cx="360" cy="34" r="110" fill="#82C9E5" opacity=".16" />
            <circle cx="40" cy="304" r="120" fill="#1859B3" opacity=".07" />
          </svg>

          <div class="rpg-result-badge" :class="overWin ? 'win' : 'lose'">
            {{ overWin ? '🎉' : '📦' }}
          </div>
          <p class="rpg-q">{{ overTitle }}</p>
          <p class="rpg-text">{{ overText }}</p>

          <div class="rpg-stats">
            <div class="rpg-stat">
              <span class="rpg-stat-k">Votre score</span>
              <b class="rpg-stat-v">{{ lastResult.score }}</b>
            </div>
            <div class="rpg-stat">
              <span class="rpg-stat-k"><i class="pi pi-trophy"></i> Record</span>
              <b class="rpg-stat-v">{{ currentBest }}</b>
            </div>
          </div>
          <div v-if="isNewBest" class="rpg-newbest-banner"><i class="pi pi-star-fill"></i> Nouveau record !</div>

          <!-- Temps de pause restant (budget partagé entre les essais — les 3 jeux) -->
          <p class="rpg-remain" :class="{ done: !canReplay }">
            <i class="pi pi-clock"></i>
            <template v-if="canReplay">Temps de pause restant : <b>{{ remainingDisplay }}s</b></template>
            <template v-else>Temps de pause écoulé — à bientôt !</template>
          </p>

          <div class="rpg-actions">
            <button v-if="canReplay" class="rpg-btn rpg-btn-primary" type="button" ref="firstBtn" @click="replay">
              Rejouer ({{ remainingDisplay }}s)
            </button>
            <button class="rpg-btn" :class="canReplay ? 'rpg-btn-secondary' : 'rpg-btn-primary'"
              :ref="canReplay ? undefined : 'firstBtn'" type="button" @click="onClose">
              Retour au travail
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import CatchStockGame from './CatchStockGame.vue'
import ManufacturerChallengeGame from './ManufacturerChallengeGame.vue'
import PathBasketGame from './PathBasketGame.vue'
import { useReaproPausePrompt } from '../../composables/useReaproPausePrompt'
import { useAuthStore } from '../../stores/auth'

const pause = useReaproPausePrompt()
const auth = useAuthStore()

// Prénom en priorité (accueil chaleureux), repli sur la même logique que la navbar.
const userName = computed(() =>
  auth.user?.firstname || auth.user?.prenom || auth.user?.lastname ||
  auth.user?.nom || auth.user?.name || 'cher utilisateur'
)

/* ── Rotation des mini-jeux Pause Reapro ── */
const GAMES = [
  { id: 'catchStock', name: 'Catch Stock', desc: 'Rattrape le stock dans le panier pendant 60 secondes.', playLabel: 'Jouer 60s', bestKey: 'reaproPauseGameBestScore', duration: 60, icon: '📦', accent: '🛒' },
  { id: 'manufacturerChallenge', name: 'Défi Fabricant', desc: 'Associe la référence au bon fabricant en 30 secondes.', playLabel: 'Jouer 30s', bestKey: 'reaproPauseGameBestScore.manufacturerChallenge', endTitle: 'Défi terminé', duration: 30, icon: '🏭', accent: '🔧' },
  { id: 'pathBasket', name: 'Chemin Panier', desc: 'Relie la pièce au panier avant la fin du temps.', playLabel: 'Jouer 60s', bestKey: 'reaproPauseGameBestScore.pathBasket', endTitle: 'Chemin terminé !', duration: 60, icon: '🧩', accent: '🛒' },
]
const gameIndex = ref(0)
const currentGame = computed(() => GAMES[gameIndex.value])
const isCatchStock = computed(() => currentGame.value.id === 'catchStock')
let lastGameIndex = -1

function readBest(key) { try { return parseInt(localStorage.getItem(key) || '0', 10) || 0 } catch { return 0 } }
function writeBest(key, v) { try { localStorage.setItem(key, String(v)) } catch { /* quota/privé : ignoré */ } }

const bestScores = ref(GAMES.map(g => readBest(g.bestKey)))   // meilleur score par jeu (localStorage)
const currentBest = computed(() => bestScores.value[gameIndex.value] || 0)

function pickRandomGame() {
  if (GAMES.length <= 1) { gameIndex.value = 0; return }
  let idx
  do { idx = Math.floor(Math.random() * GAMES.length) } while (idx === lastGameIndex)
  gameIndex.value = idx
  lastGameIndex = idx
}
function prevGame() {
  if (GAMES.length <= 1) return
  gameIndex.value = (gameIndex.value - 1 + GAMES.length) % GAMES.length
  lastGameIndex = gameIndex.value
  sessionUsedSec.value = 0   // budget plein pour le jeu choisi
}
function nextGame() {
  if (GAMES.length <= 1) return
  gameIndex.value = (gameIndex.value + 1) % GAMES.length
  lastGameIndex = gameIndex.value
  sessionUsedSec.value = 0
}

const phase = ref('intro')          // 'intro' | 'playing' | 'over'
const gameKey = ref(0)              // remonte le jeu proprement à chaque (re)lancement
const lastResult = ref({ score: 0, won: false })
const isNewBest = ref(false)
const modal = ref(null)
const firstBtn = ref(null)

/* Budget de temps PARTAGÉ par jeu (total = durée du jeu). Vaut pour LES TROIS jeux :
   à la fin, on n'affiche jamais le timer plein — on continue sur le temps restant ;
   budget épuisé → plus de « Rejouer », seulement « Retour au travail ». */
const sessionTotalSec = computed(() => currentGame.value.duration || 60)
const sessionUsedSec = ref(0)
const sessionRemainingSec = computed(() => Math.max(0, sessionTotalSec.value - sessionUsedSec.value))
const remainingDisplay = computed(() => Math.max(0, Math.floor(sessionRemainingSec.value)))
const canReplay = computed(() => sessionRemainingSec.value >= 1)

/* Écran de fin — libellés selon le jeu */
const overWin = computed(() => !isCatchStock.value || lastResult.value.won)
const overTitle = computed(() => {
  if (isCatchStock.value) return lastResult.value.won ? 'Pause terminée !' : 'Stock tombé !'
  return currentGame.value.endTitle || 'Partie terminée !'
})
const overText = computed(() => {
  if (!isCatchStock.value) return 'Bien joué — de retour, l\'esprit plus léger.'
  return lastResult.value.won ? 'Beau jeu — de retour, l\'esprit plus léger.' : 'Presque ! Une autre tentative ?'
})

function focusFirst() {
  nextTick(() => {
    if (firstBtn.value) firstBtn.value.focus()
    else if (modal.value) modal.value.focus()
  })
}

function startGame() {
  sessionUsedSec.value = 0   // (Catch Stock) budget plein
  gameKey.value++
  phase.value = 'playing'
}

function replay() {
  if (!canReplay.value) return
  gameKey.value++
  phase.value = 'playing'
}

function applyBest(score) {
  const i = gameIndex.value
  const prev = bestScores.value[i] || 0
  isNewBest.value = score > prev
  if (score > prev) {
    const next = bestScores.value.slice()
    next[i] = score
    bestScores.value = next
    writeBest(currentGame.value.bestKey, score)
  }
}

function onGameEnd({ score, won, elapsedSec }) {
  // décrémente le budget du temps réellement joué (vaut pour les 3 jeux)
  sessionUsedSec.value = Math.min(sessionTotalSec.value, sessionUsedSec.value + (elapsedSec || 0))
  applyBest(score)
  lastResult.value = { score, won }
  phase.value = 'over'
  focusFirst()
}

// Défi Fabricant : API en échec → bascule douce sur Catch Stock.
function fallbackToCatchStock() {
  const i = GAMES.findIndex(g => g.id === 'catchStock')
  if (i >= 0) { gameIndex.value = i; lastGameIndex = i }
  startGame()
}

function onClose() { pause.close() }

// À chaque ouverture : jeu proposé ALÉATOIREMENT, on repart sur la proposition (jamais le jeu directement).
watch(() => pause.showDialog.value, (open) => {
  if (open) {
    pickRandomGame()
    phase.value = 'intro'
    isNewBest.value = false
    sessionUsedSec.value = 0
    focusFirst()
  }
})
</script>

<style scoped>
.rpg-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15, 23, 42, .55);
  backdrop-filter: blur(2px);
  font-family: var(--c2-font-sans);
}

.rpg-modal {
  position: relative;
  z-index: 1201;
  width: min(680px, 94vw);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, .35);
  overflow: hidden;
  outline: none;
}

/* Header Deep Ocean — texte blanc (charte dialogs C2) */
.rpg-head {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--c2-head-bg);
  border-bottom: 1px solid var(--c2-head-border);
  padding: 12px 16px;
  flex-shrink: 0;
}
.rpg-head-titles { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
.rpg-title { color: #fff; font-size: 1rem; font-weight: 800; letter-spacing: -.01em; margin: 0; line-height: 1.3; }
.rpg-close {
  flex-shrink: 0; width: 30px; height: 28px; border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, .22); background: rgba(255, 255, 255, .12);
  color: #e2e8f0; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
  transition: background .15s, color .15s;
}
.rpg-close:hover { background: var(--c2-cobalt); border-color: var(--c2-cobalt); color: #fff; }
.rpg-close:focus-visible { outline: 2px solid var(--c2-focus); outline-offset: 2px; }
.rpg-close i { font-size: .82rem; }

/* Hauteur de corps COMMUNE aux 3 phases → le dialog ne change pas de taille
   entre l'écran de démarrage et le jeu (même enveloppe que l'aire de jeu). */
.rpg-body {
  padding: 20px;
  overflow: auto;
  min-height: clamp(430px, 60vh, 562px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* INTRO + OVER : centrés verticalement dans la même hauteur, sobres, même fond corporate */
.rpg-intro, .rpg-over {
  text-align: center; align-items: center; justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(160deg, #f7fafd 0%, #eef4fa 100%);
}
.rpg-bg { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
.rpg-intro > *:not(.rpg-bg):not(.rpg-nav),
.rpg-over > *:not(.rpg-bg) { position: relative; z-index: 1; }

/* Accueil personnalisé */
.rpg-hello { font-size: .95rem; color: #475569; font-weight: 600; margin: 0 0 2px; }
.rpg-hello b { color: var(--c2-deep-ocean); font-weight: 800; }
.rpg-wave { display: inline-block; transform-origin: 70% 80%; animation: rpg-wave 2.4s ease-in-out infinite; }
@keyframes rpg-wave { 0%,60%,100% { transform: rotate(0); } 70% { transform: rotate(16deg); } 80% { transform: rotate(-8deg); } 90% { transform: rotate(12deg); } }

/* Médaillon thématique du jeu (image significative par jeu) */
.rpg-medal {
  position: relative; width: 122px; height: 122px; margin: 8px auto 12px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(120% 120% at 50% 18%, #0a3a68, #002A51);
  box-shadow: 0 0 0 4px rgba(130, 201, 229, .55), 0 10px 22px rgba(15, 23, 42, .28);
  animation: rpg-pop .35s ease;
}
.rpg-medal-svg { width: 66%; height: 66%; display: block; filter: drop-shadow(0 3px 6px rgba(0,0,0,.28)); }
@keyframes rpg-pop { from { transform: scale(.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .rpg-wave, .rpg-medal { animation: none; } }

/* Chip nom du jeu proposé (clair et identifiable) */
.rpg-gamechip {
  display: inline-flex; align-items: center; gap: 6px; align-self: center;
  background: var(--c2-head-bg); color: #fff; border: 1px solid var(--c2-head-border);
  border-radius: 999px; padding: 5px 16px; font-size: .9rem; font-weight: 800; letter-spacing: .01em;
  margin: 0 0 6px;
}
.rpg-gamechip i { color: var(--c2-head-accent); font-size: .82rem; }

/* Pastille meilleur score */
.rpg-best-pill {
  display: inline-flex; align-items: center; gap: 6px; align-self: center;
  background: #eff6ff; border: 1px solid #dbeafe; color: var(--c2-cobalt);
  border-radius: 999px; padding: 5px 14px; font-size: .82rem; font-weight: 700; margin: 4px 0 16px;
}
.rpg-best-pill i { color: #f59e0b; font-size: .82rem; }
.rpg-best-pill b { color: var(--c2-deep-ocean); font-variant-numeric: tabular-nums; }
/* Flèches de navigation entre les jeux (bords du dialog, centre vertical) */
.rpg-nav {
  position: absolute; top: 50%; transform: translateY(-50%); z-index: 3;
  width: 34px; height: 34px; border-radius: 50%; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  background: #fff; border: 1px solid #dbe6f3; color: var(--c2-cobalt);
  box-shadow: 0 4px 12px rgba(15, 23, 42, .14); transition: background .15s, transform .12s, box-shadow .15s;
}
.rpg-nav-left { left: 6px; }
.rpg-nav-right { right: 6px; }
.rpg-nav:hover { background: var(--c2-cobalt); color: #fff; box-shadow: 0 6px 16px rgba(24, 89, 179, .3); }
.rpg-nav:active { transform: translateY(-50%) scale(.94); }
.rpg-nav:focus-visible { outline: 2px solid var(--c2-focus); outline-offset: 2px; }
.rpg-nav i { font-size: .9rem; }
.rpg-q { font-size: 1.12rem; font-weight: 800; color: var(--c2-deep-ocean); margin: 6px 0 4px; }
.rpg-text { font-size: .9rem; color: #475569; margin: 0 0 10px; }

/* ── Écran de fin : badge résultat + tuiles de stats + bannière record ── */
.rpg-result-badge {
  width: 64px; height: 64px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.9rem; margin: 0 auto 6px;
  box-shadow: 0 6px 16px rgba(15, 23, 42, .18);
}
.rpg-result-badge.win { background: linear-gradient(180deg, #dcfce7, #bbf7d0); }
.rpg-result-badge.lose { background: linear-gradient(180deg, #eef4fa, #dbe7f3); }

.rpg-stats { display: flex; gap: 10px; justify-content: center; margin: 8px 0 10px; flex-wrap: wrap; }
.rpg-stat {
  min-width: 122px; display: flex; flex-direction: column; gap: 3px; align-items: center;
  background: rgba(255, 255, 255, .82); border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 10px 18px; box-shadow: 0 2px 6px rgba(15, 23, 42, .06);
}
.rpg-stat-k { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #64748b; }
.rpg-stat-k i { color: #f59e0b; }
.rpg-stat-v { font-size: 1.7rem; font-weight: 800; color: var(--c2-deep-ocean); font-variant-numeric: tabular-nums; line-height: 1; }

.rpg-newbest-banner {
  display: inline-flex; align-items: center; gap: 6px; align-self: center;
  background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d;
  font-weight: 800; font-size: .78rem; border-radius: 999px; padding: 5px 14px; margin: 0 0 14px;
}
.rpg-newbest-banner i { color: #16a34a; }

/* Temps de pause restant (budget partagé) */
.rpg-remain {
  display: inline-flex; align-items: center; gap: 6px; align-self: center;
  font-size: .82rem; color: #64748b; font-weight: 600; margin: 0 0 14px;
}
.rpg-remain i { color: var(--c2-cobalt); font-size: .82rem; }
.rpg-remain b { color: var(--c2-deep-ocean); font-variant-numeric: tabular-nums; }
.rpg-remain.done { color: #475569; }
.rpg-remain.done i { color: #94a3b8; }

/* PLAYING */
.rpg-play { padding: 14px; }

/* Actions */
.rpg-actions { display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; }
.rpg-actions-minor { margin-top: 12px; gap: 6px; }
.rpg-btn {
  height: 40px; padding: 0 1.25rem; border-radius: 8px; border: 1px solid transparent;
  font-size: .875rem; font-weight: 600; cursor: pointer; font-family: var(--c2-font-sans);
  transition: background .15s, border-color .15s, color .15s, transform .1s;
}
.rpg-btn:focus-visible { outline: 2px solid var(--c2-focus); outline-offset: 2px; }
.rpg-btn-primary { background: var(--c2-primary); color: #fff; }
.rpg-btn-primary:hover { background: var(--c2-primary-hover); transform: translateY(-1px); }
.rpg-btn-primary:active { transform: none; }
.rpg-btn-secondary { background: #fff; border-color: #e2e8f0; color: #475569; }
.rpg-btn-secondary:hover { background: #f1f5f9; border-color: #cbd5e1; }

.rpg-link {
  background: none; border: none; cursor: pointer; padding: 2px 4px;
  font-size: .78rem; font-weight: 600; color: var(--c2-cobalt); font-family: var(--c2-font-sans);
}
.rpg-link:hover { text-decoration: underline; }
.rpg-link:focus-visible { outline: 2px solid var(--c2-focus); outline-offset: 2px; border-radius: 4px; }
.rpg-link-mute { color: #94a3b8; }
.rpg-link-mute:hover { color: #64748b; }
.rpg-dot { color: #cbd5e1; font-size: .8rem; }

@media (max-height: 560px) {
  .rpg-body { padding: 12px; }
  .rpg-emoji { font-size: 1.8rem; }
}
</style>
