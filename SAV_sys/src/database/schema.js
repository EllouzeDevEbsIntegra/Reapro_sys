// SQLite Database Schema and Setup
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create or open database
const dbPath = path.join(__dirname, '..', 'sav_database.db');
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
export function createSchema() {
    // Teams
    db.exec(`
        CREATE TABLE IF NOT EXISTS teams (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL
        )
    `);

    // Competences
    db.exec(`
        CREATE TABLE IF NOT EXISTS competences (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL
        )
    `);

    // Resources
    db.exec(`
        CREATE TABLE IF NOT EXISTS resources (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            surname TEXT,
            teamId TEXT,
            FOREIGN KEY (teamId) REFERENCES teams(id)
        )
    `);

    // Resource Competences (many-to-many)
    db.exec(`
        CREATE TABLE IF NOT EXISTS resource_competences (
            resourceId TEXT,
            competence TEXT,
            PRIMARY KEY (resourceId, competence),
            FOREIGN KEY (resourceId) REFERENCES resources(id)
        )
    `);

    // Brands
    db.exec(`
        CREATE TABLE IF NOT EXISTS brands (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL
        )
    `);

    // Models
    db.exec(`
        CREATE TABLE IF NOT EXISTS models (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            brandId TEXT,
            FOREIGN KEY (brandId) REFERENCES brands(id)
        )
    `);

    // Tasks
    db.exec(`
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT
        )
    `);

    // Projects
    db.exec(`
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            modelId TEXT,
            creationDate TEXT,
            userCreator TEXT,
            FOREIGN KEY (modelId) REFERENCES models(id)
        )
    `);

    // Project Attributes
    db.exec(`
        CREATE TABLE IF NOT EXISTS project_attributes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT
        )
    `);

    // Project Attribute Values
    db.exec(`
        CREATE TABLE IF NOT EXISTS project_attribute_values (
            id TEXT PRIMARY KEY,
            projectId TEXT,
            attributeId TEXT,
            value TEXT,
            FOREIGN KEY (projectId) REFERENCES projects(id),
            FOREIGN KEY (attributeId) REFERENCES project_attributes(id)
        )
    `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_pav_project ON project_attribute_values(projectId)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_pav_attribute ON project_attribute_values(attributeId)`);

    // Task Configurations
    db.exec(`
        CREATE TABLE IF NOT EXISTS task_configurations (
            id TEXT PRIMARY KEY,
            taskId TEXT,
            modelId TEXT,
            FOREIGN KEY (taskId) REFERENCES tasks(id),
            FOREIGN KEY (modelId) REFERENCES models(id)
        )
    `);

    // Task Configuration Subtasks
    db.exec(`
        CREATE TABLE IF NOT EXISTS task_subtasks (
            id TEXT PRIMARY KEY,
            configId TEXT,
            subtaskId TEXT,
            name TEXT,
            theoreticalHours REAL,
            FOREIGN KEY (configId) REFERENCES task_configurations(id)
        )
    `);

    // Subtask Competences
    db.exec(`
        CREATE TABLE IF NOT EXISTS subtask_competences (
            subtaskRowId INTEGER,
            competence TEXT,
            PRIMARY KEY (subtaskRowId, competence),
            FOREIGN KEY (subtaskRowId) REFERENCES task_subtasks(id)
        )
    `);

    // Project Compositions
    db.exec(`
        CREATE TABLE IF NOT EXISTS project_compositions (
            id TEXT PRIMARY KEY,
            projectId TEXT,
            taskId TEXT,
            subtaskId TEXT,
            name TEXT,
            theoreticalQty REAL,
            unit TEXT,
            status TEXT,
            FOREIGN KEY (projectId) REFERENCES projects(id),
            FOREIGN KEY (taskId) REFERENCES tasks(id)
        )
    `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_pc_project ON project_compositions(projectId)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_pc_status ON project_compositions(status)`);

    // Project Composition Competences
    db.exec(`
        CREATE TABLE IF NOT EXISTS composition_competences (
            compositionId TEXT,
            competence TEXT,
            PRIMARY KEY (compositionId, competence),
            FOREIGN KEY (compositionId) REFERENCES project_compositions(id)
        )
    `);

    // Resource Assignments
    db.exec(`
        CREATE TABLE IF NOT EXISTS resource_assignments (
            id TEXT PRIMARY KEY,
            projectCompositionId TEXT,
            resourceId TEXT,
            estimatedQty REAL,
            status TEXT,
            assignedDate TEXT,
            FOREIGN KEY (projectCompositionId) REFERENCES project_compositions(id),
            FOREIGN KEY (resourceId) REFERENCES resources(id)
        )
    `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ra_composition ON resource_assignments(projectCompositionId)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ra_resource ON resource_assignments(resourceId)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ra_status ON resource_assignments(status)`);

    // Daily Logs
    db.exec(`
        CREATE TABLE IF NOT EXISTS daily_logs (
            id TEXT PRIMARY KEY,
            projectId TEXT,
            resourceId TEXT,
            assignmentId TEXT,
            taskId TEXT,
            subtaskId TEXT,
            date TEXT,
            startTime TEXT,
            endTime TEXT,
            hours REAL,
            comment TEXT,
            FOREIGN KEY (projectId) REFERENCES projects(id),
            FOREIGN KEY (resourceId) REFERENCES resources(id),
            FOREIGN KEY (assignmentId) REFERENCES resource_assignments(id)
        )
    `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_dl_project ON daily_logs(projectId)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_dl_resource ON daily_logs(resourceId)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_dl_assignment ON daily_logs(assignmentId)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_dl_date ON daily_logs(date)`);

    console.log('✓ Database schema created successfully');
}

// Initialize database
createSchema();
