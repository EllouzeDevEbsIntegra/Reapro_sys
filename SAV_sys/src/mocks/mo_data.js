// Mock data pour les objectifs et réalisations CA MO (Chiffre d'Affaires Main d'Œuvre)
// Données mensuelles pour 2024 et 2025
// Unité: milliers d'euros (K€)

export const moMonthlyData = [
    // 2024
    { year: 2024, month: 1, monthName: 'Janvier', objective: 20, realized: 18 },
    { year: 2024, month: 2, monthName: 'Février', objective: 20, realized: 21 },
    { year: 2024, month: 3, monthName: 'Mars', objective: 20, realized: 23 },
    { year: 2024, month: 4, monthName: 'Avril', objective: 20, realized: 17 },
    { year: 2024, month: 5, monthName: 'Mai', objective: 25, realized: 24 },
    { year: 2024, month: 6, monthName: 'Juin', objective: 30, realized: 29 },
    { year: 2024, month: 7, monthName: 'Juillet', objective: 35, realized: 36 },
    { year: 2024, month: 8, monthName: 'Août', objective: 35, realized: 38 },
    { year: 2024, month: 9, monthName: 'Septembre', objective: 30, realized: 33 },
    { year: 2024, month: 10, monthName: 'Octobre', objective: 25, realized: 21 },
    { year: 2024, month: 11, monthName: 'Novembre', objective: 20, realized: 18 },
    { year: 2024, month: 12, monthName: 'Décembre', objective: 20, realized: 17 },

    // 2025
    { year: 2025, month: 1, monthName: 'Janvier', objective: 24, realized: 26 },
    { year: 2025, month: 2, monthName: 'Février', objective: 24, realized: 22 },
    { year: 2025, month: 3, monthName: 'Mars', objective: 24, realized: 20 },
    { year: 2025, month: 4, monthName: 'Avril', objective: 24, realized: 25 },
    { year: 2025, month: 5, monthName: 'Mai', objective: 28, realized: 27 },
    { year: 2025, month: 6, monthName: 'Juin', objective: 32, realized: 34 },
    { year: 2025, month: 7, monthName: 'Juillet', objective: 38, realized: 40 },
    { year: 2025, month: 8, monthName: 'Août', objective: 38, realized: 41 },
    { year: 2025, month: 9, monthName: 'Septembre', objective: 32, realized: 32 },
    { year: 2025, month: 10, monthName: 'Octobre', objective: 28, realized: 24 },
    { year: 2025, month: 11, monthName: 'Novembre', objective: 24, realized: 20 },
    { year: 2025, month: 12, monthName: 'Décembre', objective: 24, realized: 19 }
];

// Fonction helper pour obtenir les données par année
export const getMODataByYear = (year) => {
    return moMonthlyData.filter(data => data.year === year);
};

// Fonction helper pour obtenir les totaux annuels
export const getMOYearlyTotals = (year) => {
    const yearData = getMODataByYear(year);
    return {
        year,
        totalObjective: yearData.reduce((sum, item) => sum + item.objective, 0),
        totalRealized: yearData.reduce((sum, item) => sum + item.realized, 0),
        performance: 0 // sera calculé: (totalRealized / totalObjective) * 100
    };
};

// Calcul des totaux
const totals2024 = getMOYearlyTotals(2024);
const totals2025 = getMOYearlyTotals(2025);
totals2024.performance = Math.round((totals2024.totalRealized / totals2024.totalObjective) * 100);
totals2025.performance = Math.round((totals2025.totalRealized / totals2025.totalObjective) * 100);

console.log('CA MO 2024:', totals2024); // Total OBJ: 300K€, REAL: 295K€ (98.3%)
console.log('CA MO 2025:', totals2025); // Total OBJ: 340K€, REAL: 330K€ (97.1%)
