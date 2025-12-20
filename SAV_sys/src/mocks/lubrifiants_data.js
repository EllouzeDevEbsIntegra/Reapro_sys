// Mock data pour les objectifs et réalisations Lubrifiants
// Données mensuelles pour 2024 et 2025
// Unité: milliers d'euros (K€)

export const lubrifiantsMonthlyData = [
    // 2024
    { year: 2024, month: 1, monthName: 'Janvier', objective: 30, realized: 28 },
    { year: 2024, month: 2, monthName: 'Février', objective: 30, realized: 32 },
    { year: 2024, month: 3, monthName: 'Mars', objective: 40, realized: 33 },
    { year: 2024, month: 4, monthName: 'Avril', objective: 40, realized: 42 },
    { year: 2024, month: 5, monthName: 'Mai', objective: 40, realized: 44 },
    { year: 2024, month: 6, monthName: 'Juin', objective: 50, realized: 47 },
    { year: 2024, month: 7, monthName: 'Juillet', objective: 60, realized: 55 },
    { year: 2024, month: 8, monthName: 'Août', objective: 60, realized: 63 },
    { year: 2024, month: 9, monthName: 'Septembre', objective: 50, realized: 44 },
    { year: 2024, month: 10, monthName: 'Octobre', objective: 40, realized: 36 },
    { year: 2024, month: 11, monthName: 'Novembre', objective: 30, realized: 32 },
    { year: 2024, month: 12, monthName: 'Décembre', objective: 30, realized: 28 },

    // 2025
    { year: 2025, month: 1, monthName: 'Janvier', objective: 35, realized: 33 },
    { year: 2025, month: 2, monthName: 'Février', objective: 35, realized: 37 },
    { year: 2025, month: 3, monthName: 'Mars', objective: 45, realized: 44 },
    { year: 2025, month: 4, monthName: 'Avril', objective: 45, realized: 48 },
    { year: 2025, month: 5, monthName: 'Mai', objective: 45, realized: 46 },
    { year: 2025, month: 6, monthName: 'Juin', objective: 65, realized: 64 },
    { year: 2025, month: 7, monthName: 'Juillet', objective: 75, realized: 81 },
    { year: 2025, month: 8, monthName: 'Août', objective: 75, realized: 83 },
    { year: 2025, month: 9, monthName: 'Septembre', objective: 65, realized: 66 },
    { year: 2025, month: 10, monthName: 'Octobre', objective: 45, realized: 42 },
    { year: 2025, month: 11, monthName: 'Novembre', objective: 35, realized: 36 },
    { year: 2025, month: 12, monthName: 'Décembre', objective: 35, realized: 37 }
];

// Fonction helper pour obtenir les données par année
export const getLubrifiantsDataByYear = (year) => {
    return lubrifiantsMonthlyData.filter(data => data.year === year);
};

// Fonction helper pour obtenir les totaux annuels
export const getLubrifiantsYearlyTotals = (year) => {
    const yearData = getLubrifiantsDataByYear(year);
    return {
        year,
        totalObjective: yearData.reduce((sum, item) => sum + item.objective, 0),
        totalRealized: yearData.reduce((sum, item) => sum + item.realized, 0),
        performance: 0 // sera calculé: (totalRealized / totalObjective) * 100
    };
};

// Calcul des totaux
const totals2024 = getLubrifiantsYearlyTotals(2024);
const totals2025 = getLubrifiantsYearlyTotals(2025);
totals2024.performance = Math.round((totals2024.totalRealized / totals2024.totalObjective) * 100);
totals2025.performance = Math.round((totals2025.totalRealized / totals2025.totalObjective) * 100);

console.log('Lubrifiants 2024:', totals2024); // Total OBJ: 500K€, REAL: 484K€ (96.8%)
console.log('Lubrifiants 2025:', totals2025); // Total OBJ: 600K€, REAL: 617K€ (102.8%)
