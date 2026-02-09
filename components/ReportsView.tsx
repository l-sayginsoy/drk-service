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
            const today = new Date('2026-02-07');
            let startDate: Date | null = null;

            if (reportFilters.timeRange !== 'all') {
                const days = parseInt(reportFilters.timeRange.replace('d', ''), 10);
                const start = new Date(today);
                start.setDate(today.getDate() - days);
                startDate = start;
            }

            // The filter applies to the entry date.
            if (startDate) {
                const entryDate = parseGermanDate(ticket.entryDate);
                const currentDay = new Date('2026-02-07');
                if (!entryDate || entryDate < startDate || entryDate > currentDay) {
                    return false;
                }
            }

            if (reportFilters.area !== 'Alle' && ticket.area !== reportFilters.area) return false;
            if (reportFilters.status !== 'Alle' && ticket.status !== reportFilters.status) return false;
            if (reportFilters.technician !== 'Alle' && ticket.technician !== reportFilters.technician) return false;
            
            return true;
        });
    }, [tickets, reportFilters]);


    const reportData = useMemo(() => {
        // KPI data
        const overdueTickets = filteredTickets.filter(t => t.status === Status.Ueberfaellig).length;
        const openTickets = filteredTickets.filter(t => t.status === Status.Offen).length;
        const inProgressTickets = filteredTickets.filter(t => t.status === Status.InArbeit).length;
        const completedTickets = filteredTickets.filter(t => t.status === Status.Abgeschlossen).length;

        // Chart data
        // FIX: Provide explicit type for reduce accumulator
        const ticketsByAreaRaw = filteredTickets.reduce<Record<string, number>>((acc, ticket) => {
            acc[ticket.area] = (acc[ticket.area] || 0) + 1;
            return acc;
        }, {});
        
        // FIX: Provide explicit type for reduce accumulator
        // FIX: Explicitly type the initial value for the reduce accumulator to resolve type inference issues.
        // FIX: Add explicit type for reduce accumulator to resolve property access on 'unknown' errors.
        const areaStats = filteredTickets.reduce<Record<string, { total: number; overdue: number }>>((acc, ticket) => {
            if (!acc[ticket.area]) {
                acc[ticket.area] = { total: 0, overdue: 0 };
            }
            acc[ticket.area].total++;
            if (ticket.status === Status.Ueberfaellig) {
                acc[ticket.area].overdue++;
            }
            return acc;
        }, {});

        const overdueRateByArea = Object.entries(areaStats)
            .map(([label, stats]) => ({
                label,
                value: stats.total > 0 ? parseFloat(((stats.overdue / stats.total) * 100).toFixed(1)) : 0,
            }))
            .sort((a, b) => b.value - a.value);

        // FIX: Provide explicit type for reduce accumulator
        // FIX: Add explicit type for reduce accumulator to resolve downstream type errors.
        const ticketsByPriority = filteredTickets.reduce<Record<string, number>>((acc, ticket) => {
            acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
            return acc;
        }, {});

        // FIX: Provide explicit type for reduce accumulator
        // FIX: Explicitly type the initial value for the reduce accumulator to resolve type inference issues.
        // FIX: Add explicit type for reduce accumulator to resolve property access on 'unknown' errors.
        const technicianStats = filteredTickets.reduce<Record<string, { totalActive: number; overdue: number; label: string }>>((acc, ticket) => {
            const tech = ticket.technician;
            if (tech && tech !== 'N/A') {
                if (!acc[tech]) {
                    acc[tech] = { totalActive: 0, overdue: 0, label: tech };
                }
                if (ticket.status !== Status.Abgeschlossen) {
                    acc[tech].totalActive++;
                     if (ticket.status === Status.Ueberfaellig) {
                        acc[tech].overdue++;
                    }
                }
            }
            return acc;
        }, {});

        const ticketsByTechnicianData = Object.values(technicianStats)
            .sort((a, b) => b.totalActive - a.totalActive);
        
        // FIX: Provide explicit type for reduce accumulator
        // FIX: Explicitly type the initial value for the reduce accumulator to resolve type inference issues.
        // FIX: Add explicit type for reduce accumulator to resolve property access on 'unknown' errors.
        const completedByTechnicianRaw = filteredTickets
            .filter(t => t.status === Status.Abgeschlossen && t.technician && t.technician !== 'N/A')
            .reduce<Record<string, { count: number; totalResolutionDays: number }>>((acc, ticket) => {
                const tech = ticket.technician!;
                if (!acc[tech]) {
                    acc[tech] = { count: 0, totalResolutionDays: 0 };
                }
                acc[tech].count++;

                const entryDate = parseGermanDate(ticket.entryDate);
                const completionDate = parseGermanDate(ticket.completionDate!);
                if (entryDate && completionDate) {
                    const diffTime = Math.abs(completionDate.getTime() - entryDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    acc[tech].totalResolutionDays += diffDays;
                }
                return acc;
            }, {});


        const completedByTechnicianData = Object.entries(completedByTechnicianRaw)
            .map(([label, data]) => ({
                label,
                value: data.count,
                avgResolutionDays: data.count > 0 ? Math.round(data.totalResolutionDays / data.count) : 0,
            }))
            .sort((a, b) => b.value - a.value);

        return {
            overdueTickets,
            openTickets,
            inProgressTickets,
            completedTickets,
            ticketsByArea: Object.entries(ticketsByAreaRaw).map(([label, value]) => ({ label, value })).sort((a,b) => b.value - a.value),
            overdueRateByArea,
            ticketsByPriority: Object.entries(ticketsByPriority).map(([label, value]) => ({ label, value })).sort((a,b) => {
                const order: Record<string, number> = { [Priority.Hoch]: 1, [Priority.Mittel]: 2, [Priority.Niedrig]: 3 };
                return (order[a.label] ?? 99) - (order[b.label] ?? 99);
            }),
            ticketsByTechnician: ticketsByTechnicianData,
            maxTechTickets: Math.max(...ticketsByTechnicianData.map(item => item.totalActive), 1),
            completedByTechnician: completedByTechnicianData,
            maxCompletedTechTickets: Math.max(...completedByTechnicianData.map(item => item.value), 1),
        };

    }, [filteredTickets]);

    const bereichChartControls = (
        <div className="chart-toggle">
            <button
                className={`toggle-btn ${bereichChartView === 'anzahl' ? 'active' : ''}`}
                onClick={() => setBereichChartView('anzahl')}>
                Anzahl
            </button>
            <button
                className={`toggle-btn ${bereichChartView === 'quote' ? 'active' : ''}`}
                onClick={() => setBereichChartView('quote')}>
                Überfällig Quote
            </button>
        </div>
    );
    
     const getTimeRangeLabel = (rangeKey: string) => {
        const labels: Record<string, string> = {
            '7d': '(Letzte 7 Tage)',
            '30d': '(Letzte 30 Tage)',
            '90d': '(Letzte 90 Tage)',
            'all': '(Alle Zeiten)',
        };
        return labels[rangeKey] || '';
    };

    const handleResetFilters = () => {
        setReportFilters({
            timeRange: '30d',
            area: 'Alle',
            status: 'Alle',
            technician: 'Alle',
        });
    };

    return (
        <div className="reports-view">
             <style>{`
                /* Existing styles remain... */
                 @keyframes bar-enter {
                    from { transform: scaleY(0); }
                    to { transform: scaleY(1); }
                }
                @keyframes slide-in-left {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fill-in-width {
                    from { width: 0%; }
                    to { width: var(--fill-width); }
                }

                .reports-view { 
                    padding-top: 1.5rem; 
                    animation: fadeIn 0.5s ease-out;
                }
                /* New Filter Bar Styles */
                .report-filters {
                    background: var(--bg-secondary);
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--border);
                    padding: 1rem 1.5rem;
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    box-shadow: var(--shadow-sm);
                    justify-content: space-between;
                }
                .report-filter-controls {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 1rem;
                }
                .filter-group {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .filter-label {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--text-secondary);
                }
                .time-range-toggle, .chart-toggle {
                    display: flex;
                    gap: 0.5rem;
                    background: var(--bg-tertiary);
                    padding: 0.25rem;
                    border-radius: var(--radius-md);
                }
                .time-range-toggle .toggle-btn, .chart-toggle .toggle-btn {
                     background: transparent; border: none; padding: 0.35rem 0.75rem;
                    border-radius: var(--radius-sm); cursor: pointer; font-weight: 500;
                    font-size: 0.8rem; color: var(--text-muted); transition: all 0.2s ease;
                }
                .time-range-toggle .toggle-btn.active, .chart-toggle .toggle-btn.active {
                    background: var(--bg-secondary); color: var(--text-primary); box-shadow: var(--shadow-sm);
                }
                
                .report-filters .custom-select {
                    position: relative;
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    padding-right: 2.25rem;
                    padding-left: 0.75rem;
                    font-size: 0.9rem;
                    min-width: 120px;
                    cursor: pointer;
                    color: var(--text-secondary);
                    height: 38px;
                    display: flex;
                    align-items: center;
                    transition: var(--transition-smooth);
                    background-color: var(--bg-tertiary);
                }
                .report-filters .custom-select:hover {
                    border-color: var(--border-active);
                    background-color: var(--bg-tertiary);
                }
                .report-filters .custom-select.active {
                    border-color: var(--text-secondary);
                }
                .report-filters .filter-badge {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    background-color: var(--border);
                    padding: 0.15rem 0.5rem;
                    border-radius: 4px;
                    margin-left: 0.5rem;
                }

                .report-filters .custom-select span {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .report-filters .custom-select select {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    cursor: pointer;
                }
                .report-filters .custom-select svg {
                    position: absolute;
                    right: 0.75rem;
                    top: 50%;
                    transform: translateY(-50%);
                    pointer-events: none;
                    width: 16px;
                    height: 16px;
                    color: var(--text-muted);
                }
                .action-btn { 
                    background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-secondary); font-size: 0.9rem; padding: 0.5rem 1rem; border-radius: 6px; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: var(--transition-smooth); font-weight: 500; 
                }
                .action-btn:hover { background: var(--border); }
                .action-btn svg { width: 16px; height: 16px; }


                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2.5rem;
                }
                .stat-card {
                    background: var(--bg-secondary);
                    border-radius: 12px;
                    padding: 1.5rem;
                    transition: var(--transition-smooth);
                    display: flex;
                    flex-direction: column;
                    box-shadow: var(--shadow-sm);
                    border: 1px solid var(--border);
                }
                .stat-card:hover {
                    transform: translateY(-5px);
                    box-shadow: var(--shadow-lg);
                    border-color: var(--border-active);
                }
                .stat-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                }
                .stat-icon-wrapper {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .stat-icon-wrapper svg {
                    width: 20px;
                    height: 20px;
                    color: var(--text-primary);
                }
                .stat-card-title {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--text-secondary);
                }
                .stat-card-value {
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    line-height: 1.2;
                    margin-top: 1rem;
                    margin-bottom: 0.5rem;
                    align-self: flex-start;
                }
                .stat-card-description {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    align-self: flex-start;
                }
                
                .charts-grid {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                }
                 @media (max-width: 1024px) {
                    .charts-grid { grid-template-columns: 1fr; }
                }

                .chart-container {
                     background: var(--bg-secondary);
                    border-radius: 12px;
                    border: 1px solid var(--border);
                    padding: 1.5rem;
                    transition: box-shadow 0.3s ease;
                }
                .chart-container:hover {
                    box-shadow: var(--shadow-sm);
                }
                .chart-header-with-toggle {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .chart-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 0;
                }
                .chart {
                    display: flex;
                    gap: 1.25rem;
                    height: 250px;
                    padding: 0 0.5rem;
                    position: relative;
                }
                .chart::before {
                    content: '';
                    position: absolute;
                    left: 0; top: 0; right: 0; bottom: 0;
                    background-image: linear-gradient(var(--border) 1px, transparent 1px);
                    background-size: 100% 50px;
                    opacity: 0.1;
                }

                .chart-bar-group {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    min-width: 0;
                    border-radius: var(--radius-md);
                    transition: background-color 0.2s ease;
                }
                .chart-bar-group:hover {
                    background-color: var(--bg-tertiary);
                }
                .bar-value-label {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 8px;
                    height: 16px;
                }
                .chart-bar-wrapper {
                    flex-grow: 1;
                    width: 100%;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                }
                .chart-bar {
                    width: 60%;
                    max-width: 40px;
                    background-color: var(--bar-color);
                    border-radius: 6px 6px 0 0;
                    height: var(--bar-height);
                    transform-origin: bottom;
                    animation: bar-enter 0.5s ease-out forwards;
                    transition: transform 0.2s ease, filter 0.2s ease;
                }
                .chart-bar-group:hover .chart-bar {
                    filter: brightness(1.15);
                }
                .chart-label {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    margin-top: 0.75rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    width: 100%;
                }
                
                .horizontal-bar-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .horizontal-bar-item-wrapper, .horizontal-bar-item {
                     animation: slide-in-left 0.5s ease-out forwards;
                     opacity: 0;
                }
                .horizontal-bar-item {
                    display: grid;
                    grid-template-columns: 130px 1fr 40px 40px;
                    gap: 1rem;
                    align-items: center;
                }
                .horizontal-bar-item.completed-item {
                    grid-template-columns: 130px 1fr 40px;
                }
                .horizontal-bar-label {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--text-secondary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    text-align: right;
                }
                 .horizontal-bar-label.clickable {
                    cursor: pointer;
                    transition: color 0.2s ease;
                }
                .horizontal-bar-label.clickable:hover {
                    color: var(--accent-primary);
                    font-weight: 600;
                }
                .horizontal-bar-track {
                    background-color: var(--bg-tertiary);
                    border-radius: 6px;
                    height: 12px;
                    overflow: hidden;
                    border: 1px solid var(--border);
                }
                .horizontal-bar-fill {
                    background-image: linear-gradient(90deg, color-mix(in srgb, var(--bar-color) 85%, black), var(--bar-color));
                    height: 100%;
                    border-radius: 6px;
                    animation: fill-in-width 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                    width: var(--fill-width);
                    transition: filter 0.2s ease;
                }
                .horizontal-bar-item-wrapper:hover .horizontal-bar-fill,
                .horizontal-bar-item:hover .horizontal-bar-fill {
                    filter: brightness(1.2);
                }
                .horizontal-bar-value {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    text-align: right;
                }
                .horizontal-bar-value.overdue {
                    color: var(--accent-danger);
                    font-weight: 700;
                }
                .bar-and-sublabel-wrapper {
                    display: flex;
                    flex-direction: column;
                }
                .horizontal-bar-sub-label {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    margin-top: 4px;
                }
                .no-data-placeholder {
                    text-align: center;
                    color: var(--text-muted);
                    font-style: italic;
                    padding: 3rem 0;
                }
            `}</style>

            <div className="report-filters">
                <div className="report-filter-controls">
                    <div className="filter-group">
                        <span className="filter-label">Zeitraum:</span>
                        <div className="time-range-toggle">
                            <button className={`toggle-btn ${reportFilters.timeRange === '7d' ? 'active' : ''}`} onClick={() => setReportFilters(f => ({ ...f, timeRange: '7d' }))}>7 T</button>
                            <button className={`toggle-btn ${reportFilters.timeRange === '30d' ? 'active' : ''}`} onClick={() => setReportFilters(f => ({ ...f, timeRange: '30d' }))}>30 T</button>
                            <button className={`toggle-btn ${reportFilters.timeRange === '90d' ? 'active' : ''}`} onClick={() => setReportFilters(f => ({ ...f, timeRange: '90d' }))}>90 T</button>
                            <button className={`toggle-btn ${reportFilters.timeRange === 'all' ? 'active' : ''}`} onClick={() => setReportFilters(f => ({ ...f, timeRange: 'all' }))}>Alle</button>
                        </div>
                    </div>
                    <div className={`custom-select ${reportFilters.area !== 'Alle' ? 'active' : ''}`}>
                        <span>Bereich</span>
                        {reportFilters.area !== 'Alle' && <span className="filter-badge">{reportFilters.area}</span>}
                        <select value={reportFilters.area} onChange={e => setReportFilters(f => ({ ...f, area: e.target.value }))}>
                            {LOCATIONS_FOR_FILTER.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <ChevronDownIcon />
                    </div>
                    <div className={`custom-select ${reportFilters.status !== 'Alle' ? 'active' : ''}`}>
                        <span>Status</span>
                        {reportFilters.status !== 'Alle' && <span className="filter-badge">{reportFilters.status}</span>}
                         <select value={reportFilters.status} onChange={e => setReportFilters(f => ({ ...f, status: e.target.value as Status | 'Alle' }))}>
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDownIcon />
                    </div>
                    <div className={`custom-select ${reportFilters.technician !== 'Alle' ? 'active' : ''}`}>
                        <span>Techniker</span>
                        {reportFilters.technician !== 'Alle' && <span className="filter-badge">{reportFilters.technician === 'N/A' ? 'Nicht zugewiesen' : reportFilters.technician}</span>}
                        <select value={reportFilters.technician} onChange={e => setReportFilters(f => ({ ...f, technician: e.target.value }))}>
                            {allTechnicians.map(t => <option key={t} value={t}>{t === 'N/A' ? 'Nicht zugewiesen' : t}</option>)}
                        </select>
                        <ChevronDownIcon />
                    </div>
                </div>
                <button className="action-btn" onClick={handleResetFilters}>
                    <RefreshIcon />
                    Zurücksetzen
                </button>
            </div>

            <div className="stats-grid">
                <StatCard title="Überfällige Tickets" value={reportData.overdueTickets} description="Dringend zu bearbeiten" icon={<ExclamationTriangleIcon />} iconBgColor={statusBgColorMap[Status.Ueberfaellig]} onClick={() => setReportFilters(f => ({ ...f, status: Status.Ueberfaellig }))} />
                <StatCard title="Offene Tickets" value={reportData.openTickets} description="Warten auf Zuweisung" icon={<DocumentIcon />} iconBgColor={statusBgColorMap[Status.Offen]} onClick={() => setReportFilters(f => ({ ...f, status: Status.Offen }))} />
                <StatCard title="Tickets in Arbeit" value={reportData.inProgressTickets} description="Aktive Bearbeitung" icon={<WrenchScrewdriverIcon />} iconBgColor={statusBgColorMap[Status.InArbeit]} onClick={() => setReportFilters(f => ({ ...f, status: Status.InArbeit }))} />
                <StatCard title="Abgeschlossene Tickets" value={reportData.completedTickets} description="Erfolgreich abgeschlossen" icon={<CheckCircleIcon />} iconBgColor={statusBgColorMap[Status.Abgeschlossen]} onClick={() => setReportFilters(f => ({ ...f, status: Status.Abgeschlossen }))} />
            </div>

            <div className="charts-grid">
                 <BarChart 
                    title="Tickets nach Bereich" 
                    data={bereichChartView === 'anzahl' ? reportData.ticketsByArea.slice(0, 10) : reportData.overdueRateByArea.slice(0, 10)} 
                    barColor="var(--accent-primary)" 
                    headerControls={bereichChartControls}
                    valueSuffix={bereichChartView === 'quote' ? '%' : ''}
                    onBarClick={(areaLabel) => setReportFilters(f => ({...f, area: areaLabel}))}
                />
                 <BarChart title="Tickets nach Priorität" data={reportData.ticketsByPriority} barColor="var(--accent-warning)" />
            </div>

             <div className="chart-container">
                <div className="chart-header-with-toggle">
                    <h3 className="chart-title">Aktive Tickets je Techniker</h3>
                </div>
                <div className="horizontal-bar-list">
                {reportData.ticketsByTechnician.length > 0 ? reportData.ticketsByTechnician.map((tech, index) => (
                    <div className="horizontal-bar-item" key={tech.label} style={{ animationDelay: `${index * 50}ms` }} title={`${tech.label}: ${tech.totalActive} Aktiv, ${tech.overdue} Überfällig`}>
                        <span className="horizontal-bar-label clickable" title={tech.label} onClick={() => setReportFilters(f => ({ ...f, technician: tech.label }))}>{tech.label}</span>
                        <div className="horizontal-bar-track">
                            <div
                                className="horizontal-bar-fill"
                                style={{
                                    '--fill-width': `${(tech.totalActive / reportData.maxTechTickets) * 100}%`,
                                    '--bar-color': 'var(--accent-success)'
                                } as React.CSSProperties}
                            ></div>
                        </div>
                        <span className="horizontal-bar-value">{tech.totalActive}</span>
                        <span className="horizontal-bar-value overdue">{tech.overdue}</span>
                    </div>
                )) : <div className="no-data-placeholder">Keine aktiven Tickets zugewiesen.</div>}
                </div>
            </div>

            <div className="chart-container" style={{ marginTop: '1.5rem' }}>
                <div className="chart-header-with-toggle">
                    <h3 className="chart-title">Abgeschlossene Tickets je Techniker {getTimeRangeLabel(reportFilters.timeRange)}</h3>
                </div>
                <div className="horizontal-bar-list">
                {reportData.completedByTechnician.length > 0 ? reportData.completedByTechnician.map((tech, index) => (
                    <div className="horizontal-bar-item-wrapper" key={tech.label} style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="horizontal-bar-item completed-item" >
                            <span className="horizontal-bar-label clickable" title={tech.label} onClick={() => setReportFilters(f => ({ ...f, technician: tech.label }))}>{tech.label}</span>
                            <div className="bar-and-sublabel-wrapper">
                                <div className="horizontal-bar-track">
                                    <div
                                        className="horizontal-bar-fill"
                                        style={{
                                            '--fill-width': `${(tech.value / reportData.maxCompletedTechTickets) * 100}%`,
                                            '--bar-color': 'var(--accent-primary)'
                                        } as React.CSSProperties}
                                    ></div>
                                </div>
                                 <div className="horizontal-bar-sub-label">
                                    Ø Bearbeitungsdauer: {tech.avgResolutionDays} {tech.avgResolutionDays === 1 ? 'Tag' : 'Tage'}
                                </div>
                            </div>
                            <span className="horizontal-bar-value">{tech.value}</span>
                        </div>
                    </div>
                )) : <div className="no-data-placeholder">Bisher keine Aufträge in diesem Zeitraum abgeschlossen.</div>}
                </div>
            </div>
        </div>
    );
};

export default ReportsView;