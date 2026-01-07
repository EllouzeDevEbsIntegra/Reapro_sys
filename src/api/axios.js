import axios from 'axios'
import router from '../router'

const apiClient = axios.create({
    baseURL: 'http://localhost:8057',
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
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401) {
            const refreshToken = localStorage.getItem('refreshToken')

            if (refreshToken && !originalRequest._retry) {
                originalRequest._retry = true

                try {
                    const response = await axios.post(`http://localhost:8057/api/auth/refresh-token?refreshToken=${refreshToken}`)
                    const { accessToken, refreshToken: newRefreshToken } = response.data

                    localStorage.setItem('accessToken', accessToken)
                    localStorage.setItem('refreshToken', newRefreshToken)

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`
                    return apiClient(originalRequest)
                } catch (refreshError) {
                    // Refresh token expired or invalid
                    localStorage.removeItem('accessToken')
                    localStorage.removeItem('refreshToken')
                    router.push('/?sessionExpired=true')
                    return Promise.reject(refreshError)
                }
            } else {
                // No refresh token or already retried
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                router.push('/?sessionExpired=true')
            }
        }

        if (error.response?.status === 403) {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            router.push('/?sessionExpired=true')
        }

        return Promise.reject(error)
    }
)

export default apiClient
