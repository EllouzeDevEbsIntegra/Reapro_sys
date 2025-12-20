<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { dataService } from '../services/dataService';
import TheNavbar from '../components/TheNavbar.vue';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Knob from 'primevue/knob';
import Calendar from 'primevue/calendar';
import ReportsKpiSidebar from '../components/ReportsKpiSidebar.vue';
import ReportsHeader from '../components/ReportsHeader.vue';
import ReportsCalendar from '../components/ReportsCalendar.vue';
import ReportsTrendChart from '../components/ReportsTrendChart.vue';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const resources = ref([]);
const teams = ref([]);
const selectedTeam = ref(null);
const selectedResource = ref(null);
const selectedMonth = ref(new Date());
const dailyLogs = ref([]);
const assignments = ref([]);
const monthlyObjective = ref(null);
const totalMonthHours = ref(0);
const achievementRate = ref(0);
const loading = ref(false);
const viewMode = ref('monthly'); // 'monthly' or 'yearly'
const yearlyData = ref([]); // Array of 12 month objects for yearly view

const loadData = async () => {
    const [allResources, allTeams] = await Promise.all([
        dataService.getResources(),
        dataService.getTeams()
    ]);
    resources.value = allResources;
    teams.value = allTeams;

    // Default: No selection (Global View)
    selectedTeam.value = null;
    selectedResource.value = null;

    // Load initial report (Global)
    loadReport();
};

const loadReport = async () => {
    if (!selectedMonth.value) return;

    loading.value = true;
    try {
        const year = selectedMonth.value.getFullYear();
        const month = selectedMonth.value.getMonth() + 1; // API expects 1-indexed month

        // Prepare params for API
        const params = {
            year: year
        };

        if (selectedResource.value) {
            params.ressourceId = selectedResource.value;
        } else if (selectedTeam.value) {
            params.teamId = selectedTeam.value;
        }

        if (viewMode.value === 'monthly') {
            params.month = month;
            const reportData = await dataService.getMonthlyHours(params);

            const hoursMap = reportData.totalHoursByDay || {};
            totalMonthHours.value = reportData.actualHours || 0;
            monthlyObjective.value = { objectiveHours: reportData.targetHours || 0 };
            achievementRate.value = reportData.achievementRate || 0;

            dailyLogs.value = Object.entries(hoursMap).map(([date, hours]) => ({
                date: date,
                hours: Number(Number(hours).toFixed(2))
            }));
        } else {
            // Yearly mode: Use the new optimized annual-hours API
            const annualData = await dataService.getAnnualHours(params);

            const months = Array.from({ length: 12 }, (_, i) => i + 1);
            yearlyData.value = months.map(m => {
                const monthKey = String(m).padStart(2, '0');
                const actualHours = annualData?.totalHoursByMonth?.[monthKey] || 0;
                const targetHours = annualData?.targetHoursByMonth?.[monthKey] || 0;

                return {
                    month: m,
                    actualHours: actualHours,
                    targetHours: targetHours,
                    achievementRate: targetHours > 0 ? (actualHours / targetHours) * 100 : 0
                };
            });

            // Aggregate for the sidebar KPIs
            totalMonthHours.value = annualData?.totalYearHours || 0;
            const totalTarget = annualData?.totalTargetHoursYear || 0;
            achievementRate.value = annualData?.achievementRateYear || 0;
            monthlyObjective.value = { objectiveHours: totalTarget };

            // Clear daily logs in yearly view
            dailyLogs.value = [];
        }

        // Load assignments and compositions for the selected scope (always needed for KPIs)
        const [allAssignments, allCompositions] = await Promise.all([
            dataService.getResourceAssignments(),
            dataService.getProjectCompositions()
        ]);

        let filteredAssignments = [];
        if (selectedResource.value) {
            filteredAssignments = allAssignments.filter(a => a.resourceId === selectedResource.value);
        } else if (selectedTeam.value) {
            const teamResourceIds = resources.value
                .filter(r => r.teamId === selectedTeam.value)
                .map(r => r.id);
            filteredAssignments = allAssignments.filter(a => teamResourceIds.includes(a.resourceId));
        } else {
            filteredAssignments = allAssignments;
        }

        // Filter assignments by year if in yearly mode, or by month if in monthly mode
        if (viewMode.value === 'monthly') {
            const monthStr = `${year}-${String(month).padStart(2, '0')}`;
            // Note: In a real app, we'd filter assignments by date. 
            // For now, we keep the existing logic which might be global or month-based depending on API.
            // If the API getResourceAssignments returns everything, we might need to filter by date here.
        }

        // Enrich assignments with projectId for KPI calculations
        assignments.value = filteredAssignments.map(a => {
            const comp = allCompositions.find(c => c.id === (a.projectCompositionId || a.subtaskId));
            return {
                ...a,
                projectId: a.projectId || comp?.projectId
            };
        });

    } catch (error) {
        console.error("Error loading report", error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    loadData();
});

watch([selectedTeam, selectedResource, selectedMonth, viewMode], () => {
    loadReport();
});

// Reset resource selection when team changes
watch(selectedTeam, () => {
    // Do NOT auto-select resource to allow "Team View"
    // Only clear resource if the selected resource is not in the new team
    if (selectedResource.value) {
        const resource = resources.value.find(r => r.id === selectedResource.value);
        if (resource && resource.teamId !== selectedTeam.value) {
            selectedResource.value = null;
        }
    }
});

// Computed property to filter resources by team
const filteredResources = computed(() => {
    if (!selectedTeam.value) return resources.value;
    return resources.value.filter(r => r.teamId === selectedTeam.value);
});

// Navigation Logic
const goToToday = () => {
    selectedMonth.value = new Date();
};

const previous = () => {
    const current = new Date(selectedMonth.value);
    if (viewMode.value === 'monthly') {
        current.setMonth(current.getMonth() - 1);
    } else {
        current.setFullYear(current.getFullYear() - 1);
    }
    selectedMonth.value = current;
};

const next = () => {
    const current = new Date(selectedMonth.value);
    if (viewMode.value === 'monthly') {
        current.setMonth(current.getMonth() + 1);
    } else {
        current.setFullYear(current.getFullYear() + 1);
    }
    selectedMonth.value = current;
};

const currentMonthYear = computed(() => {
    if (!selectedMonth.value) return '';
    return selectedMonth.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
});

// Computed properties for KPIs
const selectedResourceData = computed(() => {
    return resources.value.find(r => r.id === selectedResource.value);
});

const resourceTeam = computed(() => {
    if (!selectedResourceData.value) return null;
    return teams.value.find(t => t.id === selectedResourceData.value.teamId);
});

const selectedTeamData = computed(() => {
    if (!selectedTeam.value) return null;
    return teams.value.find(t => t.id === selectedTeam.value);
});

const totalHoursWorked = computed(() => {
    return Number(totalMonthHours.value).toFixed(2);
});

const uniqueProjects = computed(() => {
    const projectIds = new Set(assignments.value.map(a => a.projectId).filter(Boolean));
    return projectIds.size;
});

const tasksCompleted = computed(() => {
    return assignments.value.filter(a => a.status === 'Terminé').length;
});

const tasksInProgress = computed(() => {
    return assignments.value.filter(a => a.status === 'En cours').length;
});

const tasksPending = computed(() => {
    return assignments.value.filter(a => a.status === 'Planifié').length;
});

const performancePercentage = computed(() => {
    return Math.round(achievementRate.value);
});

const performanceColor = computed(() => {
    const perf = performancePercentage.value;
    if (perf >= 100) return '#10b981'; // green
    if (perf >= 75) return '#f59e0b'; // orange
    return '#ef4444'; // red
});

const chartData = computed(() => {
    if (viewMode.value === 'monthly') {
        const days = getDaysInMonth();
        const labels = days.map(d => d.getDate());

        const actualData = days.map(d => getHoursForDay(d));

        // Calculate daily target: totalTarget / workingDays
        const workingDays = days.filter(d => !isWeekend(d)).length;
        const dailyTarget = workingDays > 0 ? (monthlyObjective.value?.objectiveHours || 0) / workingDays : 0;

        const targetData = days.map(d => isWeekend(d) ? 0 : Number(dailyTarget.toFixed(2)));

        const perfData = days.map((d, i) => {
            const target = targetData[i];
            const actual = actualData[i];
            return target > 0 ? Math.round((actual / target) * 100) : 0;
        });

        return {
            labels,
            datasets: [
                {
                    type: 'bar',
                    label: 'Prévu (h)',
                    backgroundColor: '#e2e8f0',
                    data: targetData,
                    borderRadius: 4,
                    yAxisID: 'y',
                    order: 2
                },
                {
                    type: 'bar',
                    label: 'Réel (h)',
                    backgroundColor: '#6366f1',
                    data: actualData,
                    borderRadius: 4,
                    yAxisID: 'y',
                    order: 1
                },
                {
                    type: 'line',
                    label: 'Performance (%)',
                    borderColor: '#10b981',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    data: perfData,
                    yAxisID: 'y1',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    order: 0
                }
            ]
        };
    } else {
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        const targetData = yearlyData.value.map(d => Number(d.targetHours.toFixed(2)));
        const actualData = yearlyData.value.map(d => Number(d.actualHours.toFixed(2)));
        const perfData = yearlyData.value.map(d => Math.round(d.achievementRate));

        return {
            labels: months,
            datasets: [
                {
                    type: 'bar',
                    label: 'Prévu (h)',
                    backgroundColor: '#e2e8f0',
                    data: targetData,
                    borderRadius: 6,
                    yAxisID: 'y',
                    order: 2
                },
                {
                    type: 'bar',
                    label: 'Réel (h)',
                    backgroundColor: '#6366f1',
                    data: actualData,
                    borderRadius: 6,
                    yAxisID: 'y',
                    order: 1
                },
                {
                    type: 'line',
                    label: 'Performance (%)',
                    borderColor: '#10b981',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    data: perfData,
                    yAxisID: 'y1',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    order: 0
                }
            ]
        };
    }
});

// Calendar data
const getDaysInMonth = () => {
    if (!selectedMonth.value) return [];
    const year = selectedMonth.value.getFullYear();
    const month = selectedMonth.value.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    return days;
};

const getHoursForDay = (day) => {
    const dayStr = day.toISOString().split('T')[0];
    const dayLogs = dailyLogs.value.filter(log => log.date === dayStr);
    const total = dayLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
    return Math.round(total * 100) / 100;
};

const isWeekend = (day) => {
    const dayOfWeek = day.getDay();
    return dayOfWeek === 0; // Only Sunday is a weekend
};

const isToday = (day) => {
    const today = new Date();
    return day.toDateString() === today.toDateString();
};

const getResourcePictureUrl = (resourceId) => {
    if (!resourceId) return null;
    return `/ressources/${resourceId}/picture`;
};

const getTeamPictureUrl = (teamId) => {
    if (!teamId) return null;
    return `/teams/${teamId}/picture`;
};

const downloadPDF = async () => {
    loading.value = true;
    try {
        const element = document.querySelector('.report-layout');
        if (!element) return;

        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
            useCORS: true, // For images
            logging: false,
            backgroundColor: '#f8fafc' // Match page background
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // Add header info
        const title = `Rapport - ${viewMode.value === 'monthly' ? currentMonthYear.value : selectedMonth.value.getFullYear()}`;
        pdf.setFontSize(16);
        pdf.text(title, 10, 10);

        // Add filters info
        let filterText = 'Vue Globale';
        if (selectedResource.value) {
            filterText = `Ressource: ${selectedResourceData.value?.nom || ''}`;
        } else if (selectedTeam.value) {
            filterText = `Équipe: ${selectedTeamData.value?.name || ''}`;
        }
        pdf.setFontSize(12);
        pdf.text(filterText, 10, 18);

        // Add the captured image
        pdf.addImage(imgData, 'PNG', 0, 25, pdfWidth, pdfHeight);

        // Generate filename
        const dateStr = selectedMonth.value.toISOString().slice(0, 7); // YYYY-MM
        const filename = `Rapport_${dateStr}.pdf`;

        pdf.save(filename);

    } catch (error) {
        console.error('Error generating PDF:', error);
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="page-layout">
        <TheNavbar />

        <main class="main-content">


            <div class="report-layout">
                <!-- Left Sidebar - Resource KPIs (1/3) -->
                <ReportsKpiSidebar :selectedResource="selectedResource" :selectedResourceData="selectedResourceData"
                    :selectedTeam="selectedTeam" :selectedTeamData="selectedTeamData" :teams="teams"
                    :resourceTeam="resourceTeam" :performancePercentage="performancePercentage"
                    :performanceColor="performanceColor" :monthlyObjective="monthlyObjective"
                    :totalHoursWorked="totalHoursWorked" :uniqueProjects="uniqueProjects"
                    :tasksCompleted="tasksCompleted" :tasksInProgress="tasksInProgress" :tasksPending="tasksPending"
                    :resourcePictureUrl="getResourcePictureUrl(selectedResource)"
                    :teamPictureUrl="getTeamPictureUrl(selectedTeam)" :viewMode="viewMode" />

                <!-- Right Area - Premium Calendar (2/3) -->
                <div class="calendar-area">
                    <div class="calendar-card">
                        <!-- New Premium Header -->
                        <ReportsHeader :currentMonthYear="currentMonthYear" :teams="teams" :selectedTeam="selectedTeam"
                            :filteredResources="filteredResources" :selectedResource="selectedResource"
                            :selectedMonth="selectedMonth" :viewMode="viewMode" @previous="previous" @next="next"
                            @goToToday="goToToday" @update:selectedTeam="selectedTeam = $event"
                            @update:selectedResource="selectedResource = $event"
                            @update:selectedMonth="selectedMonth = $event" @update:viewMode="viewMode = $event"
                            @download-pdf="downloadPDF" />

                        <!-- Seamless Grid -->
                        <ReportsCalendar :daysInMonth="getDaysInMonth()" :dailyLogs="dailyLogs" :isWeekend="isWeekend"
                            :isToday="isToday" :viewMode="viewMode" :yearlyData="yearlyData" />
                    </div>

                    <!-- Trend Chart -->
                    <ReportsTrendChart :data="chartData" :viewMode="viewMode" />
                </div>
            </div>


        </main>
    </div>
</template>

<style scoped>
.page-layout {
    min-height: 100vh;
    background-color: #f8fafc;
    overflow: hidden;
}

.main-content {
    padding: 0.5rem 1.5rem;
    height: 100vh;
    display: flex;
    flex-direction: column;
}

/* Top Controls */
.top-controls {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 0.5rem;
}

.resource-selector-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: white;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.label {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
}

.resource-select-minimal,
.date-picker-minimal {
    border: none;
    box-shadow: none;
}

.date-picker-minimal :deep(.p-inputtext),
.resource-select-minimal :deep(.p-inputtext) {
    border: none;
    padding: 0;
    font-size: 0.875rem;
    color: #1e293b;
}

.date-picker-minimal :deep(.p-inputtext) {
    width: 120px;
}

/* Report Layout */
.report-layout {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 1rem;
    flex: 1;
    overflow: hidden;
    padding-bottom: 0.5rem;
}
</style>
