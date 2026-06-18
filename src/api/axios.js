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

// Response Interceptor: Handle Token Refresh
// 401 = NON authentifié (token absent/expiré) -> refresh puis logout si échec.
// 403 = authentifié mais accès refusé -> NE JAMAIS déconnecter ; on laisse la vue afficher
//       "Accès interdit ou droits insuffisants." (évite la déconnexion intempestive sur 403).
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        const status = error.response?.status

        if (status === 401) {
            const refreshToken = localStorage.getItem('refreshToken')

            if (refreshToken && !originalRequest._retry) {
                originalRequest._retry = true

                try {
                    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh-token?refreshToken=${refreshToken}`)
                    const { accessToken, refreshToken: newRefreshToken } = response.data

                    localStorage.setItem('accessToken', accessToken)
                    localStorage.setItem('refreshToken', newRefreshToken)

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`
                    return apiClient(originalRequest)
                } catch (refreshError) {
                    // Refresh token expiré ou invalide -> déconnexion
                    localStorage.removeItem('accessToken')
                    localStorage.removeItem('refreshToken')
                    router.push('/?sessionExpired=true')
                    return Promise.reject(refreshError)
                }
            } else {
                // Pas de refresh token ou déjà retenté -> déconnexion
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                router.push('/?sessionExpired=true')
            }
        } else if (status === 403) {
            // Accès interdit : on NE déconnecte PAS. Message métier exploitable par les vues.
            error.isForbidden = true
            if (error.response && !error.response.data?.message) {
                error.response.data = { ...(error.response.data || {}), message: 'Accès interdit ou droits insuffisants.' }
            }
        }

        return Promise.reject(error)
    }
)

export default apiClient
