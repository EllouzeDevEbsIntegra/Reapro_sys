// Hybrid Data Service - SQLite wrapper for high-volume data
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', '..', 'sav_hybrid.db');
const db = new Database(dbPath, { readonly: true }); // Read-only for safety

db.pragma('journal_mode = WAL');

export const sqliteService = {
    // Project Compositions
    getProjectCompositions(projectId = null) {
        if (projectId) {
            const stmt = db.prepare('SELECT * FROM project_compositions WHERE projectId = ?');
            const rows = stmt.all(projectId);
            return rows.map(row => ({
                ...row,
                competences: JSON.parse(row.competences)
            }));
        }
        const rows = db.prepare('SELECT * FROM project_compositions').all();
        return rows.map(row => ({
            ...row,
            competences: JSON.parse(row.competences)
        }));
    },

    // Resource Assignments
    getResourceAssignments(filters = {}) {
        let query = 'SELECT * FROM resource_assignments WHERE 1=1';
        const params = [];

        if (filters.projectCompositionId) {
            query += ' AND projectCompositionId = ?';
            params.push(filters.projectCompositionId);
        }
        if (filters.resourceId) {
            query += ' AND resourceId = ?';
            params.push(filters.resourceId);
        }
        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        return db.prepare(query).all(...params);
    },

    // Daily Logs
    getDailyLogs(filters = {}) {
        let query = 'SELECT * FROM daily_logs WHERE 1=1';
        const params = [];

        if (filters.projectId) {
            query += ' AND projectId = ?';
            params.push(filters.projectId);
        }
        if (filters.resourceId) {
            query += ' AND resourceId = ?';
            params.push(filters.resourceId);
        }
        if (filters.assignmentId) {
            query += ' AND assignmentId = ?';
            params.push(filters.assignmentId);
        }
        if (filters.date) {
            query += ' AND date = ?';
            params.push(filters.date);
        }
        if (filters.monthStart) {
            query += ' AND date >= ?';
            params.push(filters.monthStart);
        }

        return db.prepare(query).all(...params);
    },

    // Optimized queries for dashboard
    getDashboardStats() {
        // Count assignments by status
        const assignmentStats = db.prepare(`
            SELECT status, COUNT(*) as count 
            FROM resource_assignments 
            GROUP BY status
        `).all();

        // Get total hours by team (join with resources from mock)
        const teamHours = db.prepare(`
            SELECT resourceId, SUM(hours) as totalHours
            FROM daily_logs
            GROUP BY resourceId
        `).all();

        // Get productivity data (completed assignments)
        const productivity = db.prepare(`
            SELECT 
                COUNT(*) as completedCount,
                SUM(estimatedQty) as totalEstimated
            FROM resource_assignments
            WHERE status = 'Terminé'
        `).get();

        const totalRealHours = db.prepare(`
            SELECT SUM(hours) as total
            FROM daily_logs
            WHERE assignmentId IN (
                SELECT id FROM resource_assignments WHERE status = 'Terminé'
            )
        `).get();

        return {
            assignmentStats,
            teamHours,
            productivity: {
                ...productivity,
                totalReal: totalRealHours.total
            }
        };
    },

    // Monthly evolution
    getMonthlyProjectCounts() {
        // This needs projectCompositions which we have
        const monthlyData = db.prepare(`
            SELECT 
                strftime('%Y-%m', date) as month,
                COUNT(DISTINCT projectId) as count
            FROM daily_logs
            WHERE date IS NOT NULL
            GROUP BY month
            ORDER BY month DESC
            LIMIT 12
        `).all();

        return monthlyData;
    },

    // Close database (for cleanup)
    close() {
        db.close();
    }
};
