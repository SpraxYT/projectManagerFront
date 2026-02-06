'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role?: any;
}

export default function RoleModal({ isOpen, onClose, onSuccess, role }: RoleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    permissions: {
      canViewUsers: false,
      canCreateUsers: false,
      canEditUsers: false,
      canDeleteUsers: false,
      canViewRoles: false,
      canCreateRoles: false,
      canEditRoles: false,
      canDeleteRoles: false,
      canViewLogs: false,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        description: role.description || '',
        color: role.color || '#3B82F6',
        permissions: role.permissions || {},
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        permissions: {
          canViewUsers: false,
          canCreateUsers: false,
          canEditUsers: false,
          canDeleteUsers: false,
          canViewRoles: false,
          canCreateRoles: false,
          canEditRoles: false,
          canDeleteRoles: false,
          canViewLogs: false,
        },
      });
    }
    setError('');
  }, [role, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (role) {
        await api.updateRole(role.id, formData);
      } else {
        await api.createRole(formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.error || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const permissionGroups = [
    {
      title: 'Utilisateurs',
      permissions: [
        { key: 'canViewUsers', label: 'Voir les utilisateurs' },
        { key: 'canCreateUsers', label: 'Créer des utilisateurs' },
        { key: 'canEditUsers', label: 'Modifier les utilisateurs' },
        { key: 'canDeleteUsers', label: 'Supprimer les utilisateurs' },
      ],
    },
    {
      title: 'Rôles',
      permissions: [
        { key: 'canViewRoles', label: 'Voir les rôles' },
        { key: 'canCreateRoles', label: 'Créer des rôles' },
        { key: 'canEditRoles', label: 'Modifier les rôles' },
        { key: 'canDeleteRoles', label: 'Supprimer les rôles' },
      ],
    },
    {
      title: 'Système',
      permissions: [
        { key: 'canViewLogs', label: 'Voir les logs d\'activité' },
      ],
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={role ? 'Modifier le rôle' : 'Nouveau rôle'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Nom du rôle"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Développeur, Designer..."
            required
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du rôle..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Couleur
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-20 cursor-pointer rounded border border-gray-300"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium text-gray-900">Permissions</h4>
          
          {permissionGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">{group.title}</h5>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.permissions.map((perm) => (
                  <label key={perm.key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions[perm.key as keyof typeof formData.permissions] || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            [perm.key]: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 border-t pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : role ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
