// Simple migration test - import from generated_data only
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create database
const dbPath = path.join(__dirname, '..', '..', 'sav_database.db');
console.log('Database path:', dbPath);

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Import schema
import('./schema.js').then(() => {
    console.log('Schema imported');

    // Now read mock data files dynamically
    console.log('Reading mock data files...');

    // We'll use dynamic import for the mock files
    Promise.all([
        import('../mocks/data.js'),
        import('../mocks/projects_real_data.js'),
        import('../mocks/generated_data.js')
    ]).then(([dataModule, projectsModule, generatedModule]) => {
        console.log('All modules loaded');

        const {
            teams,
            competences,
            resources,
            brands,
            models,
            tasks,
            projectAttributes,
            taskConfigurations
        } = dataModule;

        const { realProjects, realProjectAttributeValues } = projectsModule;

        const {
            generatedProjectCompositions,
            generatedResourceAssignments,
            generatedDailyLogs
        } = generatedModule;

        console.log('Data loaded, starting migration...');

        // Prepare statements
        const insertTeam = db.prepare('INSERT OR REPLACE INTO teams (id, name) VALUES (?, ?)');
        const insertCompetence = db.prepare('INSERT OR REPLACE INTO competences (id, name) VALUES (?, ?)');
        const insertResource = db.prepare('INSERT OR REPLACE INTO resources (id, name, surname, teamId) VALUES (?, ?, ?, ?)');
        const insertResourceCompetence = db.prepare('INSERT OR REPLACE INTO resource_competences (resourceId, competence) VALUES (?, ?)');
        const insertBrand = db.prepare('INSERT OR REPLACE INTO brands (id, name) VALUES (?, ?)');
        const insertModel = db.prepare('INSERT OR REPLACE INTO models (id, name, brandId) VALUES (?, ?, ?)');
        const insertTask = db.prepare('INSERT OR REPLACE INTO tasks (id, name, category) VALUES (?, ?, ?)');
        const insertProject = db.prepare('INSERT OR REPLACE INTO projects (id, name, modelId, creationDate, userCreator) VALUES (?, ?, ?, ?, ?)');
        const insertProjectAttribute = db.prepare('INSERT OR REPLACE INTO project_attributes (id, name, type) VALUES (?, ?, ?)');
        const insertProjectAttributeValue = db.prepare('INSERT OR REPLACE INTO project_attribute_values (id, projectId, attributeId, value) VALUES (?, ?, ?, ?)');
        const insertTaskConfig = db.prepare('INSERT OR REPLACE INTO task_configurations (id, taskId, modelId) VALUES (?, ?, ?)');
        const insertTaskSubtask = db.prepare('INSERT OR REPLACE INTO task_subtasks (id, configId, subtaskId, name, theoreticalHours) VALUES (?, ?, ?, ?, ?)');
        const insertSubtaskCompetence = db.prepare('INSERT OR REPLACE INTO subtask_competences (subtaskRowId, competence) VALUES (?, ?)');
        const insertProjectComposition = db.prepare('INSERT OR REPLACE INTO project_compositions (id, projectId, taskId, subtaskId, name, theoreticalQty, unit, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        const insertCompositionCompetence = db.prepare('INSERT OR REPLACE INTO composition_competences (compositionId, competence) VALUES (?, ?)');
        const insertResourceAssignment = db.prepare('INSERT OR REPLACE INTO resource_assignments (id, projectCompositionId, resourceId, estimatedQty, status, assignedDate) VALUES (?, ?, ?, ?, ?, ?)');
        const insertDailyLog = db.prepare('INSERT OR REPLACE INTO daily_logs (id, projectId, resourceId, assignmentId, taskId, subtaskId, date, startTime, endTime, hours, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

        // Use transaction
        const migrateAll = db.transaction(() => {
            console.log('1. Migrating Teams...');
            teams.forEach(t => insertTeam.run(t.id, t.name));
            console.log(`   ✓ ${teams.length} teams`);

            console.log('2. Migrating Competences...');
            competences.forEach(c => insertCompetence.run(c, c));
            console.log(`   ✓ ${competences.length} competences`);

            console.log('3. Migrating Resources...');
            resources.forEach(r => {
                insertResource.run(r.id, r.name, r.surname || '', r.teamId || '');
                r.competences.forEach(comp => insertResourceCompetence.run(r.id, comp));
            });
            console.log(`   ✓ ${resources.length} resources`);

            console.log('4. Migrating Brands...');
            brands.forEach(b => insertBrand.run(b.id, b.name));
            console.log(`   ✓ ${brands.length} brands`);

            console.log('5. Migrating Models...');
            models.forEach(m => insertModel.run(m.id, m.name, m.brandId));
            console.log(`   ✓ ${models.length} models`);

            console.log('6. Migrating Tasks...');
            tasks.forEach(t => insertTask.run(t.id, t.name, t.category || ''));
            console.log(`   ✓ ${tasks.length} tasks`);

            console.log('7. Migrating Projects...');
            let projCount = 0;
            realProjects.forEach(p => {
                insertProject.run(p.id, p.name, p.modelId, p.creationDate, p.userCreator || '');
                projCount++;
                if (projCount % 500 === 0) console.log(`   ... ${projCount} projects`);
            });
            console.log(`   ✓ ${realProjects.length} projects`);

            console.log('8. Migrating Project Attributes...');
            projectAttributes.forEach(pa => {
                insertProjectAttribute.run(pa.id, pa.name, pa.type || 'text');
            });
            console.log(`   ✓ ${projectAttributes.length} attributes`);

            console.log('9. Migrating Project Attribute Values...');
            let pavCount = 0;
            realProjectAttributeValues.forEach(pav => {
                insertProjectAttributeValue.run(pav.id, pav.projectId, pav.attributeId, pav.value);
                pavCount++;
                if (pavCount % 1000 === 0) console.log(`   ... ${pavCount} values`);
            });
            console.log(`   ✓ ${realProjectAttributeValues.length} values`);

            console.log('10. Migrating Task Configurations...');
            let subtaskCounter = 1;
            taskConfigurations.forEach(tc => {
                insertTaskConfig.run(tc.id, tc.taskId, tc.modelId);
                tc.subtasks.forEach(sub => {
                    const subtaskRowId = `st-${subtaskCounter++}`;
                    insertTaskSubtask.run(subtaskRowId, tc.id, sub.subtaskId, sub.name, sub.theoreticalHours);
                    sub.competences.forEach(comp => insertSubtaskCompetence.run(subtaskRowId, comp));
                });
            });
            console.log(`   ✓ ${taskConfigurations.length} configurations`);

            console.log('11. Migrating Project Compositions...');
            let pcCount = 0;
            generatedProjectCompositions.forEach(pc => {
                insertProjectComposition.run(
                    pc.id, pc.projectId, pc.taskId, pc.subtaskId,
                    pc.name, pc.theoreticalQty, pc.unit, pc.status
                );
                pc.competences.forEach(comp => insertCompositionCompetence.run(pc.id, comp));
                pcCount++;
                if (pcCount % 1000 === 0) console.log(`   ... ${pcCount} compositions`);
            });
            console.log(`   ✓ ${generatedProjectCompositions.length} compositions`);

            console.log('12. Migrating Resource Assignments...');
            let raCount = 0;
            generatedResourceAssignments.forEach(ra => {
                insertResourceAssignment.run(
                    ra.id, ra.projectCompositionId, ra.resourceId,
                    ra.estimatedQty, ra.status, ra.assignedDate
                );
                raCount++;
                if (raCount % 1000 === 0) console.log(`   ... ${raCount} assignments`);
            });
            console.log(`   ✓ ${generatedResourceAssignments.length} assignments`);

            console.log('13. Migrating Daily Logs...');
            let dlCount = 0;
            generatedDailyLogs.forEach(dl => {
                insertDailyLog.run(
                    dl.id, dl.projectId, dl.resourceId, dl.assignmentId,
                    dl.taskId, dl.subtaskId, dl.date, dl.startTime,
                    dl.endTime, dl.hours, dl.comment || ''
                );
                dlCount++;
                if (dlCount % 1000 === 0) console.log(`   ... ${dlCount} logs`);
            });
            console.log(`   ✓ ${generatedDailyLogs.length} logs`);
        });

        // Execute
        try {
            console.log('\nStarting transaction...');
            migrateAll();
            console.log('\n✅ Migration SUCCESS!');
            console.log(`\nDatabase: ${dbPath}`);
            console.log(`Size: ${fs.statSync(dbPath).size / 1024 / 1024} MB`);
            db.close();
        } catch (error) {
            console.error('❌ Migration failed:', error);
            db.close();
            process.exit(1);
        }
    }).catch(err => {
        console.error('Error loading modules:', err);
        db.close();
        process.exit(1);
    });
}).catch(err => {
    console.error('Error loading schema:', err);
    process.exit(1);
});
