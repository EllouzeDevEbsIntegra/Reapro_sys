// Données de workload réalistes basées sur les APIs réelles
// Ce fichier contient des affectations pré-générées pour éviter la génération dynamique
// 4 ressources maximum par équipe pour tenir sur une ligne

export const workloadAssignments = [
    // Équipe Mécanique (4 ressources)
    { resourceId: '1', resourceName: 'Ahmed ben Ali', teamName: 'Mécanique', projectCode: 'CS25-1801', subTaskName: 'Dressage Pare-choc', plannedHours: 8, workedHours: 7.5, status: 'En cours' },
    { resourceId: '1', resourceName: 'Ahmed ben Ali', teamName: 'Mécanique', projectCode: 'CS25-2003', subTaskName: 'Dressage Aile', plannedHours: 6, workedHours: 0, status: 'Planifié' },

    { resourceId: '2', resourceName: 'Salah Mansouri', teamName: 'Mécanique', projectCode: 'CS25-1835', subTaskName: 'Remplacement amort', plannedHours: 10, workedHours: 9, status: 'En cours' },
    { resourceId: '2', resourceName: 'Salah Mansouri', teamName: 'Mécanique', projectCode: 'CS25-1879', subTaskName: 'Vidange', plannedHours: 3, workedHours: 0, status: 'Planifié' },

    { resourceId: '3', resourceName: 'Mohamed Trabelsi', teamName: 'Mécanique', projectCode: 'CS25-1936', subTaskName: 'Remplacement radiateur', plannedHours: 12, workedHours: 14, status: 'En cours' },
    { resourceId: '3', resourceName: 'Mohamed Trabelsi', teamName: 'Mécanique', projectCode: 'CS25-1940', subTaskName: 'Diagnostic moteur', plannedHours: 5, workedHours: 0, status: 'Planifié' },

    { resourceId: '4', resourceName: 'Youssef Gharbi', teamName: 'Mécanique', projectCode: 'CS25-1841', subTaskName: 'Remplacement embrayage', plannedHours: 9, workedHours: 8.5, status: 'En cours' },
    { resourceId: '4', resourceName: 'Youssef Gharbi', teamName: 'Mécanique', projectCode: 'CS25-1842', subTaskName: 'Vidange', plannedHours: 3, workedHours: 0, status: 'Planifié' },

    // Équipe Carrosserie (4 ressources)
    { resourceId: '6', resourceName: 'Karim Jlassi', teamName: 'Carrosserie', projectCode: 'CS25-1802', subTaskName: 'Dressage Aile', plannedHours: 14, workedHours: 12, status: 'En cours' },
    { resourceId: '6', resourceName: 'Karim Jlassi', teamName: 'Carrosserie', projectCode: 'CS25-1803', subTaskName: 'Remplacement capot', plannedHours: 7, workedHours: 0, status: 'Planifié' },

    { resourceId: '7', resourceName: 'Mehdi Bouaziz', teamName: 'Carrosserie', projectCode: 'CS25-1806', subTaskName: 'Dressage Pare-choc', plannedHours: 8, workedHours: 8.5, status: 'En cours' },
    { resourceId: '7', resourceName: 'Mehdi Bouaziz', teamName: 'Carrosserie', projectCode: 'CS25-1807', subTaskName: 'Débosselage portière', plannedHours: 10, workedHours: 0, status: 'Planifié' },

    { resourceId: '8', resourceName: 'Tarek Hammami', teamName: 'Carrosserie', projectCode: 'CS25-1812', subTaskName: 'Réparation châssis', plannedHours: 11, workedHours: 10, status: 'En cours' },
    { resourceId: '8', resourceName: 'Tarek Hammami', teamName: 'Carrosserie', projectCode: 'CS25-1813', subTaskName: 'Dressage Aile', plannedHours: 6, workedHours: 0, status: 'Planifié' },

    { resourceId: '9', resourceName: 'Nabil Amri', teamName: 'Carrosserie', projectCode: 'CS25-1900', subTaskName: 'Remplacement Pare-choc', plannedHours: 13, workedHours: 11.5, status: 'En cours' },
    { resourceId: '9', resourceName: 'Nabil Amri', teamName: 'Carrosserie', projectCode: 'CS25-1901', subTaskName: 'Débosselage hayon', plannedHours: 8, workedHours: 0, status: 'Planifié' },

    // Équipe Électricité (4 ressources)
    { resourceId: '10', resourceName: 'Firas Dridi', teamName: 'Électricité', projectCode: 'CS25-1924', subTaskName: 'Diagnostic électrique', plannedHours: 6, workedHours: 5.5, status: 'En cours' },
    { resourceId: '10', resourceName: 'Firas Dridi', teamName: 'Électricité', projectCode: 'CS25-1925', subTaskName: 'Remplacement batterie', plannedHours: 4, workedHours: 0, status: 'Planifié' },

    { resourceId: '11', resourceName: 'Wassim Ferchichi', teamName: 'Électricité', projectCode: 'CS25-1930', subTaskName: 'Réparation faisceau', plannedHours: 10, workedHours: 11, status: 'En cours' },
    { resourceId: '11', resourceName: 'Wassim Ferchichi', teamName: 'Électricité', projectCode: 'CS25-1931', subTaskName: 'Remplacement alternateur', plannedHours: 7, workedHours: 0, status: 'Planifié' },

    { resourceId: '12', resourceName: 'Slim Khelifi', teamName: 'Électricité', projectCode: 'CS25-1935', subTaskName: 'Installation autoradio', plannedHours: 9, workedHours: 8, status: 'En cours' },
    { resourceId: '12', resourceName: 'Slim Khelifi', teamName: 'Électricité', projectCode: 'CS25-1936', subTaskName: 'Diagnostic capteurs', plannedHours: 5, workedHours: 0, status: 'Planifié' },

    { resourceId: '16', resourceName: 'Amine Sassi', teamName: 'Électricité', projectCode: 'CS25-1945', subTaskName: 'Réparation climatisation', plannedHours: 8, workedHours: 7, status: 'En cours' },
    { resourceId: '16', resourceName: 'Amine Sassi', teamName: 'Électricité', projectCode: 'CS25-1946', subTaskName: 'Remplacement démarreur', plannedHours: 6, workedHours: 0, status: 'Planifié' },

    // Équipe Peinture (4 ressources)
    { resourceId: '13', resourceName: 'Bilel Chouchane', teamName: 'Peinture', projectCode: 'CS25-1950', subTaskName: 'Préparation surface', plannedHours: 15, workedHours: 16, status: 'En cours' },
    { resourceId: '13', resourceName: 'Bilel Chouchane', teamName: 'Peinture', projectCode: 'CS25-1951', subTaskName: 'Peinture complète', plannedHours: 20, workedHours: 0, status: 'Planifié' },

    { resourceId: '14', resourceName: 'Khaled Saidi', teamName: 'Peinture', projectCode: 'CS25-1955', subTaskName: 'Peinture Pare-choc', plannedHours: 12, workedHours: 13, status: 'En cours' },
    { resourceId: '14', resourceName: 'Khaled Saidi', teamName: 'Peinture', projectCode: 'CS25-1956', subTaskName: 'Vernissage', plannedHours: 8, workedHours: 0, status: 'Planifié' },

    { resourceId: '15', resourceName: 'Rami Toumi', teamName: 'Peinture', projectCode: 'CS25-1960', subTaskName: 'Peinture portières', plannedHours: 18, workedHours: 19, status: 'En cours' },
    { resourceId: '15', resourceName: 'Rami Toumi', teamName: 'Peinture', projectCode: 'CS25-1961', subTaskName: 'Polish finition', plannedHours: 6, workedHours: 0, status: 'Planifié' },

    { resourceId: '17', resourceName: 'Samir Ben Amor', teamName: 'Peinture', projectCode: 'CS25-1965', subTaskName: 'Préparation surface', plannedHours: 10, workedHours: 9.5, status: 'En cours' },
    { resourceId: '17', resourceName: 'Samir Ben Amor', teamName: 'Peinture', projectCode: 'CS25-1966', subTaskName: 'Peinture capot', plannedHours: 12, workedHours: 0, status: 'Planifié' },

    // Équipe Service Rapide (4 ressources)
    { resourceId: '18', resourceName: 'Hichem Hadj Amor', teamName: 'Service Rapide', projectCode: 'CS25-2001', subTaskName: 'Vidange rapide', plannedHours: 2, workedHours: 1.5, status: 'En cours' },
    { resourceId: '18', resourceName: 'Hichem Hadj Amor', teamName: 'Service Rapide', projectCode: 'CS25-2002', subTaskName: 'Changement plaquettes', plannedHours: 3, workedHours: 0, status: 'Planifié' },

    { resourceId: '19', resourceName: 'Walid Cherif', teamName: 'Service Rapide', projectCode: 'CS25-2005', subTaskName: 'Remplacement filtre', plannedHours: 1.5, workedHours: 1, status: 'En cours' },
    { resourceId: '19', resourceName: 'Walid Cherif', teamName: 'Service Rapide', projectCode: 'CS25-2006', subTaskName: 'Vidange rapide', plannedHours: 2, workedHours: 0, status: 'Planifié' },

    { resourceId: '20', resourceName: 'Sami Belhadj', teamName: 'Service Rapide', projectCode: 'CS25-2010', subTaskName: 'Contrôle pneumatiques', plannedHours: 4, workedHours: 4.5, status: 'En cours' },
    { resourceId: '20', resourceName: 'Sami Belhadj', teamName: 'Service Rapide', projectCode: 'CS25-2011', subTaskName: 'Changement essuie-glaces', plannedHours: 1, workedHours: 0, status: 'Planifié' },

    { resourceId: '21', resourceName: 'Nizar Mkaddem', teamName: 'Service Rapide', projectCode: 'CS25-2015', subTaskName: 'Vidange rapide', plannedHours: 2, workedHours: 2, status: 'En cours' },
    { resourceId: '21', resourceName: 'Nizar Mkaddem', teamName: 'Service Rapide', projectCode: 'CS25-2016', subTaskName: 'Remplacement balais', plannedHours: 1.5, workedHours: 0, status: 'Planifié' },

    // Équipe Diagnostic (4 ressources)
    { resourceId: '22', resourceName: 'Riadh Souissi', teamName: 'Diagnostic', projectCode: 'CS25-2020', subTaskName: 'Diagnostic électronique', plannedHours: 8, workedHours: 7, status: 'En cours' },
    { resourceId: '22', resourceName: 'Riadh Souissi', teamName: 'Diagnostic', projectCode: 'CS25-2021', subTaskName: 'Analyse moteur', plannedHours: 10, workedHours: 0, status: 'Planifié' },

    { resourceId: '23', resourceName: 'Hatem Landolsi', teamName: 'Diagnostic', projectCode: 'CS25-2025', subTaskName: 'Diagnostic transmission', plannedHours: 12, workedHours: 13, status: 'En cours' },
    { resourceId: '23', resourceName: 'Hatem Landolsi', teamName: 'Diagnostic', projectCode: 'CS25-2026', subTaskName: 'Test performance', plannedHours: 6, workedHours: 0, status: 'Planifié' },

    { resourceId: '24', resourceName: 'Farouk Jebali', teamName: 'Diagnostic', projectCode: 'CS25-2030', subTaskName: 'Diagnostic suspension', plannedHours: 9, workedHours: 8.5, status: 'En cours' },
    { resourceId: '24', resourceName: 'Farouk Jebali', teamName: 'Diagnostic', projectCode: 'CS25-2031', subTaskName: 'Contrôle freinage', plannedHours: 7, workedHours: 0, status: 'Planifié' },

    { resourceId: '25', resourceName: 'Chokri Mahjoub', teamName: 'Diagnostic', projectCode: 'CS25-2035', subTaskName: 'Diagnostic complet', plannedHours: 15, workedHours: 14, status: 'En cours' },
    { resourceId: '25', resourceName: 'Chokri Mahjoub', teamName: 'Diagnostic', projectCode: 'CS25-2036', subTaskName: 'Analyse pollution', plannedHours: 5, workedHours: 0, status: 'Planifié' }
];

// Fonction helper pour obtenir les affectations d'une ressource
export const getResourceAssignments = (resourceId) => {
    return workloadAssignments.filter(a => a.resourceId === resourceId);
};

// Fonction helper pour obtenir les affectations par équipe
export const getTeamAssignments = (teamName) => {
    return workloadAssignments.filter(a => a.teamName === teamName);
};
