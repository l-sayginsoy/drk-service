import React from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { PlusIcon } from './icons/PlusIcon';
import { Status } from '../types';

interface HeaderProps {
    stats: {
        open: number;
        inProgress: number;
        overdue: number;
    };
    filters: { search: string, status: string };
    setFilters: React.Dispatch<React.SetStateAction<any>>;
    onNewTicketClick: () => void;
    currentView: string;
}

const Header: React.FC<HeaderProps> = ({ stats, filters, setFilters, onNewTicketClick, currentView }) => {
    
    const getPageTitle = () => {
        switch (currentView) {
            case 'dashboard': return 'Dashboard';
            case 'tickets': return 'Aktuelle Tickets';
            case 'erledigt': return 'Abgeschlossen';
            case 'reports': return 'Reports';
            default: return 'Dashboard';
        }
    }
    const pageTitle = getPageTitle();

    const handleStatClick = (status: Status) => {
        setFilters((prev: any) => ({
            ...prev,
            status: prev.status === status ? 'Alle' : status,
        }));
    };

    return (
        <header className="main-header">
            <style>{`
                .main-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 1.5rem;
                }
                 .header-left {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .header-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                }
                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }
                .stat-group {
                    display: flex;
                    gap: 1.5rem;
                    border-right: 1px solid var(--border);
                    padding-right: 1.5rem;
                }
                .stat-item {
                    display: flex;
                    align-items: baseline;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
                    border: 1px solid transparent;
                }
                .stat-item:hover {
                    background-color: var(--bg-tertiary);
                }
                .stat-item.active {
                    background-color: var(--bg-secondary);
                    border-color: var(--border-active);
                    box-shadow: var(--shadow-sm);
                }
                .stat-item.active .stat-value,
                .stat-item.active .stat-label {
                    color: var(--text-primary);
                }
                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 600;
                }
                .stat-label {
                    font-size: 0.9rem;
                    color: var(--text-muted);
                }
                .search-container {
                    position: relative;
                }
                .search-input {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    padding: 0.6rem 1rem 0.6rem 2.5rem;
                    min-width: 250px;
                    transition: var(--transition-smooth);
                }
                .search-input:focus {
                    outline: none;
                    border-color: var(--accent-primary);
                    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
                }
                .search-icon {
                    position: absolute;
                    left: 0.8rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-muted);
                }
                .search-icon svg { width: 18px; height: 18px; }
                
                .btn {
                    padding: 0.6rem 1.25rem;
                    border-radius: 8px;
                    font-weight: 500;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: var(--transition-smooth);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    border: 1px solid transparent;
                }
                .btn-primary {
                    background-color: var(--accent-primary);
                    border-color: var(--accent-primary);
                    color: #fff;
                }
                .btn-primary:hover {
                     opacity: 0.9;
                }
                 .btn-secondary {
                    background-color: var(--bg-tertiary);
                    border-color: var(--border);
                    color: var(--text-secondary);
                }
                .btn-secondary:hover {
                    background-color: var(--border);
                }
                .btn-abmelden {
                    background: transparent;
                    border-color: var(--accent-danger);
                    color: var(--accent-danger);
                }
                .btn-abmelden:hover {
                    background: rgba(220, 53, 69, 0.1);
                }
                
                @media (max-width: 1024px) {
                    .main-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }
                    .header-actions {
                        width: 100%;
                        justify-content: space-between;
                    }
                }
                @media (max-width: 768px) {
                    .header-left { margin-bottom: 0.5rem; }
                    .header-actions {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 1rem;
                    }
                    .stat-group {
                        padding-right: 0;
                        border-right: none;
                        width: 100%;
                        justify-content: space-around;
                        gap: 0.5rem;
                    }
                    .search-container { width: 100%; }
                    .search-input { width: 100%; }
                    .btn-primary { justify-content: center; }
                }

            `}</style>
            <div className="header-left">
                <h1 className="header-title">{pageTitle}</h1>
            </div>
            <div className="header-actions">
                {currentView === 'dashboard' ? (
                     <div className="stat-group">
                        <div
                            className={`stat-item ${filters.status === Status.Offen ? 'active' : ''}`}
                            onClick={() => handleStatClick(Status.Offen)}
                            role="button"
                            tabIndex={0}
                        >
                            <span className="stat-value">{stats.open}</span>
                            <span className="stat-label">Offen</span>
                        </div>
                        <div
                            className={`stat-item ${filters.status === Status.InArbeit ? 'active' : ''}`}
                            onClick={() => handleStatClick(Status.InArbeit)}
                            role="button"
                            tabIndex={0}
                        >
                            <span className="stat-value">{stats.inProgress}</span>
                            <span className="stat-label">In Arbeit</span>
                        </div>
                         <div
                            className={`stat-item ${filters.status === Status.Ueberfaellig ? 'active' : ''}`}
                            onClick={() => handleStatClick(Status.Ueberfaellig)}
                            role="button"
                            tabIndex={0}
                         >
                            <span className="stat-value">{stats.overdue}</span>
                            <span className="stat-label">Überfällig</span>
                        </div>
                    </div>
                ) : currentView !== 'reports' ? (
                    <div className="search-container">
                         <span className="search-icon"><SearchIcon /></span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Tickets durchsuchen..."
                            value={filters.search}
                            onChange={(e) => setFilters((prev: any) => ({ ...prev, search: e.target.value }))}
                        />
                    </div>
                ) : null}
                
                <button className="btn btn-primary" onClick={onNewTicketClick}>
                    <PlusIcon />
                    Neues Ticket
                </button>
            </div>
        </header>
    );
};

export default Header;