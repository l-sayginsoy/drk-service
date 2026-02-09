import React, { useState, useEffect } from 'react';
// FIX: Import User type to align with App state
import { Ticket, Status, Priority, Role, User, AppSettings } from '../types';
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
    if (name === 'N/A') return 'Zuweisen';
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
  // FIX: Use the correct User type for currentUser prop
  currentUser: User | null;
  appSettings: AppSettings;
}

const TicketDetailSidebar: React.FC<TicketDetailSidebarProps> = ({ ticket, onClose, onUpdateTicket, technicians, statuses, currentUser, appSettings }) => {
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        // Mark note as read when opening details
        if (ticket.hasNewNoteFromReporter) {
            const timer = setTimeout(() => {
                onUpdateTicket({ ...ticket, hasNewNoteFromReporter: false });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [ticket, onUpdateTicket]);

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
        if (!newNote.trim() || !currentUser) return;

        const date = new Date();
        const formattedDate = date.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric', year: 'numeric' });
        const formattedTime = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        
        // FIX: Use currentUser.name instead of non-existent currentUser.displayName
        const noteTextWithMeta = `${newNote.trim()} (${currentUser.name} am ${formattedDate}, ${formattedTime})`;

        const updatedNotes = [...(ticket.notes || []), noteTextWithMeta];
        const updatedTicket = { ...ticket, notes: updatedNotes };
        onUpdateTicket(updatedTicket);
        setNewNote('');
        
        if (updatedTicket.reporterEmail) {
            console.log(`[E-Mail-Simulation] Sende E-Mail an: ${updatedTicket.reporterEmail}`);
            console.log(`Betreff: Neue Notiz zu Ihrem Ticket ${updatedTicket.id}`);
            console.log(`Nachricht: Es wurde eine neue Notiz zu Ihrem Ticket "${updatedTicket.title}" hinzugefügt:\n"${newNote.trim()}"`);
        }
    };

    const priorityClasses = {
        [Priority.Hoch]: 'priority-high',
        [Priority.Mittel]: 'priority-medium',
        [Priority.Niedrig]: 'priority-low',
    };
    
    const categoryName = appSettings.ticketCategories.find(c => c.id === ticket.categoryId)?.name || 'N/A';

  return (
    <>
      <div className="detail-sidebar-overlay" onClick={onClose}></div>
      <div className="detail-sidebar">
        <style>{`
            .detail-sidebar-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.5); z-index: 100; animation: fadeIn 0.3s ease;
            }
            .detail-sidebar {
                position: fixed; top: 0; right: 0; width: 500px; height: 100%;
                background: var(--bg-secondary); box-shadow: -5px 0 15px rgba(0,0,0,0.1);
                z-index: 101; display: flex; flex-direction: column; animation: slideInRight 0.3s ease;
            }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
            
            /* --- New Compact Layout --- */
            .sidebar-header-compact {
                display: flex; justify-content: space-between; align-items: center;
                padding: 1rem 1.5rem; flex-shrink: 0;
            }
            .sidebar-title-compact {
                font-size: 1.1rem; font-weight: 600; color: var(--text-primary);
            }
            .close-btn {
                background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 0.5rem; margin: -0.5rem;
            }
            .close-btn:hover { color: var(--text-primary); }
            .close-btn svg { width: 24px; height: 24px; }
            
            .sidebar-body-compact {
                flex-grow: 1; overflow-y: auto; padding: 0.5rem 1.5rem 1.5rem;
            }
            .sidebar-body-compact::-webkit-scrollbar { width: 6px; }
            .sidebar-body-compact::-webkit-scrollbar-track { background: transparent; }
            .sidebar-body-compact::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
            [data-theme="dark"] .sidebar-body-compact::-webkit-scrollbar-thumb { background: #555; }
            
            .detail-group { margin-bottom: 1rem; }
            
            .detail-label-compact {
                font-size: 0.75rem; font-weight: 500; color: var(--text-muted); margin-bottom: 0.25rem;
            }
            .detail-subject-text {
                font-size: 1rem; color: var(--text-primary); line-height: 1.4;
            }

            .auftrag-grid {
                display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem 1rem;
            }
            .grid-item-span-2 { grid-column: span 2; }
            
            .detail-value-compact, .editable-field-compact {
                font-size: 0.85rem; font-weight: 500; border-radius: var(--radius-md);
                height: 32px; display: flex; align-items: center; justify-content: flex-start;
                padding: 0 0.75rem;
            }
            .detail-value-compact {
                background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--bg-tertiary);
            }
            
            .editable-field-compact {
                position: relative; background: var(--bg-secondary); border: 1px solid var(--border);
                color: var(--text-primary); justify-content: space-between;
                transition: border-color 0.2s ease, background-color 0.2s ease;
            }
            .editable-field-compact:hover { border-color: var(--border-active); background-color: var(--bg-tertiary); }
            .editable-field-compact select, .editable-field-compact input {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;
            }
            .editable-field-compact.priority-high { background-color: rgba(220, 53, 69, 0.1); color: #c82333; border-color: rgba(220, 53, 69, 0.2); }
            .editable-field-compact.priority-medium { background-color: rgba(255, 193, 7, 0.1); color: #d97706; border-color: rgba(255, 193, 7, 0.2); }
            .editable-field-compact.priority-low { background-color: rgba(25, 135, 84, 0.1); color: var(--accent-success); border-color: rgba(25, 135, 84, 0.2); }

            .description-box-compact {
                margin-top: 1rem; background: var(--bg-tertiary); padding: 0.75rem;
                border-radius: var(--radius-md); font-size: 0.9rem; color: var(--text-primary);
                line-height: 1.6;
            }
            .section-separator {
                border: 0; height: 1px; background-color: var(--border); margin: 1.5rem 0;
            }
            .notes-title-compact {
                font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 1rem;
            }
            .notes-list-compact { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
            .note-item-compact {
                background: var(--bg-tertiary); padding: 0.6rem 0.8rem; border-radius: var(--radius-md);
                font-size: 0.85rem; color: var(--text-primary); line-height: 1.5;
            }
            .note-meta-reformatted {
                display: block; text-align: right; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;
            }
            .note-textarea-compact {
                width: 100%; background: var(--bg-tertiary); border: 1px solid var(--border);
                border-radius: var(--radius-md); padding: 0.6rem 0.8rem; font-size: 0.9rem;
                color: var(--text-primary); line-height: 1.5; margin-bottom: 0.5rem;
                resize: vertical; font-family: inherit;
            }
            .note-textarea-compact:focus { outline: none; border-color: var(--accent-primary); box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1); }
            
            .add-note-btn-compact, .admin-action-btn {
                width: 100%; padding: 0.5rem 1rem; border-radius: var(--radius-md); font-weight: 500;
                font-size: 0.85rem; cursor: pointer;
                border: 1px solid transparent; /* Prevent layout shift */
                transition: var(--transition-smooth);
            }
            .add-note-btn-compact:disabled {
                background-color: var(--bg-tertiary);
                border-color: var(--border);
                color: var(--text-secondary);
                opacity: 0.6;
                cursor: not-allowed;
            }
            .add-note-btn-compact:not(:disabled) {
                background-color: var(--accent-primary);
                border-color: var(--accent-primary);
                color: #fff;
            }
            .add-note-btn-compact:hover:not(:disabled) {
                opacity: 0.9;
            }
            .admin-action-btn {
                background-color: var(--accent-danger);
                color: white;
            }
            .admin-action-btn.is-emergency {
                background-color: var(--bg-tertiary);
                color: var(--text-secondary);
                border-color: var(--border);
            }
            
            .photo-gallery { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
            .photo-thumbnail { width: 60px; height: 60px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); cursor: pointer; }
            .photo-thumbnail img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s ease; }
            .photo-thumbnail:hover img { transform: scale(1.1); }
        `}</style>
        <div className="sidebar-header-compact">
            <h2 className="sidebar-title-compact">Ticket {ticket.id}</h2>
            <button className="close-btn" onClick={onClose}><XIcon /></button>
        </div>
        <div className="sidebar-body-compact">
            
            <div className="detail-group">
                <p className="detail-label-compact">Betreff</p>
                <p className="detail-subject-text">{ticket.title}</p>
            </div>

            {currentUser?.role === Role.Admin && (
              <div className="detail-group">
                <button
                  className={`admin-action-btn ${ticket.is_emergency ? 'is-emergency' : ''}`}
                  onClick={() => onUpdateTicket({ ...ticket, is_emergency: !ticket.is_emergency })}
                >
                  {ticket.is_emergency ? 'Notfall-Markierung aufheben' : 'Als Notfall markieren'}
                </button>
              </div>
            )}

            <div className="auftrag-grid">
                <div className="grid-item">
                    <p className="detail-label-compact">Gemeldet von</p>
                    <p className="detail-value-compact">{ticket.reporter}</p>
                </div>
                <div className="grid-item">
                    <p className="detail-label-compact">Bereich</p>
                    <p className="detail-value-compact">{ticket.area}</p>
                </div>
                <div className="grid-item grid-item-span-2">
                    <p className="detail-label-compact">Ort / Raum</p>
                    <p className="detail-value-compact">{ticket.location}</p>
                </div>
                 <div className="grid-item">
                    <p className="detail-label-compact">Kategorie</p>
                     <div className="editable-field-compact">
                        <span>{categoryName}</span><ChevronDownIcon />
                        <select value={ticket.categoryId} onChange={(e) => handleFieldChange('categoryId', e.target.value)}>
                            {appSettings.ticketCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid-item">
                    <p className="detail-label-compact">Priorität</p>
                    <div className={`editable-field-compact ${priorityClasses[ticket.priority]}`}>
                        <span>{ticket.priority}</span><ChevronDownIcon />
                        <select value={ticket.priority} onChange={(e) => handleFieldChange('priority', e.target.value as Priority)}>
                            {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="grid-item grid-item-span-2">
                    <p className="detail-label-compact">Status</p>
                    <div className="editable-field-compact" style={{ backgroundColor: statusBgColorMap[ticket.status], borderColor: `var(${statusColorMap[ticket.status]})`, color: `var(${statusColorMap[ticket.status]})` }}>
                        <span>{ticket.status}</span><ChevronDownIcon />
                        <select value={ticket.status} onChange={(e) => handleFieldChange('status', e.target.value as Status)}>
                            {statuses.map(s => <option key={s} value={s}>{s === Status.Abgeschlossen ? 'Abschließen' : s}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid-item grid-item-span-2">
                    <p className="detail-label-compact">Techniker</p>
                    <div className={`editable-field-compact`}>
                        <span>{formatTechnicianName(ticket.technician)}</span><ChevronDownIcon />
                        <select value={ticket.technician} onChange={(e) => handleFieldChange('technician', e.target.value)}>
                            {technicians.map(t => <option key={t} value={t}>{t === 'N/A' ? 'Zuweisen' : t}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid-item">
                    <p className="detail-label-compact">Eingang</p>
                    <p className="detail-value-compact">{ticket.entryDate}</p>
                </div>
                <div className="grid-item">
                    <p className="detail-label-compact">Fällig bis</p>
                    <div className="editable-field-compact" style={ticket.status === Status.Ueberfaellig ? { borderColor: `var(${statusColorMap[Status.Ueberfaellig]})`, backgroundColor: statusBgColorMap[Status.Ueberfaellig] } : {}}>
                        <span>{ticket.dueDate}</span>
                        <input type="date" value={toInputDate(ticket.dueDate)} onChange={(e) => handleFieldChange('dueDate', fromInputDate(e.target.value))} />
                    </div>
                </div>
                {ticket.wunschTermin && <div className="grid-item"><p className="detail-label-compact">Wunsch-Termin</p><p className="detail-value-compact">{ticket.wunschTermin}</p></div>}
                {ticket.completionDate && <div className="grid-item"><p className="detail-label-compact">Abgeschlossen am</p><p className="detail-value-compact">{ticket.completionDate}</p></div>}
            </div>

            {ticket.description && ticket.description.trim() && (
                <div className="description-box-compact">{ticket.description}</div>
            )}
             {ticket.photos && ticket.photos.length > 0 && (
                <div className="detail-group" style={{marginTop: '1rem'}}>
                    <p className="detail-label-compact">Fotos</p>
                    <div className="photo-gallery">
                        {ticket.photos.map((photo, index) => (
                            <a key={index} href={photo} target="_blank" rel="noopener noreferrer" className="photo-thumbnail">
                                <img src={photo} alt={`Foto ${index + 1}`} />
                            </a>
                        ))}
                    </div>
                </div>
            )}
            
            <hr className="section-separator" />
            
            <div className="notes-section">
                <h3 className="notes-title-compact">Notizen</h3>
                {ticket.notes && ticket.notes.length > 0 && (
                     <div className="notes-list-compact">
                        {[...ticket.notes].reverse().map((note, index) => (<div className="note-item-compact" key={index}>{formatNote(note)}</div>))}
                     </div>
                )}
                 <div className="new-note-form">
                    <textarea className="note-textarea-compact" rows={2} placeholder="Neue Notiz eingeben..." value={newNote} onChange={(e) => setNewNote(e.target.value)}></textarea>
                    <button className="add-note-btn-compact" onClick={handleAddNote} disabled={!newNote.trim()}>Notiz speichern</button>
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default TicketDetailSidebar;