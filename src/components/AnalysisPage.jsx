import { useState, useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Cell,
} from 'recharts';
import {
    CAT_COLORS,
    CAT_ICONS,
    formatCurrency,
    formatDate,
    getToday,
} from '../utils/constants';

export default function AnalysisPage({ data }) {
    const [view, setView] = useState('daily');

    // Group expenses by date
    const grouped = useMemo(() => {
        const g = {};
        data.expenses.forEach((e) => {
            if (!g[e.date]) g[e.date] = [];
            g[e.date].push(e);
        });
        return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
    }, [data]);

    // Monthly data
    const monthly = useMemo(() => {
        const m = {};
        data.expenses.forEach((e) => {
            const mon = e.date.slice(0, 7);
            if (!m[mon]) m[mon] = { total: 0, cats: {}, count: 0 };
            m[mon].total += Number(e.amount);
            m[mon].cats[e.category] = (m[mon].cats[e.category] || 0) + Number(e.amount);
            m[mon].count++;
        });
        return m;
    }, [data]);

    const currentMonth = getToday().slice(0, 7);
    const cm = monthly[currentMonth] || { total: 0, cats: {}, count: 0 };

    const chartData = Object.entries(cm.cats).map(([name, value]) => ({
        name,
        value: Math.round(value),
        fill: CAT_COLORS[name] || '#818cf8',
    }));

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div
                    style={{
                        background: '#1a1f35',
                        border: '1px solid rgba(71,85,105,0.5)',
                        borderRadius: 10,
                        padding: '10px 14px',
                        color: '#f1f5f9',
                        fontSize: 13,
                    }}
                >
                    <div style={{ fontWeight: 700 }}>{payload[0].payload.name}</div>
                    <div style={{ color: payload[0].payload.fill }}>
                        {formatCurrency(payload[0].value)}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="page animate-slide-up">
            <h1 style={{ marginTop: 8, marginBottom: 16 }}>📈 Spend Analysis</h1>

            {/* Tab Bar */}
            <div className="tab-bar">
                <div className={`tab${view === 'daily' ? ' active' : ''}`} onClick={() => setView('daily')}>
                    Daily
                </div>
                <div
                    className={`tab${view === 'monthly' ? ' active' : ''}`}
                    onClick={() => setView('monthly')}
                >
                    Monthly
                </div>
            </div>

            {/* Daily View */}
            {view === 'daily' && (
                <>
                    {grouped.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">📭</span>
                            <div style={{ fontSize: 16, fontWeight: 600 }}>No expenses yet</div>
                            <div style={{ fontSize: 13, marginTop: 4 }}>Start logging to see analysis</div>
                        </div>
                    ) : (
                        grouped.map(([date, txs]) => {
                            const dayTotal = txs.reduce((s, t) => s + Number(t.amount), 0);
                            return (
                                <div key={date} className="animate-fade">
                                    <div className="date-header">
                                        <span>📅 {formatDate(date)}</span>
                                        <span style={{ color: 'var(--red)' }}>{formatCurrency(dayTotal)}</span>
                                    </div>
                                    {txs.map((e) => (
                                        <div key={e.id} className="tx-item">
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <div className="tx-icon" style={{ background: 'var(--red-bg)' }}>
                                                    {CAT_ICONS[e.category]}
                                                </div>
                                                <div className="tx-info">
                                                    <div className="tx-title">{e.note || e.category}</div>
                                                    <div className="tx-sub">{e.category}</div>
                                                </div>
                                            </div>
                                            <div className="tx-amount expense">-{formatCurrency(e.amount)}</div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })
                    )}
                </>
            )}

            {/* Monthly View */}
            {view === 'monthly' && (
                <>
                    {/* Current Month Stats */}
                    <div className="stats-row">
                        <div className="stat-card">
                            <div className="stat-value" style={{ color: 'var(--red)' }}>
                                {formatCurrency(cm.total)}
                            </div>
                            <div className="stat-label">This Month</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value" style={{ color: 'var(--accent)' }}>{cm.count}</div>
                            <div className="stat-label">Transactions</div>
                        </div>
                    </div>

                    {/* Chart */}
                    {chartData.length > 0 ? (
                        <div className="chart-card">
                            <h3 style={{ marginBottom: 16, paddingLeft: 8 }}>Category Breakdown</h3>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.3)" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        axisLine={{ stroke: 'rgba(71,85,105,0.5)' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        axisLine={{ stroke: 'rgba(71,85,105,0.5)' }}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={36}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={index} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="chart-legend">
                                {chartData.map((c) => (
                                    <div key={c.name} className="chart-legend-item">
                                        <div className="chart-legend-dot" style={{ background: c.fill }} />
                                        {c.name}: {formatCurrency(c.value)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <span className="empty-icon">📊</span>
                            <div style={{ fontSize: 16, fontWeight: 600 }}>No data this month</div>
                        </div>
                    )}

                    {/* Monthly History */}
                    <h3 style={{ marginTop: 16, marginBottom: 12 }}>Monthly History</h3>
                    {Object.entries(monthly)
                        .sort((a, b) => b[0].localeCompare(a[0]))
                        .map(([mon, d]) => (
                            <div key={mon} className="tx-item" style={{ marginBottom: 8 }}>
                                <div>
                                    <div className="tx-title">
                                        {new Date(mon + '-01').toLocaleDateString('en-IN', {
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </div>
                                    <div className="tx-sub">{d.count} transactions</div>
                                </div>
                                <div className="tx-amount expense">{formatCurrency(d.total)}</div>
                            </div>
                        ))}
                </>
            )}
        </div>
    );
}
