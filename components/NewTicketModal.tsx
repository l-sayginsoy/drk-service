import React, { useState, useRef } from 'react';
import { Ticket, Priority, User, AppSettings } from '../types';
import { CameraIcon } from './icons/CameraIcon';
import { XIcon } from './icons/XIcon';

interface NewTicketModalProps {
  onClose: () => void;
  onSave: (newTicket: Omit<Ticket, 'id' | 'entryDate' | 'status' | 'priority'> & { priority?: Priority }) => void;
  locations: string[];
  technicians: User[];
  appSettings: AppSettings;
  compressImage: (file: File) => Promise<string>;
}

// Helper function to format date for input type="date" (YYYY-MM-DD)
const getFutureDateString = (days: number): string => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return futureDate.toISOString().split('T')[0];
};

const NewTicketModal: React.FC<NewTicketModalProps> = ({ onClose, onSave, locations, technicians, appSettings, compressImage }) => {
  const [title, setTitle] = useState('');
  const [area, setArea] = useState(locations[0] || '');
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState(appSettings.ticketCategories[0]?.id || '');
  const [reporter, setReporter] = useState('');
  const [dueDate, setDueDate] = useState(getFutureDateString(7)); // Default due date 7 days from now
  const [technician, setTechnician] = useState('N/A');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        if (photos.length >= 3) {
            alert("Maximal 3 Fotos erlaubt."); return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert("Datei ist zu groß."); return;
        }

        try {
            const compressedDataUrl = await compressImage(file);
            if (compressedDataUrl.length > 4 * 1024 * 1024) {
                 alert("Komprimiertes Bild ist zu groß (max 4MB)."); return;
            }
            setPhotos(prev => [...prev, compressedDataUrl]);
        } catch (error) {
            console.error("Fehler bei der Bildkomprimierung:", error);
            alert("Fehler bei der Bildverarbeitung.");
        }
    };
    
    const handleRemovePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || !categoryId) {
        alert('Bitte Titel, Kategorie und Fälligkeitsdatum ausfüllen.');
        return;
    }

    const [year, month, day] = dueDate.split('-');
    const formattedDueDate = `${day}.${month}.${year}`;

    onSave({
      ticketType: 'reactive',
      title,
      area,
      location,
      reporter,
      dueDate: formattedDueDate,
      technician,
      categoryId,
      description,
      photos,
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
                max-height: 90vh;
                display: flex;
                flex-direction: column;
            }
            .modal-content h2 {
                margin-bottom: 1.5rem;
                font-size: 1.5rem;
                color: var(--text-primary);
                flex-shrink: 0;
            }
            .modal-form {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.25rem;
                overflow-y: auto;
                padding-right: 1rem;
                margin-right: -1rem;
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
                flex-shrink: 0;
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

            /* Photo upload styles */
            .photo-upload-area { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; }
            .photo-preview { position: relative; width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); }
            .photo-preview img { width: 100%; height: 100%; object-fit: cover; }
            .remove-photo-btn { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; }
            .remove-photo-btn svg { width: 14px; height: 14px; }
            .photo-buttons { display: flex; flex-direction: column; gap: 0.75rem; }
            .photo-buttons .btn { font-size: 0.85rem; padding: 0.5rem 1rem; }
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
                    {locations.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
            </div>
             <div className="form-group">
                <label htmlFor="location">Ort / Raum</label>
                <input id="location" type="text" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="form-group full-width">
                <label htmlFor="category">Kategorie</label>
                <select id="category" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                    {appSettings.ticketCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
             <div className="form-group">
                <label htmlFor="reporter">Melder</label>
                <input id="reporter" type="text" value={reporter} onChange={e => setReporter(e.target.value)} />
            </div>
            <div className="form-group">
                <label htmlFor="dueDate">Fällig bis (wird ggf. automatisch angepasst)</label>
                <input id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
            </div>
            <div className="form-group full-width">
                <label htmlFor="technician">Techniker (wird ggf. automatisch zugewiesen)</label>
                <select id="technician" value={technician} onChange={e => setTechnician(e.target.value)}>
                    <option value="N/A">Nicht zugewiesen</option>
                    {technicians.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
            </div>
             <div className="form-group full-width">
                <label htmlFor="description">Beschreibung</label>
                <textarea id="description" rows={3} value={description} onChange={e => setDescription(e.target.value)}></textarea>
            </div>
            <div className="form-group full-width">
                <label>Foto hinzufügen</label>
                <div className="photo-upload-area">
                    {photos.map((photo, index) => (
                        <div key={index} className="photo-preview">
                            <img src={photo} alt={`Vorschau ${index + 1}`} />
                            <button type="button" className="remove-photo-btn" onClick={() => handleRemovePhoto(index)}><XIcon /></button>
                        </div>
                    ))}
                    {photos.length < 3 && (
                        <div className="photo-buttons">
                            <button type="button" className="btn btn-secondary" onClick={() => cameraInputRef.current?.click()}>
                                <CameraIcon /> Foto aufnehmen
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                                Aus Galerie wählen
                            </button>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                            <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                        </div>
                    )}
                </div>
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