import React, { useState } from 'react';
// FIX: Import User type and remove TECHNICIANS_DATA import.
import { Ticket, Priority, User } from '../types';

interface NewTicketModalProps {
  onClose: () => void;
  onSave: (newTicket: Omit<Ticket, 'id' | 'entryDate' | 'status'>) => void;
  areas: string[];
  // FIX: Add technicians prop to the interface
  technicians: User[];
}

// Helper function to format date for input type="date" (YYYY-MM-DD)
const getFutureDateString = (days: number): string => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return futureDate.toISOString().split('T')[0];
};

const NewTicketModal: React.FC<NewTicketModalProps> = ({ onClose, onSave, areas, technicians }) => {
  const [title, setTitle] = useState('');
  const [area, setArea] = useState(areas[0] || '');
  const [location, setLocation] = useState('');
  const [reporter, setReporter] = useState('');
  const [dueDate, setDueDate] = useState(getFutureDateString(7)); // Default due date 7 days from now
  // FIX: Use technicians prop for initial state.
  const [technician, setTechnician] = useState(technicians[0]?.name || '');
  const [priority, setPriority] = useState<Priority>(Priority.Mittel);
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) {
        alert('Bitte Titel und Fälligkeitsdatum ausfüllen.');
        return;
    }

    // Convert YYYY-MM-DD from date input to DD.MM.YYYY for app consistency
    const [year, month, day] = dueDate.split('-');
    const formattedDueDate = `${day}.${month}.${year}`;

    onSave({
      title,
      area,
      location,
      reporter,
      dueDate: formattedDueDate,
      technician,
      priority,
      description,
      notes: [],
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
        <style>{`
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            .modal-content {
                background: var(--bg-secondary);
                padding: 2rem;
                border-radius: 12px;
                box-shadow: var(--shadow-lg);
                width: 90%;
                max-width: 600px;
                z-index: 1001;
            }
            .modal-content h2 {
                margin-bottom: 1.5rem;
                font-size: 1.5rem;
                color: var(--text-primary);
            }
            .modal-form {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.25rem;
            }
            .form-group {
                display: flex;
                flex-direction: column;
            }
            .form-group.full-width {
                grid-column: 1 / -1;
            }
            .form-group label {
                margin-bottom: 0.5rem;
                font-size: 0.9rem;
                font-weight: 500;
                color: var(--text-secondary);
            }
            .form-group input,
            .form-group select,
            .form-group textarea {
                width: 100%;
                padding: 0.75rem;
                border-radius: 8px;
                border: 1px solid var(--border);
                background: var(--bg-primary);
                font-size: 0.95rem;
                color: var(--text-primary);
                transition: var(--transition-smooth);
            }
            .form-group input:focus,
            .form-group select:focus,
            .form-group textarea:focus {
                outline: none;
                border-color: var(--accent-primary);
                box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
            }
            .form-actions {
                grid-column: 1 / -1;
                display: flex;
                justify-content: flex-end;
                gap: 1rem;
                margin-top: 1.5rem;
            }
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
            .btn-secondary {
                background-color: var(--bg-tertiary);
                border-color: var(--border);
                color: var(--text-secondary);
            }
            .btn-secondary:hover {
                background-color: var(--border);
                color: var(--text-primary);
            }
            .btn-primary {
                background-color: var(--accent-primary);
                border-color: var(--accent-primary);
                color: white;
            }
            .btn-primary:hover { opacity: 0.9; }
        `}</style>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Neues Ticket</h2>
        <form className="modal-form" onSubmit={handleSubmit}>
            <div className="form-group full-width">
                <label htmlFor="title">Titel</label>
                <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
                <label htmlFor="area">Bereich</label>
                <select id="area" value={area} onChange={e => setArea(e.target.value)}>
                    {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
            </div>
             <div className="form-group">
                <label htmlFor="location">Ort / Raum</label>
                <input id="location" type="text" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="form-group">
                <label htmlFor="reporter">Melder</label>
                <input id="reporter" type="text" value={reporter} onChange={e => setReporter(e.target.value)} />
            </div>
            <div className="form-group">
                <label htmlFor="dueDate">Fällig bis</label>
                <input id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
            </div>
            <div className="form-group">
                <label htmlFor="technician">Techniker</label>
                <select id="technician" value={technician} onChange={e => setTechnician(e.target.value)}>
                    {/* FIX: Use technicians prop */}
                    {technicians.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="priority">Priorität</label>
                <select id="priority" value={priority} onChange={e => setPriority(e.target.value as Priority)}>
                    {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
             <div className="form-group full-width">
                <label htmlFor="description">Beschreibung</label>
                <textarea id="description" rows={4} value={description} onChange={e => setDescription(e.target.value)}></textarea>
            </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">Abbrechen</button>
            <button type="submit" className="btn btn-primary">Ticket speichern</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTicketModal;