import {
    teams,
    resources,
    tasks,
    projectCompositions,
    resourceAssignments,
    dailyLogs,
    taskConfigurations,
    competences,
    monthlyObjectives,
    getCachedCompositions,
    getCachedAssignments,
    getCachedDailyLogs,
    numberingSeries
} from '../mocks/data';
import api from './api';

// Enhanced cache with TTL for performance optimization
const cache = {
    dashboardCharts: null,
    dashboardKPIs: null,
    // Reference data cache with timestamps
    data: new Map(),
    ttl: 5 * 60 * 1000, // 5 minutes

    get(key) {
        const cached = this.data.get(key);
        if (!cached) return null;

        const now = Date.now();
        if (now - cached.timestamp > this.ttl) {
            this.data.delete(key);
            return null;
        }

        return cached.value;
    },

    set(key, value) {
        this.data.set(key, {
            value,
            timestamp: Date.now()
        });
    },

    invalidate(key) {
        if (key) {
            this.data.delete(key);
        } else {
            this.data.clear();
        }
    }
};

export const dataService = {
    // Helper to calculate progress
    calculateProgress(compositions) {
        if (!compositions || compositions.length === 0) return 0;

        let totalEstimated = 0;
        let completedEstimated = 0;

        compositions.forEach(c => {
            const estimated = c.theoreticalQty || 0;
            totalEstimated += estimated;
            if (c.status === 'Terminé') {
                completedEstimated += estimated;
            }
        });

        return totalEstimated > 0 ? Math.round((completedEstimated / totalEstimated) * 100) : 0;
    },

    // Get Global Dashboard KPIs
    async getDashboardKPIsV2() {
        const stats = {
            statusCounts: {},
            productivity: 0,
            totalOrders: 0,
            totalOrders: 0,
            totalResources: 0
        };

        try {
            // Fetch resources count
            const resourcesList = await this.getResources();
            stats.totalResources = resourcesList.length;
            // Use the dedicated API endpoint to count statuses by year
            const year = new Date().getFullYear(); // 2025
            const response = await api.get(`/projects/countStatus/${year}`);

            // Response format: { "NOUVEAU": 10, "EN_COURS": 5, "TERMINE": 3 }
            stats.statusCounts = response.data || {};

            // Calculate total orders
            stats.totalOrders = Object.values(stats.statusCounts).reduce((sum, count) => sum + count, 0);

            // Calculate completion rate: Terminé / total
            const completed = stats.statusCounts['Terminé'] || 0;
            stats.productivity = stats.totalOrders > 0 ? Math.round((completed / stats.totalOrders) * 100) : 0;

            return stats;
        } catch (error) {
            console.error('Error fetching dashboard KPIs:', error);
            return stats;
        }
    },

    // --- Projects ---
    async getProjects(params = {}) {
        try {
            const response = await api.get('/projects', {
                params: {
                    page: params.page || 0,
                    size: params.size || 20,
                    sort: params.sort || 'creationDate,desc',
                    // Add any filter params
                    ...params.filters
                }
            });

            // Return full paginated response for DataTable
            return {
                content: response.data?.content || [],
                totalElements: response.data?.totalElements || 0,
                totalPages: response.data?.totalPages || 0,
                size: response.data?.size || 20,
                number: response.data?.number || 0
            };
        } catch (error) {
            console.error('Error fetching projects:', error);
            return {
                content: [],
                totalElements: 0,
                totalPages: 0,
                size: 20,
                number: 0
            };
        }
    },

    async getProject(id) {
        try {
            const response = await api.get(`/projects/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching project:', error);
            throw error;
        }
    },

    /**
     * Get project with all lines and totals
     * @param {string} id - Project ID
     * @returns {Promise} - Project with lines array and totals
     */
    async getProjectWithLines(id) {
        try {
            const response = await api.get(`/projects/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching project with lines:', error);
            throw error;
        }
    },

    /**
     * Create project with lines
     * @param {Object} data - Project data with lines array
     * @returns {Promise} - Created project
     */
    async createProjectWithLines(data) {
        try {
            const response = await api.post('/projects', data);
            return response.data;
        } catch (error) {
            console.error('Error creating project with lines:', error);
            throw error;
        }
    },

    /**
     * Update project with lines
     * @param {string} id - Project ID
     * @param {Object} data - Project data with lines array
     * @returns {Promise} - Updated project
     */
    async updateProjectWithLines(id, data) {
        try {
            const response = await api.put(`/projects/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating project with lines:', error);
            throw error;
        }
    },

    /**
     * Add a new line to a project
     * @param {string} projectId
     * @param {Object} lineData
     */
    async addProjectLine(projectId, lineData) {
        try {
            const response = await api.post(`/projects/${projectId}/lines`, lineData);
            return response.data;
        } catch (error) {
            console.error('Error adding project line:', error);
            throw error;
        }
    },

    /**
     * Update an existing line in a project
     * @param {string} projectId
     * @param {number} lineNo
     * @param {Object} lineData
     */
    async updateProjectLine(projectId, lineNo, lineData) {
        try {
            const response = await api.put(`/projects/${projectId}/lines/${lineNo}`, lineData);
            return response.data;
        } catch (error) {
            console.error('Error updating project line:', error);
            throw error;
        }
    },

    /**
     * Delete a line from a project
     * @param {string} projectId
     * @param {number} lineNo
     */
    async deleteProjectLine(projectId, lineNo) {
        try {
            await api.delete(`/projects/${projectId}/lines/${lineNo}`);
        } catch (error) {
            console.error('Error deleting project line:', error);
            throw error;
        }
    },

    async createProject(project) {
        try {
            const response = await api.post('/projects', project);
            return response.data;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    },

    async updateProject(project) {
        try {
            const response = await api.put(`/projects/${project.id}`, project);
            return response.data;
        } catch (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    },

    async deleteProject(id) {
        try {
            await api.delete(`/projects/${id}`);
            return;
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    },




    // --- Resources ---
    async getResources() {
        try {
            const response = await api.get('/ressources');
            return response.data || [];
        } catch (error) {
            console.error('Error fetching resources:', error);
            return [];
        }
    },

    async createResource(resource) {
        try {
            const response = await api.post('/ressources', {
                nom: resource.nom,
                description: resource.description || null,
                typeRessource: resource.typeRessource || 'Humaine',
                telephone: resource.telephone || null,
                adresse: resource.adresse || null,
                dateRecrutement: resource.dateRecrutement || null,
                teamId: resource.teamId,
                competenceIds: resource.competenceIds || [],
                estActive: resource.estActive !== undefined ? resource.estActive : true
            });
            return response.data;
        } catch (error) {
            console.error('Error creating resource:', error);
            throw error;
        }
    },

    async updateResource(resource) {
        try {
            const response = await api.patch(`/ressources/${resource.id}`, {
                nom: resource.nom,
                description: resource.description || null,
                typeRessource: resource.typeRessource,
                telephone: resource.telephone || null,
                adresse: resource.adresse || null,
                dateRecrutement: resource.dateRecrutement || null,
                teamId: resource.teamId,
                competenceIds: resource.competenceIds || [],
                estActive: resource.estActive !== undefined ? resource.estActive : true,
                version: resource.version || 0
            });
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 409) {
                const conflictError = new Error('Les données ont été modifiées par quelqu\'un d\'autre. Veuillez recharger la page.');
                conflictError.code = 'CONFLICT';
                conflictError.status = 409;
                throw conflictError;
            }
            console.error('Error updating resource:', error);
            throw error;
        }
    },

    async deleteResource(id, version) {
        try {
            await api.delete(`/ressources/${id}`, {
                data: { version: version || 0 }
            });
        } catch (error) {
            if (error.response && error.response.status === 409) {
                const conflictError = new Error('Les données ont été modifiées par quelqu\'un d\'autre. Veuillez recharger la page.');
                conflictError.code = 'CONFLICT';
                conflictError.status = 409;
                throw conflictError;
            }
            console.error('Error deleting resource:', error);
            throw error;
        }
    },

    async getTeams() {
        try {
            const response = await api.get('/teams');
            return response.data || [];
        } catch (error) {
            console.error('Error fetching teams:', error);
            return [];
        }
    },

    async getModels() {
        try {
            const response = await api.get('/models');
            return response.data || [];
        } catch (error) {
            console.error('Error fetching models:', error);
            return [];
        }
    },

    async getBrands() {
        try {
            const response = await api.get('/brands');
            return response.data || [];
        } catch (error) {
            console.error('Error fetching brands:', error);
            return [];
        }
    },

    async getProjectEnumValues() {
        try {
            const response = await api.get('/projects/enum-values');
            return response.data || { types: [], priorities: [], statuses: [] };
        } catch (error) {
            console.error('Error fetching project enum values:', error);
            return { types: [], priorities: [], statuses: [] };
        }
    },

    // --- Numbering Series ---
    async getNumberingSeries() {
        // Mock implementation using local data
        return numberingSeries;
    },

    async updateNumberingSeries(series) {
        // Mock implementation
        const index = numberingSeries.findIndex(s => s.id === series.id);
        if (index !== -1) {
            numberingSeries[index] = { ...series };
        } else {
            series.id = Math.random().toString(36).substr(2, 9);
            numberingSeries.push(series);
        }
        return series;
    },

    async generateNextNumber(entityType) {
        const series = numberingSeries.find(s => s.entityType === entityType && s.active);
        if (!series) return null;

        const nextNum = series.currentNumber + series.increment;
        const numStr = nextNum.toString().padStart(series.padding, '0');
        const formatted = `${series.prefix}${numStr}${series.suffix || ''}`;

        // Update current number (in a real app, this would happen on save)
        // For now, we'll just return the formatted string. 
        // Ideally, we should have a separate method to commit the increment.
        return formatted;
    },

    async incrementNumberingSeries(entityType) {
        const series = numberingSeries.find(s => s.entityType === entityType && s.active);
        if (series) {
            series.currentNumber += series.increment;
        }
    },

    async createTeam(team) {
        try {
            const response = await api.post('/teams', {
                name: team.name,
                description: team.description
            });
            return response.data;
        } catch (error) {
            console.error('Error creating team:', error);
            throw error;
        }
    },

    async updateTeam(team) {
        try {
            const response = await api.patch(`/teams/${team.id}`, {
                name: team.name,
                description: team.description,
                version: team.version || 0
            });
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 409) {
                const conflictError = new Error('Les données ont été modifiées par quelqu\'un d\'autre. Veuillez recharger la page.');
                conflictError.code = 'CONFLICT';
                conflictError.status = 409;
                throw conflictError;
            }
            console.error('Error updating team:', error);
            throw error;
        }
    },

    async deleteTeam(id, version) {
        try {
            await api.delete(`/teams/${id}`, {
                data: { version: version || 0 }
            });
        } catch (error) {
            if (error.response && error.response.status === 409) {
                const conflictError = new Error('Les données ont été modifiées par quelqu\'un d\'autre. Veuillez recharger la page.');
                conflictError.code = 'CONFLICT';
                conflictError.status = 409;
                throw conflictError;
            }
            console.error('Error deleting team:', error);
            throw error;
        }
    },

    // --- Competences ---
    async getCompetences() {
        try {
            const response = await api.get('/competences');
            return response.data || [];
        } catch (error) {
            console.error('Error fetching competences:', error);
            return [];
        }
    },

    async getCompetence(id) {
        try {
            const response = await api.get(`/competences/${id}`);
            return {
                data: response.data,
                etag: response.headers['etag'] || response.headers['ETag']
            };
        } catch (error) {
            console.error('Error fetching competence:', error);
            throw error;
        }
    },

    async createCompetence(competence) {
        try {
            const response = await api.post('/competences', {
                code: competence.code || competence.name,
                label: competence.label || competence.name,
                description: competence.description || null
            });
            return response.data;
        } catch (error) {
            console.error('Error creating competence:', error);
            throw error;
        }
    },

    async updateCompetence(competence) {
        try {
            const id = competence.id;
            // Get current ETag if not provided
            let etag = competence._etag;
            if (!etag) {
                const current = await this.getCompetence(id);
                etag = current.etag;
            }

            const response = await api.put(`/competences/${id}`, {
                code: competence.code || competence.name,
                label: competence.label || competence.name,
                description: competence.description || null
            }, {
                headers: { 'If-Match': etag }
            });
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 412) {
                const conflictError = new Error('Les données ont été modifiées par quelqu\'un d\'autre. Veuillez recharger la page.');
                conflictError.code = 'CONFLICT';
                conflictError.status = 412;
                throw conflictError;
            }
            console.error('Error updating competence:', error);
            throw error;
        }
    },

    async deleteCompetence(id) {
        try {
            // Get current ETag
            const current = await this.getCompetence(id);
            const etag = current.etag;

            await api.delete(`/competences/${id}`, {
                headers: { 'If-Match': etag }
            });
        } catch (error) {
            if (error.response && error.response.status === 412) {
                const conflictError = new Error('Les données ont été modifiées par quelqu\'un d\'autre. Veuillez recharger la page.');
                conflictError.code = 'CONFLICT';
                conflictError.status = 412;
                throw conflictError;
            }
            console.error('Error deleting competence:', error);
            throw error;
        }
    },

    // --- Brands & Models ---
    async getBrands() {
        try {
            const response = await api.get('/brands');
            return response.data || [];
        } catch (error) {
            console.error('Error fetching brands:', error);
            return [];
        }
    },

    async getBrand(id) {
        try {
            const response = await api.get(`/brands/${id}`);
            // Return both data and ETag for version control
            return {
                data: response.data,
                etag: response.headers['etag'] || response.headers['ETag']
            };
        } catch (error) {
            console.error('Error fetching brand:', error);
            throw error;
        }
    },

    async createBrand(brand) {
        try {
            const response = await api.post('/brands', brand);
            return response.data;
        } catch (error) {
            console.error('Error creating brand:', error);
            throw error;
        }
    },

    async updateBrand(id, brand, etag) {
        try {
            const config = {};
            // Add If-Match header if ETag is provided for optimistic locking
            if (etag) {
                config.headers = {
                    'If-Match': etag
                };
            }

            const response = await api.patch(`/brands/${id}`, brand, config);

            // Return both data and new ETag
            return {
                data: response.data,
                etag: response.headers['etag'] || response.headers['ETag']
            };
        } catch (error) {
            // Handle 412 Precondition Failed (concurrent modification)
            if (error.response && error.response.status === 412) {
                const conflictError = new Error('Les données ont été modifiées par quelqu\'un d\'autre. Veuillez recharger la page.');
                conflictError.code = 'CONFLICT';
                conflictError.status = 412;
                throw conflictError;
            }
            console.error('Error updating brand:', error);
            throw error;
        }
    },

    async deleteBrand(id) {
        try {
            await api.delete(`/brands/${id}`);
        } catch (error) {
            console.error('Error deleting brand:', error);
            throw error;
        }
    },

    async uploadBrandLogo(id, file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.patch(`/brands/${id}/logo`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading brand logo:', error);
            throw error;
        }
    },

    async uploadResourcePicture(id, file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.patch(`/ressources/${id}/picture`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading resource picture:', error);
            throw error;
        }
    },

    async uploadTeamPicture(id, file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.patch(`/teams/${id}/picture`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading team picture:', error);
            throw error;
        }
    },

    async getModels() {
        try {
            const response = await api.get('/models');
            return response.data || [];
        } catch (error) {
            console.error('Error fetching models:', error);
            return [];
        }
    },

    async getModel(id) {
        try {
            const response = await api.get(`/models/${id}`);
            // Return both data and ETag for version control
            return {
                data: response.data,
                etag: response.headers['etag'] || response.headers['ETag']
            };
        } catch (error) {
            console.error('Error fetching model:', error);
            throw error;
        }
    },

    async createModel(model) {
        try {
            const response = await api.post('/models', model);
            return response.data;
        } catch (error) {
            console.error('Error creating model:', error);
            throw error;
        }
    },

    async updateModel(id, model, etag) {
        try {
            const config = {};
            // Add If-Match header if ETag is provided for optimistic locking
            if (etag) {
                config.headers = {
                    'If-Match': etag
                };
            }

            const response = await api.patch(`/models/${id}`, model, config);

            // Return both data and new ETag
            return {
                data: response.data,
                etag: response.headers['etag'] || response.headers['ETag']
            };
        } catch (error) {
            // Handle 412 Precondition Failed (concurrent modification)
            if (error.response && error.response.status === 412) {
                const conflictError = new Error('Les données ont été modifiées par quelqu\'un d\'autre. Veuillez recharger la page.');
                conflictError.code = 'CONFLICT';
                conflictError.status = 412;
                throw conflictError;
            }
            console.error('Error updating model:', error);
            throw error;
        }
    },

    async deleteModel(id) {
        try {
            await api.delete(`/models/${id}`);
        } catch (error) {
            console.error('Error deleting model:', error);
            throw error;
        }
    },

    // --- Tasks & Configuration ---
    async getTasks() {
        try {
            const response = await api.get('/tasks');
            return response.data || [];
        } catch (error) {
            console.error('Error fetching tasks:', error);
            return [];
        }
    },

    async getTask(id) {
        try {
            const response = await api.get(`/tasks/${id}`);
            return {
                data: response.data,
                etag: response.headers['etag'] || response.headers['ETag']
            };
        } catch (error) {
            console.error('Error fetching task:', error);
            throw error;
        }
    },

    async createTask(task) {
        try {
            const response = await api.post('/tasks', {
                code: task.code,
                label: task.label,
                competenceIds: task.competenceIds || [],
                subTaskLinks: task.subTaskLinks || []
            });
            return response.data;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    },

    async updateTask(task) {
        try {
            const id = task.id;
            // Get current ETag if not provided
            let etag = task._etag;
            if (!etag) {
                const current = await this.getTask(id);
                etag = current.etag;
            }

            const response = await api.put(`/tasks/${id}`, {
                code: task.code,
                label: task.label,
                competenceIds: task.competenceIds || [],
                subTaskLinks: task.subTaskLinks || []
            }, {
                headers: { 'If-Match': etag }
            });
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 412) {
                const conflictError = new Error('Les données ont été modifiées par quelqu\'un d\'autre. Veuillez recharger la page.');
                conflictError.code = 'CONFLICT';
                conflictError.status = 412;
                throw conflictError;
            }
            console.error('Error updating task:', error);
            throw error;
        }
    },

    async deleteTask(id) {
        try {
            // Get current ETag
            const current = await this.getTask(id);
            const etag = current.etag;

            await api.delete(`/tasks/${id}`, {
                headers: { 'If-Match': etag }
            });
        } catch (error) {
            if (error.response && error.response.status === 412) {
                const conflictError = new Error('Les données ont été modifiées par quelqu\'un d\'autre. Veuillez recharger la page.');
                conflictError.code = 'CONFLICT';
                conflictError.status = 412;
                throw conflictError;
            }
            console.error('Error deleting task:', error);
            throw error;
        }
    },

    getTaskConfigurations() {
        return Promise.resolve([...taskConfigurations]);
    },

    // --- SubTasks API ---
    async getSubTasks() {
        try {
            const response = await api.get('/subtasks');
            return response.data || [];
        } catch (error) {
            console.error('Error fetching subtasks:', error);
            return [];
        }
    },

    async getSubTask(id) {
        try {
            const response = await api.get(`/subtasks/${id}`);
            return {
                data: response.data,
                etag: response.headers['etag'] || response.headers['ETag']
            };
        } catch (error) {
            console.error('Error fetching subtask:', error);
            throw error;
        }
    },

    async createSubTask(subtask) {
        try {
            const response = await api.post('/subtasks', {
                code: subtask.code,
                label: subtask.label,
                competenceIds: subtask.competenceIds || [],
                taskLinks: subtask.taskLinks || []
            });
            return response.data;
        } catch (error) {
            console.error('Error creating subtask:', error);
            throw error;
        }
    },

    async updateSubTask(subtask) {
        try {
            const id = subtask.id;
            // Get current ETag if not provided
            let etag = subtask._etag;
            if (!etag) {
                const current = await this.getSubTask(id);
                etag = current.etag;
            }

            const response = await api.put(`/subtasks/${id}`, {
                code: subtask.code,
                label: subtask.label,
                competenceIds: subtask.competenceIds || [],
                taskLinks: subtask.taskLinks || []
            }, {
                headers: { 'If-Match': etag }
            });
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 412) {
                const conflictError = new Error('Les données ont été modifiées par quelqu\'un d\'autre. Veuillez recharger la page.');
                conflictError.code = 'CONFLICT';
                conflictError.status = 412;
                throw conflictError;
            }
            console.error('Error updating subtask:', error);
            throw error;
        }
    },

    async deleteSubTask(id) {
        try {
            // Get current ETag
            const current = await this.getSubTask(id);
            const etag = current.etag;

            await api.delete(`/subtasks/${id}`, {
                headers: { 'If-Match': etag }
            });
        } catch (error) {
            if (error.response && error.response.status === 412) {
                const conflictError = new Error('Les données ont été modifiées par quelqu\'un d\'autre. Veuillez recharger la page.');
                conflictError.code = 'CONFLICT';
                conflictError.status = 412;
                throw conflictError;
            }
            console.error('Error deleting subtask:', error);
            throw error;
        }
    },

    // Association Task-SubTask
    async addSubTaskToTask(subtaskId, taskId) {
        try {
            await api.post(`/subtasks/${subtaskId}/tasks/${taskId}`);
        } catch (error) {
            console.error('Error adding subtask to task:', error);
            throw error;
        }
    },

    async removeSubTaskFromTask(subtaskId, taskId) {
        try {
            await api.delete(`/subtasks/${subtaskId}/tasks/${taskId}`);
        } catch (error) {
            console.error('Error removing subtask from task:', error);
            throw error;
        }
    },

    // --- Monthly Objectives API ---
    async getMonthlyObjectives() {
        try {
            const response = await api.get('/monthly-objectives');
            return response.data;
        } catch (error) {
            console.error('Error fetching monthly objectives:', error);
            return [];
        }
    },

    async getMonthlyObjective(id) {
        try {
            const response = await api.get(`/monthly-objectives/${id}`);
            return {
                data: response.data,
                etag: response.headers['etag'] || response.headers['ETag']
            };
        } catch (error) {
            console.error('Error fetching monthly objective:', error);
            throw error;
        }
    },

    async createMonthlyObjective(objective) {
        try {
            const response = await api.post('/monthly-objectives', {
                monthYear: objective.monthYear,
                ressourceId: objective.ressourceId,
                targetHours: objective.targetHours
            });
            return response.data;
        } catch (error) {
            console.error('Error creating monthly objective:', error);
            throw error;
        }
    },

    async updateMonthlyObjective(objective) {
        try {
            const id = objective.id;
            // Get current ETag if not provided
            let etag = objective._etag;
            if (!etag) {
                const current = await this.getMonthlyObjective(id);
                etag = current.etag;
            }

            const response = await api.patch(`/monthly-objectives/${id}`, {
                monthYear: objective.monthYear,
                ressourceId: objective.ressourceId,
                targetHours: objective.targetHours
            }, {
                headers: { 'If-Match': etag }
            });
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 412) {
                const conflictError = new Error('Les données ont été modifiées par quelqu\'un d\'autre. Veuillez recharger la page.');
                conflictError.code = 'CONFLICT';
                conflictError.status = 412;
                throw conflictError;
            }
            console.error('Error updating monthly objective:', error);
            throw error;
        }
    },

    async deleteMonthlyObjective(id) {
        try {
            // Get current ETag
            const current = await this.getMonthlyObjective(id);
            const etag = current.etag;

            await api.delete(`/monthly-objectives/${id}`, {
                headers: { 'If-Match': etag }
            });
        } catch (error) {
            if (error.response && error.response.status === 412) {
                const conflictError = new Error('Les données ont été modifiées par quelqu\'un d\'autre. Veuillez recharger la page.');
                conflictError.code = 'CONFLICT';
                conflictError.status = 412;
                throw conflictError;
            }
            console.error('Error deleting monthly objective:', error);
            throw error;
        }
    },


    // --- Project Compositions (Subtasks) --- FROM GENERATED DATA
    async getProjectCompositions(projectId) {
        const compositions = await getCachedCompositions();
        if (projectId) {
            return compositions.filter(pc => pc.projectId === projectId);
        }
        const cached = cache.get('projectCompositions');
        if (cached) return cached;
        cache.set('projectCompositions', compositions);
        return compositions;
    },

    // --- Resource Assignments --- FROM GENERATED DATA
    async getResourceAssignments() {
        return await getCachedAssignments();
    },

    assignResource(assignment) {
        const newAssignment = {
            ...assignment,
            id: `ra-${Date.now()}`,
            status: 'Planifié'
        };
        resourceAssignments.push(newAssignment);
        return Promise.resolve(newAssignment);
    },

    async updateAssignmentPlannedQty(id, qtePrevue) {
        try {
            const response = await api.patch(`/project-subtask-assignments/${id}/planned-quantity`, { qtePrevue });
            return response.data;
        } catch (error) {
            console.error('Error updating assignment planned quantity:', error);
            throw error;
        }
    },

    // --- Daily Logs ---
    // --- Daily Logs ---
    // --- Daily Logs ---
    // --- Workload / Assignments API ---
    async searchAssignments(params) {
        try {
            // params: { page, size, sort, teamId, ressourceId, status, search }
            const queryParams = new URLSearchParams();
            if (params.page !== undefined) queryParams.append('page', params.page);
            if (params.size !== undefined) queryParams.append('size', params.size);
            if (params.sort) queryParams.append('sort', params.sort);
            if (params.teamId) queryParams.append('teamId', params.teamId);
            if (params.ressourceId) queryParams.append('ressourceId', params.ressourceId);
            if (params.status) queryParams.append('status', params.status);
            if (params.search) queryParams.append('search', params.search); // If API supports it

            const response = await api.get(`/project-subtask-assignments/search?${queryParams.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error searching assignments:', error);
            throw error;
        }
    },

    async reassignResource(assignmentId, newResourceId) {
        try {
            const response = await api.patch(`/project-subtask-assignments/${assignmentId}/ressource`, {
                newRessourceId: newResourceId
            });
            return response.data;
        } catch (error) {
            console.error('Error reassigning resource:', error);
            throw error;
        }
    },

    async getDailyLogs(params = {}) {
        try {
            // params: { page, size, sort, ressourceId, dateFrom, dateTo, cloture }
            const response = await api.get('/daily-logs', { params });
            return response.data; // Returns { content: [], totalElements: 0, ... }
        } catch (error) {
            console.error('Error fetching daily logs:', error);
            // Return empty structure to avoid frontend errors
            return { content: [], totalElements: 0 };
        }
    },

    async startDailyLog(assignmentId) {
        try {
            const response = await api.post('/daily-logs/start', { assignmentId });
            return response.data;
        } catch (error) {
            console.error('Error starting daily log:', error);
            throw error;
        }
    },

    async stopDailyLog(id, cloture) {
        try {
            const response = await api.patch(`/daily-logs/${id}/stop`, { cloture });
            return response.data;
        } catch (error) {
            console.error('Error stopping daily log:', error);
            throw error;
        }
    },

    async getTeamYearStats(year) {
        try {
            const response = await api.get('/project-subtask-assignments/team-year-stats', { params: { year } });
            return response.data;
        } catch (error) {
            console.error('Error fetching team year stats:', error);
            return null;
        }
    },

    async getMonthlyHours(params) {
        try {
            const response = await api.get('/reports/monthly-hours', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching monthly hours:', error);
            return [];
        }
    },

    async getAnnualHours(params) {
        try {
            const response = await api.get('/reports/annual-hours', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching annual hours:', error);
            return null;
        }
    },

    async checkCurrentDailyLog(assignmentId) {
        try {
            const response = await api.get(`/daily-logs/assignment/${assignmentId}/current`);
            // 204 No Content means no active log, returns empty body which axios might treat as '' or null
            if (response.status === 204 || !response.data) {
                return null;
            }
            return response.data;
        } catch (error) {
            console.error('Error checking current daily log:', error);
            return null;
        }
    },

    async createDailyLog(log) {
        try {
            const response = await api.post('/daily-logs', log);
            return response.data;
        } catch (error) {
            console.error('Error creating daily log:', error);
            throw error;
        }
    },

    async createManualDailyLog(log) {
        try {
            const response = await api.post('/daily-logs/manual', log);
            return response.data;
        } catch (error) {
            console.error('Error creating manual daily log:', error);
            throw error;
        }
    },

    async updateManualDailyLog(id, log, version) {
        try {
            const response = await api.patch(`/daily-logs/${id}/manual`, log, {
                headers: {
                    'If-Match': `"${version}"`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error updating manual daily log:', error);
            throw error;
        }
    },

    async updateDailyLog(log) {
        try {
            const response = await api.put(`/daily-logs/${log.id}`, log);
            return response.data;
        } catch (error) {
            console.error('Error updating daily log:', error);
            throw error;
        }
    },

    async deleteDailyLog(id) {
        try {
            await api.delete(`/daily-logs/${id}`);
        } catch (error) {
            console.error('Error deleting daily log:', error);
            throw error;
        }
    },

    // --- Reporting & KPIs ---

    // Get aggregated report for a resource for a specific month
    async getResourceReport(resourceId, monthStr) { // monthStr format 'YYYY-MM'
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) return Promise.reject('Resource not found');

        // Filter logs for this resource and month
        const allLogs = await getCachedDailyLogs();
        const logs = allLogs.filter(l =>
            l.resourceId === resourceId &&
            l.date.startsWith(monthStr)
        );

        // Calculate KPIs
        const totalHours = logs.reduce((sum, l) => sum + l.hours, 0);
        const uniqueDays = new Set(logs.map(l => l.date)).size;
        const uniqueProjects = new Set(logs.map(l => l.projectId)).size;

        // Efficiency Calculation (Real vs Estimated for completed assignments)
        // Find assignments worked on this month
        const workedAssignmentIds = [...new Set(logs.map(l => l.assignmentId))];
        const allAssignments = await getCachedAssignments();
        const workedAssignments = allAssignments.filter(ra => workedAssignmentIds.includes(ra.id));

        let totalEstimated = 0;
        let totalRealForCompleted = 0;

        workedAssignments.forEach(ra => {
            if (ra.status === 'Terminé') {
                totalEstimated += ra.estimatedTime;
                // Sum real hours from logs for this assignment (could span multiple months, but simplified here)
                const assignmentLogs = allLogs.filter(l => l.assignmentId === ra.id);
                const real = assignmentLogs.reduce((sum, l) => sum + l.hours, 0);
                totalRealForCompleted += real;
            }
        });

        const efficiency = totalRealForCompleted > 0 ? (totalEstimated / totalRealForCompleted) * 100 : 0;

        // Daily Breakdown
        const daysInMonth = new Date(monthStr.split('-')[0], monthStr.split('-')[1], 0).getDate();
        const dailyBreakdown = {};
        for (let i = 1; i <= daysInMonth; i++) {
            const dayStr = `${monthStr}-${String(i).padStart(2, '0')}`;
            const dayLogs = logs.filter(l => l.date === dayStr);
            const dayTotal = dayLogs.reduce((sum, l) => sum + l.hours, 0);

            // Group by project for that day
            const projectBreakdown = {};
            dayLogs.forEach(l => {
                if (!projectBreakdown[l.projectId]) projectBreakdown[l.projectId] = 0;
                projectBreakdown[l.projectId] += l.hours;
            });

            dailyBreakdown[i] = {
                total: dayTotal,
                projects: projectBreakdown
            };
        }

        return {
            resource,
            kpis: {
                totalHours,
                uniqueDays,
                uniqueProjects,
                efficiency: Math.round(efficiency)
            },
            dailyBreakdown
        };
    },

    // Get Global Dashboard KPIs
    async getDashboardKPIs() {
        const stats = {
            statusCounts: {},
            productivity: 0,
            totalOrders: 0,
            totalResources: resources.length
        };

        const projects = await getCachedProjects();
        stats.totalOrders = projects.length;

        // Count statuses
        projects.forEach(p => {
            const status = p.attributes?.attr2 || 'En attente';
            stats.statusCounts[status] = (stats.statusCounts[status] || 0) + 1;
        });

        // Calculate global productivity (Real / Estimated hours)
        let totalEstimated = 0;
        let totalReal = 0;

        // Calculate from assignments and logs
        const assignments = await getCachedAssignments();
        const logs = await getCachedDailyLogs();

        assignments.forEach(ra => {
            if (ra.status === 'Terminé') {
                totalEstimated += (ra.estimatedQty || 0);
                // Find logs for this assignment
                const assignmentLogs = logs.filter(l => l.assignmentId === ra.id);
                const real = assignmentLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
                totalReal += real;
            }
        });

        stats.productivity = totalEstimated > 0 ? Math.round((totalEstimated / totalReal) * 100) : 0;

        return stats;
    },

    async getDashboardChartsData() {
        // Return cached version if available
        if (cache.dashboardCharts) {
            return Promise.resolve(cache.dashboardCharts);
        }

        // Fetch all projects for calculation (limit to 1000 for now)
        const projectsResponse = await this.getProjects({ size: 1000 });
        const projectsList = projectsResponse.content || [];

        // Use generated data arrays
        const logs = await getCachedDailyLogs();
        const assignments = await getCachedAssignments();

        // 1. Hours by Team
        const teamHours = {};
        teams.forEach(t => teamHours[t.name] = 0);

        logs.forEach(log => {
            const resource = resources.find(r => r.id === log.resourceId);
            if (resource) {
                const team = teams.find(t => t.id === resource.teamId);
                if (team) {
                    teamHours[team.name] = (teamHours[team.name] || 0) + log.hours;
                }
            }
        });

        // 2. Top 5 Resources Productivity (Efficiency)
        const resourceStats = {};
        resources.forEach(r => resourceStats[r.id] = { name: r.name, estimated: 0, real: 0 });

        assignments.forEach(ra => {
            if (ra.status === 'Terminé') {
                if (resourceStats[ra.resourceId]) {
                    resourceStats[ra.resourceId].estimated += (ra.estimatedQty || 0);
                }
            }
        });

        logs.forEach(log => {
            if (resourceStats[log.resourceId]) {
                resourceStats[log.resourceId].real += log.hours;
            }
        });

        const topResources = Object.values(resourceStats)
            .filter(r => r.real > 10)
            .map(r => ({
                name: r.name,
                efficiency: r.real > 0 ? (r.estimated / r.real) * 100 : 0
            }))
            .sort((a, b) => b.efficiency - a.efficiency)
            .slice(0, 5);

        // 3. Monthly Project Evolution
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const monthlyData = new Array(12).fill(0);

        projectsList.forEach(p => {
            const date = new Date(p.creationDate);
            if (!isNaN(date)) {
                monthlyData[date.getMonth()]++;
            }
        });

        const currentMonth = new Date().getMonth();
        const chartLabels = [];
        const chartData = [];

        for (let i = 5; i >= 0; i--) {
            let mIndex = currentMonth - i;
            if (mIndex < 0) mIndex += 12;
            chartLabels.push(months[mIndex]);
            chartData.push(monthlyData[mIndex]);
        }

        const result = {
            teamHours: {
                labels: Object.keys(teamHours),
                data: Object.values(teamHours)
            },
            topResources: {
                labels: topResources.map(r => r.name),
                data: topResources.map(r => r.efficiency)
            },
            monthlyEvolution: {
                labels: chartLabels,
                data: chartData
            },
            workTypeDistribution: (() => {
                const typeCounts = {};
                projectsList.forEach(p => {
                    const type = p.type || 'Autre';
                    typeCounts[type] = (typeCounts[type] || 0) + 1;
                });
                return {
                    labels: Object.keys(typeCounts),
                    data: Object.values(typeCounts)
                };
            })()
        };

        // Cache for next request
        cache.dashboardCharts = result;
        return result;
    },

    // --- Assignment Management ---

    // Get all assignments for a specific project
    getProjectAssignments(projectId) {
        const compositions = projectCompositions.filter(pc => pc.projectId === projectId);
        const compositionIds = compositions.map(c => c.id);
        const assignments = resourceAssignments.filter(ra => compositionIds.includes(ra.projectCompositionId));

        // Enrich with composition and resource details
        return Promise.resolve(assignments.map(a => {
            const comp = compositions.find(c => c.id === a.projectCompositionId);
            const resource = resources.find(r => r.id === a.resourceId);
            return {
                ...a,
                subtaskName: comp?.name,
                resourceName: resource ? `${resource.name} ${resource.surname}` : 'Unknown'
            };
        }));
    },

    // Get assignments by resource (for workload view)
    async getAssignmentsByResource(resourceId) {
        const assignments = resourceAssignments.filter(ra => ra.resourceId === resourceId);

        // Fetch projects to enrich data
        const projectsResponse = await this.getProjects({ size: 1000 });
        const projectsList = projectsResponse.content || [];

        // Enrich with project and composition details
        return assignments.map(a => {
            const comp = projectCompositions.find(c => c.id === a.projectCompositionId);
            const project = projectsList.find(p => p.id === comp?.projectId);

            return {
                ...a,
                projectName: project?.name || 'Unknown',
                subtaskName: comp?.name || 'Unknown',
                priority: project?.priority || 'Moyenne',
                projectId: comp?.projectId
            };
        });
    },

    // Update project status
    async updateProjectStatus(projectId, newStatus) {
        try {
            const project = await this.getProject(projectId);
            if (project) {
                project.status = newStatus;
                await this.updateProject(project);
                return { projectId, status: newStatus };
            }
            throw new Error('Project not found');
        } catch (error) {
            console.error('Error updating project status:', error);
            throw error;
        }
    },

    // Auto-update project status based on assignments
    async autoUpdateProjectStatus(projectId) {
        const compositions = projectCompositions.filter(pc => pc.projectId === projectId);
        const compositionIds = compositions.map(c => c.id);
        const assignments = resourceAssignments.filter(ra => compositionIds.includes(ra.projectCompositionId));

        let newStatus = 'En cours'; // Default

        if (assignments.length === 0) {
            newStatus = 'En attente d\'affectation';
        } else {
            const hasStarted = assignments.some(a => a.status === 'En cours' || a.status === 'Terminé');
            const allCompleted = assignments.length > 0 && assignments.every(a => a.status === 'Terminé');

            if (allCompleted) {
                newStatus = 'Fin travaux';
            } else if (hasStarted) {
                newStatus = 'En cours de réparation';
            } else {
                newStatus = 'En attente début travaux';
            }
        }

        return this.updateProjectStatus(projectId, newStatus);
    },

    // Delete assignment
    deleteAssignment(assignmentId) {
        const index = resourceAssignments.findIndex(a => a.id === assignmentId);
        if (index !== -1) {
            resourceAssignments.splice(index, 1);
            return Promise.resolve();
        }
        return Promise.reject(new Error('Assignment not found'));
    },

    // Get Team Performance (hours worked, efficiency, monthly trends)
    getTeamPerformance() {
        const teamStats = {};

        // Initialize team stats
        teams.forEach(team => {
            teamStats[team.id] = {
                teamId: team.id,
                teamName: team.name,
                totalHours: 0,
                totalEstimated: 0,
                efficiency: 0,
                monthlyHours: {},
                year2024Hours: 0,
                year2025Hours: 0
            };
        });

        // Calculate hours by team and month
        dailyLogs.forEach(log => {
            const resource = resources.find(r => r.id === log.resourceId);
            if (resource && teamStats[resource.teamId]) {
                const logDate = new Date(log.date);
                const year = logDate.getFullYear();
                const month = logDate.getMonth() + 1; // 1-12
                const monthKey = `${year}-${month.toString().padStart(2, '0')}`;

                teamStats[resource.teamId].totalHours += log.hours;
                teamStats[resource.teamId].monthlyHours[monthKey] =
                    (teamStats[resource.teamId].monthlyHours[monthKey] || 0) + log.hours;

                if (year === 2024) {
                    teamStats[resource.teamId].year2024Hours += log.hours;
                } else if (year === 2025) {
                    teamStats[resource.teamId].year2025Hours += log.hours;
                }
            }
        });

        // Calculate estimated hours by team
        generatedResourceAssignments.forEach(assignment => {
            const resource = resources.find(r => r.id === assignment.resourceId);
            if (resource && teamStats[resource.teamId] && assignment.status === 'Terminé') {
                teamStats[resource.teamId].totalEstimated += (assignment.estimatedQty || 0);
            }
        });

        // Calculate efficiency (estimated / real * 100)
        Object.values(teamStats).forEach(stat => {
            if (stat.totalHours > 0) {
                stat.efficiency = Math.round((stat.totalEstimated / stat.totalHours) * 100);
            }
        });

        return Promise.resolve(Object.values(teamStats));
    },

    // Get Resource Performance (hours worked, tasks completed, efficiency)
    getResourcePerformance() {
        const resourceStats = {};

        // Initialize resource stats
        resources.forEach(resource => {
            resourceStats[resource.id] = {
                resourceId: resource.id,
                resourceName: resource.name,
                teamId: resource.teamId,
                totalHours: 0,
                totalEstimated: 0,
                tasksCompleted: 0,
                efficiency: 0,
                monthlyHours: {},
                year2024Hours: 0,
                year2025Hours: 0
            };
        });

        // Calculate hours by resource
        dailyLogs.forEach(log => {
            if (resourceStats[log.resourceId]) {
                const logDate = new Date(log.date);
                const year = logDate.getFullYear();
                const month = logDate.getMonth() + 1;
                const monthKey = `${year}-${month.toString().padStart(2, '0')}`;

                resourceStats[log.resourceId].totalHours += log.hours;
                resourceStats[log.resourceId].monthlyHours[monthKey] =
                    (resourceStats[log.resourceId].monthlyHours[monthKey] || 0) + log.hours;

                if (year === 2024) {
                    resourceStats[log.resourceId].year2024Hours += log.hours;
                } else if (year === 2025) {
                    resourceStats[log.resourceId].year2025Hours += log.hours;
                }
            }
        });

        // Calculate estimated hours and tasks completed
        resourceAssignments.forEach(assignment => {
            if (resourceStats[assignment.resourceId]) {
                if (assignment.status === 'Terminé') {
                    resourceStats[assignment.resourceId].totalEstimated += (assignment.estimatedQty || 0);
                    resourceStats[assignment.resourceId].tasksCompleted += 1;
                }
            }
        });

        // Calculate efficiency
        Object.values(resourceStats).forEach(stat => {
            if (stat.totalHours > 0) {
                stat.efficiency = Math.round((stat.totalEstimated / stat.totalHours) * 100);
            }
        });

        return Promise.resolve(Object.values(resourceStats));
    },

    // Get Monthly Performance Trends (for charts)
    getMonthlyPerformanceTrends() {
        const monthlyData = {};

        // Aggregate hours by month
        dailyLogs.forEach(log => {
            const logDate = new Date(log.date);
            const year = logDate.getFullYear();
            const month = logDate.getMonth() + 1;
            const monthKey = `${year}-${month.toString().padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    month: monthKey,
                    year: year,
                    totalHours: 0,
                    totalEstimated: 0,
                    efficiency: 0
                };
            }

            monthlyData[monthKey].totalHours += log.hours;
        });

        // Add estimated hours
        resourceAssignments.forEach(assignment => {
            if (assignment.status === 'Terminé' && assignment.assignedDate) {
                const assignDate = new Date(assignment.assignedDate);
                const year = assignDate.getFullYear();
                const month = assignDate.getMonth() + 1;
                const monthKey = `${year}-${month.toString().padStart(2, '0')}`;

                if (monthlyData[monthKey]) {
                    monthlyData[monthKey].totalEstimated += (assignment.estimatedQty || 0);
                }
            }
        });

        // Calculate efficiency
        Object.values(monthlyData).forEach(data => {
            if (data.totalHours > 0) {
                data.efficiency = Math.round((data.totalEstimated / data.totalHours) * 100);
            }
        });

        // Sort by month
        const sortedData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

        return Promise.resolve(sortedData);
    },

    // --- Objectives & Productivity ---

    // --- User Management ---
    async getUsers() {
        try {
            const response = await api.get('/users');
            return response.data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    async createUser(user) {
        try {
            const response = await api.post('/users', user);
            return response.data;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    async updateUser(user) {
        try {
            const response = await api.put(`/users/${user.id}`, user);
            return response.data;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },

    async deleteUser(id) {
        try {
            await api.delete(`/users/${id}`);
            return;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    // Chart 1: Team Objectives vs Realized (Grouped Bar)
    async getTeamObjectivesVsRealized(year = 2025) {
        try {
            // Récupérer les données depuis l'API
            const [objectives, teams, resources] = await Promise.all([
                this.getMonthlyObjectives(),
                this.getTeams(),
                this.getResources()
            ]);

            console.log('Objectives sample:', objectives[0]); // DEBUG
            console.log('Teams:', teams); // DEBUG
            console.log('Resources sample:', resources[0]); // DEBUG

            // Initialiser les stats pour chaque équipe (indexé par teamId)
            const teamStats = {};
            teams.forEach(team => {
                teamStats[team.id] = {
                    teamId: team.id,
                    teamName: team.name,
                    realized: 0,
                    objective: 0
                };
            });

            // Parcourir tous les objectifs mensuels et agréger par équipe
            objectives.forEach(obj => {
                // Parser l'année depuis monthYear (format YYYY-MM)
                const [objYear] = (obj.monthYear || '').split('-');
                const objYearNum = parseInt(objYear);

                // Filtrer par année sélectionnée
                if (objYearNum === year) {
                    // Trouver la ressource correspondante pour récupérer le teamId
                    const resource = resources.find(r => r.id === obj.ressourceId);

                    if (resource && teamStats[resource.teamId]) {
                        // Sommer les heures objectives et réalisées
                        teamStats[resource.teamId].objective += obj.targetHours || 0;
                        teamStats[resource.teamId].realized += obj.actualHours || 0;
                    }
                }
            });

            console.log('Team stats:', teamStats); // DEBUG
            return Object.values(teamStats);
        } catch (error) {
            console.error('Error in getTeamObjectivesVsRealized:', error);
            return [];
        }
    },

    // Chart 2 & 3: Monthly Productivity (N vs N-1)
    async getMonthlyProductivity() {
        try {
            const objectives = await this.getMonthlyObjectives();

            const monthlyData = {};

            // Initialize months for 2024 and 2025
            [2024, 2025].forEach(year => {
                for (let m = 1; m <= 12; m++) {
                    const key = `${year}-${m.toString().padStart(2, '0')}`;
                    monthlyData[key] = {
                        year: year,
                        month: m,
                        realized: 0,
                        objective: 0,
                        productivity: 0
                    };
                }
            });

            // Agréger les données des objectifs mensuels
            objectives.forEach(obj => {
                // Parser monthYear (format YYYY-MM)
                const [yearStr, monthStr] = (obj.monthYear || '').split('-');
                const year = parseInt(yearStr);
                const month = parseInt(monthStr);
                const key = `${year}-${month.toString().padStart(2, '0')}`;

                if (monthlyData[key]) {
                    monthlyData[key].realized += obj.actualHours || 0;
                    monthlyData[key].objective += obj.targetHours || 0;
                }
            });

            // Calculate productivity (realized / objective * 100)
            Object.values(monthlyData).forEach(data => {
                if (data.objective > 0) {
                    data.productivity = Math.round((data.realized / data.objective) * 100);
                }
            });

            // Sort by date
            return Object.values(monthlyData).sort((a, b) => {
                return (a.year - b.year) || (a.month - b.month);
            });
        } catch (error) {
            console.error('Error in getMonthlyProductivity:', error);
            return [];
        }
    },

    // Generate next number from numbering series
    async generateNextNumber(entityType) {
        try {
            // Call API to get next number from numbering series
            const response = await api.get(`/numbering-series/next/${entityType}`);
            return response.data.nextNumber || null;
        } catch (error) {
            console.error(`Error generating next number for ${entityType}:`, error);

            // Fallback to mock data if API fails
            const activeSeries = numberingSeries.find(
                s => s.entityType === entityType && s.active
            );

            if (activeSeries) {
                const nextNum = (activeSeries.currentNumber + activeSeries.increment)
                    .toString()
                    .padStart(activeSeries.padding, '0');
                return `${activeSeries.prefix}${nextNum}${activeSeries.suffix || ''}`;
            }

            return null;
        }
    },

    // Numbering Series Management (using mock data only)
    async getNumberingSeries() {
        // Return mock data directly
        return numberingSeries;
    },

    async updateNumberingSeries(series) {
        // Update mock data directly
        const index = numberingSeries.findIndex(s => s.id === series.id);
        if (index !== -1) {
            numberingSeries[index] = { ...series };
            return numberingSeries[index];
        }
        throw new Error('Numbering series not found');
    },

    async incrementNumberingSeries(entityType) {
        // Increment counter in mock data
        const activeSeries = numberingSeries.find(
            s => s.entityType === entityType && s.active
        );

        if (activeSeries) {
            activeSeries.currentNumber += activeSeries.increment;
            return activeSeries;
        }

        throw new Error(`No active numbering series found for ${entityType}`);
    },

    // --- Project Assignments (Affectations) ---
    async getProjectAssignments(projectId) {
        try {
            const response = await api.get(`/project-subtask-assignments/project/${projectId}`);
            return response.data || [];
        } catch (error) {
            console.error('Error fetching project assignments:', error);
            return [];
        }
    },

    async createAssignment(assignment) {
        try {
            const response = await api.post('/project-subtask-assignments', assignment);
            return response.data;
        } catch (error) {
            console.error('Error creating assignment:', error);
            throw error;
        }
    },

    async updateAssignmentRealQty(id, qteReelle) {
        try {
            const response = await api.patch(`/project-subtask-assignments/${id}/real-quantity`, { qteReelle });
            return response.data;
        } catch (error) {
            console.error('Error updating assignment real quantity:', error);
            throw error;
        }
    },

    async deleteAssignment(id) {
        try {
            await api.delete(`/project-subtask-assignments/${id}`);
        } catch (error) {
            console.error('Error deleting assignment:', error);
            throw error;
        }
    },

    async searchAssignments(params = {}) {
        try {
            const response = await api.get('/project-subtask-assignments/search', { params });
            return response.data || { content: [], totalElements: 0 };
        } catch (error) {
            console.error('Error searching assignments:', error);
            return { content: [], totalElements: 0 };
        }
    },

    // --- Performance Reports ---
    async getSubtaskPerformance(params = {}) {
        try {
            const response = await api.get('/reports/subtask-performance', { params });
            return response.data || [];
        } catch (error) {
            console.error('Error fetching subtask performance:', error);
            return [];
        }
    }
};

