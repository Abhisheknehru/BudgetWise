import { useState } from 'react';
import {
    CATEGORIES,
    CAT_COLORS,
    CAT_ICONS,
    CAT_BG,
    formatCurrency,
    getToday,
} from '../utils/constants';

export default function AddPage({ addExpense, balance }) {
    const [amt, setAmt] = useState('');
    const [cat, setCat] = useState('Food');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(getToday());

    const remaining = balance - Number(amt || 0);

    const handleAdd = () => {
        if (!amt || Number(amt) <= 0) return;
        addExpense(amt, cat, note, date);
        setAmt('');
        setNote('');
        setDate(getToday());
    };

    return (
        <div className="page animate-slide-up">
            <h1 style={{ marginTop: 8, marginBottom: 8 }}>➕ Add Expense</h1>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>
                Balance after:{' '}
                <strong style={{ color: remaining < 500 ? 'var(--red)' : 'var(--green)' }}>
                    {formatCurrency(remaining)}
                </strong>
            </p>

            <div className="card">
                {/* Amount */}
                <div className="field">
                    <label>Amount (₹)</label>
                    <input
                        className="amount-input"
                        type="number"
                        placeholder="0.00"
                        value={amt}
                        onChange={(e) => setAmt(e.target.value)}
                    />
                </div>

                {/* Category */}
                <div className="field">
                    <label>Category</label>
                    <div className="cat-grid">
                        {CATEGORIES.map((c) => (
                            <div
                                key={c}
                                className={`cat-chip${cat === c ? ' active' : ''}`}
                                style={{
                                    background: cat === c ? CAT_BG[c] : undefined,
                                    color: cat === c ? CAT_COLORS[c] : undefined,
                                    borderColor: cat === c ? CAT_COLORS[c] : undefined,
                                }}
                                onClick={() => setCat(c)}
                            >
                                {CAT_ICONS[c]} {c}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Note */}
                <div className="field">
                    <label>Note</label>
                    <input
                        placeholder="What was this for?"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </div>

                {/* Date */}
                <div className="field">
                    <label>Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>

                {/* Submit */}
                <button
                    className="btn btn-primary"
                    onClick={handleAdd}
                    style={{ marginTop: 8, padding: 16, fontSize: 16 }}
                >
                    Log Expense
                </button>
            </div>
        </div>
    );
}
