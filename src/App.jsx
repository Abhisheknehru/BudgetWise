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
