import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';

interface UserModalProps {
  user: Partial<User> | null;
  onClose: () => void;
  onSave: (user: User) => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    role: Role.Technician,
    password: '',
    isActive: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({ ...user, password: '' }); // Don't show existing password
    } else {
      setFormData({
        name: '',
        role: Role.Technician,
        password: '',
        isActive: true,
      });
    }
  }, [user]);

  const isNewUser = !user?.id;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Name ist ein Pflichtfeld.");
      return;
    }
    onSave(formData as User);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <style>{`
        .modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.6); display: flex; align-items: center;
            justify-content: center; z-index: 1000; animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal-content {
            background: var(--bg-secondary); padding: 2rem; border-radius: 12px;
            box-shadow: var(--shadow-lg); width: 90%; max-width: 500px;
            z-index: 1001;
        }
        .modal-content h2 {
            margin-bottom: 1.5rem; font-size: 1.5rem; color: var(--text-primary);
        }
        .modal-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .form-group { display: flex; flex-direction: column; }
        .form-group label {
            margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 500;
            color: var(--text-secondary);
        }
        .form-group input, .form-group select {
            width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border);
            background: var(--bg-primary); font-size: 0.95rem; color: var(--text-primary);
            transition: var(--transition-smooth);
        }
        .form-group input:focus, .form-group select:focus {
            outline: none; border-color: var(--accent-primary);
            box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }
        .form-actions {
            display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;
        }
        .btn {
            padding: 0.6rem 1.25rem; border-radius: 8px; font-weight: 500; font-size: 0.9rem;
            cursor: pointer; transition: var(--transition-smooth); display: flex;
            align-items: center; gap: 0.5rem; border: 1px solid transparent;
        }
        .btn-secondary {
            background-color: var(--bg-tertiary); border-color: var(--border);
            color: var(--text-secondary);
        }
        .btn-secondary:hover { background-color: var(--border); color: var(--text-primary); }
        .btn-primary {
            background-color: var(--accent-primary); border-color: var(--accent-primary);
            color: white;
        }
        .btn-primary:hover { opacity: 0.9; }
      `}</style>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{isNewUser ? 'Neuen Benutzer erstellen' : 'Benutzer bearbeiten'}</h2>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="role">Rolle</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange}>
              <option value={Role.Technician}>Techniker</option>
              <option value={Role.Admin}>Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={isNewUser ? 'Passwort (optional)' : 'Leer lassen, um nicht zu ändern'}
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">Abbrechen</button>
            <button type="submit" className="btn btn-primary">Speichern</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;