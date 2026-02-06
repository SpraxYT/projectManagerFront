'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import RoleModal from '@/components/modals/RoleModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Button from '@/components/ui/Button';

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<any>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await api.getRoles({ search });
      setRoles(response.roles || []);
    } catch (error) {
      console.error('Erreur chargement rôles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRoles();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleEdit = (role: any) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleDelete = (role: any) => {
    setRoleToDelete(role);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;

    try {
      await api.deleteRole(roleToDelete.id);
      loadRoles();
    } catch (error: any) {
      alert(error.error || 'Erreur lors de la suppression');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
  };

  const handleModalSuccess = () => {
    loadRoles();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Rôles personnalisés</h1>
        <p className="mt-2 text-gray-600">
          Créez et gérez des rôles avec des permissions personnalisées
        </p>
      </div>

      {/* Search & Actions */}
      <div className="mb-6 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Rechercher un rôle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          + Créer un rôle
        </Button>
      </div>

      {/* Role Modal */}
      <RoleModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        role={selectedRole}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer le rôle"
        message={roleToDelete ? `Êtes-vous sûr de vouloir supprimer le rôle "${roleToDelete.name}" ?` : ''}
        details={
          roleToDelete
            ? [
                ...(roleToDelete._count?.users > 0
                  ? [
                      `⚠️ ${roleToDelete._count.users} utilisateur${roleToDelete._count.users > 1 ? 's' : ''} ${roleToDelete._count.users > 1 ? 'perdront' : 'perdra'} leurs permissions personnalisées`,
                    ]
                  : []),
                'Le rôle et toutes ses permissions seront supprimés',
              ]
            : []
        }
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />

      {/* Roles Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
        </div>
      ) : roles.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun rôle personnalisé</h3>
          <p className="mt-2 text-sm text-gray-500">
            Commencez par créer votre premier rôle personnalisé avec des permissions spécifiques
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="mt-6">
            Créer mon premier rôle
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {role.color && (
                    <div
                      className="h-10 w-10 rounded-lg"
                      style={{ backgroundColor: role.color }}
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                    {role.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {role.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <span className="text-sm text-gray-500">
                  {role._count?.users || 0} utilisateur{(role._count?.users || 0) !== 1 ? 's' : ''}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(role)}
                    className="rounded p-2 text-blue-600 hover:bg-blue-50"
                    title="Modifier"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(role)}
                    className="rounded p-2 text-red-600 hover:bg-red-50"
                    title="Supprimer"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
