import React, { useMemo, useState } from 'react';
import { Ticket, Status, Priority } from '../types';
// FIX: Changed AREAS to LOCATIONS_FOR_FILTER as AREAS is not exported from constants.
import { statusBgColorMap, LOCATIONS_FOR_FILTER, TECHNICIANS_DATA, STATUSES } from '../constants';
import { DocumentIcon } from './icons/DocumentIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { RefreshIcon } from './icons/RefreshIcon';


interface ReportsViewProps {
  tickets: Ticket[];
}

// Helper to parse German date format DD.MM.YYYY
const parseGermanDate = (dateStr: string | undefined): Date | null => {
    if (!dateStr || dateStr === 'N/A') return null;
    const parts = dateStr.split('.');
    if (parts.length === 3) {
        // new Date(year, monthIndex, day)
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return null;
};

// --- Icon components defined locally for this view ---
const ExclamationTriangleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
);
const WrenchScrewdriverIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.495-2.495a1.125 1.125 0 0 1 1.591 0l3.001 3.001a1.125 1.125 0 0 1 0 1.591l-2.495 2.495m-5.832-5.832 2.495-2.495a1.125 1.125 0 0 0 0-1.591l-3.001-3.001a1.125 1.125 0 0 0-1.591 0l-2.495 2.495m5.832 5.832L9.25 17.25" />
    </svg>
);
const CheckCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const StatCard: React.FC<{ title: string; value: string | number; description?: string; icon: React.ReactNode; iconBgColor: string; onClick?: () => void; }> = ({ title, value, description, icon, iconBgColor, onClick }) => (
    <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
        <div className="stat-card-header">
            <h3 className="stat-card-title">{title}</h3>
            <div className="stat-icon-wrapper" style={{ backgroundColor: iconBgColor }}>
                {icon}
            </div>
        </div>
        <p className="stat-card-value">{value}</p>
        {description && <p className="stat-card-description">{description}</p>}
    </div>
);

const BarChart: React.FC<{ title: string; data: { label: string; value: number }[]; barColor: string; valueSuffix?: string; headerControls?: React.ReactNode; onBarClick?: (label: string) => void; }> = ({ title, data, barColor, valueSuffix = '', headerControls, onBarClick }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="chart-container">
            <div className="chart-header-with-toggle">
                <h3 className="chart-title">{title}</h3>
                {headerControls}
            </div>
            {data.length > 0 ? (
                <div className="chart">
                    {data.map((item, index) => (
                        <div 
                            className="chart-bar-group" 
                            key={item.label} 
                            title={`${item.label}: ${item.value}${valueSuffix}`}
                            onClick={() => onBarClick && onBarClick(item.label)}
                            style={{ cursor: onBarClick ? 'pointer' : 'default' }}
                        >
                             <div className="bar-value-label">{item.value}{valueSuffix}</div>
                            <div className="chart-bar-wrapper">
                                <div
                                    className="chart-bar"
                                    style={{
                                        '--bar-height': `${(item.value / maxValue) * 100}%`,
                                        '--bar-color': barColor,
                                        'animationDelay': `${index * 50}ms`
                                    } as React.CSSProperties}
                                ></div>
                            </div>
                            <span className="chart-label">{item.label}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="no-data-placeholder">Keine Daten für dieses Diagramm verfügbar.</div>
            )}
        </div>
    );
};


const ReportsView: React.FC<ReportsViewProps> = ({ tickets }) => {
    const [bereichChartView, setBereichChartView] = useState<'anzahl' | 'quote'>('anzahl');
    const [reportFilters, setReportFilters] = useState({
        timeRange: '30d', // '7d', '30d', '90d', 'all'
        area: 'Alle',
        status: 'Alle',
        technician: 'Alle',
    });

    const allTechnicians = useMemo(() => ['Alle', ...TECHNICIANS_DATA.map(t => t.name)], []);

    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket => {
            const today = new Date(2026, 1, 7); // Fixed truncated line
            today.setHours(0,0,0,0);

            if (reportFilters.timeRange !== 'all') {
                const entryDate = parseGermanDate(ticket.entryDate);
                if (!entryDate) return false;
                
                // Fix: Allow TypeScript to infer a more specific type for `days` to ensure values are always numbers.
                const days = { '7d': 7, '30d': 30, '90d': 90 };
                const cutOffDate = new Date(today);
                cutOffDate.setDate(today.getDate() - days[reportFilters.timeRange as '7d'|'30d'|'90d']);
                // FIX: Use .getTime() for explicit date comparison to avoid type errors in strict mode.
                if (entryDate.getTime() < cutOffDate.getTime()) return false;
            }

            if (reportFilters.area !== 'Alle' && ticket.area !== reportFilters.area) return false;
            if (reportFilters.status !== 'Alle' && ticket.status !== reportFilters.status) return false;
            if (reportFilters.technician !== 'Alle' && ticket.technician !== reportFilters.technician) return false;
            
            return true;
        });
    }, [tickets, reportFilters]);

    const stats = useMemo(() => {
        const total = filteredTickets.length;
        const abgeschlossene = filteredTickets.filter(t => t.status === Status.Abgeschlossen).length;
        const ueberfaellige = filteredTickets.filter(t => t.status === Status.Ueberfaellig).length;

        let avgResolutionTime = 0;
        const resolvedTickets = filteredTickets.filter(t => t.completionDate && t.entryDate);
        if (resolvedTickets.length > 0) {
            // FIX: Explicitly type totalTime as a number to avoid potential type inference issues.
            // Fix: Add explicit type for the accumulator `acc` to ensure it's treated as a number.
            const totalTime: number = resolvedTickets.reduce((acc: number, t) => {
                const entry = parseGermanDate(t.entryDate);
                const completion = parseGermanDate(t.completionDate);
                if (entry && completion) {
                    return acc + (completion.getTime() - entry.getTime());
                }
                return acc;
            }, 0);
            avgResolutionTime = totalTime / resolvedTickets.length / (1000 * 60 * 60 * 24); // in days
        }

        return {
            total,
            abgeschlossene,
            offene: total - abgeschlossene,
            ueberfaellige,
            avgResolutionTime: avgResolutionTime.toFixed(1)
        };
    }, [filteredTickets]);

    const ticketsByArea = useMemo(() => {
        const counts = filteredTickets.reduce((acc, ticket) => {
            acc[ticket.area] = (acc[ticket.area] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const totalTickets = filteredTickets.length;
        
        return Object.entries(counts)
            .map(([label, value]) => ({
                label,
                value: bereichChartView === 'anzahl' ? value : totalTickets > 0 ? (value / totalTickets) * 100 : 0
            }))
            .sort((a, b) => b.value - a.value).slice(0, 10);
    }, [filteredTickets, bereichChartView]);
    
    const ticketsByTechnician = useMemo(() => {
        const counts = filteredTickets.reduce((acc, ticket) => {
            const tech = ticket.technician === 'N/A' ? 'Unzugewiesen' : ticket.technician;
            acc[tech] = (acc[tech] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value).slice(0, 10);
    }, [filteredTickets]);

    const handleFilterChange = (filterName: string, value: string) => {
        setReportFilters(prev => ({ ...prev, [filterName]: value }));
    };
    
    const resetFilters = () => {
        setReportFilters({ timeRange: '30d', area: 'Alle', status: 'Alle', technician: 'Alle' });
    };

    const FilterChip: React.FC<{label: string, name: string, options: string[], value: string}> = ({label, name, options, value}) => (
        <div className={`custom-select filter-chip ${value !== 'Alle' && name !== 'timeRange' ? 'active' : ''}`}>
            <span>{label}</span>
            {value !== 'Alle' && name !== 'timeRange' && <span className="filter-badge">{value}</span>}
            <select value={value} onChange={(e) => handleFilterChange(name, e.target.value)}>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <ChevronDownIcon />
        </div>
    );

    const timeRangeOptions = {'7d': 'Letzte 7 Tage', '30d': 'Letzte 30 Tage', '90d': 'Letzte 90 Tage', 'all': 'Gesamter Zeitraum'};

    return (
        <div className="reports-view">
            <style>{`
                .reports-view { padding-top: 0; }
                .reports-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .reports-title { font-size: 1.75rem; font-weight: 700; }
                .reports-filter-bar { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 1rem 1.5rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }
                .stat-card { background-color: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; transition: var(--transition-smooth); }
                .stat-card:hover { border-color: var(--border-active); box-shadow: var(--shadow-sm); }
                .stat-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
                .stat-card-title { font-size: 0.9rem; font-weight: 500; color: var(--text-secondary); }
                .stat-icon-wrapper { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
                .stat-icon-wrapper svg { width: 20px; height: 20px; color: var(--text-primary); }
                .stat-card-value { font-size: 2.25rem; font-weight: 700; color: var(--text-primary); }
                .stat-card-description { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem; }
                .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                .chart-container { background-color: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; }
                .chart-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 1.5rem; }
                .chart { display: flex; gap: 1rem; height: 250px; align-items: flex-end; }
                .chart-bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
                .chart-bar-wrapper { flex-grow: 1; width: 100%; display: flex; align-items: flex-end; }
                .chart-bar { width: 100%; background-color: var(--bar-color, var(--accent-primary)); border-radius: 4px 4px 0 0; height: var(--bar-height); animation: growUp 0.5s ease-out forwards; }
                .chart-label { font-size: 0.8rem; color: var(--text-muted); text-align: center; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .bar-value-label { font-size: 0.8rem; font-weight: 600; color: var(--text-primary); }
                @keyframes growUp { from { height: 0; } }
                .no-data-placeholder { height: 250px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
                .chart-header-with-toggle { display: flex; justify-content: space-between; align-items: center; }
                /* Filter styles from FilterBar.tsx */
                .custom-select { position: relative; border: 1px solid var(--border); border-radius: 6px; padding: 0.5rem 2rem 0.5rem 0.75rem; font-size: 0.9rem; min-width: 120px; cursor: pointer; color: var(--text-secondary); height: 38px; display: flex; align-items: center; transition: var(--transition-smooth); background-color: var(--bg-tertiary); }
                .custom-select:hover { border-color: var(--border-active); }
                .custom-select select { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
                .custom-select svg { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); pointer-events: none; width: 16px; height: 16px; color: var(--text-muted); }
                .action-btn { background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-secondary); font-size: 0.9rem; padding: 0.5rem 1rem; border-radius: 6px; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: var(--transition-smooth); font-weight: 500; margin-left: auto; }
                .action-btn:hover { background: var(--border); }
            `}</style>
            <div className="reports-header">
                <h1 className="reports-title">Reports & Analysen</h1>
            </div>

            <div className="reports-filter-bar">
                <div className="custom-select">
                    <span>{timeRangeOptions[reportFilters.timeRange as keyof typeof timeRangeOptions]}</span>
                    <select value={reportFilters.timeRange} onChange={(e) => handleFilterChange('timeRange', e.target.value)}>
                        {Object.entries(timeRangeOptions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                    <ChevronDownIcon/>
                </div>
                <FilterChip label="Bereich" name="area" options={LOCATIONS_FOR_FILTER} value={reportFilters.area} />
                <FilterChip label="Status" name="status" options={STATUSES} value={reportFilters.status} />
                <FilterChip label="Techniker" name="technician" options={allTechnicians} value={reportFilters.technician} />
                <button className="action-btn" onClick={resetFilters}><RefreshIcon />Zurücksetzen</button>
            </div>
            
            <div className="stats-grid">
                <StatCard title="Gesamte Tickets" value={stats.total} description="Im ausgewählten Zeitraum" icon={<DocumentIcon />} iconBgColor="rgba(0, 123, 255, 0.1)" />
                <StatCard title="Abgeschlossen" value={stats.abgeschlossene} description="Im ausgewählten Zeitraum" icon={<CheckCircleIcon />} iconBgColor="rgba(40, 167, 69, 0.1)" />
                <StatCard title="Überfällig" value={stats.ueberfaellige} description="Aktuell überfällige Tickets" icon={<ExclamationTriangleIcon />} iconBgColor="rgba(220, 53, 69, 0.1)" />
                <StatCard title="Lösungszeit (Ø)" value={`${stats.avgResolutionTime} Tage`} description="Für abgeschlossene Tickets" icon={<WrenchScrewdriverIcon />} iconBgColor="rgba(255, 193, 7, 0.1)" />
            </div>
            
            <div className="charts-grid">
                <BarChart title="Tickets pro Bereich" data={ticketsByArea} barColor="var(--accent-primary)" valueSuffix={bereichChartView === 'quote' ? '%' : ''} />
                <BarChart title="Tickets pro Techniker" data={ticketsByTechnician} barColor="#6f42c1" />
            </div>
        </div>
    );
};
// FIX: Add missing default export
export default ReportsView;