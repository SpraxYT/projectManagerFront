'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, role: string) => Promise<void>;
  projectId: string;
  existingMembers: string[]; // Liste des IDs déjà membres
}

export default function AddMemberModal({
  isOpen,
  onClose,
  onSave,
  projectId,
  existingMembers,
}: AddMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('MEMBER');

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const response = await api.getUsers();
      // Filtrer les utilisateurs qui ne sont pas déjà membres
      const availableUsers = (response.users || []).filter(
        (user: any) => !existingMembers.includes(user.id)
      );
      setUsers(availableUsers);
      if (availableUsers.length > 0) {
        setSelectedUserId(availableUsers[0].id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setLoading(true);
    try {
      await onSave(selectedUserId, selectedRole);
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h2 className="mb-6 text-xl font-semibold text-gray-900">
          Ajouter un membre
        </h2>

        {users.length === 0 ? (
          <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 mb-4">
            Tous les utilisateurs sont déjà membres de ce projet.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Utilisateur <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Rôle <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="VIEWER">Lecteur (Viewer)</option>
                <option value="MEMBER">Membre</option>
                <option value="OWNER">Propriétaire (Owner)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {selectedRole === 'VIEWER' && 'Peut uniquement consulter le projet'}
                {selectedRole === 'MEMBER' && 'Peut consulter et modifier le projet'}
                {selectedRole === 'OWNER' && 'Contrôle total sur le projet'}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading || users.length === 0}>
            {loading ? 'Ajout...' : 'Ajouter'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
