// Google Sheets API v4 + Drive API v3 — direct REST calls using OAuth access token

const SHEET_NAME = 'My Expenses';
const TAB_NAME = 'Expenses';
const HEADERS = ['Date', 'Category', 'Amount', 'Description', 'Status'];
const SHEET_ID_KEY = 'bw_google_sheet_id';

// ── Storage helpers ──────────────────────────────────────────────────────────

export const getStoredSheetId = () => localStorage.getItem(SHEET_ID_KEY);
export const storeSheetId = (id) => localStorage.setItem(SHEET_ID_KEY, id);
export const clearSheetId = () => localStorage.removeItem(SHEET_ID_KEY);

export const getSheetUrl = (sheetId) =>
    `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

// ── Low-level fetch helper ───────────────────────────────────────────────────

const apiFetch = (url, token, options = {}) =>
    fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });

// ── Sheet verification ───────────────────────────────────────────────────────

export const verifySheet = async (token, sheetId) => {
    try {
        const res = await apiFetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=spreadsheetId`,
            token
        );
        return res.ok;
    } catch {
        return false;
    }
};

// ── Sheet creation ───────────────────────────────────────────────────────────

export const createSheet = async (token) => {
    const res = await apiFetch(
        'https://sheets.googleapis.com/v4/spreadsheets',
        token,
        {
            method: 'POST',
            body: JSON.stringify({
                properties: { title: SHEET_NAME },
                sheets: [
                    {
                        properties: { title: TAB_NAME, index: 0 },
                        data: [
                            {
                                startRow: 0,
                                startColumn: 0,
                                rowData: [
                                    {
                                        values: HEADERS.map((h) => ({
                                            userEnteredValue: { stringValue: h },
                                            userEnteredFormat: {
                                                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                                                backgroundColor: { red: 0.267, green: 0.467, blue: 0.957 },
                                                horizontalAlignment: 'CENTER',
                                            },
                                        })),
                                    },
                                ],
                            },
                        ],
                    },
                ],
            }),
        }
    );

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Failed to create spreadsheet');
    }

    const data = await res.json();

    // Auto-resize columns for readability
    try {
        await apiFetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${data.spreadsheetId}:batchUpdate`,
            token,
            {
                method: 'POST',
                body: JSON.stringify({
                    requests: [
                        {
                            autoResizeDimensions: {
                                dimensions: {
                                    sheetId: 0,
                                    dimension: 'COLUMNS',
                                    startIndex: 0,
                                    endIndex: 5,
                                },
                            },
                        },
                    ],
                }),
            }
        );
    } catch {
        // Non-critical — sheet still works without auto-resize
    }

    return data.spreadsheetId;
};

// ── Find or create ───────────────────────────────────────────────────────────

/**
 * Returns the spreadsheet ID for "My Expenses".
 * Priority: 1) Verified stored ID  2) Create new sheet
 */
export const findOrCreateSheet = async (token) => {
    // Check stored ID first (fastest path)
    const storedId = getStoredSheetId();
    if (storedId) {
        const valid = await verifySheet(token, storedId);
        if (valid) return storedId;
        // Stored ID no longer accessible — fall through to create
        clearSheetId();
    }

    // Create a new "My Expenses" sheet
    const newId = await createSheet(token);
    storeSheetId(newId);
    return newId;
};

// ── Append expense row ───────────────────────────────────────────────────────

/**
 * Appends a single expense row to the sheet.
 * Columns: Date | Category | Amount | Description | Status
 */
export const appendExpenseRow = async (token, sheetId, expense) => {
    const { date, category, amount, note, status = 'Logged' } = expense;

    // Use 'A:E' (no tab name) to avoid sheet-name encoding issues
    const res = await apiFetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A%3AE:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        token,
        {
            method: 'POST',
            body: JSON.stringify({
                values: [[date, category, Number(amount), note || '', status]],
            }),
        }
    );

    if (res.status === 401) {
        const e = new Error('Session expired. Please sign in again.');
        e.code = 401;
        throw e;
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Failed to append row to sheet');
    }

    return res.json();
};

// ── Sync all expenses (full rewrite rows 2+) ─────────────────────────────────

export const syncAllExpenses = async (token, sheetId, expenses) => {
    // Clear existing data rows (keep header in row 1)
    await apiFetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A2%3AE:clear`,
        token,
        { method: 'POST', body: JSON.stringify({}) }
    );

    if (!expenses.length) return { count: 0 };

    const values = expenses.map((e) => [
        e.date, e.category, Number(e.amount), e.note || '', 'Logged',
    ]);

    const res = await apiFetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A2%3AE${expenses.length + 1}?valueInputOption=USER_ENTERED`,
        token,
        { method: 'PUT', body: JSON.stringify({ values }) }
    );

    if (res.status === 401) {
        const e = new Error('Session expired. Please sign in again.');
        e.code = 401;
        throw e;
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Failed to sync expenses');
    }

    return { count: expenses.length };
};

// ── Fetch user info ──────────────────────────────────────────────────────────

export const fetchUserInfo = async (token) => {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch user info');
    const d = await res.json();
    return { email: d.email || '', name: d.name || 'User', picture: d.picture || '' };
};
