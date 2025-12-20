<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import api from '../services/api';

const props = defineProps({
    src: {
        type: String,
        required: true
    },
    alt: {
        type: String,
        default: ''
    },
    class: {
        type: String,
        default: ''
    }
});

const imageUrl = ref(null);
const loading = ref(true);
const error = ref(false);

const loadImage = async () => {
    if (!props.src) {
        error.value = true;
        loading.value = false;
        return;
    }

    loading.value = true;
    error.value = false;

    try {
        // If it's a data URL or blob URL, use it directly
        if (props.src.startsWith('data:') || props.src.startsWith('blob:')) {
            imageUrl.value = props.src;
            loading.value = false;
            return;
        }

        // Fetch with authentication headers
        const response = await api.get(props.src, { responseType: 'blob' });

        if (imageUrl.value) {
            URL.revokeObjectURL(imageUrl.value);
        }

        imageUrl.value = URL.createObjectURL(response.data);
    } catch (e) {
        console.error('Failed to load secure image:', e);
        error.value = true;
    } finally {
        loading.value = false;
    }
};

watch(() => props.src, () => {
    loadImage();
});

onMounted(() => {
    loadImage();
});

onBeforeUnmount(() => {
    if (imageUrl.value && !imageUrl.value.startsWith('data:')) {
        URL.revokeObjectURL(imageUrl.value);
    }
});
</script>

<template>
    <div class="secure-image-container" :class="props.class">
        <div v-if="loading" class="loading-placeholder">
            <i class="pi pi-spin pi-spinner"></i>
        </div>
        <img v-else-if="!error && imageUrl" :src="imageUrl" :alt="alt" class="secure-img" />
        <div v-else class="error-placeholder">
            <slot name="error">
                <span class="fallback-icon">-</span>
            </slot>
        </div>
    </div>
</template>

<style scoped>
.secure-image-container {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.secure-img {
    width: 100%;
    height: 100%;
    object-fit: inherit;
}

.loading-placeholder,
.error-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: #f8fafc;
    color: #94a3b8;
}

.fallback-icon {
    font-size: 0.8rem;
}
</style>
