'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import ProjectModal from '@/components/modals/ProjectModal';
import AddMemberModal from '@/components/modals/AddMemberModal';
import CredentialModal from '@/components/modals/CredentialModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import PromptModal from '@/components/ui/PromptModal';
import KanbanBoard from '@/components/kanban/KanbanBoard';

type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'COMPLETED';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  prodUrl?: string;
  betaUrl?: string;
  repoUrl?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  members: Array<{
    role: string;
    joinedAt: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  _count: {
    credentials: number;
  };
}

interface Credential {
  id: string;
  type: string;
  name: string;
  username?: string;
  url?: string;
  notes?: string;
  createdAt: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { user } = useAuthStore();

  const [project, setProject] = useState<Project | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'kanban' | 'members' | 'credentials' | 'settings'>('kanban');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  
  // États des modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  
  // États des confirmations
  const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState(false);
  const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ userId: string; userName: string } | null>(null);
  const [showChangeMemberRolePrompt, setShowChangeMemberRolePrompt] = useState(false);
  const [memberToChangeRole, setMemberToChangeRole] = useState<{ userId: string; userName: string; currentRole: string } | null>(null);
  const [showDeleteCredentialConfirm, setShowDeleteCredentialConfirm] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadProject();
    loadCredentials();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await api.getProjectById(projectId);
      setProject(response.project);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCredentials = async () => {
    try {
      const response = await api.getProjectCredentials(projectId);
      setCredentials(response.credentials || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const revealPassword = async (credentialId: string) => {
    try {
      const response = await api.revealCredentialPassword(projectId, credentialId);
      setRevealedPasswords({ ...revealedPasswords, [credentialId]: response.password });
      
      // Masquer après 30 secondes
      setTimeout(() => {
        setRevealedPasswords((prev) => {
          const { [credentialId]: _, ...rest } = prev;
          return rest;
        });
      }, 30000);
    } catch (error: any) {
      alert(error.error || 'Erreur lors de la révélation du mot de passe');
    }
  };

  const getUserRole = (): string => {
    if (!project || !user) return 'VIEWER';
    const member = project.members.find((m) => m.user.id === user.id);
    return member?.role || 'VIEWER';
  };

  const canRevealPasswords = (): boolean => {
    if (user?.role === 'OWNER' || user?.role === 'ADMIN') return true;
    const projectRole = getUserRole();
    return projectRole === 'OWNER' || projectRole === 'MEMBER';
  };

  const canManageMembers = (): boolean => {
    if (user?.role === 'OWNER' || user?.role === 'ADMIN') return true;
    const projectRole = getUserRole();
    return projectRole === 'OWNER';
  };

  const handleEditProject = async (data: any) => {
    try {
      await api.updateProject(projectId, data);
      await loadProject();
    } catch (error: any) {
      alert(error.error || 'Erreur lors de la mise à jour');
      throw error;
    }
  };

  const deleteProject = () => {
    setShowDeleteProjectConfirm(true);
  };

  const confirmDeleteProject = async () => {
    try {
      await api.deleteProject(projectId);
      router.push('/dashboard/projects');
    } catch (error: any) {
      alert(error.error || 'Erreur lors de la suppression');
    }
  };

  const handleAddMember = async (userId: string, role: string) => {
    try {
      await api.addProjectMember(projectId, { userId, role });
      await loadProject();
    } catch (error: any) {
      alert(error.error || 'Erreur lors de l\'ajout du membre');
      throw error;
    }
  };

  const handleRemoveMember = (userId: string, userName: string) => {
    setMemberToRemove({ userId, userName });
    setShowRemoveMemberConfirm(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await api.removeProjectMember(projectId, memberToRemove.userId);
      await loadProject();
    } catch (error: any) {
      alert(error.error || 'Erreur lors de la suppression du membre');
    }
  };

  const handleChangeMemberRole = (userId: string, currentRole: string, userName: string) => {
    setMemberToChangeRole({ userId, userName, currentRole });
    setShowChangeMemberRolePrompt(true);
  };

  const confirmChangeMemberRole = async (newRole: string) => {
    if (!memberToChangeRole) return;

    try {
      await api.updateProjectMemberRole(projectId, memberToChangeRole.userId, newRole);
      await loadProject();
    } catch (error: any) {
      alert(error.error || 'Erreur lors de la modification du rôle');
    }
  };

  const handleSaveCredential = async (data: any) => {
    try {
      if (editingCredential) {
        await api.updateProjectCredential(projectId, editingCredential.id, data);
      } else {
        await api.createProjectCredential(projectId, data);
      }
      await loadCredentials();
      setEditingCredential(null);
    } catch (error: any) {
      alert(error.error || 'Erreur lors de l\'enregistrement');
      throw error;
    }
  };

  const handleDeleteCredential = (credentialId: string) => {
    setCredentialToDelete(credentialId);
    setShowDeleteCredentialConfirm(true);
  };

  const confirmDeleteCredential = async () => {
    if (!credentialToDelete) return;

    try {
      await api.deleteProjectCredential(projectId, credentialToDelete);
      await loadCredentials();
    } catch (error: any) {
      alert(error.error || 'Erreur lors de la suppression');
    }
  };

  const openEditCredential = (credential: Credential) => {
    setEditingCredential(credential);
    setShowCredentialModal(true);
  };

  const openNewCredential = () => {
    setEditingCredential(null);
    setShowCredentialModal(true);
  };

  if (loading || !project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux projets
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            {canManageMembers() && (
              <>
                <Button variant="secondary" size="sm" onClick={() => setShowEditModal(true)}>
                  Éditer
                </Button>
                <Button variant="danger" size="sm" onClick={deleteProject}>
                  Supprimer
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'kanban', label: 'Kanban', icon: '📋' },
            { id: 'members', label: 'Membres', icon: '👥', count: project.members.length },
            { id: 'credentials', label: 'Mots de passe', icon: '🔑', count: project._count.credentials },
            { id: 'settings', label: 'Paramètres', icon: '⚙️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center space-x-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{tab.count}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'kanban' && (
          <div>
            {/* Project Info Card */}
            <div className="mb-6 rounded-lg bg-white p-4 shadow-sm border border-gray-200">
              {project.description && (
                <p className="text-sm text-gray-700 mb-3">{project.description}</p>
              )}
              
              <div className="flex items-center gap-6 text-sm">
                {project.prodUrl && (
                  <a
                    href={project.prodUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 hover:underline"
                  >
                    <span>🚀</span>
                    <span>Production</span>
                  </a>
                )}
                {project.betaUrl && (
                  <a
                    href={project.betaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 hover:underline"
                  >
                    <span>🧪</span>
                    <span>Beta</span>
                  </a>
                )}
                {project.repoUrl && (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 hover:underline"
                  >
                    <span>📦</span>
                    <span>Repository</span>
                  </a>
                )}
                <span className="text-gray-500">
                  <span className="font-medium">Créé le</span> {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>

            {/* Kanban Board */}
            <div className="h-[calc(100vh-360px)]">
              <KanbanBoard projectId={projectId} canEdit={canManageMembers()} />
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Membres du projet</h2>
              {canManageMembers() && (
                <Button size="sm" onClick={() => setShowAddMemberModal(true)}>
                  Ajouter un membre
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {project.members.map((member) => (
                <div
                  key={member.user.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                      {member.user.firstName.charAt(0)}{member.user.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user.firstName} {member.user.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {canManageMembers() ? (
                      <button
                        onClick={() => handleChangeMemberRole(
                          member.user.id,
                          member.role,
                          `${member.user.firstName} ${member.user.lastName}`
                        )}
                        className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer"
                        title="Cliquer pour changer le rôle"
                      >
                        {member.role === 'OWNER' && '👑 Propriétaire'}
                        {member.role === 'MEMBER' && '👤 Membre'}
                        {member.role === 'VIEWER' && '👁️ Lecteur'}
                      </button>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
                        {member.role === 'OWNER' && '👑 Propriétaire'}
                        {member.role === 'MEMBER' && '👤 Membre'}
                        {member.role === 'VIEWER' && '👁️ Lecteur'}
                      </span>
                    )}
                    {canManageMembers() && member.role !== 'OWNER' && (
                      <button
                        onClick={() => handleRemoveMember(
                          member.user.id,
                          `${member.user.firstName} ${member.user.lastName}`
                        )}
                        className="text-red-600 hover:text-red-800"
                        title="Retirer du projet"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'credentials' && (
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Mots de passe</h2>
              {canRevealPasswords() && (
                <Button size="sm" onClick={openNewCredential}>
                  Ajouter un mot de passe
                </Button>
              )}
            </div>

            {!canRevealPasswords() && (
              <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
                ℹ️ Vous êtes <strong>Lecteur</strong> sur ce projet. Vous ne pouvez pas voir les mots de passe.
              </div>
            )}

            {credentials.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                Aucun mot de passe enregistré
              </div>
            ) : (
              <div className="space-y-3">
                {credentials.map((cred) => (
                  <div
                    key={cred.id}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                            {cred.type === 'FTP' && 'FTP'}
                            {cred.type === 'DATABASE' && 'Base de données'}
                            {cred.type === 'ADMIN' && 'Admin'}
                            {cred.type === 'API' && 'API'}
                            {cred.type === 'SSH' && 'SSH'}
                            {cred.type === 'OTHER' && 'Autre'}
                          </span>
                          <h3 className="font-medium text-gray-900">{cred.name}</h3>
                        </div>
                        
                        {cred.username && (
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Utilisateur :</span> {cred.username}
                          </p>
                        )}
                        
                        <div className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Mot de passe :</span>{' '}
                          {canRevealPasswords() ? (
                            revealedPasswords[cred.id] ? (
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                {revealedPasswords[cred.id]}
                              </span>
                            ) : (
                              <button
                                onClick={() => revealPassword(cred.id)}
                                className="text-blue-600 hover:underline"
                              >
                                Cliquer pour révéler
                              </button>
                            )
                          ) : (
                            <span className="text-gray-400">••••••••</span>
                          )}
                        </div>
                        
                        {cred.url && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">URL :</span>{' '}
                            <a href={cred.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {cred.url}
                            </a>
                          </p>
                        )}
                        
                        {cred.notes && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Notes :</span> {cred.notes}
                          </p>
                        )}
                      </div>
                      
                      {canRevealPasswords() && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditCredential(cred)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Modifier"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteCredential(cred.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Supprimer"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Détails du projet</h2>
              
              <dl className="grid gap-4 sm:grid-cols-2">
                {project.prodUrl && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Production</dt>
                    <dd className="mt-1">
                      <a
                        href={project.prodUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {project.prodUrl}
                      </a>
                    </dd>
                  </div>
                )}
                {project.betaUrl && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Beta</dt>
                    <dd className="mt-1">
                      <a
                        href={project.betaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {project.betaUrl}
                      </a>
                    </dd>
                  </div>
                )}
                {project.repoUrl && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Repository</dt>
                    <dd className="mt-1">
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {project.repoUrl}
                      </a>
                    </dd>
                  </div>
                )}
                {project.startDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Date de début</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(project.startDate).toLocaleDateString('fr-FR')}
                    </dd>
                  </div>
                )}
                {project.endDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Date de fin</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(project.endDate).toLocaleDateString('fr-FR')}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-600">Créé par</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {project.createdBy.firstName} {project.createdBy.lastName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Date de création</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>
              <div className="rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Membres du projet</h2>
                  {canManageMembers() && (
                    <Button size="sm" onClick={() => setShowAddMemberModal(true)}>
                      Ajouter un membre
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {project.members.map((member) => (
                    <div
                      key={member.user.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                          {member.user.firstName.charAt(0)}{member.user.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.user.firstName} {member.user.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{member.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {canManageMembers() ? (
                          <button
                            onClick={() => handleChangeMemberRole(
                              member.user.id,
                              member.role,
                              `${member.user.firstName} ${member.user.lastName}`
                            )}
                            className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer"
                            title="Cliquer pour changer le rôle"
                          >
                            {member.role === 'OWNER' && '👑 Propriétaire'}
                            {member.role === 'MEMBER' && '👤 Membre'}
                            {member.role === 'VIEWER' && '👁️ Lecteur'}
                          </button>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
                            {member.role === 'OWNER' && '👑 Propriétaire'}
                            {member.role === 'MEMBER' && '👤 Membre'}
                            {member.role === 'VIEWER' && '👁️ Lecteur'}
                          </span>
                        )}
                        {canManageMembers() && member.role !== 'OWNER' && (
                          <button
                            onClick={() => handleRemoveMember(
                              member.user.id,
                              `${member.user.firstName} ${member.user.lastName}`
                            )}
                            className="text-red-600 hover:text-red-800"
                            title="Retirer du projet"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mots de passe */}
              <div className="rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Mots de passe</h2>
                  {canRevealPasswords() && (
                    <Button size="sm" onClick={openNewCredential}>
                      Ajouter un mot de passe
                    </Button>
                  )}
                </div>

                {!canRevealPasswords() && (
                  <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
                    ℹ️ Vous êtes <strong>Lecteur</strong> sur ce projet. Vous ne pouvez pas voir les mots de passe.
                  </div>
                )}

                {credentials.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    Aucun mot de passe enregistré
                  </div>
                ) : (
                  <div className="space-y-3">
                    {credentials.map((cred) => (
                      <div
                        key={cred.id}
                        className="rounded-lg border border-gray-200 p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                                {cred.type === 'FTP' && 'FTP'}
                                {cred.type === 'DATABASE' && 'Base de données'}
                                {cred.type === 'ADMIN' && 'Admin'}
                                {cred.type === 'API' && 'API'}
                                {cred.type === 'SSH' && 'SSH'}
                                {cred.type === 'OTHER' && 'Autre'}
                              </span>
                              <h3 className="font-medium text-gray-900">{cred.name}</h3>
                            </div>
                            
                            {cred.username && (
                              <p className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">Utilisateur :</span> {cred.username}
                              </p>
                            )}
                            
                            <div className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Mot de passe :</span>{' '}
                              {canRevealPasswords() ? (
                                revealedPasswords[cred.id] ? (
                                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                    {revealedPasswords[cred.id]}
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => revealPassword(cred.id)}
                                    className="text-blue-600 hover:underline"
                                  >
                                    Cliquer pour révéler
                                  </button>
                                )
                              ) : (
                                <span className="text-gray-400">••••••••</span>
                              )}
                            </div>
                            
                            {cred.url && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">URL :</span>{' '}
                                <a href={cred.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  {cred.url}
                                </a>
                              </p>
                            )}
                            
                            {cred.notes && (
                              <p className="text-sm text-gray-600 mt-2">
                                <span className="font-medium">Notes :</span> {cred.notes}
                              </p>
                            )}
                          </div>
                          
                          {canRevealPasswords() && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openEditCredential(cred)}
                                className="text-gray-600 hover:text-gray-900"
                                title="Modifier"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteCredential(cred.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Supprimer"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProjectModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditProject}
        project={project}
      />

      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onSave={handleAddMember}
        projectId={projectId}
        existingMembers={project?.members.map(m => m.user.id) || []}
      />

      <CredentialModal
        isOpen={showCredentialModal}
        onClose={() => {
          setShowCredentialModal(false);
          setEditingCredential(null);
        }}
        onSave={handleSaveCredential}
        credential={editingCredential}
      />

      {/* Delete Project Confirmation */}
      <ConfirmModal
        isOpen={showDeleteProjectConfirm}
        onClose={() => setShowDeleteProjectConfirm(false)}
        onConfirm={confirmDeleteProject}
        title="Supprimer le projet"
        message={project ? `Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ?` : ''}
        details={[
          'Tous les membres perdront l\'accès',
          'Tous les mots de passe seront supprimés',
          'Toutes les tâches seront supprimées',
        ]}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />

      {/* Remove Member Confirmation */}
      <ConfirmModal
        isOpen={showRemoveMemberConfirm}
        onClose={() => setShowRemoveMemberConfirm(false)}
        onConfirm={confirmRemoveMember}
        title="Retirer le membre du projet"
        message={memberToRemove ? `Êtes-vous sûr de vouloir retirer ${memberToRemove.userName} de ce projet ?` : ''}
        details={[
          'L\'accès au projet et ses informations',
          'L\'accès aux mots de passe',
          'L\'accès aux tâches du projet',
        ]}
        confirmText="Retirer"
        cancelText="Annuler"
        variant="warning"
      />

      {/* Change Member Role Prompt */}
      <PromptModal
        isOpen={showChangeMemberRolePrompt}
        onClose={() => setShowChangeMemberRolePrompt(false)}
        onConfirm={confirmChangeMemberRole}
        title="Changer le rôle du membre"
        message={memberToChangeRole ? `Changer le rôle de ${memberToChangeRole.userName}` : ''}
        inputType="select"
        defaultValue={memberToChangeRole?.currentRole || 'MEMBER'}
        options={[
          { value: 'OWNER', label: '👑 Propriétaire - contrôle total' },
          { value: 'MEMBER', label: '👤 Membre - peut modifier et révéler mots de passe' },
          { value: 'VIEWER', label: '👁️ Lecteur - lecture seule' },
        ]}
      />

      {/* Delete Credential Confirmation */}
      <ConfirmModal
        isOpen={showDeleteCredentialConfirm}
        onClose={() => setShowDeleteCredentialConfirm(false)}
        onConfirm={confirmDeleteCredential}
        title="Supprimer le mot de passe"
        message="Êtes-vous sûr de vouloir supprimer ce mot de passe ?"
        details={[
          'Cette action est irréversible',
          'Le mot de passe sera définitivement supprimé',
        ]}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />
    </div>
  );
}
