import { useState } from 'react';
import { formatCurrency, formatDate, getToday, CAT_ICONS } from '../utils/constants';

export default function HomePage({ data, balance, addIncome }) {
    const [showAdd, setShowAdd] = useState(false);
    const [amt, setAmt] = useState('');
    const [src, setSrc] = useState('');
    const [date, setDate] = useState(getToday());

    const handleAdd = () => {
        if (!amt || !src) return;
        addIncome(amt, src, date);
        setAmt('');
        setSrc('');
        setDate(getToday());
        setShowAdd(false);
    };

    const recent = [...data.expenses]
        .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
        .slice(0, 6);

    const recentInc = [...data.incomes]
        .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
        .slice(0, 3);

    const totalInc = data.incomes.reduce((s, i) => s + Number(i.amount), 0);
    const totalExp = data.expenses.reduce((s, e) => s + Number(e.amount), 0);

    return (
        <div className="page animate-slide-up">
            {/* Balance Card */}
            <div className="balance-card">
                <div className="balance-label">Available Balance</div>
                <div className="balance-amount">{formatCurrency(balance)}</div>
                <div className="balance-stats">
                    <div>
                        <div className="balance-stat-label">Income</div>
                        <div className="balance-stat-value" style={{ color: '#86efac' }}>
                            {formatCurrency(totalInc)}
                        </div>
                    </div>
                    <div>
                        <div className="balance-stat-label">Spent</div>
                        <div className="balance-stat-value" style={{ color: '#fca5a5' }}>
                            {formatCurrency(totalExp)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Income Section */}
            <div className="section-header">
                <div className="section-title">💰 Income</div>
                <button
                    className="btn btn-primary"
                    style={{ width: 'auto', padding: '10px 18px', fontSize: 13 }}
                    onClick={() => setShowAdd(!showAdd)}
                >
                    {showAdd ? 'Cancel' : '+ Add'}
                </button>
            </div>

            {showAdd && (
                <div className="card animate-scale" style={{ marginBottom: 16 }}>
                    <div className="field">
                        <label>Amount (₹)</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={amt}
                            onChange={(e) => setAmt(e.target.value)}
                        />
                    </div>
                    <div className="field">
                        <label>Source</label>
                        <input
                            placeholder="e.g. Mom, Freelance, Salary"
                            value={src}
                            onChange={(e) => setSrc(e.target.value)}
                        />
                    </div>
                    <div className="field">
                        <label>Date</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <button className="btn btn-green" onClick={handleAdd}>
                        💰 Add Income
                    </button>
                </div>
            )}

            {/* Recent Income */}
            {recentInc.length > 0 && (
                <>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', margin: '16px 0 8px' }}>
                        Recent Income
                    </div>
                    <div className="stagger">
                        {recentInc.map((i) => (
                            <div key={i.id} className="tx-item animate-slide-up">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div className="tx-icon" style={{ background: 'var(--green-bg)' }}>💰</div>
                                    <div className="tx-info">
                                        <div className="tx-title">{i.source}</div>
                                        <div className="tx-sub">{formatDate(i.date)}</div>
                                    </div>
                                </div>
                                <div className="tx-amount income">+{formatCurrency(i.amount)}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Recent Expenses */}
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', margin: '20px 0 8px' }}>
                Recent Expenses
            </div>
            {recent.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon animate-float">🎉</span>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No expenses yet!</div>
                    <div style={{ fontSize: 13 }}>Tap "Add" to log your first expense</div>
                </div>
            ) : (
                <div className="stagger">
                    {recent.map((e) => (
                        <div key={e.id} className="tx-item animate-slide-up">
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div className="tx-icon" style={{ background: 'var(--red-bg)' }}>
                                    {CAT_ICONS[e.category]}
                                </div>
                                <div className="tx-info">
                                    <div className="tx-title">{e.note || e.category}</div>
                                    <div className="tx-sub">{e.category} • {formatDate(e.date)}</div>
                                </div>
                            </div>
                            <div className="tx-amount expense">-{formatCurrency(e.amount)}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
