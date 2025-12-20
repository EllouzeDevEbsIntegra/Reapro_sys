// Script to verify generated data quality
import { generatedDailyLogs, generatedResourceAssignments, generatedProjectCompositions } from './generated_data.js';
import { resources } from './data.js';
import fs from 'fs';

// 1. Daily Hours Check
const resourceDailyHours = {}; // { resourceId: { date: hours } }

generatedDailyLogs.forEach(log => {
    if (!resourceDailyHours[log.resourceId]) resourceDailyHours[log.resourceId] = {};
    if (!resourceDailyHours[log.resourceId][log.date]) resourceDailyHours[log.resourceId][log.date] = 0;
    resourceDailyHours[log.resourceId][log.date] += log.hours;
});

let totalDays = 0;
let validDays = 0;
let underDays = 0;
let overDays = 0;

Object.keys(resourceDailyHours).forEach(resId => {
    Object.keys(resourceDailyHours[resId]).forEach(date => {
        const hours = resourceDailyHours[resId][date];
        totalDays++;
        if (hours >= 5 && hours <= 8.5) validDays++; // Allow slight margin
        else if (hours < 5) underDays++;
        else overDays++;
    });
});

// 2. Efficiency Check
let totalEfficiency = 0;
let count = 0;
let minEff = 100;
let maxEff = 0;

generatedResourceAssignments.forEach(ra => {
    // Calculate real hours from logs
    const logs = generatedDailyLogs.filter(l => l.assignmentId === ra.id);
    const realHours = logs.reduce((sum, l) => sum + l.hours, 0);

    if (realHours > 0 && ra.estimatedQty > 0) {
        const efficiency = (ra.estimatedQty / realHours) * 100;
        totalEfficiency += efficiency;
        count++;
        if (efficiency < minEff) minEff = efficiency;
        if (efficiency > maxEff) maxEff = efficiency;
    }
});

// 3. Resource Coverage
const coveredResources = new Set(generatedDailyLogs.map(l => l.resourceId));

const report = `
--- Verification Report ---
Total Daily Logs: ${generatedDailyLogs.length}
Total Assignments: ${generatedResourceAssignments.length}

1. Daily Hours Analysis:
Total Working Days Logged: ${totalDays}
Valid Days (5-8.5h): ${validDays} (${((validDays / totalDays) * 100).toFixed(1)}%)
Under Days (<5h): ${underDays} (${((underDays / totalDays) * 100).toFixed(1)}%)
Over Days (>8.5h): ${overDays} (${((overDays / totalDays) * 100).toFixed(1)}%)

2. Efficiency Analysis:
Avg Efficiency: ${(totalEfficiency / count).toFixed(1)}%
Min Efficiency: ${minEff.toFixed(1)}%
Max Efficiency: ${maxEff.toFixed(1)}%

3. Resource Coverage:
Resources with logs: ${coveredResources.size} / ${resources.length}
Missing: ${resources.filter(r => !coveredResources.has(r.id)).map(r => r.name + ' ' + r.surname).join(', ')}
`;

fs.writeFileSync('src/mocks/verification_report.txt', report);
console.log('Report written to src/mocks/verification_report.txt');
