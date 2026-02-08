import React from 'react';
import { PRIORITIES } from '../constants';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { DocumentArrowDownIcon } from './icons/DocumentArrowDownIcon';
import { Role, GroupableKey, Ticket } from '../types';
import { DocumentIcon } from './icons/DocumentIcon'; // Assuming you have a generic document icon

interface FilterBarProps {
    filters: any;
    setFilters: React.Dispatch<React.SetStateAction<any>>;
    areas: string[];
    technicians: string[];
    statuses: string[];
    showStatusFilter: boolean;
    showGroupBy: boolean;
    onExportCSV: () => void;
    onExportPDF: () => void;
    userRole: Role | null;
    groupBy: GroupableKey | 'none';
    setGroupBy: (value: GroupableKey | 'none') => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, areas, technicians, statuses, showStatusFilter, showGroupBy, onExportCSV, onExportPDF, userRole, groupBy, setGroupBy }) => {
    
    const handleFilterChange = (filterName: string, value: string) => {
        setFilters((prev: any) => ({ ...prev, [filterName]: value }));
    }

    const resetFilters = () => {
        setFilters({
            area: 'Alle',
            technician: userRole === Role.Technician ? filters.technician : 'Alle',
            priority: 'Alle',
            status: 'Alle',
            search: filters.search,
        });
        setGroupBy('none');
    }
    
    const groupByOptions = [
        { value: 'none', label: 'Keine' },
        { value: 'status', label: 'Status' },
        { value: 'technician', label: 'Techniker' },
        { value: 'priority', label: 'Priorität' },
        { value: 'area', label: 'Bereich' },
    ];

    const FilterDropdown: React.FC<{label: string, name: string, options: string[], value: string, disabled?: boolean}> = ({label, name, options, value, disabled = false}) => {
        const getDisplayValue = (val: string) => {
            if (name === 'technician' && val === 'N/A') {
                return 'Nicht zugewiesen';
            }
            return val;
        };

        return (
            <div className={`custom-select ${disabled ? 'disabled' : ''}`}>
                <span>{label}: {getDisplayValue(value)}</span>
                <select value={value} onChange={(e) => handleFilterChange(name, e.target.value)} disabled={disabled}>
                    {options.map(opt => <option key={opt} value={opt}>{getDisplayValue(opt)}</option>)}
                </select>
                <ChevronDownIcon />
            </div>
        );
    };

    return (
        <div className="filter-bar">
            <style>{`
                .filter-bar { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 1rem 1.5rem; display: flex; align-items: center; gap: 1rem; transition: var(--transition-smooth); flex-wrap: wrap; }
                .filter-controls { display: flex; gap: 1rem; flex-wrap: wrap; flex-grow: 1; align-items: center; }
                .custom-select { position: relative; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 6px; padding: 0.5rem 2rem 0.5rem 0.75rem; font-size: 0.9rem; min-width: 150px; cursor: pointer; color: var(--text-secondary); }
                .custom-select.group-by-select { background-color: color-mix(in srgb, var(--accent-primary) 8%, var(--bg-tertiary)); border-color: color-mix(in srgb, var(--accent-primary) 20%, var(--border)); font-weight: 500; }
                .custom-select.disabled { cursor: not-allowed; background-color: var(--bg-primary); color: var(--text-muted); opacity: 0.8; }
                .custom-select.disabled select { pointer-events: none; }
                .custom-select span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .custom-select select { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
                .custom-select svg { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); pointer-events: none; width: 16px; height: 16px; color: var(--text-muted); }
                .filter-actions { margin-left: auto; display: flex; gap: 1rem; flex-shrink: 0; }
                .action-btn { background: transparent; border: 1px solid var(--border); color: var(--text-secondary); font-size: 0.9rem; padding: 0.5rem 1rem; border-radius: 6px; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: var(--transition-smooth); }
                .action-btn:hover { background: var(--bg-tertiary); }
                .action-btn svg { width: 16px; height: 16px; }
                .divider { width: 1px; height: 24px; background-color: var(--border); margin: 0 0.5rem; }
            `}</style>
            <div className="filter-controls">
                <FilterDropdown label="Bereich" name="area" options={areas} value={filters.area} />
                <FilterDropdown label="Haustechniker" name="technician" options={technicians} value={filters.technician} disabled={userRole === Role.Technician} />
                <FilterDropdown label="Priorität" name="priority" options={PRIORITIES} value={filters.priority} />
                {showStatusFilter && <FilterDropdown label="Status" name="status" options={statuses} value={filters.status} />}
                {showGroupBy && (
                    <>
                        <div className="divider" />
                        <div className="custom-select group-by-select">
                            <span>Gruppieren: {groupByOptions.find(o => o.value === groupBy)?.label || 'Keine'}</span>
                            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupableKey | 'none')}>
                                {groupByOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <ChevronDownIcon />
                        </div>
                    </>
                )}
            </div>
            <div className="filter-actions">
                 <button className="action-btn" onClick={onExportPDF}>
                    <DocumentIcon />
                    PDF Export
                </button>
                 <button className="action-btn" onClick={onExportCSV}>
                    <DocumentArrowDownIcon />
                    CSV Export
                </button>
                <button className="action-btn" onClick={resetFilters}>
                    <RefreshIcon />
                    Zurücksetzen
                </button>
            </div>
        </div>
    );
};

export default FilterBar;