// Mock data pour les objectifs et réalisations PDR (Pièces De Rechange)
// Données mensuelles pour 2024 et 2025

export const pdrMonthlyData = [
    // 2024
    { year: 2024, month: 1, monthName: 'Janvier', objective: 120, realized: 111 },
    { year: 2024, month: 2, monthName: 'Février', objective: 100, realized: 109 },
    { year: 2024, month: 3, monthName: 'Mars', objective: 100, realized: 89 },
    { year: 2024, month: 4, monthName: 'Avril', objective: 120, realized: 118 },
    { year: 2024, month: 5, monthName: 'Mai', objective: 140, realized: 146 },
    { year: 2024, month: 6, monthName: 'Juin', objective: 160, realized: 143 },
    { year: 2024, month: 7, monthName: 'Juillet', objective: 180, realized: 187 },
    { year: 2024, month: 8, monthName: 'Août', objective: 180, realized: 202 },
    { year: 2024, month: 9, monthName: 'Septembre', objective: 160, realized: 140 },
    { year: 2024, month: 10, monthName: 'Octobre', objective: 140, realized: 151 },
    { year: 2024, month: 11, monthName: 'Novembre', objective: 120, realized: 106 },
    { year: 2024, month: 12, monthName: 'Décembre', objective: 100, realized: 133 },

    // 2025
    { year: 2025, month: 1, monthName: 'Janvier', objective: 140, realized: 155 },
    { year: 2025, month: 2, monthName: 'Février', objective: 120, realized: 112 },
    { year: 2025, month: 3, monthName: 'Mars', objective: 120, realized: 132 },
    { year: 2025, month: 4, monthName: 'Avril', objective: 140, realized: 137 },
    { year: 2025, month: 5, monthName: 'Mai', objective: 160, realized: 177 },
    { year: 2025, month: 6, monthName: 'Juin', objective: 180, realized: 201 },
    { year: 2025, month: 7, monthName: 'Juillet', objective: 200, realized: 208 },
    { year: 2025, month: 8, monthName: 'Août', objective: 220, realized: 214 },
    { year: 2025, month: 9, monthName: 'Septembre', objective: 180, realized: 168 },
    { year: 2025, month: 10, monthName: 'Octobre', objective: 160, realized: 155 },
    { year: 2025, month: 11, monthName: 'Novembre', objective: 140, realized: 159 },
    { year: 2025, month: 12, monthName: 'Décembre', objective: 120, realized: 137 }
];

// Fonction helper pour obtenir les données par année
export const getPDRDataByYear = (year) => {
    return pdrMonthlyData.filter(data => data.year === year);
};

// Fonction helper pour obtenir les totaux annuels
export const getPDRYearlyTotals = (year) => {
    const yearData = getPDRDataByYear(year);
    return {
        year,
        totalObjective: yearData.reduce((sum, item) => sum + item.objective, 0),
        totalRealized: yearData.reduce((sum, item) => sum + item.realized, 0),
        performance: 0 // sera calculé: (totalRealized / totalObjective) * 100
    };
};
