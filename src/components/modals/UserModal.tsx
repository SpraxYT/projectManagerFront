'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: any;
}

export default function UserModal({ isOpen, onClose, onSuccess, user }: UserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'MEMBER',
    customRoleId: null as string | null,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customRoles, setCustomRoles] = useState<any[]>([]);

  useEffect(() => {
    // Charger les rôles personnalisés
    const loadRoles = async () => {
      try {
        const response = await api.getRoles({ limit: 100 });
        setCustomRoles(response.roles || []);
      } catch (error) {
        console.error('Erreur chargement rôles:', error);
      }
    };

    if (isOpen) {
      loadRoles();
    }

    if (user) {
      setFormData({
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        password: '',
        role: user.role || 'MEMBER',
        customRoleId: user.customRoleId || null,
        isActive: user.isActive ?? true,
      });
    } else {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'MEMBER',
        customRoleId: null,
        isActive: true,
      });
    }
    setError('');
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (user) {
        // Mise à jour
        const updateData: any = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          customRoleId: formData.role === 'CUSTOM' ? formData.customRoleId : null,
          isActive: formData.isActive,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await api.updateUser(user.id, updateData);
      } else {
        // Création
        const createData: any = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
          role: formData.role,
          customRoleId: formData.role === 'CUSTOM' ? formData.customRoleId : null,
        };
        await api.post('/users', createData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.error || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Prénom"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />

          <Input
            label="Nom"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <Input
          label={user ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required={!user}
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Rôle <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.role === 'CUSTOM' && formData.customRoleId ? `CUSTOM:${formData.customRoleId}` : formData.role}
            onChange={(e) => {
              const value = e.target.value;
              if (value.startsWith('CUSTOM:')) {
                const customRoleId = value.split(':')[1];
                setFormData({ 
                  ...formData, 
                  role: 'CUSTOM',
                  customRoleId: customRoleId
                });
              } else {
                setFormData({ 
                  ...formData, 
                  role: value,
                  customRoleId: null
                });
              }
            }}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          >
            <optgroup label="Rôles prédéfinis">
              <option value="MEMBER">Membre</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Administrateur</option>
              <option value="OWNER">Propriétaire</option>
            </optgroup>
            {customRoles.length > 0 && (
              <optgroup label="Rôles personnalisés">
                {customRoles.map((role) => (
                  <option key={role.id} value={`CUSTOM:${role.id}`}>
                    {role.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {user && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Compte actif
            </label>
          </div>
        )}

        <div className="flex justify-end space-x-3 border-t pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : user ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
