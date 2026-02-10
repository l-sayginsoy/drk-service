import React from 'react';
import { Ticket, Priority, Status } from '../types';
import { TECHNICIANS_DATA, statusColorMap } from '../constants';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { CheckIcon } from './icons/CheckIcon';

interface TicketCardProps {
  ticket: Ticket;
  onUpdateTicket: (ticket: Ticket) => void;
  onSelectTicket: (ticket: Ticket) => void;
  selectedTicket: Ticket | null;
}

const ExclamationTriangleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="16" height="16">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
);

const formatTechnicianName = (name: string) => {
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0][0]}. ${parts[parts.length - 1]}`;
    }
    return name;
};

// Helper function to format the note text and style its metadata
const formatNote = (note: string) => {
    // Regex to capture: 1. Main text, 2. User, 3. Date, 4. Time
    const noteRegex = /^(.*)\s\((.*)\s(?:am\s)?(\d{1,2}\.[\d]{1,2}\.[\d]{2,4}),?\s(\d{2}:\d{2})(?::\d{2})?\)$/;
    const match = note.match(noteRegex);

    if (match) {
        const mainText = match[1];
        const user = match[2];
        const dateStr = match[3];
        const time = match[4];

        const [day, month, year] = dateStr.split('.');
        const formattedDate = `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year.slice(-2)}`;
        
        const metaText = `(${user} ${formattedDate} ${time})`;

        return (
            <>
                <span className="note-main-text">{mainText}</span>
                <span className="note-meta-reformatted">{metaText}</span>
            </>
        );
    }
    // Fallback for notes without metadata structure
    return <span className="note-main-text">{note}</span>;
};


const TicketCard: React.FC<TicketCardProps> = ({ ticket, onUpdateTicket, onSelectTicket, selectedTicket }) => {

    const priorityClasses = {
        [Priority.Hoch]: 'priority-high',
        [Priority.Mittel]: 'priority-medium',
        [Priority.Niedrig]: 'priority-low',
    };

    // Helper to convert DD.MM.YYYY to YYYY-MM-DD for date input
    const toInputDate = (dateStr: string) => {
        const parts = dateStr.split('.');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return '';
    };

    // Helper to convert YYYY-MM-DD from input to DD.MM.YYYY
    const fromInputDate = (dateStr: string) => {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}.${parts[1]}.${parts[0]}`;
        }
        return '';
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData("ticketId", ticket.id);
        e.currentTarget.classList.add('dragging');
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('dragging');
    };
    
    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdateTicket({ ...ticket, status: e.target.value as Status });
    };

    const handleTechnicianSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdateTicket({ ...ticket, technician: e.target.value });
    };

    const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdateTicket({ ...ticket, priority: e.target.value as Priority });
    };
    
    const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateTicket({ ...ticket, dueDate: fromInputDate(e.target.value) });
    };

    const technicianOptions = ['N/A', ...TECHNICIANS_DATA.map(t => t.name)];
    
    const isEmergency = !!ticket.is_emergency;

    const Dropdown: React.FC<{ 
        options: string[], 
        selected: string, 
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
        className?: string
    }> = ({ options, selected, onChange, className = '' }) => (
        <div className={`custom-dropdown ${className}`} onClick={e => e.stopPropagation()}>
            <span>{selected}</span> <ChevronDownIcon />
            <select value={selected} onChange={onChange}>
                {options.map(opt => <option key={opt} value={opt}>{opt === Status.Abgeschlossen ? 'Abschließen' : opt}</option>)}
            </select>
        </div>
    );

    const cardClasses = `ticket-card ${selectedTicket?.id === ticket.id ? 'selected' : ''} ${ticket.status === Status.Abgeschlossen ? 'status-done' : ''} ${isEmergency ? 'urgent-alert' : ''}`;

    return (
        <div 
            className={cardClasses}
            style={{ borderLeftColor: `var(${statusColorMap[ticket.status]})` }}
            draggable="true"
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <style>{`
                @keyframes pulse-border {
                    0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.8); }
                    70% { box-shadow: 0 0 0 8px rgba(220, 53, 69, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
                }
                .ticket-card {
                    background: var(--bg-secondary);
                    border-radius: var(--radius-md);
                    margin-bottom: 1.5rem;
                    box-shadow: var(--shadow-md);
                    border-left: 5px solid transparent;
                    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, background-color 0.2s ease-in-out;
                    padding: 1rem 1.25rem;
                    position: relative;
                }
                .ticket-card.urgent-alert {
                    animation: pulse-border 1.5s infinite;
                    border-color: var(--accent-danger) !important;
                }
                .ticket-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-lg);
                }
                .ticket-card.dragging {
                    opacity: 0.5;
                    transform: rotate(3deg);
                }
                .ticket-card.selected {
                    background-color: var(--border);
                    box-shadow: 0 0 0 2px var(--accent-primary), var(--shadow-lg);
                }
                .ticket-card.status-done { 
                    opacity: 0.8; 
                }
                
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 1rem;
                    margin-bottom: 0.5rem;
                }
                .card-id {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    background: var(--bg-tertiary);
                    padding: 0.1rem 0.5rem;
                    border-radius: var(--radius-sm);
                    flex-shrink: 0;
                    margin-top: 0.2rem;
                }
                .card-title { font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem; flex-grow: 1;}
                .card-location { font-size: 0.9rem; color: var(--text-secondary); font-weight: 500; }
                .card-location span { font-weight: normal; color: var(--text-muted); }
                .card-meta { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem; }
                
                .card-header-indicator {
                    margin-top: 0.5rem;
                }
                .urgent-icon { color: var(--accent-danger); margin-left: -0.25rem; }
                
                .card-actions-grid {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 0.75rem;
                    margin-top: 1rem;
                }
                .action-item {
                    font-size: 0.8rem;
                    position: relative; /* For dropdown positioning */
                }
                .action-label {
                    color: var(--text-muted);
                    margin-bottom: 0.25rem;
                    font-size: 0.75rem;
                    text-align: center;
                }
                .action-value-box, .details-btn, .custom-dropdown, .date-input-wrapper {
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    padding: 0.25rem 0.75rem;
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: var(--text-secondary);
                    width: 100%;
                    text-align: center;
                    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
                    height: 29px; /* fixed height */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .action-value-box.priority-high {
                    background-color: rgba(220, 53, 69, 0.1); color: #c82333; border-color: rgba(220, 53, 69, 0.3); font-weight: 600;
                }
                .action-value-box.emergency {
                    background-color: var(--accent-danger);
                    color: white;
                    border-color: var(--accent-danger);
                    font-weight: 600;
                }
                .date-input-wrapper {
                    position: relative;
                }
                .date-input-wrapper input[type="date"] {
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    opacity: 0;
                    cursor: pointer;
                }
                 .date-input-wrapper input[type="date"]::-webkit-calendar-picker-indicator {
                    width: 100%; height: 100%;
                    cursor: pointer;
                }

                .custom-dropdown {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.25rem;
                    position: relative;
                    cursor: pointer;
                }
                .custom-dropdown.priority-high { background-color: rgba(220, 53, 69, 0.1); color: #c82333; border-color: rgba(220, 53, 69, 0.3); font-weight: 600; }
                .custom-dropdown.priority-medium { background-color: rgba(255, 193, 7, 0.1); color: #d97706; border-color: rgba(255, 193, 7, 0.3); font-weight: 600; }
                .custom-dropdown.priority-low { background-color: rgba(25, 135, 84, 0.1); color: var(--accent-success); border-color: rgba(25, 135, 84, 0.3); font-weight: 600; }

                .custom-dropdown span {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .custom-dropdown select {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;
                }
                .custom-dropdown svg { width: 14px; height: 14px; flex-shrink: 0; }
                
                .details-btn {
                    cursor: pointer;
                    color: var(--text-muted);
                }
                .details-btn:hover, .custom-dropdown:hover, .date-input-wrapper:hover {
                    background: var(--border);
                    border-color: var(--accent-primary);
                    color: var(--text-primary);
                    box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.1);
                }
                .custom-dropdown.priority-high:hover { background-color: rgba(220, 53, 69, 0.2); }
                .custom-dropdown.priority-medium:hover { background-color: rgba(255, 193, 7, 0.2); }
                .custom-dropdown.priority-low:hover { background-color: rgba(25, 135, 84, 0.2); }
            `}</style>
            
            <div className="card-header">
                {isEmergency && <span className="urgent-icon" title="Notfall"><ExclamationTriangleIcon /></span>}
                <h3 className="card-title">{ticket.title}</h3>
                {ticket.hasNewNoteFromReporter && <span className="new-note-indicator card-header-indicator" title="Neue Notiz vom Melder"></span>}
            </div>
            <p className="card-location">{ticket.area} <span>›</span> {ticket.location}</p>
            <p className="card-meta">Gemeldet: {ticket.reporter}</p>

            <div className="card-actions-grid">
                <div className="action-item">
                    <div className="action-label">Eingang</div>
                    <div className="action-value-box">{ticket.entryDate}</div>
                </div>
                <div className="action-item">
                    <div className="action-label">Fällig bis</div>
                    <div className="date-input-wrapper">
                        <span>{ticket.dueDate}</span>
                        <input 
                            type="date" 
                            value={toInputDate(ticket.dueDate)}
                            onChange={handleDueDateChange}
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                </div>
                <div className="action-item">
                    <div className="action-label">Priorität</div>
                     {isEmergency ? (
                        <div className="action-value-box emergency">Notfall</div>
                    ) : (
                        <Dropdown options={Object.values(Priority)} selected={ticket.priority} onChange={handlePriorityChange} className={priorityClasses[ticket.priority]} />
                    )}
                </div>
                <div className="action-item">
                    <div className="action-label">Status</div>
                    <Dropdown 
                        options={Object.values(Status).filter(s => s !== Status.Ueberfaellig)} 
                        selected={ticket.status} 
                        onChange={handleStatusChange} 
                    />
                </div>
                 <div className="action-item">
                    <div className="action-label">Haustechniker</div>
                    <div className="custom-dropdown">
                        <span>{ticket.technician === 'N/A' ? 'Zuweisen' : formatTechnicianName(ticket.technician)}</span> <ChevronDownIcon />
                        <select value={ticket.technician} onChange={handleTechnicianSelectChange}>
                             {technicianOptions.map(opt => <option key={opt} value={opt}>{opt === 'N/A' ? 'Nicht zugewiesen' : opt}</option>)}
                        </select>
                    </div>
                </div>
                <div className="action-item">
                    <div className="action-label">Ticket</div>
                    <button className="details-btn" onClick={() => onSelectTicket(ticket)}>
                        {ticket.id}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TicketCard;