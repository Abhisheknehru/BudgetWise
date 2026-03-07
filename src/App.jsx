import { useState, useEffect, useMemo, useRef } from 'react';
import { loadData, saveData } from './utils/constants';
import { isConnected, startAutoSync, stopAutoSync } from './utils/googleSheets';
import BottomNav from './components/BottomNav';
import HomePage from './components/HomePage';
import AddPage from './components/AddPage';
import AnalysisPage from './components/AnalysisPage';
import ExportPage from './components/ExportPage';

export default function App() {
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState('home');
  const [toast, setToast] = useState('');

  // Persist to localStorage
  useEffect(() => {
    saveData(data);
  }, [data]);

  // Keep a ref to latest data so auto-sync always reads current state
  const dataRef = useRef(data);
  dataRef.current = data;

  // Start auto-sync once on mount if connected
  useEffect(() => {
    if (isConnected()) {
      startAutoSync(() => dataRef.current);
    }
    return () => stopAutoSync();
  }, []);

  // PWA install prompt
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Show banner if user hasn't dismissed it before
      if (!localStorage.getItem('bw_install_dismissed')) {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      showToast('App installed!');
    }
    setInstallPrompt(null);
    setShowInstallBanner(false);
  };

  const dismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem('bw_install_dismissed', '1');
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (msg) => setToast(msg);

  // Compute balance
  const balance = useMemo(() => {
    const inc = data.incomes.reduce((s, i) => s + Number(i.amount), 0);
    const exp = data.expenses.reduce((s, e) => s + Number(e.amount), 0);
    return inc - exp;
  }, [data]);

  const addIncome = (amount, source, date) => {
    setData((prev) => ({
      ...prev,
      incomes: [...prev.incomes, { id: Date.now(), amount: Number(amount), source, date }],
    }));
    showToast('💰 Income added!');
  };

  const addExpense = (amount, category, note, date) => {
    setData((prev) => ({
      ...prev,
      expenses: [
        ...prev.expenses,
        { id: Date.now(), amount: Number(amount), category, note, date },
      ],
    }));
    showToast('✅ Expense logged!');
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && <div className="toast">{toast}</div>}

      {/* Install Banner */}
      {showInstallBanner && (
        <div className="install-banner">
          <div style={{ flex: 1 }}>
            <strong>Install BudgetWise</strong>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Add to home screen for quick access</div>
          </div>
          <button onClick={handleInstall} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
            Install
          </button>
          <button onClick={dismissInstall} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 18, cursor: 'pointer', padding: 4 }}>
            &times;
          </button>
        </div>
      )}

      {/* Low Balance Warning */}
      {balance < 500 && balance !== 0 && (
        <div className="warning-banner">
          ⚠️ Low Balance! Below ₹500 — spend carefully
        </div>
      )}

      {/* Pages */}
      {tab === 'home' && <HomePage data={data} balance={balance} addIncome={addIncome} />}
      {tab === 'add' && <AddPage addExpense={addExpense} balance={balance} />}
      {tab === 'analysis' && <AnalysisPage data={data} />}
      {tab === 'export' && <ExportPage data={data} showToast={showToast} />}

      {/* Bottom Navigation */}
      <BottomNav tab={tab} setTab={setTab} />
    </>
  );
}
