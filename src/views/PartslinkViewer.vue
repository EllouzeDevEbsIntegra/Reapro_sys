<template>
  <div class="page-layout">
    <TheNavbar />

    <main class="main-content">
      <section class="viewer-card">
        <header class="viewer-header">
          <div>
            <h1>Catalogue Partslink</h1>
            <p class="sub">Visualisation integree via session navigateur distante</p>
          </div>

          <div class="status-pill" :class="statusClass">
            <span class="dot"></span>
            <span>{{ sessionState || 'UNKNOWN' }}</span>
          </div>
        </header>

        <div class="actions">
          <button class="btn btn-primary" :disabled="loading" @click="openViewer">
            {{ loading ? 'Ouverture...' : 'Ouvrir le catalogue Partslink' }}
          </button>
          <button class="btn btn-secondary" :disabled="loading" @click="restartViewer">
            Redemarrer la session Partslink
          </button>
          <button class="btn btn-ghost" :disabled="loading" @click="closeViewer">
            Fermer la session
          </button>
          <button class="btn btn-ghost" :disabled="loading" @click="refreshStatus">
            Rafraichir statut
          </button>
        </div>

        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
        <p v-else-if="statusMessage" class="status-msg">{{ statusMessage }}</p>

        <div class="viewer-shell">
          <iframe
            v-if="viewerUrl"
            :src="viewerUrl"
            title="Partslink Viewer"
            class="viewer-frame"
          ></iframe>
          <div v-else class="placeholder">
            Cliquez sur "Ouvrir le catalogue Partslink" pour demarrer la session.
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import TheNavbar from '@/components/TheNavbar.vue'
import {
  closePartslinkSession,
  createOrGetPartslinkSession,
  getPartslinkSessionStatus,
  restartPartslinkSession
} from '@/api/partslinkService'

const loading = ref(false)
const viewerUrl = ref('')
const sessionId = ref('')
const sessionState = ref('')
const statusMessage = ref('')
const errorMessage = ref('')

const statusClass = computed(() => {
  switch (sessionState.value) {
    case 'ACTIVE':
      return 'ok'
    case 'STARTING':
      return 'warn'
    case 'ERROR':
      return 'bad'
    case 'EXPIRED':
      return 'bad'
    default:
      return 'idle'
  }
})

const normalizeViewerUrl = (rawUrl) => {
  if (!rawUrl) return ''
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  if (apiBaseUrl) {
    return `${apiBaseUrl.replace(/\/$/, '')}/${rawUrl.replace(/^\//, '')}`
  }

  return `${window.location.origin}/${rawUrl.replace(/^\//, '')}`
}

const applySessionPayload = (payload) => {
  sessionId.value = payload?.sessionId || ''
  sessionState.value = payload?.state || ''
  statusMessage.value = payload?.message || ''
  const rawViewerUrl = payload?.viewerUrl || ''
  viewerUrl.value = normalizeViewerUrl(rawViewerUrl)
  console.log('[Partslink] raw viewerUrl:', rawViewerUrl)
  console.log('[Partslink] normalized viewerUrl:', viewerUrl.value)
}

const extractErrorMessage = (error, fallbackMessage) => {
  const serverMessage = error?.response?.data?.message
  if (serverMessage) return serverMessage
  return fallbackMessage
}

const openViewer = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const payload = await createOrGetPartslinkSession()
    applySessionPayload(payload)
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'Impossible de demarrer la session Partslink.')
  } finally {
    loading.value = false
  }
}

const refreshStatus = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const payload = await getPartslinkSessionStatus()
    applySessionPayload(payload)
    if (!payload?.active) {
      viewerUrl.value = ''
    }
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'Impossible de recuperer le statut Partslink.')
  } finally {
    loading.value = false
  }
}

const restartViewer = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const payload = await restartPartslinkSession()
    applySessionPayload(payload)
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'Impossible de redemarrer la session Partslink.')
  } finally {
    loading.value = false
  }
}

const closeViewer = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    await closePartslinkSession()
    viewerUrl.value = ''
    sessionId.value = ''
    sessionState.value = 'CLOSED'
    statusMessage.value = 'Session fermee.'
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'Impossible de fermer la session Partslink.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshStatus()
})
</script>

<style scoped>
.page-layout {
  min-height: 100vh;
  background: #f1f5f9;
}

.main-content {
  width: 100%;
  padding: 1rem 1.8rem 2rem;
}

.viewer-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #dbe3ee;
  box-shadow: 0 12px 28px rgba(12, 24, 44, 0.08);
  padding: 1.25rem;
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.viewer-header h1 {
  margin: 0;
  font-size: 1.4rem;
  color: #0f2442;
}

.sub {
  margin: 0.35rem 0 0;
  color: #4f607a;
  font-size: 0.92rem;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: 999px;
  padding: 0.4rem 0.72rem;
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
}

.status-pill .dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: currentColor;
}

.status-pill.ok {
  color: #0f7a42;
  background: #dcfce7;
}

.status-pill.warn {
  color: #955d00;
  background: #fef3c7;
}

.status-pill.bad {
  color: #9f1239;
  background: #ffe4e6;
}

.status-pill.idle {
  color: #475569;
  background: #e2e8f0;
}

.actions {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.btn {
  border: none;
  border-radius: 10px;
  padding: 0.56rem 0.9rem;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-primary {
  color: #ffffff;
  background: linear-gradient(120deg, #1d4ed8, #2563eb);
}

.btn-secondary {
  color: #ffffff;
  background: linear-gradient(120deg, #0f766e, #0d9488);
}

.btn-ghost {
  color: #0f2442;
  background: #e2e8f0;
}

.error-msg {
  margin-top: 0.9rem;
  color: #be123c;
  font-weight: 600;
}

.status-msg {
  margin-top: 0.9rem;
  color: #334155;
  font-weight: 600;
}

.viewer-shell {
  margin-top: 1rem;
  border: 1px solid #d7e1ee;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
}

.viewer-frame {
  width: 100%;
  height: calc(100vh - 210px);
  border: none;
}

.placeholder {
  min-height: calc(100vh - 210px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-weight: 600;
  padding: 1rem;
  text-align: center;
}

@media (max-width: 900px) {
  .main-content {
    padding: 0.75rem;
  }

  .viewer-header {
    flex-direction: column;
    align-items: stretch;
  }

  .viewer-frame,
  .placeholder {
    height: calc(100vh - 250px);
    min-height: calc(100vh - 250px);
  }
}
</style>
