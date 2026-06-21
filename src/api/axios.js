import axios from 'axios'
import router from '../router'

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// ──────────────────────────────────────────────────────────────────────────
// Gestion de session côté intercepteur
//  - 401  = session invalide (token absent/expiré) → refresh UNIQUE sérialisé, sinon logout + /login.
//  - 403  = authentifié mais droits insuffisants → JAMAIS de logout (flag isForbidden + message).
//  - réseau/serveur injoignable (pas de réponse) → PAS de logout (session non confirmée invalide),
//    on signale une erreur douce via un évènement global (toast géré par App.vue).
// On NE logge JAMAIS de token.
// ──────────────────────────────────────────────────────────────────────────

const REFRESH_URL = '/api/auth/refresh-token'
const ME_URL = '/api/auth/me'

let isRefreshing = false
let pendingQueue = [] // requêtes en attente pendant un refresh : { resolve, reject }

// Vérification de session sérialisée (verrou). Utilisée sur 403 pour distinguer
// « session invalide » (le backend ne reconnaît plus le token) d'un « vrai 403 droits insuffisants ».
// Renvoie 'valid' (200), 'invalid' (401/403 ou autre réponse serveur) ou 'network' (aucune réponse).
let sessionCheck = null
const checkSession = () => {
    if (sessionCheck) return sessionCheck
    const token = localStorage.getItem('accessToken')
    sessionCheck = axios
        .get(`${import.meta.env.VITE_API_BASE_URL}${ME_URL}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        .then(() => 'valid')
        .catch((e) => (e.response ? 'invalid' : 'network'))
    // libère le verrou une fois la vérification terminée (les 403 concurrents partagent le même appel)
    sessionCheck.finally(() => { sessionCheck = null })
    return sessionCheck
}

const flushQueue = (error, token = null) => {
    pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
    pendingQueue = []
}

const clearSession = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
}

const emitNetworkError = () => {
    try { window.dispatchEvent(new CustomEvent('reapro:network-error')) } catch (_) { /* SSR/guard */ }
}

// Redirection vers la page de connexion (route '/'), en évitant les doubles redirections / boucles.
const redirectToLogin = () => {
    const current = router.currentRoute?.value
    if (!current || current.path === '/' || current.name === 'login') return
    const redirect = current.fullPath && current.fullPath !== '/' ? current.fullPath : undefined
    router.push({ path: '/', query: { sessionExpired: 'true', ...(redirect ? { redirect } : {}) } })
}

const hardLogout = () => {
    clearSession()
    redirectToLogin()
}

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config || {}

        // 1) Erreur réseau / serveur injoignable (aucune réponse HTTP) → NE PAS déconnecter
        if (!error.response) {
            error.isNetworkError = true
            emitNetworkError()
            return Promise.reject(error)
        }

        const status = error.response.status

        // 2) 401 → session invalide
        if (status === 401) {
            const isRefreshCall = typeof originalRequest.url === 'string' && originalRequest.url.includes(REFRESH_URL)
            const refreshToken = localStorage.getItem('refreshToken')

            // 401 sur le refresh lui-même, ou aucun refresh token, ou déjà rejoué → logout
            if (isRefreshCall || !refreshToken || originalRequest._retry) {
                hardLogout()
                return Promise.reject(error)
            }

            // Un refresh est déjà en cours → on met la requête en file d'attente
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    pendingQueue.push({
                        resolve: (newToken) => {
                            originalRequest._retry = true
                            originalRequest.headers.Authorization = `Bearer ${newToken}`
                            resolve(apiClient(originalRequest))
                        },
                        reject
                    })
                })
            }

            // Refresh unique (single-flight)
            originalRequest._retry = true
            isRefreshing = true
            try {
                const resp = await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL}${REFRESH_URL}?refreshToken=${encodeURIComponent(refreshToken)}`
                )
                const newAccess = resp.data?.accessToken
                const newRefresh = resp.data?.refreshToken
                if (!newAccess) throw new Error('refresh: no access token')

                localStorage.setItem('accessToken', newAccess)
                if (newRefresh) localStorage.setItem('refreshToken', newRefresh)

                flushQueue(null, newAccess)
                originalRequest.headers.Authorization = `Bearer ${newAccess}`
                return apiClient(originalRequest)
            } catch (refreshError) {
                flushQueue(refreshError, null)
                if (refreshError.response) {
                    // Le serveur a répondu (401/400…) → session réellement invalide → logout
                    hardLogout()
                } else {
                    // Réseau KO pendant le refresh → on ne déconnecte pas (session non confirmée invalide)
                    refreshError.isNetworkError = true
                    emitNetworkError()
                }
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        // 3) 403 → AMBIGU : peut être un vrai manque de droits OU une session non reconnue
        //    par le backend (token invalide mappé en 403). On lève l'ambiguïté via /api/auth/me.
        if (status === 403) {
            const isMeCall = typeof originalRequest.url === 'string' && originalRequest.url.includes(ME_URL)

            // 403 sur /me lui-même → session invalide → logout (et pas de boucle de vérification)
            if (isMeCall) {
                hardLogout()
                return Promise.reject(error)
            }

            const sessionState = await checkSession()
            if (sessionState === 'valid') {
                // Session OK → c'est un VRAI 403 (droits insuffisants) → PAS de logout
                error.isForbidden = true
                if (error.response && !error.response.data?.message) {
                    error.response.data = { ...(error.response.data || {}), message: 'Accès interdit ou droits insuffisants.' }
                }
                return Promise.reject(error)
            }
            if (sessionState === 'network') {
                // /me injoignable → on ne déconnecte pas (session non confirmée invalide)
                error.isNetworkError = true
                emitNetworkError()
                return Promise.reject(error)
            }
            // sessionState === 'invalid' → la session n'est plus reconnue → logout + login
            hardLogout()
            return Promise.reject(error)
        }

        return Promise.reject(error)
    }
)

export default apiClient
