import React, { useState } from 'react';
import { User, AppArea, Role } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import UserModal from './UserModal';
import AreaModal from './AreaModal';

interface SettingsViewProps {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    areas: AppArea[];
    setAreas: React.Dispatch<React.SetStateAction<AppArea[]>>;
}

const SettingsView: React.FC<SettingsViewProps> = ({ users, setUsers, areas, setAreas }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'areas'>('users');
    
    // State for user modal
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

    // State for area modal
    const [isAreaModalOpen, setAreaModalOpen] = useState(false);
    const [editingArea, setEditingArea] = useState<AppArea | null>(null);
    
    // --- User Management ---
    const handleOpenUserModal = (user: User | null) => {
        setEditingUser(user);
        setUserModalOpen(true);
    };

    const handleSaveUser = (userToSave: User) => {
        if (userToSave.id) { // Editing existing user
            setUsers(current => current.map(u => (u.id === userToSave.id ? { ...u, ...userToSave, password: userToSave.password ? userToSave.password : u.password } : u)));
        } else { // Adding new user
            const newUser: User = {
                ...userToSave,
                id: `user-${Date.now()}`,
            };
            setUsers(current => [...current, newUser]);
        }
        setUserModalOpen(false);
        setEditingUser(null);
    };
    
    const handleToggleUserStatus = (userId: string) => {
        setUsers(current => current.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
    };

    const handleDeleteUser = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (user && window.confirm(`Sind Sie sicher, dass Sie den Benutzer "${user.name}" endgültig löschen möchten?`)) {
            setUsers(current => current.filter(u => u.id !== userId));
        }
    };

    // --- Area Management ---
    const handleOpenAreaModal = (area: AppArea | null) => {
        setEditingArea(area);
        setAreaModalOpen(true);
    };

    const handleSaveArea = (areaToSave: AppArea) => {
        if (areaToSave.id) { // Editing existing area
            setAreas(current => current.map(a => (a.id === areaToSave.id ? { ...a, name: areaToSave.name } : a)));
        } else { // Adding new area
            if (areas.some(a => a.name.toLowerCase() === areaToSave.name.trim().toLowerCase())) {
                alert('Ein Bereich mit diesem Namen existiert bereits.');
                return;
            }
            const newArea: AppArea = {
                id: `area-${Date.now()}`,
                name: areaToSave.name.trim(),
                isActive: true,
            };
            setAreas(current => [...current, newArea]);
        }
        setAreaModalOpen(false);
        setEditingArea(null);
    };

    const handleToggleAreaStatus = (areaId: string) => {
        setAreas(current => current.map(a => a.id === areaId ? { ...a, isActive: !a.isActive } : a));
    };

    const handleDeleteArea = (areaId: string) => {
        const area = areas.find(a => a.id === areaId);
        if (area && window.confirm(`Sind Sie sicher, dass Sie den Bereich "${area.name}" endgültig löschen möchten?`)) {
            setAreas(current => current.filter(a => a.id !== areaId));
        }
    };


    return (
        <div className="settings-view">
            <style>{`
                .settings-view { padding-top: 1.5rem; max-width: 1200px; margin: 0 auto; }
                .settings-header { margin-bottom: 2rem; }
                .settings-title { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); }
                .settings-tabs { display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border); margin-bottom: 2rem; }
                .tab-btn { background: none; border: none; padding: 0.75rem 1.5rem; font-size: 1rem; font-weight: 500; cursor: pointer; color: var(--text-secondary); border-bottom: 2px solid transparent; transition: var(--transition-smooth); }
                .tab-btn.active { color: var(--text-primary); border-bottom-color: var(--accent-primary); }
                .tab-btn:hover:not(.active) { color: var(--text-primary); }
                .tab-content { animation: fadeIn 0.3s ease; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                .content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .content-title { font-size: 1.25rem; font-weight: 600; }
                .btn { padding: 0.5rem 1rem; border-radius: 8px; font-weight: 500; font-size: 0.9rem; cursor: pointer; transition: var(--transition-smooth); display: flex; align-items: center; gap: 0.5rem; border: 1px solid transparent; }
                .btn-primary { background-color: var(--accent-primary); border-color: var(--accent-primary); color: white; }
                .btn-primary:hover { opacity: 0.9; }
                .btn-secondary { background-color: var(--bg-tertiary); border-color: var(--border); color: var(--text-secondary); font-size: 0.8rem; padding: 0.4rem 0.8rem; }
                .btn-secondary:hover { background-color: var(--border); color: var(--text-primary); }
                .btn-danger { background-color: transparent; border-color: transparent; color: var(--accent-danger); font-size: 0.8rem; padding: 0.4rem 0.8rem; }
                .btn-danger:hover { background-color: rgba(220, 53, 69, 0.1); color: #c82333; }
                .btn-danger svg { width: 14px; height: 14px; }
                
                .settings-table { width: 100%; border-collapse: collapse; }
                .settings-table th, .settings-table td { text-align: left; padding: 1rem; border-bottom: 1px solid var(--border); }
                .settings-table th { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase; }
                .settings-table tr:hover { background-color: var(--bg-tertiary); }
                .status-badge { padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
                .status-badge.active { background-color: var(--accent-success); color: white; }
                .status-badge.inactive { background-color: var(--text-muted); color: white; }
                .actions-cell { display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center; }
            `}</style>
            <div className="settings-header">
                <h1 className="settings-title">Einstellungen</h1>
            </div>
            <div className="settings-tabs">
                <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Benutzerverwaltung</button>
                <button className={`tab-btn ${activeTab === 'areas' ? 'active' : ''}`} onClick={() => setActiveTab('areas')}>Bereiche</button>
            </div>
            <div className="tab-content">
                {activeTab === 'users' && (
                    <div id="user-management">
                        <div className="content-header">
                           <h2 className="content-title">Benutzerliste</h2>
                           <button className="btn btn-primary" onClick={() => handleOpenUserModal(null)}><PlusIcon />Benutzer hinzufügen</button>
                        </div>
                        <table className="settings-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Rolle</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.name}</td>
                                        <td>{user.role}</td>
                                        <td><span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>{user.isActive ? 'Aktiv' : 'Inaktiv'}</span></td>
                                        <td className="actions-cell">
                                            <button className="btn btn-secondary" onClick={() => handleOpenUserModal(user)}>Bearbeiten</button>
                                            {user.role !== Role.Admin ? (
                                                <>
                                                    <button className="btn btn-secondary" onClick={() => handleToggleUserStatus(user.id)}>{user.isActive ? 'Deaktivieren' : 'Aktivieren'}</button>
                                                    <button className="btn btn-danger" onClick={() => handleDeleteUser(user.id)} title="Löschen"><TrashIcon /></button>
                                                </>
                                            ) : <div style={{width: '92px'}} /> /* Spacer to align actions */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab === 'areas' && (
                    <div id="area-management">
                        <div className="content-header">
                           <h2 className="content-title">Bereichsliste</h2>
                           <button className="btn btn-primary" onClick={() => handleOpenAreaModal(null)}><PlusIcon />Bereich hinzufügen</button>
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
                                {areas.map(area => (
                                    <tr key={area.id}>
                                        <td>{area.name}</td>
                                        <td><span className={`status-badge ${area.isActive ? 'active' : 'inactive'}`}>{area.isActive ? 'Aktiv' : 'Inaktiv'}</span></td>
                                        <td className="actions-cell">
                                            <button className="btn btn-secondary" onClick={() => handleOpenAreaModal(area)}>Bearbeiten</button>
                                            <button className="btn btn-secondary" onClick={() => handleToggleAreaStatus(area.id)}>{area.isActive ? 'Deaktivieren' : 'Aktivieren'}</button>
                                            <button className="btn btn-danger" onClick={() => handleDeleteArea(area.id)} title="Löschen"><TrashIcon /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {isUserModalOpen && <UserModal user={editingUser} onClose={() => setUserModalOpen(false)} onSave={handleSaveUser} />}
            {isAreaModalOpen && <AreaModal area={editingArea} onClose={() => setAreaModalOpen(false)} onSave={handleSaveArea} />}
        </div>
    );
};

export default SettingsView;