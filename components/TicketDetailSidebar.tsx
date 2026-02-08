import React, { useState } from 'react';
import { Ticket, Status, Priority } from '../types';
import { XIcon } from './icons/XIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { statusColorMap, statusBgColorMap } from '../constants';


// Helper function to format the note text and style its metadata (can be shared)
const formatNote = (note: string) => {
    const noteRegex = /^(.*)\s\((.*)\s(?:am\s)?(\d{1,2}\.\d{1,2}\.\d{2,4}),?\s(\d{2}:\d{2})(?::\d{2})?\)$/;
    const match = note.match(noteRegex);
    if (match) {
        const [, mainText, user, dateStr, time] = match;
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
    return <span className="note-main-text">{note}</span>;
};

const formatTechnicianName = (name: string) => {
    if (name === 'N/A') return 'Nicht zugewiesen';
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0][0]}. ${parts[parts.length - 1]}`;
    }
    return name;
};

interface TicketDetailSidebarProps {
  ticket: Ticket;
  onClose: () => void;
  onUpdateTicket: (ticket: Ticket) => void;
  technicians: string[];
  statuses: Status[];
}

const TicketDetailSidebar: React.FC<TicketDetailSidebarProps> = ({ ticket, onClose, onUpdateTicket, technicians, statuses }) => {
    const [newNote, setNewNote] = useState('');

    const toInputDate = (dateStr: string | undefined) => {
        if (!dateStr || dateStr === 'N/A') return '';
        const parts = dateStr.split('.');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return '';
    };
    const fromInputDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        const parts = dateStr.split('-');
        if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
        return '';
    };

    const handleFieldChange = (field: keyof Ticket, value: any) => {
        onUpdateTicket({ ...ticket, [field]: value });
    };

     const handleAddNote = () => {
        if (!newNote.trim()) return;

        const date = new Date('2026-02-07');
        const formattedDate = date.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric', year: 'numeric' });
        const formattedTime = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        
        const noteTextWithMeta = `${newNote.trim()} (Admin am ${formattedDate}, ${formattedTime})`;

        const updatedNotes = [...(ticket.notes || []), noteTextWithMeta];
        onUpdateTicket({ ...ticket, notes: updatedNotes });
        setNewNote('');
    };

    const priorityClasses = {
        [Priority.Hoch]: 'priority-high',
        [Priority.Mittel]: 'priority-medium',
        [Priority.Niedrig]: 'priority-low',
    };

  return (
    <>
      <div className="detail-sidebar-overlay" onClick={onClose}></div>
      <div className="detail-sidebar">
        <style>{`
            .detail-sidebar-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 100;
                animation: fadeIn 0.3s ease;
            }
            .detail-sidebar {
                position: fixed;
                top: 0;
                right: 0;
                width: 480px;
                height: 100%;
                background: var(--bg-secondary);
                box-shadow: -5px 0 15px rgba(0,0,0,0.1);
                z-index: 101;
                display: flex;
                flex-direction: column;
                animation: slideInRight 0.3s ease;
            }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }

            .sidebar-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem 1.5rem;
                border-bottom: 1px solid var(--border);
                flex-shrink: 0;
            }
            .sidebar-title {
                font-size: 1.1rem;
                font-weight: 600;
                color: var(--text-primary);
            }
            .sidebar-title span {
                color: var(--text-muted);
                font-weight: 500;
            }
            .close-btn {
                background: none;
                border: none;
                cursor: pointer;
                color: var(--text-muted);
                padding: 0.5rem;
                margin: -0.5rem;
            }
            .close-btn:hover { color: var(--text-primary); }
            .close-btn svg { width: 24px; height: 24px; }
            
            .sidebar-body {
                flex-grow: 1;
                overflow-y: auto;
                padding: 0.5rem 1.5rem 1.5rem;
            }
             .sidebar-body::-webkit-scrollbar { width: 6px; }
             .sidebar-body::-webkit-scrollbar-track { background: var(--bg-tertiary); }
             .sidebar-body::-webkit-scrollbar-thumb { background: var(--border-active); border-radius: 3px; }
             [data-theme="dark"] .sidebar-body::-webkit-scrollbar-thumb { background: #555; }

            .detail-block {
                padding: 1rem 0;
                border-top: 1px solid var(--border);
            }
            .detail-block:first-child {
                padding-top: 0.25rem;
                border-top: none;
            }
             .detail-block:last-child {
                padding-bottom: 0;
            }

            .detail-label {
                font-size: 0.8rem;
                font-weight: 600;
                color: var(--text-secondary);
                margin-bottom: 0.3rem;
            }
            .ticket-main-title {
                font-size: 1.3rem;
                font-weight: 600;
                color: var(--text-primary);
                line-height: 1.3;
            }
            
            .assignment-panel {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 0.5rem;
            }
            
            .description-box, .note-item {
                 background: var(--bg-tertiary);
                 padding: 0.75rem 1rem;
                 border-radius: 8px;
                 font-size: 0.9rem;
                 color: var(--text-primary);
                 line-height: 1.6;
            }
            
            .detail-value, .date-value-field {
                font-size: 0.85rem;
                font-weight: 500;
                color: var(--text-primary);
                background: var(--bg-tertiary);
                padding: 0.4rem 0.75rem;
                border-radius: var(--radius-md);
                border: 1px solid var(--border);
                text-align: center;
            }

            .notes-list {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                margin-top: 1rem;
            }
            
            .note-meta-reformatted {
                display: block;
                text-align: right;
                font-size: 0.8rem;
                font-style: normal;
                color: var(--text-muted);
                margin-top: 0.5rem;
            }
            .photo-gallery {
                display: flex;
                flex-wrap: wrap;
                gap: 0.75rem;
                margin-top: 0.5rem;
            }
            .photo-thumbnail {
                width: 80px;
                height: 80px;
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid var(--border);
                cursor: pointer;
            }
            .photo-thumbnail img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.2s ease;
            }
            .photo-thumbnail:hover img {
                transform: scale(1.1);
            }

             /* Unified Editable fields */
            .editable-field {
                position: relative;
                background: var(--bg-secondary);
                border: 1px solid var(--border);
                border-radius: var(--radius-md);
                padding: 0.4rem 0.75rem;
                font-size: 0.85rem;
                font-weight: 500;
                color: var(--text-primary);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                border-left-width: 4px;
            }
            .editable-field select, .editable-field input {
                position: absolute;
                top: 0; left: 0;
                width: 100%; height: 100%;
                opacity: 0;
                cursor: pointer;
            }
            .editable-field:hover {
                border-color: var(--border-active);
                background-color: var(--bg-tertiary);
            }
            
            .editable-field.priority-high {
                border-left-color: var(--accent-danger);
                background-color: rgba(220, 53, 69, 0.1);
                color: #c82333;
            }
            .editable-field.priority-medium {
                border-left-color: var(--accent-warning);
                background-color: rgba(255, 193, 7, 0.1);
                color: #d97706;
            }
            .editable-field.priority-low {
                border-left-color: var(--accent-success);
                background-color: rgba(25, 135, 84, 0.1);
                color: var(--accent-success);
            }

            .editable-field.priority-high:hover { background-color: rgba(220, 53, 69, 0.2); }
            .editable-field.priority-medium:hover { background-color: rgba(255, 193, 7, 0.2); }
            .editable-field.priority-low:hover { background-color: rgba(25, 135, 84, 0.2); }

            .editable-field.technician-assigned { border-left-color: var(--text-secondary); }
            .editable-field.is-date-field { background-color: var(--bg-tertiary); }
            
            .note-textarea {
                width: 100%; background: var(--bg-tertiary); border: 1px solid var(--border);
                border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.9rem;
                color: var(--text-primary); line-height: 1.6; margin-top: 0.5rem;
                resize: vertical; font-family: inherit;
            }
            .note-textarea:focus { outline: none; border-color: var(--accent-primary); box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1); }
            .add-note-btn { width: 100%; margin-top: 0.75rem; padding: 0.6rem 1.25rem; border-radius: 8px; font-weight: 500; font-size: 0.9rem; cursor: pointer; border: 1px solid transparent; background-color: var(--accent-primary); border-color: var(--accent-primary); color: white; transition: var(--transition-smooth); }
            .add-note-btn:hover:not(:disabled) { opacity: 0.9; }
            .add-note-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            .wish-date-field { color: var(--text-primary); border-left: 4px solid var(--accent-warning); }

            @media (max-width: 768px) {
                .detail-sidebar { width: 90%; }
                .assignment-panel { grid-template-columns: 1fr; }
            }
        `}</style>
        <div className="sidebar-header">
            <h2 className="sidebar-title"><span>Ticket:</span> {ticket.id}</h2>
            <button className="close-btn" onClick={onClose}><XIcon /></button>
        </div>
        <div className="sidebar-body">
            <div className="detail-block">
                <p className="detail-label">Betreff</p>
                <h3 className="ticket-main-title">{ticket.title}</h3>
            </div>
            <div className="detail-block">
                 <div className="assignment-panel" style={{ marginBottom: '1rem' }}>
                    <div> <p className="detail-label">Gemeldet von</p> <p className="detail-value">{ticket.reporter}</p> </div>
                    <div> <p className="detail-label">Bereich</p> <p className="detail-value">{ticket.area}</p> </div>
                    <div> <p className="detail-label">Ort / Raum</p> <p className="detail-value">{ticket.location}</p> </div>
                </div>
                <div className="assignment-panel" style={{ marginBottom: '1rem' }}>
                    <div>
                        <p className="detail-label">Status</p>
                         <div className="editable-field" style={{ borderLeftColor: `var(${statusColorMap[ticket.status]})`, backgroundColor: statusBgColorMap[ticket.status], color: `var(${statusColorMap[ticket.status]})` }}>
                            <span>{ticket.status}</span><ChevronDownIcon />
                            <select value={ticket.status} onChange={(e) => handleFieldChange('status', e.target.value as Status)}>
                                {statuses.map(s => <option key={s} value={s}>{s === Status.Abgeschlossen ? 'Abschließen' : s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <p className="detail-label">Priorität</p>
                        <div className={`editable-field ${priorityClasses[ticket.priority]}`}>
                            <span>{ticket.priority}</span><ChevronDownIcon />
                            <select value={ticket.priority} onChange={(e) => handleFieldChange('priority', e.target.value as Priority)}>
                                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <p className="detail-label">Techniker</p>
                        <div className={`editable-field ${ticket.technician !== 'N/A' ? 'technician-assigned' : ''}`}>
                            <span>{formatTechnicianName(ticket.technician)}</span><ChevronDownIcon />
                            <select value={ticket.technician} onChange={(e) => handleFieldChange('technician', e.target.value)}>
                                {technicians.map(t => <option key={t} value={t}>{t === 'N/A' ? 'Nicht zugewiesen' : t}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="assignment-panel">
                     <div> <p className="detail-label">Eingang</p> <p className="date-value-field">{ticket.entryDate}</p> </div>
                     {ticket.wunschTermin && <div><p className="detail-label">Wunsch Termin</p><p className="date-value-field wish-date-field">{ticket.wunschTermin}</p></div>}
                    <div>
                        <p className="detail-label">Fällig bis</p>
                         <div className="editable-field is-date-field" style={ticket.status === Status.Ueberfaellig ? { borderLeftColor: `var(${statusColorMap[Status.Ueberfaellig]})`, backgroundColor: statusBgColorMap[Status.Ueberfaellig] } : {}}>
                            <span>{ticket.dueDate}</span>
                            <input type="date" value={toInputDate(ticket.dueDate)} onChange={(e) => handleFieldChange('dueDate', fromInputDate(e.target.value))} />
                        </div>
                    </div>
                    {ticket.completionDate && <div><p className="detail-label">Abgeschlossen am</p><p className="date-value-field">{ticket.completionDate}</p></div>}
                </div>
            </div>
            {ticket.photos && ticket.photos.length > 0 && (
                <div className="detail-block">
                    <p className="detail-label">Fotos</p>
                    <div className="photo-gallery">
                        {ticket.photos.map((photo, index) => (
                            <a key={index} href={photo} target="_blank" rel="noopener noreferrer" className="photo-thumbnail">
                                <img src={photo} alt={`Foto ${index + 1}`} />
                            </a>
                        ))}
                    </div>
                </div>
            )}
            <div className="detail-block">
                 {ticket.description && ticket.description.trim() && (<><p className="detail-label">Beschreibung</p><div className="description-box">{ticket.description}</div></>)}
                {ticket.notes && ticket.notes.length > 0 && (
                     <div className="notes-list"><p className="detail-label">Notizen</p>{[...ticket.notes].reverse().map((note, index) => (<div className="note-item" key={index}>{formatNote(note)}</div>))}</div>
                )}
            </div>
            <div className="detail-block">
                <p className="detail-label">Neue Notiz hinzufügen</p>
                <textarea className="note-textarea" rows={3} placeholder="Hier Notiz eingeben..." value={newNote} onChange={(e) => setNewNote(e.target.value)}></textarea>
                <button className="add-note-btn" onClick={handleAddNote} disabled={!newNote.trim()}>Notiz speichern</button>
            </div>
        </div>
      </div>
    </>
  );
};

export default TicketDetailSidebar;