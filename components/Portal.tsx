import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Ticket, Priority, Role, User, AppSettings } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { SearchIcon } from './icons/SearchIcon';
import { UserIcon } from './icons/UserIcon';
// FIX: Correctly import TECHNICIANS_DATA
import { TECHNICIANS_DATA } from '../constants';
import { CameraIcon } from './icons/CameraIcon';
import { XIcon } from './icons/XIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { KeyIcon } from './icons/KeyIcon';
import { CheckBadgeIcon } from './icons/CheckBadgeIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';

const LOCAL_STORAGE_KEY = 'facility-management-tickets';
const DRAFT_STORAGE_KEY = 'facility-management-ticket-draft';

type PortalView = 'menu' | 'erfassen' | 'pruefen' | 'status-result' | 'success' | 'techniker-login' | 'admin-login';

interface PortalProps {
  appSettings: AppSettings;
  onLogin: (user: User) => void;
  tickets: Ticket[];
  locations: string[];
  onAddTicket: (newTicket: Omit<Ticket, 'id' | 'entryDate' | 'status' | 'priority'> & { priority?: Priority }) => string;
  onUpdateTicket: (ticket: Ticket) => void;
  users: User[];
}

const formatNote = (note: string) => {
    const noteRegex = /^(.*)\s\((.*)\s(?:am\s)?(\d{1,2}\.\d{1,2}\.\d{2,4}),?\s(\d{2}:\d{2})(?::\d{2})?\)$/;
    const match = note.match(noteRegex);
    if (match) {
        const [, mainText, user, dateStr, time] = match;
        const [day, month, year] = dateStr.split('.');
        const formattedDate = `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year.slice(-2)}`;
        const metaText = `(${user} ${formattedDate} ${time})`;
        return <><span className="note-main-text">{mainText}</span><span className="note-meta">{metaText}</span></>;
    }
    return <span className="note-main-text">{note}</span>;
};

const getSuggestedDueDate = (priority: Priority, rules: Record<Priority, number>): string => {
    const date = new Date();
    const daysToAdd = rules[priority] || 7; // Default to 7 days if rule not found
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split('T')[0];
};

const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_LONG_EDGE = 1600;
                let { width, height } = img;
                if (width > height) {
                    if (width > MAX_LONG_EDGE) {
                        height *= MAX_LONG_EDGE / width;
                        width = MAX_LONG_EDGE;
                    }
                } else {
                    if (height > MAX_LONG_EDGE) {
                        width *= MAX_LONG_EDGE / height;
                        height = MAX_LONG_EDGE;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Canvas context not available'));
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.75));
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};

const NewTicketForm: React.FC<{
    locations: string[];
    onAddTicket: (newTicket: Omit<Ticket, 'id' | 'entryDate' | 'status' | 'priority'> & { priority?: Priority }) => string;
    setView: (view: PortalView) => void;
    setNewlyCreatedTicketId: (id: string) => void;
    appSettings: AppSettings;
}> = ({ locations, onAddTicket, setView, setNewlyCreatedTicketId, appSettings }) => {
    const [formState, setFormState] = useState(() => {
        try {
            const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (savedDraft) {
                const draft = JSON.parse(savedDraft);
                return draft;
            }
        } catch (e) { console.error("Could not load draft", e); }
        
        return {
            reporter: '', area: locations[0] || '', location: '', title: '',
            description: '', wunschTermin: '',
            reporterEmail: '', photos: [] as string[],
            categoryId: appSettings.ticketCategories[0]?.id || ''
        };
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formState));
    }, [formState]);

    const photoRules = useMemo(() => {
        const recommended = ['Wäscherei', 'Küche', 'Haustechnik'];
        const required = ['Brandschutz', 'Sicherheit'];
        if (required.includes(formState.area)) return { mode: 'required', text: 'Foto ist für diesen Bereich erforderlich.' };
        if (recommended.includes(formState.area)) return { mode: 'recommended', text: 'Foto wird für diesen Bereich empfohlen.' };
        return { mode: 'optional', text: '' };
    }, [formState.area]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formState.area) newErrors.area = 'Bereich ist ein Pflichtfeld.';
        if (!formState.categoryId) newErrors.categoryId = 'Kategorie ist ein Pflichtfeld.';
        if (formState.title.length < 10) newErrors.title = 'Betreff muss mindestens 10 Zeichen lang sein.';
        if (!formState.location.trim()) newErrors.location = 'Ort ist ein Pflichtfeld.';
        if (!formState.description.trim()) newErrors.description = 'Beschreibung ist ein Pflichtfeld.';
        if (photoRules.mode === 'required' && formState.photos.length === 0) newErrors.photos = 'Ein Foto ist erforderlich.';
        if (formState.reporter.trim().length < 2) newErrors.reporter = 'Name muss mindestens 2 Zeichen lang sein.';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formState.reporterEmail && !emailRegex.test(formState.reporterEmail)) {
            newErrors.reporterEmail = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        if (formState.photos.length >= 3) {
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
            setFormState(prev => ({ ...prev, photos: [...prev.photos, compressedDataUrl] }));
        } catch (error) {
            console.error("Fehler bei der Bildkomprimierung:", error);
            alert("Fehler bei der Bildverarbeitung.");
        }
    };
    
    const handleRemovePhoto = (index: number) => {
        setFormState(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
    };

    const handleSubmit = () => {
        if (!validate()) return;
        const formattedWunschTermin = formState.wunschTermin
            ? formState.wunschTermin.split('-').reverse().join('.')
            : undefined;

        const newTicketId = onAddTicket({
            ticketType: 'reactive',
            title: formState.title, area: formState.area, location: formState.location,
            reporter: formState.reporter, dueDate: '', // Will be auto-calculated
            technician: 'N/A',
            description: formState.description,
            categoryId: formState.categoryId,
            wunschTermin: formattedWunschTermin, photos: formState.photos, notes: [],
            reporterEmail: formState.reporterEmail,
        });

        setNewlyCreatedTicketId(newTicketId);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setView('success');
    };
    
    return (
        <>
            <div className="portal-header condensed">
                <button className="back-btn" onClick={() => setView('menu')}><ArrowLeftIcon /></button>
                <h2 className="portal-subtitle">Ticket erstellen</h2>
                <div className="header-spacer" />
            </div>
            <div className="portal-form mobile-form">
                <div className="form-group">
                    <label>Bereich*</label>
                    <select value={formState.area} onChange={e => setFormState(p => ({...p, area: e.target.value}))}>
                        {locations.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                 <div className="form-group">
                    <label>Ort / Bereich Detail*</label>
                    <input type="text" placeholder="z.B. Raum 102, Maschine 3" value={formState.location} onChange={e => setFormState(p => ({...p, location: e.target.value}))} />
                    {errors.location && <span className="error-text">{errors.location}</span>}
                </div>
                 <div className="form-group">
                    <label>Kategorie*</label>
                    <select value={formState.categoryId} onChange={e => setFormState(p => ({...p, categoryId: e.target.value}))}>
                        {appSettings.ticketCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                     {errors.categoryId && <span className="error-text">{errors.categoryId}</span>}
                </div>
                <div className="form-group">
                    <label>Betreff*</label>
                    <input type="text" placeholder="Kurze Beschreibung des Problems" value={formState.title} onChange={e => setFormState(p => ({...p, title: e.target.value}))} />
                    {errors.title && <span className="error-text">{errors.title}</span>}
                </div>
                <div className="form-group">
                    <label>Detaillierte Beschreibung*</label>
                    <textarea placeholder="Bitte beschreiben Sie das Problem so genau wie möglich." rows={5} value={formState.description} onChange={e => setFormState(p => ({...p, description: e.target.value}))}></textarea>
                    {errors.description && <span className="error-text">{errors.description}</span>}
                </div>
                 <div className="form-group">
                    <label>Foto hinzufügen {photoRules.mode !== 'optional' && '*'}</label>
                    <div className="photo-upload-area">
                        {formState.photos.map((photo, index) => (
                            <div key={index} className="photo-preview">
                                <img src={photo} alt={`Vorschau ${index + 1}`} />
                                <button className="remove-photo-btn" onClick={() => handleRemovePhoto(index)}><XIcon /></button>
                            </div>
                        ))}
                        {formState.photos.length < 3 && (
                            <div className="photo-buttons">
                                <button className="portal-btn btn-secondary" onClick={() => cameraInputRef.current?.click()}>
                                    <CameraIcon /> Foto aufnehmen
                                </button>
                                <button className="portal-btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                                    Aus Galerie wählen
                                </button>
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                                <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                            </div>
                        )}
                    </div>
                     {photoRules.text && <span className={`info-text ${photoRules.mode}`}>{photoRules.text}</span>}
                     {errors.photos && <span className="error-text">{errors.photos}</span>}
                </div>
                <div className="form-group">
                    <label>Ihr Name*</label>
                    <input type="text" placeholder="Max Mustermann" value={formState.reporter} onChange={e => setFormState(p => ({...p, reporter: e.target.value}))} />
                    {errors.reporter && <span className="error-text">{errors.reporter}</span>}
                </div>
                 <div className="form-group">
                    <label>Ihre E-Mail-Adresse (Optional)</label>
                    <input type="email" placeholder="fuer-status-updates@email.de" value={formState.reporterEmail} onChange={e => setFormState(p => ({...p, reporterEmail: e.target.value}))} />
                    {errors.reporterEmail && <span className="error-text">{errors.reporterEmail}</span>}
                </div>
                 <div className="form-group">
                    <label>Wunsch-Termin (Optional)</label>
                    <input type="date" value={formState.wunschTermin} onChange={e => setFormState(p => ({...p, wunschTermin: e.target.value}))} />
                </div>
            </div>
             <div className="portal-actions">
              <button className="portal-btn btn-primary" onClick={handleSubmit}>Meldung absenden</button>
            </div>
        </>
    );
};


const Portal: React.FC<PortalProps> = ({ appSettings, onLogin, tickets, locations, onAddTicket, onUpdateTicket, users }) => {
  const [view, setView] = useState<PortalView>('menu');
  const [ticketIdInput, setTicketIdInput] = useState('');
  const [foundTicket, setFoundTicket] = useState<Ticket | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [newlyCreatedTicketId, setNewlyCreatedTicketId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [noteAdded, setNoteAdded] = useState(false);
  const [loginAttempt, setLoginAttempt] = useState({ name: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

  const handleTicketPruefen = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    setFoundTicket(null);
    setNoteAdded(false);
    
    const trimmedId = ticketIdInput.trim().toUpperCase();
    if (!trimmedId) {
        setSearchError('Bitte geben Sie eine Ticket-ID ein.');
        setView('status-result');
        return;
    }

    const ticket = tickets.find(t => t.id.toUpperCase() === trimmedId);
    
    if (ticket) {
      setFoundTicket(ticket);
    } else {
      setSearchError(`Ticket mit der ID "${trimmedId}" wurde nicht gefunden.`);
    }
    setView('status-result');
  };

  const handleTechnicianLogin = (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      const user = users.find(u => u.name === loginAttempt.name && u.role === Role.Technician && u.isActive);
      if (user) {
          onLogin(user);
      } else {
          setLoginError('Anmeldedaten sind ungültig oder Konto inaktiv.');
      }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      const user = users.find(u => u.name === loginAttempt.name && u.role === Role.Admin);
      if (user) {
          onLogin(user);
      } else {
          setLoginError('Anmeldedaten sind ungültig.');
      }
  };
  
  const handleAddNewNote = () => {
    if (!newNote.trim() || !foundTicket) return;

    const date = new Date();
    const formattedDate = date.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric', year: 'numeric' });
    const formattedTime = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    
    const noteTextWithMeta = `${newNote.trim()} (Melder am ${formattedDate}, ${formattedTime})`;

    const updatedNotes = [...(foundTicket.notes || []), noteTextWithMeta];
    const updatedTicket = { ...foundTicket, notes: updatedNotes, hasNewNoteFromReporter: true };
    
    onUpdateTicket(updatedTicket);
    setFoundTicket(updatedTicket); // Update local state to show new note immediately
    setNewNote('');
    setNoteAdded(true);
    setTimeout(() => setNoteAdded(false), 3000); // Hide message after 3 seconds
  };


  const resetAndGoToMenu = () => {
      setTicketIdInput(''); setFoundTicket(null); setSearchError(null); setNewlyCreatedTicketId(null); setView('menu');
  };

  const renderContent = () => {
    switch(view) {
      case 'erfassen':
        return <NewTicketForm locations={locations} onAddTicket={onAddTicket} setView={setView} setNewlyCreatedTicketId={setNewlyCreatedTicketId} appSettings={appSettings} />;
      case 'pruefen':
        return (
          <form onSubmit={handleTicketPruefen}>
            <div className="portal-header condensed">
                <button type="button" className="back-btn" onClick={resetAndGoToMenu}><ArrowLeftIcon /></button>
                <h2 className="portal-subtitle">Status prüfen</h2>
                <div className="header-spacer" />
            </div>
            <div className="portal-form centered-form">
                <label>Bitte geben Sie Ihre Ticket-ID ein</label>
                <input type="text" placeholder="M-..." value={ticketIdInput} onChange={e => setTicketIdInput(e.target.value)} />
                 <button type="submit" className="portal-btn btn-primary">Status prüfen</button>
            </div>
          </form>
        );
       case 'techniker-login':
        return (
            <form onSubmit={handleTechnicianLogin}>
                <div className="portal-header condensed">
                    <button className="back-btn" onClick={resetAndGoToMenu}><ArrowLeftIcon /></button>
                    <h2 className="portal-subtitle">Anmeldung Haustechnik</h2>
                    <div className="header-spacer" />
                </div>
                <div className="portal-form">
                     <div className="form-group">
                        <label>Techniker</label>
                        <select value={loginAttempt.name} onChange={e => { setLoginAttempt(p => ({...p, name: e.target.value})); setLoginError(''); }}>
                            <option value="" disabled>Namen auswählen</option>
                            {TECHNICIANS_DATA.filter(t => t.isActive).map(tech => (
                                <option key={tech.id} value={tech.name}>
                                    {tech.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Passwort</label>
                        <input type="password" value={loginAttempt.password} onChange={e => { setLoginAttempt(p => ({...p, password: e.target.value})); setLoginError(''); }}/>
                    </div>
                    {loginError && <p className="error-text" style={{textAlign: 'center'}}>{loginError}</p>}
                </div>
                <div className="portal-actions">
                   <button type="submit" className="portal-btn btn-primary">Anmelden</button>
                </div>
            </form>
        );
       case 'admin-login':
        return (
            <form onSubmit={handleAdminLogin}>
                <div className="portal-header condensed">
                    <button type="button" className="back-btn" onClick={resetAndGoToMenu}><ArrowLeftIcon /></button>
                    <h2 className="portal-subtitle">Admin Anmeldung</h2>
                    <div className="header-spacer" />
                </div>
                 <div className="portal-form">
                     <div className="form-group">
                        <label>Benutzername</label>
                        <input type="text" value={loginAttempt.name} onChange={e => { setLoginAttempt(p => ({...p, name: e.target.value})); setLoginError(''); }}/>
                    </div>
                    <div className="form-group">
                        <label>Passwort</label>
                        <input type="password" value={loginAttempt.password} onChange={e => { setLoginAttempt(p => ({...p, password: e.target.value})); setLoginError(''); }}/>
                    </div>
                     {loginError && <p className="error-text" style={{textAlign: 'center'}}>{loginError}</p>}
                    <div className="login-hint">
                        <p><strong>Demo-Anmeldung:</strong></p>
                        <p>Benutzer: <strong>Admin</strong> / Passwort: <strong>admin</strong></p>
                    </div>
                </div>
                <div className="portal-actions">
                    <button type="submit" className="portal-btn btn-primary">Anmelden</button>
                </div>
            </form>
        );
      case 'status-result':
        return (
            <>
                <div className="portal-header condensed">
                   <button className="back-btn" onClick={() => setView('pruefen')}><ArrowLeftIcon /></button>
                   <h2 className="portal-subtitle">Ticket-Status</h2>
                   <div className="header-spacer" />
                </div>
                {searchError ? (
                    <p className="search-result-text error">{searchError}</p>
                ) : foundTicket && (
                  <>
                  <div className="status-result-box">
                    <div className="status-result-id">{foundTicket.id}</div>
                    <div className="status-details-box">
                        <div className="status-detail-item"><strong>Status:</strong> <span className="status-detail-value">{foundTicket.status}</span></div>
                        <div className="status-detail-item"><strong>Betreff:</strong> <span className="status-detail-value">{foundTicket.title}</span></div>
                        <div className="status-detail-item"><strong>Techniker:</strong> <span className="status-detail-value">{foundTicket.technician === 'N/A' ? 'Noch nicht zugewiesen' : foundTicket.technician}</span></div>
                        <div className="portal-notes-container">
                            <p className="notes-title"><strong>Letzte Notizen:</strong></p>
                            {foundTicket.notes && foundTicket.notes.length > 0 ? (
                                [...foundTicket.notes].reverse().slice(0, 3).map((note, index) => (
                                     <div className="portal-note-item" key={index}>{formatNote(note)}</div>
                                ))
                            ) : <span className="no-notes">Keine Notizen vorhanden.</span>}
                        </div>
                    </div>
                  </div>
                  <div className="note-add-section">
                    <label>Neue Notiz hinzufügen</label>
                    <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Schreiben Sie hier eine Nachricht an die Haustechnik..."></textarea>
                    <button className="portal-btn btn-primary" onClick={handleAddNewNote} disabled={!newNote.trim()}>Nachricht senden</button>
                    {noteAdded && <p className="note-added-success">Notiz erfolgreich hinzugefügt!</p>}
                  </div>
                  </>
                )}
                 <div className="portal-actions">
                    <button className="portal-btn btn-secondary" onClick={resetAndGoToMenu}>Zurück zum Hauptmenü</button>
                </div>
            </>
        );
       case 'success':
        return (
            <>
                <div className="success-content">
                    <div className="success-icon-wrapper">
                        <CheckBadgeIcon />
                    </div>
                    <h2 className="portal-subtitle" style={{position: 'static', transform: 'none'}}>Meldung erfolgreich gesendet!</h2>
                    <div className="success-message">
                        <p>Vielen Dank! Ihr Ticket wurde erfolgreich erstellt. Bitte bewahren Sie die folgende ID für zukünftige Anfragen auf:</p>
                        <div className="success-ticket-id-wrapper">
                            <span className="success-ticket-id">{newlyCreatedTicketId}</span>
                            <button className="copy-btn" onClick={() => handleCopy(newlyCreatedTicketId)} title={copied ? 'Kopiert!' : 'In Zwischenablage kopieren'}>
                                {copied ? <CheckIcon style={{color: 'var(--accent-success)'}} /> : <ClipboardIcon />}
                            </button>
                        </div>
                        <p className="email-info">
                            Falls Sie eine E-Mail-Adresse angegeben haben, wird eine Bestätigung an diese gesendet (in dieser Demo-Version wird dies nur simuliert).
                        </p>
                    </div>
                </div>
                <div className="portal-actions">
                    <button className="portal-btn btn-primary" onClick={resetAndGoToMenu}>Zurück zum Hauptmenü</button>
                </div>
            </>
        );
      case 'menu':
      default:
        return (
             <>
                <div className="portal-header">
                    <img src="/drk-logo.png" alt="App Logo" className="portal-logo" />
                    <h1 className="portal-title">{appSettings.appName}</h1>
                    <p className="portal-subtitle-org">DRK Kreisverband Vorderpfalz e. V.</p>
                </div>
                <div className="portal-menu">
                    <button className="portal-menu-btn primary" onClick={() => setView('erfassen')}><div className="btn-content"><div className="btn-icon"><PlusIcon /></div><div className="btn-text"><span className="btn-title">Ticket erstellen</span><span className="btn-description">Melden Sie eine neue Störung.</span></div></div></button>
                    {appSettings.portalConfig.showStatus && <button className="portal-menu-btn" onClick={() => setView('pruefen')}><div className="btn-content"><div className="btn-icon"><SearchIcon /></div><div className="btn-text"><span className="btn-title">Status prüfen</span><span className="btn-description">Fortschritt eines Tickets prüfen.</span></div></div></button>}
                    {appSettings.portalConfig.showTechnicianLogin && <button className="portal-menu-btn" onClick={() => setView('techniker-login')}><div className="btn-content"><div className="btn-icon"><UserIcon /></div><div className="btn-text"><span className="btn-title">Anmeldung Haustechnik</span><span className="btn-description">Login für Techniker.</span></div></div></button>}
                    {appSettings.portalConfig.showAdminLogin && <button className="portal-menu-btn" onClick={() => setView('admin-login')}><div className="btn-content"><div className="btn-icon"><KeyIcon /></div><div className="btn-text"><span className="btn-title">Admin Anmeldung</span><span className="btn-description">Verwaltung des Systems.</span></div></div></button>}
                </div>
             </>
        );
    }
  };
  
    return (
        <div className="portal-container">
            <style>{`
                :root { --portal-max-width: 550px; }
                .portal-container { width: 100%; min-height: 100vh; display: flex; justify-content: center; align-items: center; background-color: var(--bg-primary); font-family: 'Geist', sans-serif; color: var(--text-primary); padding: 2rem 1rem; }
                .portal-box { width: 100%; max-width: var(--portal-max-width); background: var(--bg-secondary); border-radius: 12px; box-shadow: var(--shadow-lg); border: 1px solid var(--border); display: flex; flex-direction: column; }
                .portal-box.view-pruefen { max-width: 450px; }
                .portal-box.view-pruefen form { display: flex; flex-direction: column; flex-grow: 1; }
                .portal-header { padding: 2.5rem 2rem 2.5rem; text-align: center; }
                .portal-logo { display: block; margin: 0 auto 2rem; max-width: 250px; height: auto; max-height: 70px; object-fit: contain; }
                .portal-header.condensed { padding: 1.5rem 1rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; position: relative; }
                .back-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 0.5rem; z-index: 1; }
                .back-btn:hover { color: var(--text-primary); }
                .header-spacer { padding: 0.5rem; width: 24px; visibility: hidden; z-index: 1; }
                .portal-title { font-size: 2.25rem; font-weight: 700; line-height: 1.2; margin-bottom: 0.5rem; }
                .portal-subtitle-org { font-size: 1.1rem; font-weight: 500; color: var(--text-secondary); }
                .portal-menu { padding: 0 2rem 2.5rem; display: flex; flex-direction: column; gap: 1rem; }
                .portal-menu-btn { background-color: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem 1.5rem; text-align: left; cursor: pointer; transition: var(--transition-smooth); width: 100%; font-family: inherit; }
                .portal-menu-btn:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--border-active); background-color: var(--bg-secondary); }
                .portal-menu-btn.primary { background-color: var(--accent-primary); border-color: var(--accent-primary); color: white; }
                .portal-menu-btn.primary:hover { background-color: #0b5ed7; border-color: #0a58ca; }
                .btn-content { display: flex; align-items: center; gap: 1.25rem; }
                .btn-icon { background-color: var(--bg-secondary); width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-primary); flex-shrink: 0; border: 1px solid var(--border); }
                .portal-menu-btn.primary .btn-icon { background-color: rgba(255, 255, 255, 0.2); border: none; color: white; }
                .btn-icon svg { width: 22px; height: 22px; }
                .btn-text { display: flex; flex-direction: column; }
                .btn-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.2rem; color: var(--text-primary); }
                .btn-description { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4; }
                .portal-menu-btn.primary .btn-title { color: white; }
                .portal-menu-btn.primary .btn-description { color: rgba(255, 255, 255, 0.85); }
                .portal-actions { display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem 1rem; }
                .portal-btn { padding: 0.8rem; border-radius: 8px; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: var(--transition-smooth); display: flex; align-items: center; justify-content: center; gap: 0.75rem; border: 1px solid transparent; width: 100%; }
                .btn-primary { background-color: var(--accent-primary); border-color: var(--accent-primary); color: #fff; }
                .btn-primary:hover:not(:disabled) { opacity: 0.9; }
                .btn-primary:disabled { background-color: var(--border-active); border-color: var(--border-active); cursor: not-allowed; }
                .btn-secondary { background-color: var(--bg-tertiary); border-color: var(--border); color: var(--text-secondary); }
                .btn-secondary:hover { background-color: var(--border); color: var(--text-primary); }
                .portal-subtitle { font-size: 1.25rem; font-weight: 600; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: max-content; }
                .portal-form { padding: 1.5rem 1rem; display: flex; flex-direction: column; gap: 1.25rem; }
                .portal-form.centered-form { flex-grow: 1; justify-content: center; align-items: center; gap: 1rem; text-align: center; }
                .portal-form.centered-form input { max-width: 300px; text-align: center; font-size: 1.1rem; }
                .form-group { display: flex; flex-direction: column; }
                .form-group label { font-size: 0.9rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem; }
                .portal-form input, .portal-form select, .portal-form textarea, .note-add-section textarea { width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-primary); font-size: 1rem; color: var(--text-primary); transition: var(--transition-smooth); }
                .portal-form input:focus, .portal-form select:focus, .portal-form textarea:focus, .note-add-section textarea:focus { outline: none; border-color: var(--accent-primary); box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1); }
                .error-text { color: var(--accent-danger); font-size: 0.8rem; margin-top: 0.25rem; }
                .info-text { font-size: 0.8rem; margin-top: 0.25rem; color: var(--text-muted); }
                .info-text.required { color: var(--accent-danger); font-weight: 500; }
                .info-text.recommended { color: var(--text-secondary); }
                .photo-upload-area { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; }
                .photo-preview { position: relative; width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); }
                .photo-preview img { width: 100%; height: 100%; object-fit: cover; }
                .remove-photo-btn { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; }
                .remove-photo-btn svg { width: 14px; height: 14px; }
                .photo-buttons { display: flex; flex-direction: column; gap: 0.75rem; }
                .search-result-text.error { color: var(--accent-danger); font-size: 0.9rem; text-align: center; padding: 1rem; }
                .status-result-box { padding: 1rem; }
                .status-result-id { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 8px; padding: 0.5rem 1rem; font-size: 1.25rem; font-weight: 600; text-align: center; margin-bottom: 1.5rem; color: var(--accent-primary); }
                .status-details-box { background: var(--bg-primary); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; }
                .status-detail-item { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border); font-size: 0.95rem; gap: 1rem; }
                .status-detail-item:last-child { border-bottom: none; }
                .status-detail-item strong { color: var(--text-secondary); font-weight: 500; }
                .status-detail-value { color: var(--text-primary); font-weight: 500; text-align: right; }
                .portal-notes-container { margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border); }
                .notes-title { font-size: 0.9rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.5rem; }
                .portal-note-item { background: var(--bg-tertiary); padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.9rem; margin-bottom: 0.5rem; }
                .note-meta { display: block; text-align: right; font-size: 0.8em; font-style: italic; color: var(--text-muted); margin-top: 0.5rem; }
                .success-content { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 2rem 1rem; gap: 1.5rem; }
                .success-icon-wrapper { background-color: rgba(40, 167, 69, 0.1); color: var(--accent-success); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
                .success-icon-wrapper svg { width: 48px; height: 48px; }
                .success-message { display: flex; flex-direction: column; align-items: center; gap: 1rem; font-size: 0.95rem; color: var(--text-secondary); }
                .success-ticket-id-wrapper { display: flex; align-items: center; gap: 0.75rem; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem 1.25rem; margin: 0.5rem 0; }
                .success-ticket-id { font-size: 1.75rem; font-weight: 700; color: var(--accent-primary); font-family: monospace; }
                .copy-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); position: relative; padding: 0.5rem; border-radius: 50%; transition: background-color 0.2s ease; }
                .copy-btn:hover { color: var(--text-primary); background-color: var(--border); }
                .copy-btn svg { width: 20px; height: 20px; }
                .email-info { font-size: 0.85rem; color: var(--text-muted); margin-top: 1rem; max-width: 400px; }
                .note-add-section { padding: 1.5rem 1rem; display: flex; flex-direction: column; gap: 0.75rem; border-top: 1px solid var(--border); }
                .note-add-section label { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
                .note-add-section textarea { min-height: 80px; resize: vertical; }
                .note-added-success { color: var(--accent-success); font-size: 0.9rem; text-align: center; margin-top: 0.5rem; font-weight: 500; }
                .login-hint { font-size: 0.85rem; color: var(--text-secondary); text-align: center; padding: 0.75rem; background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-md); margin-top: 0.5rem; line-height: 1.5; }
                .login-hint p { margin: 0; }
            `}</style>
            <div className={`portal-box view-${view}`}>
                {renderContent()}
            </div>
        </div>
    );
};

export default Portal;