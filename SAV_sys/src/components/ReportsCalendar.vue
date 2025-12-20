<template>
    <div class="calendar-grid-container">
        <!-- Monthly View -->
        <template v-if="viewMode === 'monthly'">
            <!-- Weekday Headers -->
            <div class="weekday-row">
                <div class="weekday-header">Lun</div>
                <div class="weekday-header">Mar</div>
                <div class="weekday-header">Mer</div>
                <div class="weekday-header">Jeu</div>
                <div class="weekday-header">Ven</div>
                <div class="weekday-header">Sam</div>
                <div class="weekday-header">Dim</div>
            </div>

            <!-- Days Grid -->
            <div class="days-grid">
                <!-- Empty cells -->
                <div v-for="n in emptyCells" :key="'empty-' + n" class="calendar-day empty"></div>

                <!-- Days -->
                <div v-for="day in daysInMonth" :key="day.toISOString()" class="calendar-day" :class="{
                    'weekend': isWeekend(day),
                    'today': isToday(day)
                }">
                    <div class="day-number">{{ day.getDate() }}</div>
                    <div v-if="getHoursForDay(day) > 0" class="day-hours">
                        {{ getHoursForDay(day) }} H
                    </div>
                </div>
            </div>
        </template>

        <!-- Yearly View -->
        <template v-else>
            <div class="yearly-grid">
                <div v-for="monthData in yearlyData" :key="monthData.month" class="month-card">
                    <div class="month-header">
                        <span class="month-name">{{ getMonthName(monthData.month) }}</span>
                        <span class="month-perf" :style="{ color: getPerfColor(monthData.achievementRate) }">
                            {{ Math.round(monthData.achievementRate) }}%
                        </span>
                    </div>
                    <div class="month-body">
                        <div class="month-stat">
                            <span class="stat-label">Réalisé</span>
                            <span class="stat-value">{{ monthData.actualHours.toFixed(1) }} h</span>
                        </div>
                        <div class="month-stat">
                            <span class="stat-label">Objectif</span>
                            <span class="stat-value">{{ monthData.targetHours.toFixed(1) }} h</span>
                        </div>
                    </div>
                    <div class="month-footer">
                        <div class="perf-bar-bg">
                            <div class="perf-bar-fill" :style="{
                                width: Math.min(monthData.achievementRate, 100) + '%',
                                backgroundColor: getPerfColor(monthData.achievementRate)
                            }">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    daysInMonth: Array,
    dailyLogs: Array,
    isWeekend: Function,
    isToday: Function,
    viewMode: String,
    yearlyData: Array
});

const getMonthName = (monthNum) => {
    const date = new Date(2025, monthNum - 1, 1);
    return date.toLocaleDateString('fr-FR', { month: 'long' });
};

const getPerfColor = (perf) => {
    if (perf >= 100) return '#10b981';
    if (perf >= 75) return '#f59e0b';
    return '#ef4444';
};

const emptyCells = computed(() => {
    if (!props.daysInMonth.length) return 0;
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    // We want 0 for Monday, 6 for Sunday.
    let firstDay = props.daysInMonth[0].getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
});

const getHoursForDay = (day) => {
    const dayStr = day.toISOString().split('T')[0];
    const dayLogs = props.dailyLogs.filter(log => log.date === dayStr);
    const total = dayLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
    return Math.round(total * 100) / 100;
};
</script>

<style scoped>
.calendar-grid-container {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
}

.weekday-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
}

.weekday-header {
    text-align: center;
    font-weight: 600;
    color: #64748b;
    padding: 0.5rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    border-right: 1px solid #e2e8f0;
}

.weekday-header:last-child {
    border-right: none;
}

.days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    flex: 1;
    overflow-y: auto;
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #f1f5f9;
    align-content: start;
}

.calendar-day {
    border-right: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
    padding: 0.125rem 0.5rem;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background: white;
    font-size: 0.75rem;
    position: relative;
    height: 90px;
    min-height: 90px;
}

.calendar-day:nth-child(7n) {
    border-right: none;
}

.calendar-day.empty {
    background: #fcfcfc;
}

.calendar-day.today {
    background: #eff6ff;
}

.calendar-day.today .day-number {
    background: #3b82f6;
    color: white;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
}

.day-number {
    font-weight: 600;
    font-size: 0.875rem;
    color: #1e293b;
    margin: 0;
    padding: 0;
    z-index: 2;
}

.day-hours {
    font-size: 0.75rem;
    font-weight: 700;
    color: white;
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    margin: 0;
    box-shadow: 0 1px 2px rgba(234, 88, 12, 0.2);
    width: auto;
    min-width: 40px;
    text-align: center;
    z-index: 2;
}

/* Yearly Grid Styling */
.yearly-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.6rem;
    padding: 0.5rem 0;
    flex: 1;
    overflow-y: auto;
    background: #f8fafc;
}

.month-card {
    background: white;
    border-radius: 12px;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: all 0.2s;
    min-height: 150px;
    justify-content: center;
}

.month-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border-color: #cbd5e1;
}

.month-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.month-name {
    font-weight: 700;
    color: #1e293b;
    text-transform: capitalize;
    font-size: 1rem;
}

.month-perf {
    font-weight: 700;
    font-size: 0.875rem;
}

.month-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.month-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.stat-label {
    font-size: 0.75rem;
    color: #64748b;
}

.stat-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #334155;
}

.month-footer {
    margin-top: auto;
}

.perf-bar-bg {
    height: 6px;
    background: #f1f5f9;
    border-radius: 3px;
    overflow: hidden;
}

.perf-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease-out;
}
</style>
