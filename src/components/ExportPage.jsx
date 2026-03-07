import { useState, useEffect } from 'react';
import { getToday } from '../utils/constants';
import {
    getSheetsUrl,
    saveSheetsUrl,
    removeSheetsUrl,
    isConnected,
    syncToSheets,
    testConnection,
    getSheetViewUrl,
    saveSheetViewUrl,
    removeSheetViewUrl,
} from '../utils/googleSheets';

export default function ExportPage({ data, showToast }) {
    const total = data.expenses.length + data.incomes.length;
    const [sheetsUrl, setSheetsUrl] = useState(getSheetsUrl());
    const [showSetup, setShowSetup] = useState(false);
    const [urlInput, setUrlInput] = useState(getSheetsUrl());
    const [syncing, setSyncing] = useState(false);
    const [connected, setConnected] = useState(isConnected());
    const [lastSync, setLastSync] = useState(
        localStorage.getItem('bw_last_sync') || ''
    );
    const [sheetViewUrl, setSheetViewUrl] = useState(getSheetViewUrl());
    const [sheetViewInput, setSheetViewInput] = useState(getSheetViewUrl());

    useEffect(() => {
        setConnected(isConnected());
    }, [sheetsUrl]);

    const buildSorted = () => {
        const sorted = [
            ...data.incomes.map((i) => ({
                ...i,
                type: 'Income',
                category: i.source,
                note: i.source,
            })),
            ...data.expenses.map((e) => ({ ...e, type: 'Expense' })),
        ];
        sorted.sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
        return sorted;
    };

    const exportCSV = () => {
        const sorted = buildSorted();
        let csv = 'Date,Type,Category,Note,Amount,Balance\n';
        let bal = 0;
        let lastDate = '';

        sorted.forEach((t) => {
            if (lastDate && lastDate !== t.date) csv += '\n';
            bal += t.type === 'Income' ? Number(t.amount) : -Number(t.amount);
            csv += `${t.date},${t.type},${t.category || ''},${(t.note || '').replace(/,/g, ' ')},${t.type === 'Income' ? '+' : '-'}${t.amount},${bal.toFixed(2)}\n`;
            lastDate = t.date;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budgetwise_${getToday()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('📁 CSV downloaded!');
    };

    const copyForSheets = () => {
        const sorted = buildSorted();
        let tsv = 'Date\tType\tCategory\tNote\tAmount\n';
        let lastDate = '';

        sorted.forEach((t) => {
            if (lastDate && lastDate !== t.date) tsv += '\t\t\t\t\n';
            tsv += `${t.date}\t${t.type}\t${t.category || ''}\t${t.note || ''}\t${t.type === 'Income' ? '+' : '−'}${t.amount}\n`;
            lastDate = t.date;
        });

        navigator.clipboard.writeText(tsv).then(() => {
            showToast('📋 Copied! Paste in Google Sheets');
        });
    };

    const handleSaveUrl = async () => {
        if (!urlInput.trim()) {
            showToast('❌ Please enter a valid URL');
            return;
        }
        if (!urlInput.includes('script.google.com')) {
            showToast('❌ Not a valid Google Apps Script URL');
            return;
        }
        saveSheetsUrl(urlInput.trim());
        setSheetsUrl(urlInput.trim());
        if (sheetViewInput.trim()) {
            saveSheetViewUrl(sheetViewInput.trim());
            setSheetViewUrl(sheetViewInput.trim());
        }
        setShowSetup(false);

        // Test connection
        const result = await testConnection(urlInput.trim());
        if (result.success) {
            showToast('✅ Connected to Google Sheets!');
        } else {
            showToast('⚠️ URL saved. Sync to verify connection.');
        }
    };

    const handleDisconnect = () => {
        if (confirm('Disconnect from Google Sheets?')) {
            removeSheetsUrl();
            removeSheetViewUrl();
            setSheetsUrl('');
            setUrlInput('');
            setSheetViewUrl('');
            setSheetViewInput('');
            setLastSync('');
            localStorage.removeItem('bw_last_sync');
            showToast('🔓 Disconnected from Google Sheets');
        }
    };

    const handleSync = async () => {
        if (total === 0) {
            showToast('📭 No transactions to sync');
            return;
        }
        setSyncing(true);
        try {
            const result = await syncToSheets(data);
            const now = new Date().toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
            });
            setLastSync(now);
            localStorage.setItem('bw_last_sync', now);
            showToast(`☁️ Synced ${result.count} transactions to Sheets!`);
        } catch (err) {
            showToast(`❌ Sync failed: ${err.message}`);
        } finally {
            setSyncing(false);
        }
    };

    const clearAll = () => {
        if (confirm('Delete ALL data? This cannot be undone.')) {
            localStorage.removeItem('bw_data');
            location.reload();
        }
    };

    return (
        <div className="page animate-slide-up">
            <h1 style={{ marginTop: 8, marginBottom: 16 }}>📤 Export Data</h1>

            {/* Summary */}
            <div className="card" style={{ textAlign: 'center', padding: 28 }}>
                <div style={{ fontSize: 52, marginBottom: 12 }} className="animate-float">📊</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                    {total} Transactions
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                    {data.incomes.length} income • {data.expenses.length} expenses
                </div>
            </div>

            {/* Google Sheets Connection Card */}
            <div
                className="card"
                style={{
                    marginTop: 12,
                    border: connected
                        ? '1.5px solid var(--green)'
                        : '1.5px solid var(--border)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Glow effect when connected */}
                {connected && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 3,
                            background: 'linear-gradient(90deg, var(--green), var(--accent), var(--green))',
                            borderRadius: '12px 12px 0 0',
                        }}
                    />
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: connected
                                ? 'rgba(52, 211, 153, 0.15)'
                                : 'rgba(148, 163, 184, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                        }}
                    >
                        {connected ? '🟢' : '🔗'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>
                            Google Sheets {connected ? 'Connected' : 'Integration'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                            {connected
                                ? lastSync
                                    ? `Last sync: ${lastSync}`
                                    : 'Connected • Not synced yet'
                                : 'Auto-sync your data to Sheets'}
                        </div>
                    </div>
                    {connected && (
                        <button
                            onClick={handleDisconnect}
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: 8,
                                padding: '6px 10px',
                                fontSize: 11,
                                color: 'var(--red)',
                                cursor: 'pointer',
                                fontWeight: 600,
                            }}
                        >
                            Disconnect
                        </button>
                    )}
                </div>

                {/* Connected: Show Sync & View Buttons */}
                {connected && !showSetup && (
                    <>
                        <button
                            className="btn btn-green"
                            onClick={handleSync}
                            disabled={syncing}
                            style={{
                                padding: 14,
                                fontSize: 15,
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            {syncing ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <span className="spinner" /> Syncing...
                                </span>
                            ) : (
                                '☁️ Sync to Google Sheets'
                            )}
                        </button>
                        {sheetViewUrl && (
                            <button
                                className="btn"
                                onClick={() => window.open(sheetViewUrl, '_blank')}
                                style={{
                                    marginTop: 8,
                                    padding: 14,
                                    fontSize: 15,
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    border: '1.5px solid rgba(99, 102, 241, 0.3)',
                                    color: 'var(--accent)',
                                }}
                            >
                                📊 View Google Sheet
                            </button>
                        )}
                    </>
                )}

                {/* Not Connected: Show Connect Button */}
                {!connected && !showSetup && (
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowSetup(true)}
                        style={{ padding: 14, fontSize: 15 }}
                    >
                        🔗 Connect Google Sheets
                    </button>
                )}

                {/* Setup Form */}
                {showSetup && (
                    <div className="animate-slide-up" style={{ marginTop: 4 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                            Paste your Google Apps Script Web App URL:
                        </label>
                        <input
                            type="url"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://script.google.com/macros/s/.../exec"
                            style={{
                                width: '100%',
                                padding: 12,
                                borderRadius: 10,
                                border: '1.5px solid var(--border)',
                                background: 'var(--card)',
                                color: 'var(--text)',
                                fontSize: 13,
                                marginBottom: 10,
                                boxSizing: 'border-box',
                            }}
                        />
                        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                            Google Sheet URL (to view your sheet):
                        </label>
                        <input
                            type="url"
                            value={sheetViewInput}
                            onChange={(e) => setSheetViewInput(e.target.value)}
                            placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                            style={{
                                width: '100%',
                                padding: 12,
                                borderRadius: 10,
                                border: '1.5px solid var(--border)',
                                background: 'var(--card)',
                                color: 'var(--text)',
                                fontSize: 13,
                                marginBottom: 10,
                                boxSizing: 'border-box',
                            }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                className="btn btn-green"
                                onClick={handleSaveUrl}
                                style={{ flex: 1, padding: 50 }}
                            >
                                ✅ Save & Test
                            </button>
                            <button
                                className="btn"
                                onClick={() => {
                                    setShowSetup(false);
                                    setUrlInput(getSheetsUrl());
                                }}
                                style={{
                                    padding: 50,
                                    background: 'var(--card)',
                                    border: '1.5px solid var(--border)',
                                    color: 'var(--text2)',
                                }}
                            >
                                Cancel
                            </button>
                        </div>

                        {/* Setup instructions */}
                        <div
                            style={{
                                marginTop: 14,
                                padding: 14,
                                borderRadius: 10,
                                background: 'rgba(99, 102, 241, 0.08)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                            }}
                        >
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                                📌 Quick Setup Steps:
                            </div>
                            <ol className="steps-list" style={{ fontSize: 12.5, margin: 0 }}>
                                <li>Create a new Google Sheet</li>
                                <li>Add headers: <strong>Date, Type, Category, Note, Amount, Synced At</strong></li>
                                <li>Go to <strong>Extensions → Apps Script</strong></li>
                                <li>Paste the script from <strong>GOOGLE_SHEETS_SETUP.md</strong></li>
                                <li>Deploy as <strong>Web app</strong> (access: Anyone)</li>
                                <li>Copy the URL and paste it above!</li>
                            </ol>
                        </div>
                    </div>
                )}
            </div>

            {/* Download Buttons */}
            <button className="btn btn-primary" onClick={exportCSV} style={{ marginTop: 12, marginBottom: 12, padding: 16 }}>
                📁 Download CSV File
            </button>
            <button className="btn btn-green" onClick={copyForSheets} style={{ marginBottom: 12, padding: 16 }}>
                📋 Copy for Google Sheets
            </button>

            {/* Clear Data */}
            <button
                className="btn btn-danger"
                onClick={clearAll}
                style={{ marginTop: 16, padding: 16 }}
            >
                🗑️ Clear All Data
            </button>
        </div>
    );
}
