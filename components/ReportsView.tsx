import React, { useMemo, useState } from 'react';
import { Ticket, Status } from '../types';
import { TECHNICIANS_DATA, STATUSES, LOCATIONS_FOR_FILTER } from '../constants';
import { DocumentIcon } from './icons/DocumentIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { RefreshIcon } from './icons/RefreshIcon';

interface ReportsViewProps {
  tickets: Ticket[];
}

// --- HELPER FUNCTIONS ---
const parseGermanDate = (dateStr: string | undefined): Date | null => {
    if (!dateStr || dateStr === 'N/A') return null;
    const parts = dateStr.split('.');
    if (parts.length === 3) {
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return null;
};

// --- ICON COMPONENTS (locally scoped for this view) ---
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

// --- UI COMPONENTS ---
const StatCard: React.FC<{ title: string; value: string | number; description?: string; icon: React.ReactNode; iconBgColor: string; }> = ({ title, value, description, icon, iconBgColor }) => (
    <div className="stat-card">
        <div className="stat-card-header">
            <h3 className="stat-card-title">{title}</h3>
            <div className="stat-icon-wrapper" style={{ backgroundColor: iconBgColor }}>{icon}</div>
        </div>
        <p className="stat-card-value">{value}</p>
        {description && <p className="stat-card-description">{description}</p>}
    </div>
);

const HorizontalBarChart: React.FC<{ title: string; data: { label: string; value: number; color?: string }[]; barColor?: string; valueSuffix?: string; }> = ({ title, data, barColor, valueSuffix = '' }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="chart-container">
            <h3 className="chart-title">{title}</h3>
            {data.length > 0 ? (
                <div className="h-bar-chart">
                    {data.map((item, index) => (
                        <div className="h-bar-row" key={item.label} style={{ animationDelay: `${index * 50}ms` }}>
                            <span className="h-bar-label" title={item.label}>{item.label}</span>
                            <div className="h-bar-wrapper">
                                <div className="h-bar" style={{ '--bar-width': `${(item.value / maxValue) * 100}%`, '--bar-color': item.color || barColor } as React.CSSProperties}></div>
                            </div>
                            <span className="h-bar-value">{item.value.toFixed(item.value % 1 === 0 ? 0 : 1)}{valueSuffix}</span>
                        </div>
                    ))}
                </div>
            ) : <div className="no-data-placeholder">Keine Daten verfügbar.</div>}
        </div>
    );
};

const DoughnutChart: React.FC<{ title: string; data: { label: string; value: number; color: string }[] }> = ({ title, data }) => {
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercent = 0;
    const gradientParts = data.map(item => {
        const percent = (item.value / totalValue) * 100;
        const part = `${item.color} ${cumulativePercent}% ${cumulativePercent + percent}%`;
        cumulativePercent += percent;
        return part;
    });
    const conicGradient = `conic-gradient(${gradientParts.join(', ')})`;

    return (
        <div className="chart-container">
            <h3 className="chart-title">{title}</h3>
            {data.length > 0 ? (
                <div className="doughnut-chart-area">
                    <div className="doughnut-chart" style={{ background: conicGradient }}>
                        <div className="doughnut-center">
                            <span className="doughnut-total-value">{totalValue}</span>
                            <span className="doughnut-total-label">Tickets</span>
                        </div>
                    </div>
                    <div className="doughnut-legend">
                        {data.map(item => (
                            <div className="legend-item" key={item.label}>
                                <span className="legend-color-dot" style={{ backgroundColor: item.color }}></span>
                                <span className="legend-label">{item.label}</span>
                                <span className="legend-value">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : <div className="no-data-placeholder">Keine Daten verfügbar.</div>}
        </div>
    );
};

const LineChart: React.FC<{ title: string; data: { date: string; created: number; completed: number }[] }> = ({ title, data }) => {
    const maxValue = Math.max(...data.flatMap(d => [d.created, d.completed]), 10);
    const yAxisLabels = Array.from({ length: 5 }, (_, i) => Math.round(maxValue / 4 * i)).reverse();

    const createPath = (dataset: 'created' | 'completed', color: string) => {
        if (data.length < 2) return null;
        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - (d[dataset] / maxValue) * 100;
            return `${x},${y}`;
        }).join(' ');
        
        return (
            <>
                <polyline fill="none" stroke={color} strokeWidth="2" points={points} vectorEffect="non-scaling-stroke" />
                <polygon fill={`url(#gradient-${dataset})`} points={`0,100 ${points} 100,100`} />
            </>
        );
    };

    return (
        <div className="chart-container full-width">
            <h3 className="chart-title">{title}</h3>
            {data.length > 0 ? (
                <div className="line-chart-area">
                    <div className="y-axis">
                        {yAxisLabels.map(label => <span key={label}>{label}</span>)}
                    </div>
                    <div className="line-chart-svg-wrapper">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="gradient-created" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.3"/>
                                    <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0"/>
                                </linearGradient>
                                <linearGradient id="gradient-completed" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--accent-success)" stopOpacity="0.3"/>
                                    <stop offset="100%" stopColor="var(--accent-success)" stopOpacity="0"/>
                                </linearGradient>
                            </defs>
                            {createPath('created', 'var(--accent-primary)')}
                            {createPath('completed', 'var(--accent-success)')}
                        </svg>
                    </div>
                     <div className="x-axis">
                        <span>{data[0]?.date}</span>
                        <span>{data[Math.floor(data.length / 2)]?.date}</span>
                        <span>{data[data.length-1]?.date}</span>
                    </div>
                     <div className="line-chart-legend">
                        <div className="legend-item"><span className="legend-color-dot" style={{backgroundColor: 'var(--accent-primary)'}}></span>Neu erstellt</div>
                        <div className="legend-item"><span className="legend-color-dot" style={{backgroundColor: 'var(--accent-success)'}}></span>Abgeschlossen</div>
                    </div>
                </div>
            ) : <div className="no-data-placeholder">Keine Daten für Trendanalyse verfügbar.</div>}
        </div>
    );
};

// --- MAIN COMPONENT ---
const ReportsView: React.FC<ReportsViewProps> = ({ tickets }) => {
    const [reportFilters, setReportFilters] = useState({
        timeRange: '30d' as '7d' | '30d' | '90d' | 'all',
        area: 'Alle', status: 'Alle', technician: 'Alle'
    });
    const allTechnicians = useMemo(() => ['Alle', ...TECHNICIANS_DATA.map(t => t.name)], []);

    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket => {
            const today = new Date(2026, 1, 7); today.setHours(0, 0, 0, 0);
            if (reportFilters.timeRange !== 'all') {
                const entryDate = parseGermanDate(ticket.entryDate);
                if (!entryDate) return false;
                const days = { '7d': 7, '30d': 30, '90d': 90 };
                const cutOffDate = new Date(today); cutOffDate.setDate(today.getDate() - days[reportFilters.timeRange]);
// FIX: Use .getTime() for robust date comparison to resolve arithmetic operation error.
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
        const resolvedTickets = filteredTickets.filter(t => t.completionDate && t.entryDate);
        let avgResolutionTime = 0;
        if (resolvedTickets.length > 0) {
            const totalTime = resolvedTickets.reduce((acc: number, t) => {
                const entry = parseGermanDate(t.entryDate);
                const completion = parseGermanDate(t.completionDate);
                if (entry && completion) {
// FIX: Use .getTime() for robust date subtraction to resolve arithmetic operation error.
                    return acc + (completion.getTime() - entry.getTime());
                }
                return acc;
            }, 0);
            avgResolutionTime = totalTime / resolvedTickets.length / (1000 * 60 * 60 * 24);
        }
        return { total, abgeschlossene, ueberfaellige, avgResolutionTime: avgResolutionTime.toFixed(1) };
    }, [filteredTickets]);

    const ticketsByArea = useMemo(() => {
        const counts = filteredTickets.reduce((acc: Record<string, number>, ticket) => {
            acc[ticket.area] = (acc[ticket.area] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8);
    }, [filteredTickets]);

    const ticketsByTechnician = useMemo(() => {
        // FIX: Explicitly type accumulator in reduce to fix potential type inference issues.
        const counts = filteredTickets.reduce((acc: Record<string, number>, ticket) => {
            if (ticket.technician && ticket.technician !== 'N/A') {
                 acc[ticket.technician] = (acc[ticket.technician] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const sorted = Object.entries(counts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
        
        const colors = ['#0d6efd', '#6f42c1', '#dc3545', '#fd7e14', '#198754', '#6c757d', '#343a40', '#adb5bd'];
        return sorted.map((item, index) => ({...item, color: colors[index % colors.length]}));
    }, [filteredTickets]);

    const technicianWorkload = useMemo(() => {
        const activeTickets = filteredTickets.filter(t => t.status !== Status.Abgeschlossen);
        const totalActiveTickets = activeTickets.length;
        if (totalActiveTickets === 0) return [];
        
        // FIX: Explicitly type accumulator in reduce to fix potential type inference issues.
        const counts = activeTickets.reduce((acc: Record<string, number>, ticket) => {
             if (ticket.technician && ticket.technician !== 'N/A') {
                acc[ticket.technician] = (acc[ticket.technician] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts)
            .map(([label, value]) => ({ label, value: (value / totalActiveTickets) * 100 }))
            .sort((a, b) => b.value - a.value);

    }, [filteredTickets]);
    
    const ticketTrendData = useMemo(() => {
        if (reportFilters.timeRange === 'all') return [];
        const days = { '7d': 7, '30d': 30, '90d': 90 }[reportFilters.timeRange];
        const today = new Date(2026, 1, 7);
        const dailyData: Record<string, { created: number, completed: number }> = {};
        
        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
            dailyData[dateString] = { created: 0, completed: 0 };
        }

        filteredTickets.forEach(ticket => {
            const entryDate = parseGermanDate(ticket.entryDate);
            if (entryDate) {
                const dateString = entryDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
                if (dailyData[dateString]) dailyData[dateString].created++;
            }
            const completionDate = parseGermanDate(ticket.completionDate);
            if (completionDate) {
                const dateString = completionDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
                 if (dailyData[dateString]) dailyData[dateString].completed++;
            }
        });
        
        return Object.entries(dailyData).map(([date, values]) => ({ date, ...values })).reverse();
    }, [filteredTickets, reportFilters.timeRange]);

    const handleFilterChange = (filterName: string, value: string) => setReportFilters(prev => ({ ...prev, [filterName]: value as any }));
    const resetFilters = () => setReportFilters({ timeRange: '30d', area: 'Alle', status: 'Alle', technician: 'Alle' });

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
                /* General */
                .reports-view { padding-top: 0; }
                .reports-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .reports-title { font-size: 1.75rem; font-weight: 700; }
                .no-data-placeholder { height: 100%; min-height: 200px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
                
                /* Filters */
                .reports-filter-bar { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 1rem 1.5rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
                .custom-select { position: relative; border: 1px solid var(--border); border-radius: 6px; padding: 0.5rem 2rem 0.5rem 0.75rem; font-size: 0.9rem; min-width: 120px; cursor: pointer; color: var(--text-secondary); height: 38px; display: flex; align-items: center; transition: var(--transition-smooth); background-color: var(--bg-tertiary); }
                .custom-select:hover { border-color: var(--border-active); }
                .custom-select select { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
                .custom-select svg { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); pointer-events: none; width: 16px; height: 16px; color: var(--text-muted); }
                .action-btn { background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-secondary); font-size: 0.9rem; padding: 0.5rem 1rem; border-radius: 6px; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: var(--transition-smooth); font-weight: 500; margin-left: auto; }
                .action-btn:hover { background: var(--border); }

                /* Stats Grid */
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }
                .stat-card { background-color: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; }
                .stat-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
                .stat-card-title { font-size: 0.9rem; font-weight: 500; color: var(--text-secondary); }
                .stat-icon-wrapper { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
                .stat-icon-wrapper svg { width: 20px; height: 20px; color: var(--text-primary); }
                .stat-card-value { font-size: 2.25rem; font-weight: 700; color: var(--text-primary); }
                .stat-card-description { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem; }

                /* Charts */
                .charts-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; }
                @media (min-width: 992px) { .charts-grid { grid-template-columns: 3fr 2fr; } }
                .chart-container { background-color: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; display: flex; flex-direction: column; }
                .chart-container.full-width { grid-column: 1 / -1; }
                .chart-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 1.5rem; flex-shrink: 0; }
                
                .technician-charts-stack { display: flex; flex-direction: column; gap: 2rem; }

                /* Horizontal Bar Chart */
                .h-bar-chart { display: flex; flex-direction: column; gap: 1rem; }
                .h-bar-row { display: grid; grid-template-columns: 100px 1fr 40px; gap: 0.75rem; align-items: center; animation: slideIn 0.5s ease-out forwards; opacity: 0; }
                @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
                .h-bar-label { font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .h-bar-wrapper { background-color: var(--bg-tertiary); border-radius: 4px; height: 16px; }
                .h-bar { height: 100%; border-radius: 4px; background: var(--bar-color, var(--accent-primary)); width: var(--bar-width, 0%); transition: width 0.5s ease-out; }
                .h-bar-value { font-size: 0.8rem; font-weight: 500; color: var(--text-primary); text-align: right; }
                
                /* Line Chart */
                .line-chart-area { flex-grow: 1; display: grid; grid-template-columns: auto 1fr; grid-template-rows: 1fr auto; }
                .y-axis { grid-column: 1; grid-row: 1; display: flex; flex-direction: column; justify-content: space-between; text-align: right; padding-right: 0.5rem; font-size: 0.75rem; color: var(--text-muted); }
                .line-chart-svg-wrapper { grid-column: 2; grid-row: 1; position: relative; }
                .line-chart-svg-wrapper svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
                .x-axis { grid-column: 2; grid-row: 2; display: flex; justify-content: space-between; padding-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted); }
                .line-chart-legend { grid-column: 1 / -1; grid-row: 3; display: flex; justify-content: center; gap: 1.5rem; padding-top: 1rem; }
                .legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
                .legend-color-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
            `}</style>
            <div className="reports-header">
                <h1 className="reports-title">Reports & Analysen</h1>
            </div>

            <div className="reports-filter-bar">
                <div className="custom-select">
                    <span>{timeRangeOptions[reportFilters.timeRange]}</span>
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
                <HorizontalBarChart title="Top 8 Bereiche nach Ticketaufkommen" data={ticketsByArea} barColor="linear-gradient(90deg, #fd7e14, #dc3545)" />
                <div className="technician-charts-stack">
                    <HorizontalBarChart title="Ticket-Verteilung pro Techniker" data={ticketsByTechnician} />
                    <HorizontalBarChart title="Prozentuale Auslastung (Aktive Tickets)" data={technicianWorkload} barColor="linear-gradient(90deg, #198754, #0d6efd)" valueSuffix="%" />
                </div>
                {reportFilters.timeRange !== 'all' && (
                    <LineChart title={`Ticket-Trend (${timeRangeOptions[reportFilters.timeRange]})`} data={ticketTrendData} />
                )}
            </div>
        </div>
    );
};
export default ReportsView;