<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
    modelValue: {
        type: [String, Number],
        default: ''
    },
    options: {
        type: Array,
        required: true,
        // Expects objects with { id, name }
    },
    placeholder: {
        type: String,
        default: 'Sélectionner...'
    },
    disabled: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const searchQuery = ref('');
const dropdownRef = ref(null);
const searchInputRef = ref(null);

const selectedOption = computed(() => {
    return props.options.find(opt => opt.id === props.modelValue);
});

const displayText = (option) => {
    if (!option) return '';
    return `${option.id} - ${option.name}`;
};

const filteredOptions = computed(() => {
    const query = searchQuery.value.toLowerCase();
    if (!query) return props.options;
    return props.options.filter(opt =>
        opt.name.toLowerCase().includes(query) ||
        opt.id.toString().toLowerCase().includes(query)
    );
});

const toggleDropdown = () => {
    if (props.disabled) return;
    isOpen.value = !isOpen.value;
    if (isOpen.value) {
        searchQuery.value = '';
        nextTick(() => {
            if (searchInputRef.value) {
                searchInputRef.value.focus();
            }
        });
    }
};

const selectOption = (option) => {
    emit('update:modelValue', option.id);
    isOpen.value = false;
    searchQuery.value = '';
};

const closeDropdown = (e) => {
    if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
        isOpen.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', closeDropdown);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', closeDropdown);
});
</script>

<template>
    <div class="searchable-select" ref="dropdownRef">
        <!-- Trigger -->
        <div class="select-trigger" :class="{ 'is-open': isOpen, 'is-disabled': disabled }" @click="toggleDropdown">
            <span v-if="selectedOption" class="selected-text">{{ displayText(selectedOption) }}</span>
            <span v-else class="placeholder-text">{{ placeholder }}</span>
            <span class="arrow" :class="{ 'arrow-up': isOpen }">▼</span>
        </div>

        <!-- Dropdown Menu -->
        <div v-if="isOpen" class="select-dropdown">
            <div class="search-container">
                <input ref="searchInputRef" type="text" v-model="searchQuery" placeholder="Rechercher..."
                    class="dropdown-search-input" @click.stop />
            </div>
            <div class="options-list">
                <div v-for="option in filteredOptions" :key="option.id" class="option-item"
                    :class="{ 'is-selected': option.id === modelValue }" @click="selectOption(option)">
                    {{ displayText(option) }}
                </div>
                <div v-if="filteredOptions.length === 0" class="no-results">
                    Aucun résultat
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.searchable-select {
    position: relative;
    width: 100%;
}

.select-trigger {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background-color: white;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    cursor: pointer;
    user-select: none;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.select-trigger:hover:not(.is-disabled) {
    border-color: #94a3b8;
}

.select-trigger.is-open {
    border-color: #42b883;
    box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

.select-trigger.is-disabled {
    background-color: #f1f5f9;
    cursor: not-allowed;
    color: #94a3b8;
}

.selected-text {
    color: #1e293b;
}

.placeholder-text {
    color: #94a3b8;
}

.arrow {
    font-size: 0.75rem;
    color: #64748b;
    transition: transform 0.2s;
}

.arrow-up {
    transform: rotate(180deg);
}

.select-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background-color: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    z-index: 50;
    overflow: hidden;
}

.search-container {
    padding: 0.5rem;
    border-bottom: 1px solid #e2e8f0;
    background-color: #f8fafc;
}

.dropdown-search-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    font-size: 0.875rem;
    outline: none;
}

.dropdown-search-input:focus {
    border-color: #42b883;
}

.options-list {
    max-height: 200px;
    overflow-y: auto;
}

.option-item {
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    color: #334155;
    transition: background-color 0.1s;
}

.option-item:hover {
    background-color: #f1f5f9;
}

.option-item.is-selected {
    background-color: #ecfdf5;
    color: #059669;
    font-weight: 500;
}

.no-results {
    padding: 0.75rem;
    text-align: center;
    color: #94a3b8;
    font-size: 0.875rem;
}
</style>
