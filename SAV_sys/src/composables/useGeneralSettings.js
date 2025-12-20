import { ref } from 'vue';

// Default settings
const defaultSettings = {
    currency: 'EUR',
    currencySymbol: '€',
    decimalPlaces: 2,
    hourlyRates: [] // Array of { id, startDate, endDate, rate }
};

// Reactive settings
const settings = ref({ ...defaultSettings });

// Load settings from localStorage
const loadSettings = () => {
    const saved = localStorage.getItem('app_general_settings');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Merge with defaults to ensure new fields exist
            settings.value = { ...defaultSettings, ...parsed };
        } catch (e) {
            console.error('Failed to parse settings:', e);
            settings.value = { ...defaultSettings };
        }
    }
};

// Save settings to localStorage
const saveSettings = (newSettings) => {
    settings.value = { ...settings.value, ...newSettings };
    localStorage.setItem('app_general_settings', JSON.stringify(settings.value));
};

// Format currency
const formatCurrency = (amount, decimals = null) => {
    if (amount === null || amount === undefined) return '0.00';

    const places = decimals !== null ? decimals : settings.value.decimalPlaces;
    const formatted = Number(amount).toFixed(places);
    return `${formatted} ${settings.value.currencySymbol}`;
};

// Get hourly rate for a specific date
const getHourlyRateForDate = (dateStr) => {
    if (!settings.value.hourlyRates || settings.value.hourlyRates.length === 0) return 0;

    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const match = settings.value.hourlyRates.find(r => {
        const start = new Date(r.startDate);
        const end = new Date(r.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return targetDate >= start && targetDate <= end;
    });

    return match ? Number(match.rate) : 0;
};

// Initialize on first import
loadSettings();

export const useGeneralSettings = () => {
    return {
        settings,
        loadSettings,
        saveSettings,
        formatCurrency,
        getHourlyRateForDate
    };
};

export const currencies = [
    { code: 'EUR', label: 'Euro', symbol: '€' },
    { code: 'USD', label: 'Dollar', symbol: '$' },
    { code: 'TND', label: 'Dinar Tunisien', symbol: 'DT' }
];
