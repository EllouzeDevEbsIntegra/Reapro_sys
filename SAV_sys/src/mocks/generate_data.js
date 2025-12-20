// Script to generate massive realistic data for SAV application
// Run with: node src/mocks/generate_data.js

import fs from 'fs';
import { realProjects, realProjectAttributeValues } from './projects_real_data.js';
import { tasks, taskConfigurations, resources, competences, models } from './data.js';

console.log('Starting massive data generation (Resource-Centric)...');

// --- Helpers ---

function parseDate(dateStr) {
    return new Date(dateStr);
}

// French Public Holidays
const holidays = [
    '2024-01-01', '2024-04-01', '2024-05-01', '2024-05-08', '2024-05-09', '2024-05-20',
    '2024-07-14', '2024-08-15', '2024-11-01', '2024-11-11', '2024-12-25',
    '2025-01-01', '2025-04-21', '2025-05-01', '2025-05-08', '2025-05-29', '2025-06-09',
    '2025-07-14', '2025-08-15', '2025-11-01', '2025-11-11', '2025-12-25'
];

function isWorkingDay(date) {
    const day = date.getDay();
    if (day === 0) return false; // Sunday only
    const dateStr = date.toISOString().split('T')[0];
    return !holidays.includes(dateStr);
}

function getDailyHoursTarget(date) {
    const day = date.getDay();
    if (day === 6) return 5 + Math.random() * 1; // Saturday: 5-6h
    return 5 + Math.random() * 3; // Mon-Fri: 5-8h
}

function getRandomWorkHours() {
    const today = new Date();
    return getDailyHoursTarget(today);
}

function getProjectAttribute(projectId, attrId) {
    const attrValue = realProjectAttributeValues.find(
        pav => pav.projectId === projectId && pav.attributeId === attrId
    );
    return attrValue?.value || '';
}

// --- Data Containers ---
const projectCompositions = [];
const resourceAssignments = [];
const dailyLogs = [];
const projectUpdates = [];

let pcCounter = 1;
let raCounter = 1;
let dlCounter = 1;

// --- Phase 1: Prepare Projects & Potential Tasks ---
console.log('Phase 1: Preparing Projects...');

// Sort projects by date
const sortedProjects = [...realProjects].sort((a, b) =>
    new Date(a.creationDate) - new Date(b.creationDate)
);

// --- Generate Additional Q4 2025 Projects ---
console.log('Generating additional Q4 2025 projects...');
const q4Start = new Date('2025-10-15');
const q4End = new Date('2025-12-31');
const uniqueClientIds = [...new Set(realProjects.map(p => p.clientId))];

for (let i = 0; i < 500; i++) {
    const creationDate = new Date(q4Start.getTime() + Math.random() * (q4End.getTime() - q4Start.getTime()));
    const project = {
        id: `p-q4-${i}`,
        name: `Projet Q4-${i}`,
        modelId: models[Math.floor(Math.random() * models.length)].id,
        clientId: uniqueClientIds[Math.floor(Math.random() * uniqueClientIds.length)] || 'client-1',
        immatriculation: `Q4-${Math.floor(Math.random() * 9999)}`,
        km: Math.floor(Math.random() * 200000),
        creationDate: creationDate.toISOString(), // Use creationDate to match realProjects
        status: 'Nouveau',
        attributes: {
            attr1: Math.random() > 0.5 ? 'Haute' : 'Moyenne',
            attr2: Math.random() > 0.33 ? (Math.random() > 0.5 ? 'SRV RAPIDE' : 'MEC') : 'CAR',
            attr3: 'Généré Q4 2025',
            attr9: Math.random() > 0.33 ? (Math.random() > 0.5 ? 'SRV RAPIDE' : 'MEC') : 'CAR'
        }
    };
    sortedProjects.push(project);
}
// Re-sort after adding
sortedProjects.sort((a, b) => new Date(a.creationDate) - new Date(b.creationDate));

// We need a pool of unassigned tasks to draw from
const unassignedTasksPool = []; // { projectId, taskId, subtaskId, name, theoreticalQty, competences, creationDate }

sortedProjects.forEach(project => {
    const projectType = getProjectAttribute(project.id, 'attr9');
    const projectDesc = getProjectAttribute(project.id, 'attr3');
    const creationDate = parseDate(project.creationDate);

    // Determine tasks based on type/desc
    const tasksToAdd = [];
    if (projectType === 'SRV RAPIDE' || projectDesc.includes('VIDANGE')) tasksToAdd.push('VIDANGE');
    if (projectType === 'MEC' || projectDesc.includes('FREIN')) tasksToAdd.push('MO-0000022');
    if (projectDesc.includes('DISQUE')) tasksToAdd.push('MO-0000037');
    if (projectType === 'CAR' || projectDesc.includes('PEINTURE')) tasksToAdd.push('MO-0000002');
    if (projectType === 'LAVAGE' || projectDesc.includes('LAVAGE')) tasksToAdd.push('LAVAGE');
    if (projectType === 'DIAG' || projectDesc.includes('DIAG')) tasksToAdd.push('DIAG');

    if (tasksToAdd.length === 0) {
        // Default assignment if no specific type found
        const rand = Math.random();
        if (rand < 0.4) tasksToAdd.push('VIDANGE');
        else if (rand < 0.7) tasksToAdd.push('MO-0000022');
        else tasksToAdd.push('DIAG');
    }

    tasksToAdd.forEach(taskId => {
        let config = taskConfigurations.find(tc => tc.taskId === taskId && tc.modelId === project.modelId);
        if (!config) config = taskConfigurations.find(tc => tc.taskId === taskId && tc.modelId === 'm1'); // Fallback

        if (config) {
            config.subtasks.forEach(sub => {
                const pcId = `pc-${pcCounter++}`;

                // Create Project Composition
                const composition = {
                    id: pcId,
                    projectId: project.id,
                    taskId: taskId,
                    subtaskId: sub.subtaskId,
                    name: sub.name,
                    theoreticalQty: sub.theoreticalHours,
                    unit: 'Heure',
                    competences: sub.competences,
                    status: 'À faire' // Initial status
                };
                projectCompositions.push(composition);

                // Add to pool for assignment
                unassignedTasksPool.push({
                    ...composition,
                    creationDate: creationDate,
                    projectType: projectType
                });
            });
        }
    });
});

console.log(`Pool created with ${unassignedTasksPool.length} tasks.`);

// --- Phase 2: Resource-Centric Daily Loop ---
console.log('Phase 2: Generating Daily Logs...');

const startDate = new Date('2024-01-01');
const endDate = new Date('2025-12-31');
const currentDate = new Date(startDate);

// Resource Backlogs (Assigned but not finished tasks)
const resourceBacklogs = {}; // { resourceId: [ { assignmentId, remainingHours, efficiencyFactor } ] }
resources.forEach(r => resourceBacklogs[r.id] = []);

while (currentDate <= endDate) {
    if (isWorkingDay(currentDate)) {
        const dateStr = currentDate.toISOString().split('T')[0];

        // Process each resource
        resources.forEach(resource => {
            // Check if resource is hired
            if (new Date(resource.hireDate) > currentDate) return;

            // Target hours for today (5-8h)
            const targetHours = getRandomWorkHours();
            let loggedHoursToday = 0;

            // Work until target reached
            while (loggedHoursToday < targetHours) {
                // 1. Check Backlog
                let currentAssignment = null;

                if (resourceBacklogs[resource.id].length > 0) {
                    currentAssignment = resourceBacklogs[resource.id][0]; // Take first item
                } else {
                    // 2. If Backlog empty, find new task from Pool
                    // Filter pool: 
                    // - Created before today
                    // - Matching competence
                    // - Not already assigned (removed from pool when assigned)
                    // - Resource not overloaded (LIMIT: max 15 assignments total)

                    // Calculate current active assignments for this resource
                    const currentAssignmentsCount = resourceAssignments.filter(
                        ra => ra.resourceId === resource.id &&
                            (ra.status === 'En cours' || ra.status === 'Planifié')
                    ).length;

                    // LIMIT: Don't assign more if already has 15 or more active/planned tasks
                    const MAX_CONCURRENT_ASSIGNMENTS = 15;

                    const eligibleTaskIndex = unassignedTasksPool.findIndex(t =>
                        new Date(t.creationDate) <= currentDate &&
                        t.competences.some(c => resource.competences.includes(c)) &&
                        currentAssignmentsCount < MAX_CONCURRENT_ASSIGNMENTS
                    );

                    if (eligibleTaskIndex !== -1) {
                        const taskToAssign = unassignedTasksPool[eligibleTaskIndex];

                        // Create Assignment
                        const raId = `ra-${raCounter++}`;

                        // Efficiency Factor: 0.7 (slow) to 1.2 (fast)
                        // Randomize per assignment
                        const efficiency = 0.7 + Math.random() * 0.5;

                        // Estimated Qty = Theoretical
                        // Real Qty will be determined by logging
                        // We estimate the TOTAL real time needed = Theoretical / Efficiency
                        const totalRealNeeded = taskToAssign.theoreticalQty / efficiency;

                        const assignment = {
                            id: raId,
                            projectCompositionId: taskToAssign.id,
                            resourceId: resource.id,
                            estimatedQty: taskToAssign.theoreticalQty, // Keep theoretical as estimated for simplicity or add variance
                            status: 'En cours',
                            assignedDate: currentDate.toISOString()
                        };
                        resourceAssignments.push(assignment);

                        // Add to backlog
                        currentAssignment = {
                            assignmentId: raId,
                            projectCompositionId: taskToAssign.id,
                            remainingHours: totalRealNeeded,
                            efficiencyFactor: efficiency
                        };
                        resourceBacklogs[resource.id].push(currentAssignment);

                        // Remove from pool
                        unassignedTasksPool.splice(eligibleTaskIndex, 1);

                        // Update Composition Status
                        const comp = projectCompositions.find(c => c.id === taskToAssign.id);
                        if (comp) comp.status = 'En cours';


                    } else {
                        // FALLBACK: Generate a generic "Maintenance / Nettoyage" task to fill the day
                        const fallbackRaId = `ra-fallback-${raCounter++}`;

                        const hoursNeeded = targetHours - loggedHoursToday;

                        // We create a log directly without a formal assignment in the main list if we want,
                        // or we create a dummy assignment. Let's create a dummy log.

                        const logId = `dl-${dlCounter++}`;
                        const startTime = new Date(currentDate);
                        startTime.setHours(8 + loggedHoursToday);
                        const endTime = new Date(startTime);
                        endTime.setTime(endTime.getTime() + hoursNeeded * 60 * 60 * 1000);

                        dailyLogs.push({
                            id: logId,
                            projectId: 'INTERNAL',
                            resourceId: resource.id,
                            assignmentId: fallbackRaId,
                            taskId: 'AUTRE',
                            subtaskId: 'ST-MAINT',
                            date: dateStr,
                            startTime: startTime.toISOString(),
                            endTime: endTime.toISOString(),
                            hours: Number(hoursNeeded.toFixed(2)),
                            comment: 'Travaux internes / Maintenance / Nettoyage'
                        });

                        loggedHoursToday += hoursNeeded;
                        // Loop will terminate
                    }
                }

                // Log work on current assignment
                if (currentAssignment) {
                    const hoursToLog = Math.min(
                        targetHours - loggedHoursToday, // Don't exceed daily target
                        currentAssignment.remainingHours, // Don't exceed task remaining
                        4 // Max 4h block per log
                    );

                    if (hoursToLog <= 0.1) {
                        // Tiny remainder, just finish it or skip
                        resourceBacklogs[resource.id].shift(); // Remove from backlog
                        continue;
                    }

                    // Create Log
                    const logId = `dl-${dlCounter++}`;

                    // Find details for log
                    const assignment = resourceAssignments.find(ra => ra.id === currentAssignment.assignmentId);
                    const composition = projectCompositions.find(pc => pc.id === assignment.projectCompositionId);

                    // Start time calculation (simplified)
                    const startTime = new Date(currentDate);
                    startTime.setHours(8 + loggedHoursToday);
                    const endTime = new Date(startTime);
                    endTime.setTime(endTime.getTime() + hoursToLog * 60 * 60 * 1000);

                    dailyLogs.push({
                        id: logId,
                        projectId: composition.projectId,
                        resourceId: resource.id,
                        assignmentId: assignment.id,
                        taskId: composition.taskId,
                        subtaskId: composition.subtaskId,
                        date: dateStr,
                        startTime: startTime.toISOString(),
                        endTime: endTime.toISOString(),
                        hours: Number(hoursToLog.toFixed(2)),
                        comment: ''
                    });

                    loggedHoursToday += hoursToLog;
                    currentAssignment.remainingHours -= hoursToLog;

                    // Check if task finished
                    if (currentAssignment.remainingHours <= 0.1) {
                        // Task Done
                        assignment.status = 'Terminé';
                        composition.status = 'Terminé';

                        // Remove from backlog
                        resourceBacklogs[resource.id].shift();
                    }
                }
            }
        });
    }
    // Next day
    currentDate.setDate(currentDate.getDate() + 1);
}

// --- Auto-Completion & Business Rules Logic ---
console.log('Applying Business Rules for Project Completion...');
const now = new Date('2025-12-31');

sortedProjects.forEach(project => {
    const creationDate = new Date(project.creationDate);
    const projectType = getProjectAttribute(project.id, 'attr9') || project.attributes?.attr9;

    // Determine max duration based on type
    let maxDurationDays = 180; // Default 6 months
    if (projectType === 'SRV RAPIDE' || projectType === 'LAVAGE') maxDurationDays = 3;
    else if (projectType === 'MEC') maxDurationDays = 15;
    else if (projectType === 'CAR') maxDurationDays = 180;

    const expectedCompletionDate = new Date(creationDate);
    expectedCompletionDate.setDate(expectedCompletionDate.getDate() + maxDurationDays);

    const shouldBeClosed = expectedCompletionDate < now;

    // Force close if older than max duration
    if (shouldBeClosed) {
        // Mark all compositions as completed
        const projectComps = projectCompositions.filter(c => c.projectId === project.id);
        projectComps.forEach(comp => {
            comp.status = 'Terminé';
            comp.realQty = comp.theoreticalQty;
        });

        // Mark all assignments as completed
        const projectAssignments = resourceAssignments.filter(ra => {
            const comp = projectCompositions.find(c => c.id === ra.projectCompositionId);
            return comp && comp.projectId === project.id;
        });
        projectAssignments.forEach(ra => ra.status = 'Terminé');
    }
});

// --- Phase 3: Finalize Project Statuses ---
console.log('Phase 3: Finalizing Statuses...');

// Helper to calculate status map
function calculateProjectStatuses() {
    const map = {};
    projectCompositions.forEach(pc => {
        if (!map[pc.projectId]) {
            map[pc.projectId] = { total: 0, completed: 0, started: 0 };
        }
        map[pc.projectId].total++;
        if (pc.status === 'Terminé') map[pc.projectId].completed++;
        if (pc.status === 'En cours') map[pc.projectId].started++;
    });
    return map;
}

// Initial Status Calculation (after Auto-Completion)
let projectStatusMap = calculateProjectStatuses();

// --- Distribution Adjustment (Target: 5% In Progress) ---
console.log('Adjusting distribution to meet targets...');
try {
    const notStartedProjects = sortedProjects.filter(p => {
        const status = projectStatusMap[p.id];
        if (!status) return true; // No tasks = Not Started
        return status.total > 0 && status.started === 0 && status.completed === 0;
    });

    // We want to convert about half of "Not Started" to "In Progress" to go from ~10% NS -> 5% NS + 5% IP
    // Actually, let's be more aggressive if needed.
    // We want "In Progress" to be ~5% of TOTAL.
    const totalTargetInProgress = Math.floor(sortedProjects.length * 0.05);
    const currentInProgress = sortedProjects.filter(p => {
        const s = projectStatusMap[p.id];
        return s && (s.started > 0 || (s.completed > 0 && s.completed < s.total));
    }).length;

    const neededInProgress = Math.max(0, totalTargetInProgress - currentInProgress);

    console.log(`Current In Progress: ${currentInProgress}, Target: ${totalTargetInProgress}, Needed: ${neededInProgress}`);

    const projectsToStart = notStartedProjects.slice(0, neededInProgress + 50); // Add buffer

    projectsToStart.forEach(project => {
        // Set project status
        project.status = 'En cours';

        // Find compositions
        const comps = projectCompositions.filter(c => c.projectId === project.id);
        if (comps.length > 0) {
            // Mark first task as In Progress
            comps[0].status = 'En cours';

            // Create a fake assignment if none exists
            const existingAssignment = resourceAssignments.find(ra => ra.projectCompositionId === comps[0].id);
            if (!existingAssignment) {
                const resource = resources[Math.floor(Math.random() * resources.length)];
                const raId = `ra-adj-${raCounter++}`;
                resourceAssignments.push({
                    id: raId,
                    projectCompositionId: comps[0].id,
                    resourceId: resource.id,
                    estimatedQty: comps[0].theoreticalQty,
                    status: 'En cours',
                    assignedDate: new Date('2025-12-20').toISOString()
                });
            }
        }
    });
} catch (error) {
    console.error('CRITICAL ERROR in Distribution Adjustment:', error);
}

// Re-calculate statuses after adjustment
projectStatusMap = calculateProjectStatuses();

Object.keys(projectStatusMap).forEach(projectId => {
    const stats = projectStatusMap[projectId];
    let status = 'En attente début travaux';

    // Update final project status
    const project = sortedProjects.find(p => p.id === projectId);
    if (project) {
        if (stats.completed === stats.total && stats.total > 0) status = 'Clôturé';
        else if (stats.started > 0 || stats.completed > 0) status = 'En cours';
        project.status = status;
    }
});

// Verify Distribution
const totalProjects = sortedProjects.length;
const closedCount = sortedProjects.filter(p => p.status === 'Clôturé').length;
const inProgressCount = sortedProjects.filter(p => p.status === 'En cours').length;
const notStartedCount = sortedProjects.filter(p => p.status === 'En attente début travaux' || p.status === 'Nouveau').length;

console.log(`
Final Distribution:
- Total Projects: ${totalProjects}
- Closed: ${closedCount} (${(closedCount / totalProjects * 100).toFixed(1)}%)
- In Progress: ${inProgressCount} (${(inProgressCount / totalProjects * 100).toFixed(1)}%)
- Not Started: ${notStartedCount} (${(notStartedCount / totalProjects * 100).toFixed(1)}%)
`);

// --- Phase 4: Write to File ---
console.log('Phase 4: Writing to file...');

const outputPath = 'src/mocks/generated_data.js';
fs.writeFileSync(outputPath, ''); // Clear file

console.log('Writing projectCompositions...');
fs.appendFileSync(outputPath, `export const generatedProjectCompositions = ${JSON.stringify(projectCompositions, null, 4)};\n`);

console.log('Writing resourceAssignments...');
fs.appendFileSync(outputPath, `export const generatedResourceAssignments = ${JSON.stringify(resourceAssignments, null, 4)};\n`);

// Write dailyLogs to a separate file
const logsPath = 'src/mocks/generated_logs.js';
console.log('Writing dailyLogs to separate file...');
fs.writeFileSync(logsPath, `export const generatedDailyLogs = ${JSON.stringify(dailyLogs, null, 4)};\n`);

console.log('Writing projectStatuses...');
fs.appendFileSync(outputPath, `export const generatedProjectStatuses = ${JSON.stringify(projectStatusMap, null, 4)};\n`);

console.log('Writing projects...');
fs.appendFileSync(outputPath, `export const generatedProjects = ${JSON.stringify(sortedProjects, null, 4)};\n`);

console.log('Done! Data generated in src/mocks/generated_data.js and src/mocks/generated_logs.js');
