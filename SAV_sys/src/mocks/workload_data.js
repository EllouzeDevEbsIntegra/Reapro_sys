// Mock data pour Workload - Temps presté par ressource
// Génération dynamique basée sur les ressources réelles de l'API

// Fonction pour générer des données de workload pour une ressource
export const generateWorkloadForResource = (resourceId, resourceIndex) => {
    const numTasks = 2 + Math.floor(Math.random() * 3); // 2-4 tâches par ressource
    const tasks = [];

    for (let i = 0; i < numTasks; i++) {
        const plannedHours = 6 + Math.floor(Math.random() * 15); // 6-20h
        const variability = 0.85 + Math.random() * 0.35; // 85%-120% du prévu
        const workedHours = i === 0 ? Math.round(plannedHours * variability * 10) / 10 : 0; // Seulement la première tâche a du temps presté

        const statuses = i === 0 ? 'En cours' : 'Planifié';

        tasks.push({
            resourceId,
            subTaskId: `ST-${resourceIndex * 10 + i + 1}`,
            plannedHours,
            workedHours,
            status: statuses
        });
    }

    return tasks;
};

// Fonction pour calculer le rendement d'une ressource
export const calculateResourcePerformance = (workloadData) => {
    const totalPlanned = workloadData.reduce((sum, w) => sum + w.plannedHours, 0);
    const totalWorked = workloadData.reduce((sum, w) => sum + w.workedHours, 0);

    return {
        totalPlanned,
        totalWorked,
        performance: totalPlanned > 0 ? Math.round((totalWorked / totalPlanned) * 100) : 0
    };
};

// Fonction helper pour générer toutes les données de workload à partir des ressources
export const generateAllWorkloadData = (resources) => {
    const allData = [];

    resources.forEach((resource, index) => {
        const resourceWorkload = generateWorkloadForResource(resource.id, index);
        allData.push(...resourceWorkload);
    });

    return allData;
};

// Fonction helper pour obtenir les données d'une ressource spécifique
export const getResourceWorkload = (workloadData, resourceId) => {
    return workloadData.filter(w => w.resourceId === resourceId);
};

// Fonction helper pour calculer le rendement par équipe
export const calculateTeamPerformance = (workloadData, resourceIds) => {
    const teamData = workloadData.filter(w => resourceIds.includes(w.resourceId));
    const totalPlanned = teamData.reduce((sum, w) => sum + w.plannedHours, 0);
    const totalWorked = teamData.reduce((sum, w) => sum + w.workedHours, 0);

    return totalPlanned > 0 ? Math.round((totalWorked / totalPlanned) * 100) : 0;
};
