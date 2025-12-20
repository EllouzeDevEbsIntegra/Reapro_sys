// Hybrid SQLite Schema - Only for high-volume data
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', '..', 'sav_hybrid.db');
export const db = new Database(dbPath);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL'); // Better performance

// Only create tables for high-volume data
export function createHybridSchema() {
    // Project Compositions
    db.exec(`
        CREATE TABLE IF NOT EXISTS project_compositions (
            id TEXT PRIMARY KEY,
            projectId TEXT NOT NULL,
            taskId TEXT NOT NULL,
            subtaskId TEXT,
            name TEXT,
            theoreticalQty REAL,
            unit TEXT,
            status TEXT,
            competences TEXT
        )
    `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_pc_project ON project_compositions(projectId)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_pc_status ON project_compositions(status)`);

    // Resource Assignments
    db.exec(`
        CREATE TABLE IF NOT EXISTS resource_assignments (
            id TEXT PRIMARY KEY,
            projectCompositionId TEXT NOT NULL,
            resourceId TEXT NOT NULL,
            estimatedQty REAL,
            status TEXT,
            assignedDate TEXT
        )
    `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ra_composition ON resource_assignments(projectCompositionId)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ra_resource ON resource_assignments(resourceId)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ra_status ON resource_assignments(status)`);

    // Daily Logs
    db.exec(`
        CREATE TABLE IF NOT EXISTS daily_logs (
            id TEXT PRIMARY KEY,
            projectId TEXT NOT NULL,
            resourceId TEXT NOT NULL,
            assignmentId TEXT,
            taskId TEXT,
            subtaskId TEXT,
            date TEXT,
            startTime TEXT,
            endTime TEXT,
            hours REAL,
            comment TEXT
        )
    `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_dl_project ON daily_logs(projectId)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_dl_resource ON daily_logs(resourceId)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_dl_assignment ON daily_logs(assignmentId)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_dl_date ON daily_logs(date)`);

    console.log('✓ Hybrid schema created');
}

createHybridSchema();
