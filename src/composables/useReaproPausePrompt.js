/* ════════════════════════════════════════════════════════════════════════
   useReaproPausePrompt — déclencheur DISCRET du mini-jeu « Pause Reapro ».

   • 100 % frontend : aucun appel backend, aucune donnée métier/email/token.
   • localStorage UNIQUEMENT pour préférences + meilleur score.
   • Singleton (état au niveau module) → une seule instance partagée par l'app.
   • Mesure l'activité utilisateur (souris/clavier/scroll/tactile) et propose une
     micro-pause de 60 s après 60 min d'activité réelle, sans jamais bloquer.

   Règles : pas si désactivé / caché aujourd'hui / en snooze / < 3 h depuis la
   dernière proposition / sur une page d'auth / si un autre dialog est ouvert.
   ════════════════════════════════════════════════════════════════════════ */
import { ref } from 'vue'

/* Clés localStorage explicites — AUCUNE donnée métier/sensible n'y est stockée. */
const LS = {
  best: 'reaproPauseGameBestScore',
  lastPrompt: 'reaproPauseGameLastPromptAt',
  snoozed: 'reaproPauseGameSnoozedUntil',
  disabled: 'reaproPauseGameDisabled',
  hiddenToday: 'reaproPauseGameHiddenToday',
}

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE

/* ⚠️ Constante de test : raccourcit les délais en dev pour valider rapidement.
   VALEURS FINALES = false. Ne jamais committer à true. */
const TEST_MODE = false

// Seuils PROGRESSIFS de temps de travail EFFECTIF (non calendaire) avant proposition :
//   1ʳᵉ fois → 30 min · 2ᵉ fois → 45 min · ensuite → 60 min (à chaque fois).
// Pas de plafond horaire fixe (1/3 h supprimé) : seul l'espacement par temps effectif joue.
const PROMPT_THRESHOLDS_MS = TEST_MODE
  ? [15 * SECOND, 25 * SECOND, 35 * SECOND]
  : [30 * MINUTE, 45 * MINUTE, 60 * MINUTE]
const SNOOZE_MS = TEST_MODE ? 20 * SECOND : 60 * MINUTE            // « Plus tard » → repousse de 60 min
const IDLE_GAP_MS = 60 * SECOND   // au-delà de ce silence, on ne compte plus le temps comme « actif »
const TICK_MS = SECOND

/* Pages où l'on ne déclenche JAMAIS (auth) */
const AUTH_ROUTES = new Set(['login', 'register', 'forgot-password', 'reset-password'])

/* Sélecteurs d'autres overlays « importants » à respecter (ne pas s'imposer par-dessus) */
const BLOCKING_SELECTORS = '.p-dialog-mask, .p-dialog, .p-drawer-mask, .p-drawer, .p-confirmdialog'

/* ── État partagé (module-scoped → singleton) ── */
const showDialog = ref(false)
const bestScore = ref(readNum(LS.best, 0))

let activeMs = 0
let promptCount = 0          // nb de propositions déjà affichées (pilote le seuil progressif)
let lastActivityAt = Date.now()
let tickTimer = null
let bound = false
let routeNameGetter = () => null

/* ── Helpers localStorage (sûrs : try/catch, jamais d'exception remontée) ── */
function readNum(key, fallback = 0) {
  try {
    const v = parseInt(localStorage.getItem(key) || '', 10)
    return Number.isFinite(v) ? v : fallback
  } catch { return fallback }
}
function readStr(key) {
  try { return localStorage.getItem(key) || '' } catch { return '' }
}
function writeNum(key, value) {
  try { localStorage.setItem(key, String(value)) } catch { /* quota/private mode : on ignore */ }
}
function writeStr(key, value) {
  try { localStorage.setItem(key, value) } catch { /* idem */ }
}

function todayStr() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function anotherDialogOpen() {
  if (typeof document === 'undefined') return false
  try { return !!document.querySelector(BLOCKING_SELECTORS) } catch { return false }
}

function isEligible(now) {
  if (readStr(LS.disabled) === '1') return false
  if (readStr(LS.hiddenToday) === todayStr()) return false
  if (now < readNum(LS.snoozed, 0)) return false
  if (AUTH_ROUTES.has(routeNameGetter())) return false
  if (anotherDialogOpen()) return false
  return true
}

// Seuil de travail effectif requis pour la PROCHAINE proposition (30 → 45 → 60 → 60 …).
function currentThresholdMs() {
  const i = Math.min(promptCount, PROMPT_THRESHOLDS_MS.length - 1)
  return PROMPT_THRESHOLDS_MS[i]
}

function onActivity() {
  lastActivityAt = Date.now()
}

function tick() {
  const now = Date.now()
  // On ne cumule du temps « actif » que si l'utilisateur a bougé récemment
  // (et jamais pendant que le dialog est déjà ouvert).
  if (!showDialog.value && now - lastActivityAt <= IDLE_GAP_MS) activeMs += TICK_MS
  if (showDialog.value) return
  if (activeMs >= currentThresholdMs() && isEligible(now)) promptNow()
}

function promptNow() {
  promptCount++             // prochaine proposition utilisera le seuil suivant (30 → 45 → 60 …)
  activeMs = 0
  showDialog.value = true
}

/* ── Actions exposées au dialog ── */
function close() { showDialog.value = false }

function playLater() {
  writeNum(LS.snoozed, Date.now() + SNOOZE_MS)
  activeMs = 0
  close()
}

function hideToday() {
  writeStr(LS.hiddenToday, todayStr())
  activeMs = 0
  close()
}

function disablePauses() {
  writeStr(LS.disabled, '1')
  activeMs = 0
  close()
}

function open() { showDialog.value = true }   // ouverture manuelle (dev/test)

function updateBest(score) {
  if (typeof score === 'number' && score > bestScore.value) {
    bestScore.value = score
    writeNum(LS.best, score)
  }
}

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'wheel', 'touchstart', 'pointerdown']

function init(getRouteName) {
  if (typeof getRouteName === 'function') routeNameGetter = getRouteName
  if (bound || typeof window === 'undefined') return
  bound = true
  ACTIVITY_EVENTS.forEach(evt =>
    window.addEventListener(evt, onActivity, { passive: true })
  )
  tickTimer = window.setInterval(tick, TICK_MS)

  // Aide dev UNIQUEMENT (jamais en prod) : ouvrir le dialog / réinitialiser les prefs depuis la console.
  if (import.meta.env.DEV) {
    window.__reaproPause = {
      open,
      reset() { Object.values(LS).forEach(k => { try { localStorage.removeItem(k) } catch {} }); activeMs = 0 },
      state: () => ({ activeMs, best: bestScore.value, snoozed: readNum(LS.snoozed, 0), disabled: readStr(LS.disabled), hiddenToday: readStr(LS.hiddenToday) }),
    }
  }
}

function teardown() {
  if (!bound || typeof window === 'undefined') return
  ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, onActivity))
  if (tickTimer) { window.clearInterval(tickTimer); tickTimer = null }
  bound = false
}

export function useReaproPausePrompt() {
  return {
    showDialog,
    bestScore,
    init,
    teardown,
    open,
    close,
    playLater,
    hideToday,
    disablePauses,
    updateBest,
  }
}
