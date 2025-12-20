<template>
    <div class="kpi-sidebar">
        <!-- Resource Profile -->
        <div class="profile-card">
            <div class="avatar-container">
                <!-- Resource Picture -->
                <SecureImage v-if="selectedResource && selectedResourceData?.picture" :src="resourcePictureUrl"
                    :alt="selectedResourceData?.nom" class="avatar">
                    <template #error>
                        <Avatar icon="pi pi-user" shape="circle" size="xlarge" class="avatar-fallback" />
                    </template>
                </SecureImage>
                <!-- Team Picture (fallback if no resource selected) -->
                <SecureImage v-else-if="selectedTeam && selectedTeamData?.picture" :src="teamPictureUrl"
                    :alt="selectedTeamData?.name" class="avatar">
                    <template #error>
                        <Avatar icon="pi pi-users" shape="circle" size="xlarge" class="avatar-fallback" />
                    </template>
                </SecureImage>
                <!-- Default Fallback -->
                <div v-else class="avatar-fallback-container">
                    <img v-if="!selectedTeam && !selectedResource" src="../assets/global_view_icon.png"
                        class="global-view-img" alt="Vue Globale" />
                    <Avatar v-else :icon="selectedTeam ? 'pi pi-users' : 'pi pi-user'" shape="circle" size="xlarge"
                        class="avatar-fallback" />
                </div>
            </div>
            <h2 class="resource-name">
                {{ displayName }}
            </h2>
            <p class="resource-team">{{ displayTeam }}</p>
        </div>

        <!-- Performance Gauge -->
        <div class="gauge-card">
            <h3>Performance {{ viewMode === 'monthly' ? 'Mensuelle' : 'Annuelle' }}</h3>
            <div class="gauge-container">
                <Knob :modelValue="Math.min(performancePercentage, 100)" :size="120" :strokeWidth="10"
                    :valueColor="performanceColor" :valueTemplate="performancePercentage + '%'" readonly />
            </div>
            <div class="gauge-legend">
                <span class="objective-label">{{ monthlyObjective?.objectiveHours || 0 }} h</span>
                <span class="worked-label">{{ totalHoursWorked }} h</span>
            </div>
        </div>

        <!-- KPI Cards -->
        <div class="kpi-cards">
            <div class="kpi-card">
                <i class="pi pi-folder kpi-icon" style="color: #3b82f6"></i>
                <div class="kpi-content">
                    <div class="kpi-value">{{ uniqueProjects }}</div>
                    <div class="kpi-label">Dossiers</div>
                </div>
            </div>

            <div class="kpi-card">
                <i class="pi pi-check-circle kpi-icon" style="color: #10b981"></i>
                <div class="kpi-content">
                    <div class="kpi-value">{{ tasksCompleted }}</div>
                    <div class="kpi-label">Terminées</div>
                </div>
            </div>

            <div class="kpi-card">
                <i class="pi pi-spin pi-spinner kpi-icon" style="color: #f59e0b"></i>
                <div class="kpi-content">
                    <div class="kpi-value">{{ tasksInProgress }}</div>
                    <div class="kpi-label">En Cours</div>
                </div>
            </div>

            <div class="kpi-card">
                <i class="pi pi-clock kpi-icon" style="color: #6b7280"></i>
                <div class="kpi-content">
                    <div class="kpi-value">{{ tasksPending }}</div>
                    <div class="kpi-label">En Attente</div>
                </div>
            </div>

            <div class="kpi-card highlight-orange">
                <i class="pi pi-calendar kpi-icon"></i>
                <div class="kpi-content">
                    <div class="kpi-value">{{ totalHoursWorked }} h</div>
                    <div class="kpi-label">Heures</div>
                </div>
            </div>

            <div class="kpi-card highlight-emerald">
                <i class="pi pi-chart-line kpi-icon"></i>
                <div class="kpi-content">
                    <div class="kpi-value">{{ performancePercentage }}%</div>
                    <div class="kpi-label">Rentabilité</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import Knob from 'primevue/knob';
import Avatar from 'primevue/avatar';
import SecureImage from './SecureImage.vue';
import { computed } from 'vue';

const props = defineProps({
    selectedResource: [Number, String],
    selectedResourceData: Object,
    selectedTeam: [Number, String],
    selectedTeamData: Object,
    teams: Array,
    resourceTeam: Object,
    performancePercentage: Number,
    performanceColor: String,
    monthlyObjective: Object,
    totalHoursWorked: [String, Number],
    uniqueProjects: Number,
    tasksCompleted: Number,
    tasksInProgress: Number,
    tasksPending: Number,
    resourcePictureUrl: String,
    teamPictureUrl: String,
    viewMode: {
        type: String,
        default: 'monthly'
    }
});

const displayName = computed(() => {
    if (props.selectedResource) return props.selectedResourceData?.nom || '';
    if (props.selectedTeam) return props.selectedTeamData?.name || '';
    return 'Atelier Complet';
});

const displayTeam = computed(() => {
    if (props.selectedResource) return props.resourceTeam?.name || 'Non assigné';
    if (props.selectedTeam) return 'Vue Équipe';
    return 'Vue Globale';
});

// Knob needs a writable ref or a computed with getter if we want to use v-model, 
// but since it's readonly, we can just use a local computed.
const performancePercentageValue = computed(() => props.performancePercentage);
</script>

<style scoped>
.kpi-sidebar {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow-y: auto;
    height: 100%;
}

.profile-card,
.gauge-card,
.kpi-card {
    background: white;
    border-radius: 8px;
    padding: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #f1f5f9;
}

.profile-card {
    text-align: center;
}

.avatar-container {
    display: flex;
    justify-content: center;
    margin-bottom: 0.5rem;
    height: 230px;
}

.avatar {
    width: 200px;
    height: 200px;
}

:deep(.avatar img) {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid #e0e7ff;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.avatar-fallback {
    width: 200px !important;
    height: 200px !important;
    font-size: 4rem !important;
    background-color: #f1f5f9 !important;
    color: #94a3b8 !important;
    border: 4px solid #e0e7ff;
}

.avatar-fallback-container {
    width: 200px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.global-view-img {
    width: 200px;
    height: 200px;
    object-fit: contain;
    border-radius: 50%;
    background: white;
    padding: 10px;
    border: 4px solid #e0e7ff;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.resource-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0.125rem 0;
}

.resource-team {
    color: #64748b;
    font-size: 0.75rem;
    margin: 0;
}

.gauge-card h3 {
    text-align: center;
    font-size: 0.9rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #f1f5f9;
}

.gauge-container {
    display: flex;
    justify-content: center;
}

.gauge-legend {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 1rem;
    padding: 0 0.5rem;
}

.objective-label,
.worked-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
}

.objective-label::before {
    content: 'Objectif';
    font-size: 0.65rem;
    text-transform: uppercase;
    font-weight: 600;
    color: #94a3b8;
}

.worked-label::before {
    content: 'Réalisé';
    font-size: 0.65rem;
    text-transform: uppercase;
    font-weight: 600;
    color: #94a3b8;
}

.kpi-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
}

.kpi-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.125rem;
    transition: all 0.2s ease;
}

.kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.kpi-card.highlight-orange {
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    color: white;
    border: none;
}

.kpi-card.highlight-emerald {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
}

.kpi-card.highlight-orange .kpi-icon,
.kpi-card.highlight-emerald .kpi-icon {
    color: white !important;
}

.kpi-card.highlight-orange .kpi-label,
.kpi-card.highlight-emerald .kpi-label {
    color: rgba(255, 255, 255, 0.95);
}

.kpi-card.highlight-orange .kpi-value,
.kpi-card.highlight-emerald .kpi-value {
    color: white;
}

.kpi-icon {
    font-size: 1.125rem;
}

.kpi-value {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
}

.kpi-label {
    font-size: 0.65rem;
    color: #64748b;
    margin-top: 0.125rem;
}
</style>
