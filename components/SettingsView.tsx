// FIX: Import useMemo hook from React.
import React, { useState, useMemo } from 'react';
import { User, Location, Role, AppSettings, Priority, TicketCategory, SLARule, RoutingRule, Asset, MaintenancePlan, AvailabilityStatus } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import UserModal from './UserModal';
import AreaModal from './AreaModal';

interface SettingsViewProps {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    locations: Location[];
    setLocations: React.Dispatch<React.SetStateAction<Location[]>>;
    assets: Asset[];
    setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
    maintenancePlans: MaintenancePlan[];
    setMaintenancePlans: React.Dispatch<React.SetStateAction<MaintenancePlan[]>>;
    appSettings: AppSettings;
    setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const SettingsView: React.FC<SettingsViewProps> = (props) => {
    const { users, setUsers, locations, setLocations, assets, setAssets, maintenancePlans, setMaintenancePlans, appSettings, setAppSettings } = props;
    const [activeTab, setActiveTab] = useState<'prozesse' | 'benutzer' | 'standorte'>('prozesse');
    
    // Modals
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
    const [isLocationModalOpen, setLocationModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);

    const allSkills = useMemo(() => {
        const skillSet = new Set<string>();
        users.forEach(u => u.skills.forEach(s => skillSet.add(s)));
        appSettings.routingRules.forEach(r => skillSet.add(r.skill));
        return Array.from(skillSet).sort();
    }, [users, appSettings.routingRules]);

    // --- User Management ---
    const handleOpenUserModal = (user: User | null) => {
        setEditingUser(user);
        setUserModalOpen(true);
    };

    const handleSaveUser = (userToSave: User) => {
        if (userToSave.id) {
            setUsers(current => current.map(u => (u.id === userToSave.id ? { ...u, ...userToSave, password: userToSave.password ? userToSave.password : u.password } : u)));
        } else {
            const newUser: User = { ...userToSave, id: `user-${Date.now()}` };
            setUsers(current => [...current, newUser]);
        }
        setUserModalOpen(false);
        setEditingUser(null);
    };
    
    const handleDeleteUser = (id: string) => {
        if (window.confirm('Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?')) {
            setUsers(current => current.filter(user => user.id !== id));
        }
    };
    
    // --- Location Management ---
    const handleOpenLocationModal = (location: Location | null) => {
        setEditingLocation(location);
        setLocationModalOpen(true);
    };
    const handleSaveLocation = (locationToSave: Location) => {
        if (locationToSave.id) {
            setLocations(current => current.map(l => (l.id === locationToSave.id ? { ...l, name: locationToSave.name } : l)));
        } else {
            if (locations.some(l => l.name.toLowerCase() === locationToSave.name.trim().toLowerCase())) {
                alert('Ein Standort mit diesem Namen existiert bereits.');
                return;
            }
            const newLocation: Location = {
                id: `loc-${Date.now()}`,
                name: locationToSave.name.trim(),
                isActive: true,
            };
            setLocations(current => [...current, newLocation]);
        }
        setLocationModalOpen(false);
        setEditingLocation(null);
    };
    const handleToggleLocationStatus = (locationId: string) => {
        setLocations(current => current.map(l => l.id === locationId ? { ...l, isActive: !l.isActive } : l));
    };
    const handleDeleteLocation = (locationId: string) => {
        const location = locations.find(l => l.id === locationId);
        if (location && window.confirm(`Sind Sie sicher, dass Sie den Standort "${location.name}" löschen möchten?`)) {
            setLocations(current => current.filter(l => l.id !== locationId));
        }
    };

    // --- Generic Handlers for AppSettings ---
    const handleAddSetting = <T extends { id: string }>(key: keyof AppSettings, newItem: Omit<T, 'id'>) => {
        setAppSettings(prev => ({
            ...prev,
            [key]: [...(prev[key] as unknown as T[]), { ...newItem, id: `${key}-${Date.now()}` }]
        }));
    };
    
    const handleUpdateSetting = <T extends { id: string }>(key: keyof AppSettings, updatedItem: T) => {
        setAppSettings(prev => ({
            ...prev,
            [key]: (prev[key] as unknown as T[]).map(item => item.id === updatedItem.id ? updatedItem : item)
        }));
    };

    const handleDeleteSetting = (key: keyof AppSettings, id: string) => {
        if (window.confirm('Sind Sie sicher, dass Sie diesen Eintrag löschen möchten?')) {
            setAppSettings(prev => ({
                ...prev,
                [key]: (prev[key] as any[]).filter(item => item.id !== id)
            }));
        }
    };
    
    // --- Render Functions for Tabs ---
    const renderProzesseTab = () => (
        <>
            <div className="settings-section">
                <div className="settings-section-header">
                    <h3 className="settings-section-title">App Name</h3>
                </div>
                <div className="settings-section-body">
                    <div className="form-group">
                        <label>Der hier festgelegte Name wird im Portal angezeigt.</label>
                        <input type="text" value={appSettings.appName} onChange={e => setAppSettings(prev => ({...prev, appName: e.target.value}))} className="form-group-input" />
                    </div>
                </div>
            </div>
            <div className="settings-section">
                <div className="settings-section-header"><h3 className="settings-section-title">Ticket-Kategorien</h3></div>
                <div className="settings-section-body">
                    {appSettings.ticketCategories.map(cat => (
                        <div key={cat.id} className="list-item">
                            <input type="text" value={cat.name} onChange={e => handleUpdateSetting('ticketCategories', {...cat, name: e.target.value})} className="form-group-input" />
                            <button onClick={() => handleDeleteSetting('ticketCategories', cat.id)} className="btn btn-danger-sm"><TrashIcon/></button>
                        </div>
                    ))}
                    <button onClick={() => handleAddSetting<TicketCategory>('ticketCategories', { name: 'Neue Kategorie'})} className="btn btn-secondary btn-full-width"><PlusIcon /> Neue Kategorie hinzufügen</button>
                </div>
            </div>

            <div className="settings-section">
                <div className="settings-section-header"><h3 className="settings-section-title">SLA-Matrix (Fälligkeiten)</h3></div>
                <div className="settings-section-body">
                    <div className="sla-grid-header">
                        <span>Kategorie</span><span>Priorität</span><span>Reaktionszeit (Stunden)</span><span></span>
                    </div>
                    {appSettings.slaMatrix.map(rule => (
                        <div key={rule.id} className="sla-grid-row">
                            <select value={rule.categoryId} onChange={e => handleUpdateSetting<SLARule>('slaMatrix', {...rule, categoryId: e.target.value})} className="form-group-select">
                                {appSettings.ticketCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select value={rule.priority} onChange={e => handleUpdateSetting<SLARule>('slaMatrix', {...rule, priority: e.target.value as Priority})} className="form-group-select">
                                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <input type="number" value={rule.responseTimeHours} min="1" onChange={e => handleUpdateSetting<SLARule>('slaMatrix', {...rule, responseTimeHours: parseInt(e.target.value,10)})} className="form-group-input" />
                            <button onClick={() => handleDeleteSetting('slaMatrix', rule.id)} className="btn btn-danger-sm"><TrashIcon /></button>
                        </div>
                    ))}
                    <button onClick={() => handleAddSetting<SLARule>('slaMatrix', { categoryId: appSettings.ticketCategories[0]?.id || '', priority: Priority.Mittel, responseTimeHours: 24 })} className="btn btn-secondary btn-full-width"><PlusIcon /> Neue SLA-Regel hinzufügen</button>
                </div>
            </div>

            <div className="settings-section">
                <div className="settings-section-header"><h3 className="settings-section-title">Automatisches Ticket-Routing</h3></div>
                <div className="settings-section-body">
                    <div className="routing-grid-header">
                        <span>Wenn Text enthält (Keywords, Komma-getrennt)</span><span>...dann Skill zuweisen</span><span></span>
                    </div>
                    {appSettings.routingRules.map(rule => (
                        <div key={rule.id} className="routing-grid-row">
                            <input type="text" value={rule.keyword} onChange={e => handleUpdateSetting<RoutingRule>('routingRules', {...rule, keyword: e.target.value})} className="form-group-input" />
                             <input type="text" value={rule.skill} list="skills-datalist" onChange={e => handleUpdateSetting<RoutingRule>('routingRules', {...rule, skill: e.target.value})} className="form-group-input" />
                            <button onClick={() => handleDeleteSetting('routingRules', rule.id)} className="btn btn-danger-sm"><TrashIcon /></button>
                        </div>
                    ))}
                    <button onClick={() => handleAddSetting<RoutingRule>('routingRules', { keyword: 'Beispiel', skill: 'Allgemein'})} className="btn btn-secondary btn-full-width"><PlusIcon /> Neue Routing-Regel hinzufügen</button>
                    <datalist id="skills-datalist">
                        {allSkills.map(s => <option key={s} value={s} />)}
                    </datalist>
                </div>
            </div>
        </>
    );

    const renderBenutzerTab = () => (
        <div id="user-management">
            <div className="content-header">
               <h2 className="content-title">Benutzerliste</h2>
               <button className="btn btn-primary" onClick={() => handleOpenUserModal(null)}><PlusIcon />Benutzer hinzufügen</button>
            </div>
            <table className="settings-table">
                <thead><tr><th>Name</th><th>Rolle</th><th>Skills</th><th>Verfügbarkeit</th><th>Status</th><th></th></tr></thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.name}</td>
                            <td>{user.role}</td>
                            <td><div className="skills-container">{user.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}</div></td>
                            <td>{user.availability.status}</td>
                            <td><span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>{user.isActive ? 'Aktiv' : 'Inaktiv'}</span></td>
                            <td className="actions-cell">
                                <button className="btn btn-secondary" onClick={() => handleOpenUserModal(user)}>Bearbeiten</button>
                                {user.role !== Role.Admin && <button className="btn btn-danger" onClick={() => handleDeleteUser(user.id)} title="Löschen"><TrashIcon /></button>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderStandorteTab = () => (
        <div id="location-management">
            <div className="content-header">
                <h2 className="content-title">Standortliste</h2>
                <button className="btn btn-primary" onClick={() => handleOpenLocationModal(null)}><PlusIcon />Standort hinzufügen</button>
            </div>
            <table className="settings-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {locations.map(location => (
                        <tr key={location.id}>
                            <td>{location.name}</td>
                            <td><span className={`status-badge ${location.isActive ? 'active' : 'inactive'}`}>{location.isActive ? 'Aktiv' : 'Inaktiv'}</span></td>
                            <td className="actions-cell">
                                <button className="btn btn-secondary" onClick={() => handleOpenLocationModal(location)}>Bearbeiten</button>
                                <button className="btn btn-secondary" onClick={() => handleToggleLocationStatus(location.id)}>{location.isActive ? 'Deaktivieren' : 'Aktivieren'}</button>
                                <button className="btn btn-danger" onClick={() => handleDeleteLocation(location.id)} title="Löschen"><TrashIcon /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="settings-view">
            <style>{`
                /* General Styles */
                .settings-view { padding-top: 1.5rem; max-width: 1200px; margin: 0 auto; }
                .settings-header { margin-bottom: 2rem; }
                .settings-title { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); }
                .settings-tabs { display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border); margin-bottom: 2rem; flex-wrap: wrap; }
                .tab-btn { background: none; border: none; padding: 0.75rem 1.5rem; font-size: 1rem; font-weight: 500; cursor: pointer; color: var(--text-secondary); border-bottom: 2px solid transparent; transition: var(--transition-smooth); }
                .tab-btn.active { color: var(--text-primary); border-bottom-color: var(--accent-primary); }
                .tab-content { animation: fadeIn 0.3s ease; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                /* Section Styles */
                .settings-section { background-color: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); margin-bottom: 2rem; }
                .settings-section-header { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); }
                .settings-section-title { font-size: 1.1rem; font-weight: 600; }
                .settings-section-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }

                /* Form & List Styles */
                .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .form-group-input, .form-group-select { width: 100%; padding: 0.6rem 0.8rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-primary); font-size: 0.95rem; color: var(--text-primary); transition: var(--transition-smooth); }
                .form-group-input:focus, .form-group-select:focus { outline: none; border-color: var(--accent-primary); box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1); }
                .list-item { display: flex; gap: 0.5rem; align-items: center; }
                
                /* Grids for complex settings */
                .sla-grid-header, .routing-grid-header { display: grid; grid-template-columns: 2fr 2fr 1fr auto; gap: 0.5rem; font-size: 0.8rem; color: var(--text-muted); font-weight: 500; margin-bottom: 0.5rem; padding: 0 0.5rem; }
                .routing-grid-header { grid-template-columns: 3fr 2fr auto; }
                .sla-grid-row, .routing-grid-row { display: grid; grid-template-columns: 2fr 2fr 1fr auto; gap: 0.5rem; align-items: center; }
                .routing-grid-row { grid-template-columns: 3fr 2fr auto; }

                /* Buttons */
                .btn { padding: 0.5rem 1rem; border-radius: 8px; font-weight: 500; font-size: 0.9rem; cursor: pointer; transition: var(--transition-smooth); display: flex; align-items: center; justify-content: center; gap: 0.5rem; border: 1px solid transparent; }
                .btn-primary { background-color: var(--accent-primary); color: white; }
                .btn-secondary { background-color: var(--bg-tertiary); border-color: var(--border); color: var(--text-secondary); }
                .btn-secondary:hover { background-color: var(--border); color: var(--text-primary); }
                .btn-full-width { width: 100%; }
                .btn-danger { color: var(--accent-danger); background: none; border: none; }
                 .btn-danger:hover { background-color: rgba(220, 53, 69, 0.1); }
                .btn-danger-sm { background: none; border: none; color: var(--text-muted); padding: 0.5rem; }
                .btn-danger-sm:hover { color: var(--accent-danger); background: rgba(220, 53, 69, 0.1); border-radius: 50%; }
                
                /* Table Styles for User/Area list */
                .content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .content-title { font-size: 1.25rem; font-weight: 600; }
                .settings-table { width: 100%; border-collapse: collapse; }
                .settings-table th, .settings-table td { text-align: left; padding: 1rem; border-bottom: 1px solid var(--border); }
                .settings-table th { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase; }
                .status-badge { padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; color: white; }
                .status-badge.active { background-color: var(--accent-success); }
                .status-badge.inactive { background-color: var(--text-muted); }
                .actions-cell { display: flex; gap: 0.5rem; justify-content: flex-end; }
                .skills-container { display: flex; flex-wrap: wrap; gap: 0.25rem; }
                .skill-tag { background-color: var(--bg-tertiary); color: var(--text-secondary); padding: 0.1rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 500; }
            `}</style>
            <div className="settings-header">
                <h1 className="settings-title">Steuerzentrale</h1>
            </div>
            <div className="settings-tabs">
                <button className={`tab-btn ${activeTab === 'prozesse' ? 'active' : ''}`} onClick={() => setActiveTab('prozesse')}>Prozesse & Logik</button>
                <button className={`tab-btn ${activeTab === 'benutzer' ? 'active' : ''}`} onClick={() => setActiveTab('benutzer')}>Benutzer & Teams</button>
                <button className={`tab-btn ${activeTab === 'standorte' ? 'active' : ''}`} onClick={() => setActiveTab('standorte')}>Standorte & Anlagen</button>
            </div>
            <div className="tab-content">
                {activeTab === 'prozesse' && renderProzesseTab()}
                {activeTab === 'benutzer' && renderBenutzerTab()}
                {activeTab === 'standorte' && renderStandorteTab()}
            </div>
            {isUserModalOpen && <UserModal user={editingUser} allSkills={allSkills} onClose={() => setUserModalOpen(false)} onSave={handleSaveUser} />}
            {isLocationModalOpen && <AreaModal area={editingLocation} onClose={() => setLocationModalOpen(false)} onSave={handleSaveLocation} />}
        </div>
    );
};

export default SettingsView;