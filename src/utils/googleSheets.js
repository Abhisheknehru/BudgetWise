// Google Sheets sync utility for BudgetWise

const STORAGE_KEY = 'bw_sheets_url';

export const getSheetsUrl = () => localStorage.getItem(STORAGE_KEY) || '';

export const saveSheetsUrl = (url) => {
    localStorage.setItem(STORAGE_KEY, url.trim());
};

export const removeSheetsUrl = () => {
    localStorage.removeItem(STORAGE_KEY);
};

export const isConnected = () => !!getSheetsUrl();

const SHEET_VIEW_KEY = 'bw_sheet_view_url';

export const getSheetViewUrl = () => localStorage.getItem(SHEET_VIEW_KEY) || '';

export const saveSheetViewUrl = (url) => {
    localStorage.setItem(SHEET_VIEW_KEY, url.trim());
};

export const removeSheetViewUrl = () => {
    localStorage.removeItem(SHEET_VIEW_KEY);
};

/**
 * Build sorted transaction list from app data
 */
export const buildTransactions = (data) => {
    const transactions = [
        ...data.incomes.map((i) => ({
            date: i.date,
            type: 'Income',
            category: i.source,
            note: i.source,
            amount: Number(i.amount),
        })),
        ...data.expenses.map((e) => ({
            date: e.date,
            type: 'Expense',
            category: e.category || '',
            note: e.note || '',
            amount: Number(e.amount),
        })),
    ];
    transactions.sort((a, b) => a.date.localeCompare(b.date));
    return transactions;
};

/**
 * Sync all data to Google Sheets (full replace)
 * Uses a hidden form + iframe to reliably POST to Google Apps Script
 * (fetch with no-cors fails because Google's 302 redirect strips the POST body)
 */
export const syncToSheets = async (data) => {
    const url = getSheetsUrl();
    if (!url) throw new Error('Google Sheets URL not configured');

    const transactions = buildTransactions(data);

    const payload = JSON.stringify({
        action: 'sync',
        transactions,
    });

    return new Promise((resolve, reject) => {
        try {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.name = 'bw_sync_frame_' + Date.now();
            document.body.appendChild(iframe);

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = url;
            form.target = iframe.name;
            form.style.display = 'none';

            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'payload';
            input.value = payload;
            form.appendChild(input);

            document.body.appendChild(form);
            form.submit();

            // Clean up after allowing time for the request to complete
            setTimeout(() => {
                document.body.removeChild(form);
                document.body.removeChild(iframe);
                resolve({ success: true, count: transactions.length });
            }, 4000);
        } catch (err) {
            reject(new Error('Sync failed. Check your URL and try again.'));
        }
    });
};

/**
 * Auto-sync: syncs every 60 seconds if data has changed
 */
let autoSyncTimer = null;
let lastSyncHash = '';

const getDataHash = (data) => {
    return data.incomes.length + ':' + data.expenses.length + ':' +
        (data.incomes[data.incomes.length - 1]?.id || 0) + ':' +
        (data.expenses[data.expenses.length - 1]?.id || 0);
};

export const startAutoSync = (getData) => {
    stopAutoSync();
    lastSyncHash = getDataHash(getData());

    autoSyncTimer = setInterval(async () => {
        if (!isConnected()) return;
        const currentData = getData();
        const currentHash = getDataHash(currentData);
        if (currentHash === lastSyncHash) return;

        try {
            await syncToSheets(currentData);
            lastSyncHash = currentHash;
            const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            localStorage.setItem('bw_last_sync', now);
        } catch (err) {
            // Silently fail on auto-sync, user can manually retry
        }
    }, 60000);
};

export const stopAutoSync = () => {
    if (autoSyncTimer) {
        clearInterval(autoSyncTimer);
        autoSyncTimer = null;
    }
};

/**
 * Test the connection
 */
export const testConnection = async (url) => {
    try {
        await fetch(url, {
            method: 'GET',
            mode: 'no-cors',
            redirect: 'follow',
        });
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
};
