export const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Other'];

export const CAT_COLORS = {
    Food: '#f87171',
    Transport: '#60a5fa',
    Shopping: '#fbbf24',
    Entertainment: '#a78bfa',
    Other: '#94a3b8',
};

export const CAT_ICONS = {
    Food: '🍕',
    Transport: '🚗',
    Shopping: '🛍️',
    Entertainment: '🎮',
    Other: '📦',
};

export const CAT_BG = {
    Food: 'rgba(248,113,113,0.12)',
    Transport: 'rgba(96,165,250,0.12)',
    Shopping: 'rgba(251,191,36,0.12)',
    Entertainment: 'rgba(167,139,250,0.12)',
    Other: 'rgba(148,163,184,0.12)',
};

export const formatCurrency = (n) =>
    '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const getToday = () => new Date().toISOString().split('T')[0];

export const loadData = () => {
    try {
        const d = localStorage.getItem('bw_data');
        return d ? JSON.parse(d) : { incomes: [], expenses: [] };
    } catch {
        return { incomes: [], expenses: [] };
    }
};

export const saveData = (d) => {
    localStorage.setItem('bw_data', JSON.stringify(d));
};
