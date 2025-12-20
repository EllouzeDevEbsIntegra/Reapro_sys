import axios from 'axios'

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

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true
            const refreshToken = localStorage.getItem('refreshToken')

            if (refreshToken) {
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
                    window.location.href = '/'
                    return Promise.reject(refreshError)
                }
            }
        }

        return Promise.reject(error)
    }
)

export default apiClient
