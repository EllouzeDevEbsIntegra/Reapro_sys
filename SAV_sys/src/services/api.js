import axios from 'axios';
import router from '../router';

// Create an Axios instance
const api = axios.create({
    baseURL: 'http://localhost:8055/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token refresh state management
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Request interceptor to add the auth token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized - attempt token refresh
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');

            if (!refreshToken) {
                // No refresh token available - logout
                console.warn('No refresh token available. Logging out...');
                await handleLogout();
                return Promise.reject(error);
            }

            try {
                // Attempt to refresh the token
                const response = await axios.post(
                    `http://localhost:8055/api/auth/refresh-token?refreshToken=${refreshToken}`
                );

                const { accessToken, refreshToken: newRefreshToken } = response.data;

                // Update tokens in localStorage
                localStorage.setItem('token', accessToken);
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }

                // Update axios default header
                api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                // Update auth store
                try {
                    const { useAuthStore } = await import('../stores/auth.js');
                    const authStore = useAuthStore();
                    authStore.token = accessToken;
                } catch (err) {
                    console.error('Failed to update auth store:', err);
                }

                // Process queued requests
                processQueue(null, accessToken);

                // Retry the original request
                return api(originalRequest);

            } catch (refreshError) {
                // Refresh failed - logout user
                console.error('Token refresh failed:', refreshError);
                processQueue(refreshError, null);
                await handleLogout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Handle 403 Forbidden - permission issue (don't try to refresh)
        if (error.response && error.response.status === 403) {
            console.warn('Access forbidden:', error.config?.url);
            // Don't logout, just show the error
        }

        return Promise.reject(error);
    }
);

// Helper function to handle logout
async function handleLogout() {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');

    // Update auth store
    try {
        const { useAuthStore } = await import('../stores/auth.js');
        const authStore = useAuthStore();
        authStore.user = null;
        authStore.token = null;
        authStore.error = 'Session expirée. Veuillez vous reconnecter.';
    } catch (err) {
        console.error('Failed to update auth store:', err);
    }

    // Redirect to login
    if (router.currentRoute.value.path !== '/login') {
        router.push('/login');
    }
}

export default api;
