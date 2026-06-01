<template>
    <footer class="app-footer">
        <div class="footer-content">
            <span class="version-text" v-if="version">Version: {{ version.displayVersion }}</span>
            <span class="copyright">&copy; {{ new Date().getFullYear() }} Reapro System</span>
        </div>
    </footer>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const version = computed(() => authStore.version)

onMounted(async () => {
    if (!authStore.version) {
        await authStore.fetchVersion()
    }
})
</script>

<style scoped>
.app-footer {
    width: 100%;
    padding: 0.5rem 1rem;
    background-color: #f8fafc;
    border-top: 1px solid #e2e8f0;
    margin-top: auto;
}

.footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: #64748b;
}

.version-text {
    font-weight: 500;
}
</style>
