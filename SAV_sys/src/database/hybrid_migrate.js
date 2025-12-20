// Hybrid Migration - Only migrate high-volume data
import { db } from './hybrid_schema.js';

console.log('Loading generated data...');

// Use dynamic import to avoid loading issues
import('../mocks/generated_data.js').then(module => {
    const {
        generatedProjectCompositions,
        generatedResourceAssignments,
        generatedDailyLogs
    } = module;

    console.log(`Data loaded:
  - Compositions: ${generatedProjectCompositions.length}
  - Assignments: ${generatedResourceAssignments.length}
  - Daily Logs: ${generatedDailyLogs.length}`);

    // Prepare statements
    const insertPC = db.prepare(`
        INSERT OR REPLACE INTO project_compositions 
        (id, projectId, taskId, subtaskId, name, theoreticalQty, unit, status, competences) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertRA = db.prepare(`
        INSERT OR REPLACE INTO resource_assignments 
        (id, projectCompositionId, resourceId, estimatedQty, status, assignedDate) 
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertDL = db.prepare(`
        INSERT OR REPLACE INTO daily_logs 
        (id, projectId, resourceId, assignmentId, taskId, subtaskId, date, startTime, endTime, hours, comment) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Migrate in transaction
    const migrate = db.transaction(() => {
        console.log('\n1. Migrating Project Compositions...');
        let count = 0;
        generatedProjectCompositions.forEach(pc => {
            insertPC.run(
                pc.id, pc.projectId, pc.taskId, pc.subtaskId || '',
                pc.name, pc.theoreticalQty, pc.unit, pc.status,
                JSON.stringify(pc.competences) // Store as JSON string
            );
            count++;
            if (count % 2000 === 0) console.log(`   ... ${count}`);
        });
        console.log(`   ✓ ${count} compositions`);

        console.log('\n2. Migrating Resource Assignments...');
        count = 0;
        generatedResourceAssignments.forEach(ra => {
            insertRA.run(
                ra.id, ra.projectCompositionId, ra.resourceId,
                ra.estimatedQty, ra.status, ra.assignedDate
            );
            count++;
            if (count % 2000 === 0) console.log(`   ... ${count}`);
        });
        console.log(`   ✓ ${count} assignments`);

        console.log('\n3. Migrating Daily Logs...');
        count = 0;
        generatedDailyLogs.forEach(dl => {
            insertDL.run(
                dl.id, dl.projectId, dl.resourceId, dl.assignmentId || '',
                dl.taskId, dl.subtaskId, dl.date, dl.startTime,
                dl.endTime, dl.hours, dl.comment || ''
            );
            count++;
            if (count % 2000 === 0) console.log(`   ... ${count}`);
        });
        console.log(`   ✓ ${count} logs`);
    });

    console.log('\nStarting migration...');
    const start = Date.now();
    migrate();
    const duration = ((Date.now() - start) / 1000).toFixed(2);

    console.log(`\n✅ Migration SUCCESS in ${duration}s`);

    // Show DB stats
    const stats = db.prepare(`
        SELECT 
            (SELECT COUNT(*) FROM project_compositions) as compositions,
            (SELECT COUNT(*) FROM resource_assignments) as assignments,
            (SELECT COUNT(*) FROM daily_logs) as logs
    `).get();

    console.log('\nDatabase Statistics:');
    console.log(`  Compositions: ${stats.compositions}`);
    console.log(`  Assignments:  ${stats.assignments}`);
    console.log(`  Daily Logs:   ${stats.logs}`);

    db.close();
}).catch(err => {
    console.error('Error:', err);
    db.close();
    process.exit(1);
});
