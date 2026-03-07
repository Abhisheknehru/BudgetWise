import { HiHome, HiPlus, HiChartBar, HiArrowDown } from 'react-icons/hi2';

export default function BottomNav({ tab, setTab }) {
    const items = [
        { key: 'home', label: 'Home', Icon: HiHome },
        { key: 'add', label: 'Add', Icon: HiPlus },
        { key: 'analysis', label: 'Analysis', Icon: HiChartBar },
        { key: 'export', label: 'Export', Icon: HiArrowDown },
    ];

    return (
        <nav className="bottom-nav">
            {items.map(({ key, label, Icon }) => (
                <div
                    key={key}
                    className={`nav-item${tab === key ? ' active' : ''}`}
                    onClick={() => setTab(key)}
                >
                    <Icon size={24} />
                    {label}
                </div>
            ))}
        </nav>
    );
}
