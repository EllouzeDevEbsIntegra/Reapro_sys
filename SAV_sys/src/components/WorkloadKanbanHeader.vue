<template>
    <div class="kanban-header-bar">
        <!-- Left: Team Info -->
        <div class="header-left" v-if="activeTeam">
            <h3 class="current-team-name">{{ activeTeam.teamName }}</h3>
            <span class="current-team-count">{{ activeTeam.resources ?
                Object.keys(activeTeam.resources).length : 0 }} ressources</span>

            <!-- Team Stats Bar -->
            <div class="team-stats-bar" v-if="teamStats">
                <span class="stats-period-label">Stats {{ currentYear }} :</span>
                <!-- Planned -->
                <div class="stat-group">
                    <span class="stat-label">Prévu:</span>
                    <span class="stat-val">{{ formatNumber(teamStats.current.totalPlannedHours) }} h</span>
                </div>

                <!-- Real -->
                <div class="stat-group">
                    <span class="stat-label">Réel:</span>
                    <span class="stat-val">{{ formatNumber(teamStats.current.totalRealHours) }} h</span>
                </div>

                <!-- Efficiency -->
                <div class="stat-group">
                    <span class="stat-label">Eff:</span>
                    <span class="stat-val">{{ Math.round(teamStats.current.efficiency * 100) }}%</span>
                </div>
            </div>
        </div>

        <!-- Center: Tabs -->
        <div class="header-center">
            <div class="custom-tabs">
                <div v-for="(team, index) in teams" :key="team.teamName" class="custom-tab-item"
                    :class="{ 'active': activeTabIndex === index }" @click="$emit('update:activeTabIndex', index)">
                    {{ team.teamName }}
                </div>
            </div>
        </div>

        <div class="header-right">
            <button @click="$emit('export-excel')" class="export-excel-btn" title="Exporter les données de l'équipe">
                <i class="pi pi-file-excel"></i>
                <span>Exporter</span>
            </button>
            <button @click="$emit('update:isExpanded', !isExpanded)" class="kanban-toggle-btn-header">
                <i :class="isExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
                <span>{{ isExpanded ? 'Masquer' : 'Afficher' }}</span>
            </button>
        </div>
    </div>
</template>

<script setup>
defineProps({
    activeTeam: Object,
    teamStats: Object,
    teams: Array,
    activeTabIndex: Number,
    isExpanded: Boolean,
    formatNumber: Function
});

defineEmits(['update:activeTabIndex', 'update:isExpanded', 'export-excel']);
</script>

<style scoped>
.kanban-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: white;
    padding: 0.5rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    margin-bottom: 1rem;
    border: 1px solid #e2e8f0;
}

.header-left {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    min-width: 200px;
}

.current-team-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

.current-team-count {
    font-size: 0.85rem;
    color: #64748b;
}

.team-stats-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: #f8fafc;
    padding: 0.35rem 0.75rem;
    border-radius: 8px;
    margin-left: 1rem;
    border: 1px solid #e2e8f0;
}

.stats-period-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-right: 0.25rem;
}

.stat-group {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.8rem;
}

.stat-label {
    color: #64748b;
    font-weight: 500;
}

.stat-val {
    font-weight: 700;
    color: #1e293b;
}

.header-center {
    flex: 1;
    display: flex;
    justify-content: center;
}

.custom-tabs {
    display: flex;
    gap: 2.5rem;
    padding: 0 1rem;
}

.custom-tab-item {
    cursor: pointer;
    padding: 0.75rem 0;
    color: #64748b;
    font-weight: 600;
    font-size: 0.95rem;
    transition: all 0.2s ease;
    position: relative;
    border-bottom: 3px solid transparent;
}

.custom-tab-item:hover {
    color: #334155;
}

.custom-tab-item.active {
    color: #1e293b;
    border-bottom-color: #22c55e;
}

.header-right {
    min-width: 200px;
    display: flex;
    justify-content: flex-end;
}

.kanban-toggle-btn-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: transparent;
    border: 1px solid #e2e8f0;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    color: #64748b;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.kanban-toggle-btn-header:hover {
    background: #f8fafc;
    color: #334155;
    border-color: #cbd5e1;
}

.export-excel-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    color: #16a34a;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-right: 0.75rem;
}

.export-excel-btn:hover {
    background: #dcfce7;
    border-color: #86efac;
    box-shadow: 0 2px 4px rgba(22, 163, 74, 0.1);
}

.export-excel-btn i {
    font-size: 0.9rem;
}
</style>
