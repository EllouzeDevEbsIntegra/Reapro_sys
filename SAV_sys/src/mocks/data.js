// --- Imports (MUST be at the TOP) ---
import { useDataCache } from '../composables/useDataCache.js';
import { generatedProjects, generatedProjectCompositions, generatedResourceAssignments, generatedProjectStatuses } from './generated_data.js';
import { generatedDailyLogs } from './generated_logs.js';

export const competences = ['MECANIQUE', 'DIAGNOSTIC', 'CARROSSERIE', 'PEINTURE', 'LAVAGE', 'ELECTRICITE', 'CLIMATISATION', 'CAR PREPARATION', 'CAR PAINT'];

export const models = [
    { id: 'm1', name: 'Clio' },
];

export const resources = [
    { id: 'RES-00004', name: 'Karim', surname: 'Jendoubi', competences: ['MECANIQUE'], hireDate: '2025-02-01', team: 'Mécanique', teamId: 'TEAM-001', estActive: true },
    { id: 'RES-00005', name: 'Sofien', surname: 'Gharbi', competences: ['MONTAGE / DEMONTAGE', 'DRESSAGE'], hireDate: '2023-05-20', team: 'Carrosserie', teamId: 'TEAM-002', estActive: true },
    { id: 'RES-00011', name: 'Fakhri', surname: 'Hammami', competences: ['SERVICE RAPIDE'], hireDate: '2023-08-14', team: 'Service Rapide', teamId: 'TEAM-003', estActive: true },
    { id: 'RES-00009', name: 'Aymen', surname: 'Mbarek', competences: ['DIAGNOSTIC', 'ELECTRICITE'], hireDate: '2023-11-03', team: 'Diagnostic', teamId: 'TEAM-004', estActive: true },
    { id: 'RES-00002', name: 'Ahmed', surname: 'Trabelsi', competences: ['MECANIQUE'], hireDate: '2023-07-22', team: 'Mécanique', teamId: 'TEAM-001', estActive: true },
    { id: 'RES-00006', name: 'Bilel', surname: 'Dkhili', competences: ['PEINTURE'], hireDate: '2023-09-18', team: 'Carrosserie', teamId: 'TEAM-002', estActive: true },
    { id: 'RES-00007', name: 'Rami', surname: 'Zoghlami', competences: ['CAR PREPARATION'], hireDate: '2024-04-12', team: 'Carrosserie', teamId: 'TEAM-002', estActive: true },
    { id: 'RES-00014', name: 'Jihed', surname: 'Mansour', competences: ['LAVAGE'], hireDate: '2024-07-19', team: 'Lavage', teamId: 'TEAM-005', estActive: true },
    { id: 'RES-00003', name: 'Yassine', surname: 'Ben Salem', competences: ['DIAGNOSTIC', 'MECANIQUE'], hireDate: '2024-01-10', team: 'Mécanique', teamId: 'TEAM-001', estActive: true },
    { id: 'RES-00008', name: 'Nizar', surname: 'Ayadi', competences: ['MONTAGE / DEMONTAGE'], hireDate: '2024-11-05', team: 'Carrosserie', teamId: 'TEAM-002', estActive: true },
    { id: 'RES-00012', name: 'Nader', surname: 'Ayari', competences: ['SERVICE RAPIDE'], hireDate: '2024-03-25', team: 'Service Rapide', teamId: 'TEAM-003', estActive: true },
    { id: 'RES-00013', name: 'Wael', surname: 'Ben Rejeb', competences: ['SERVICE RAPIDE'], hireDate: '2023-12-01', team: 'Service Rapide', teamId: 'TEAM-003', estActive: true },
    { id: 'RES-00015', name: 'Saber', surname: 'Bouaziz', competences: ['LAVAGE'], hireDate: '2025-01-10', team: 'Lavage', teamId: 'TEAM-005', estActive: true },
    { id: 'RES-00010', name: 'Seifeddine', surname: 'Chaouch 2', competences: ['ELECTRICITE', 'SERVICE RAPIDE'], hireDate: '2022-06-30', team: 'Diagnostic', teamId: 'TEAM-004', estActive: true },
    { id: 'RES-00001', name: 'Mohamed', surname: 'Amri', competences: ['MECANIQUE', 'SERVICE RAPIDE'], hireDate: '2023-03-15', team: 'Mécanique', teamId: 'TEAM-001', estActive: true }
];

export const tasks = [
    { id: 'VIDANGE', name: 'Vidange' },
    { id: 'MO-0000022', name: 'Remplacement Plaquettes' },
    { id: 'MO-0000037', name: 'Remplacement Disques' },
    { id: 'MO-0000002', name: 'Peinture Complète' },
    { id: 'LAVAGE', name: 'Lavage Complet' },
    { id: 'DIAG', name: 'Diagnostic Electronique' },
];

export const taskConfigurations = [
    {
        taskId: 'VIDANGE',
        modelId: 'm1',
        subtasks: [
            { subtaskId: 'ST-V1', name: 'Vidange Huile', theoreticalHours: 0.5, competences: ['MECANIQUE'] },
            { subtaskId: 'ST-V2', name: 'Remplacement Filtre', theoreticalHours: 0.25, competences: ['MECANIQUE'] },
            { subtaskId: 'ST-V3', name: 'Contrôle Niveaux', theoreticalHours: 0.25, competences: ['MECANIQUE'] }
        ]
    },
    {
        taskId: 'MO-0000022',
        modelId: 'm1',
        subtasks: [
            { subtaskId: 'ST-M1', name: 'Démontage Roues', theoreticalHours: 0.2, competences: ['MECANIQUE'] },
            { subtaskId: 'ST-M2', name: 'Remplacement Plaquettes', theoreticalHours: 0.8, competences: ['MECANIQUE'] },
            { subtaskId: 'ST-M3', name: 'Essai Freinage', theoreticalHours: 0.2, competences: ['MECANIQUE'] }
        ]
    },
    {
        taskId: 'MO-0000037',
        modelId: 'm1',
        subtasks: [
            { subtaskId: 'ST-D1', name: 'Démontage Roues', theoreticalHours: 0.2, competences: ['MECANIQUE'] },
            { subtaskId: 'ST-D2', name: 'Remplacement Disques', theoreticalHours: 1.2, competences: ['MECANIQUE'] },
            { subtaskId: 'ST-D3', name: 'Essai Freinage', theoreticalHours: 0.2, competences: ['MECANIQUE'] }
        ]
    },
    {
        taskId: 'MO-0000002',
        modelId: 'm1',
        subtasks: [
            { subtaskId: 'ST-C1', name: 'Démontage Eléments', theoreticalHours: 3.0, competences: ['CARROSSERIE', 'CAR PREPARATION'] },
            { subtaskId: 'ST-C2', name: 'Redressage', theoreticalHours: 4.0, competences: ['CARROSSERIE', 'CAR PREPARATION'] },
            { subtaskId: 'ST-C3', name: 'Préparation Surface', theoreticalHours: 4.0, competences: ['PEINTURE', 'CAR PREPARATION'] },
            { subtaskId: 'ST-C4', name: 'Application Apprêt', theoreticalHours: 2.0, competences: ['PEINTURE', 'CAR PAINT'] },
            { subtaskId: 'ST-C5', name: 'Peinture', theoreticalHours: 4.0, competences: ['PEINTURE', 'CAR PAINT'] },
            { subtaskId: 'ST-C6', name: 'Vernis & Finition', theoreticalHours: 3.0, competences: ['PEINTURE', 'CAR PAINT'] }
        ]
    },
    {
        taskId: 'LAVAGE',
        modelId: 'm1',
        subtasks: [
            { subtaskId: 'ST-L1', name: 'Lavage Extérieur', theoreticalHours: 0.5, competences: ['LAVAGE'] },
            { subtaskId: 'ST-L2', name: 'Nettoyage Intérieur', theoreticalHours: 0.5, competences: ['LAVAGE'] }
        ]
    },
    {
        taskId: 'DIAG',
        modelId: 'm1',
        subtasks: [
            { subtaskId: 'ST-DG1', name: 'Lecture Codes Défaut', theoreticalHours: 0.5, competences: ['DIAGNOSTIC'] },
            { subtaskId: 'ST-DG2', name: 'Analyse & Rapport', theoreticalHours: 1.0, competences: ['DIAGNOSTIC'] }
        ]
    }
];

export const teams = [
    { id: 'TEAM-001', name: 'Mécanique', picture: true },
    { id: 'TEAM-002', name: 'Carrosserie', picture: true },
    { id: 'TEAM-003', name: 'Service Rapide', picture: true },
    { id: 'TEAM-004', name: 'Diagnostic', picture: true },
    { id: 'TEAM-005', name: 'Lavage', picture: true }
];

export const brands = [
    { id: 'renault', name: 'Renault' },
    { id: 'peugeot', name: 'Peugeot' },
    { id: 'citroen', name: 'Citroën' },
    { id: 'mercedes', name: 'Mercedes' },
    { id: 'bmw', name: 'BMW' },
    { id: 'audi', name: 'Audi' },
    { id: 'volkswagen', name: 'Volkswagen' },
    { id: 'fiat', name: 'Fiat' },
    { id: 'alfa', name: 'Alfa Romeo' },
    { id: 'volvo', name: 'Volvo' },
    { id: 'kia', name: 'Kia' },
    { id: 'range', name: 'Range Rover' }
];

export const monthlyObjectives = [
    { id: 'obj1', resourceId: 'RES-00004', year: 2025, month: 1, objectiveHours: 160 },
    { id: 'obj2', resourceId: 'RES-00005', year: 2025, month: 1, objectiveHours: 160 },
    { id: 'obj3', resourceId: 'RES-00011', year: 2025, month: 1, objectiveHours: 160 },
    { id: 'obj4', resourceId: 'RES-00009', year: 2025, month: 1, objectiveHours: 160 },
    { id: 'obj5', resourceId: 'RES-00002', year: 2025, month: 1, objectiveHours: 160 },
    // Mock data for December 2025 (Current View)
    { id: 'obj6', resourceId: 'RES-00004', year: 2025, month: 12, objectiveHours: 150 },
    { id: 'obj7', resourceId: 'RES-00005', year: 2025, month: 12, objectiveHours: 150 },
    { id: 'obj8', resourceId: 'RES-00011', year: 2025, month: 12, objectiveHours: 150 },
    { id: 'obj9', resourceId: 'RES-00009', year: 2025, month: 12, objectiveHours: 150 },
    { id: 'obj10', resourceId: 'RES-00002', year: 2025, month: 12, objectiveHours: 150 },
    { id: 'obj11', resourceId: 'RES-00006', year: 2025, month: 12, objectiveHours: 150 },
    { id: 'obj12', resourceId: 'RES-00007', year: 2025, month: 12, objectiveHours: 150 },
    { id: 'obj13', resourceId: 'RES-00014', year: 2025, month: 12, objectiveHours: 150 },
    { id: 'obj14', resourceId: 'RES-00003', year: 2025, month: 12, objectiveHours: 150 },
    { id: 'obj15', resourceId: 'RES-00008', year: 2025, month: 12, objectiveHours: 150 },
    { id: 'obj16', resourceId: 'RES-00012', year: 2025, month: 12, objectiveHours: 150 },
    { id: 'obj17', resourceId: 'RES-00013', year: 2025, month: 12, objectiveHours: 150 },
    { id: 'obj18', resourceId: 'RES-00015', year: 2025, month: 12, objectiveHours: 150 },
    { id: 'obj19', resourceId: 'RES-00010', year: 2025, month: 12, objectiveHours: 150 },
    { id: 'obj20', resourceId: 'RES-00001', year: 2025, month: 12, objectiveHours: 150 }
];

// --- Cached Data Access ---
const { withCache } = useDataCache();

export const getCachedProjects = () => withCache('projects', async () => generatedProjects);
export const getCachedCompositions = () => withCache('compositions', async () => generatedProjectCompositions);
export const getCachedAssignments = () => withCache('assignments', async () => generatedResourceAssignments);
export const getCachedDailyLogs = () => withCache('dailyLogs', async () => generatedDailyLogs);

// --- Legacy exports (required by dataService.js) ---
export const projects = generatedProjects;
export const projectCompositions = generatedProjectCompositions;
export const resourceAssignments = generatedResourceAssignments;
export const dailyLogs = generatedDailyLogs;

export const numberingSeries = [
    {
        id: '1',
        entityType: 'PROJECT',
        prefix: 'CS25-',
        suffix: '',
        startNumber: 1,
        currentNumber: 2600,
        increment: 1,
        padding: 6,
        active: true
    },
    {
        id: '2',
        entityType: 'RESOURCE',
        prefix: 'RES-',
        suffix: '',
        startNumber: 100,
        currentNumber: 104,
        increment: 1,
        padding: 4,
        active: true
    }
];

