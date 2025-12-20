
import { ref, computed } from 'vue';

// Global cache state
const cache = ref(new Map());
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function useDataCache() {

    /**
     * Set data in cache with optional TTL
     * @param {string} key - Cache key
     * @param {any} data - Data to store
     * @param {number} ttl - Time to live in ms (default 5 min)
     */
    const setCache = (key, data, ttl = DEFAULT_TTL) => {
        const expiresAt = Date.now() + ttl;
        cache.value.set(key, {
            data,
            expiresAt,
            timestamp: Date.now()
        });
        // console.log(`[Cache] Set: ${key} (Expires in ${ttl/1000}s)`);
    };

    /**
     * Get data from cache if valid
     * @param {string} key - Cache key
     * @returns {any|null} - Cached data or null if missing/expired
     */
    const getCache = (key) => {
        const item = cache.value.get(key);

        if (!item) return null;

        if (Date.now() > item.expiresAt) {
            // console.log(`[Cache] Expired: ${key}`);
            cache.value.delete(key);
            return null;
        }

        // console.log(`[Cache] Hit: ${key}`);
        return item.data;
    };

    /**
     * Clear specific key or entire cache
     * @param {string} [key] - Optional key to clear
     */
    const clearCache = (key) => {
        if (key) {
            cache.value.delete(key);
            // console.log(`[Cache] Cleared: ${key}`);
        } else {
            cache.value.clear();
            // console.log(`[Cache] Cleared All`);
        }
    };

    /**
     * Wrapper to fetch data with caching
     * @param {string} key - Cache key
     * @param {Function} fetchFn - Function to fetch data if cache miss
     * @param {number} ttl - TTL in ms
     * @returns {Promise<any>} - Data
     */
    const withCache = async (key, fetchFn, ttl = DEFAULT_TTL) => {
        const cached = getCache(key);
        if (cached) return cached;

        // console.log(`[Cache] Miss: ${key} - Fetching...`);
        const data = await fetchFn();
        setCache(key, data, ttl);
        return data;
    };

    // Computed stats for debugging
    const cacheStats = computed(() => {
        return {
            size: cache.value.size,
            keys: Array.from(cache.value.keys())
        };
    });

    return {
        setCache,
        getCache,
        clearCache,
        withCache,
        cacheStats
    };
}
