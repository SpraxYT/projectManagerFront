'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import ProjectModal from '@/components/modals/ProjectModal';
import AddMemberModal from '@/components/modals/AddMemberModal';
import CredentialModal from '@/components/modals/CredentialModal';

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

  const [project, setProject] = useState<Project | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'credentials'>('info');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  
  // États des modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);

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

  const handleEditProject = async (data: any) => {
    try {
      await api.updateProject(projectId, data);
      await loadProject();
    } catch (error: any) {
      alert(error.error || 'Erreur lors de la mise à jour');
      throw error;
    }
  };

  const deleteProject = async () => {
    const confirmed = window.confirm(
      '⚠️ ATTENTION : Cette action est irréversible !\n\n' +
      `Êtes-vous sûr de vouloir supprimer le projet "${project?.name}" ?\n\n` +
      'Toutes les données associées (membres, mots de passe) seront définitivement supprimées.'
    );
    
    if (!confirmed) return;

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

  const handleRemoveMember = async (userId: string) => {
    const confirmed = window.confirm('Êtes-vous sûr de vouloir retirer ce membre ?');
    if (!confirmed) return;

    try {
      await api.removeProjectMember(projectId, userId);
      await loadProject();
    } catch (error: any) {
      alert(error.error || 'Erreur lors de la suppression du membre');
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

  const handleDeleteCredential = async (credentialId: string) => {
    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer ce mot de passe ?');
    if (!confirmed) return;

    try {
      await api.deleteProjectCredential(projectId, credentialId);
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
      <div className="mb-8">
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
            {project.description && (
              <p className="mt-2 text-gray-600">{project.description}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="secondary" size="sm" onClick={() => setShowEditModal(true)}>
              Éditer
            </Button>
            <Button variant="danger" size="sm" onClick={deleteProject}>
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'info', label: 'Informations', icon: 'ℹ️' },
            { id: 'members', label: 'Membres', icon: '👥', count: project.members.length },
            { id: 'credentials', label: 'Mots de passe', icon: '🔑', count: project._count.credentials },
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
        {activeTab === 'info' && (
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

        {activeTab === 'members' && (
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Membres du projet</h2>
              <Button size="sm" onClick={() => setShowAddMemberModal(true)}>
                Ajouter un membre
              </Button>
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
                  <div className="flex items-center space-x-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
                      {member.role}
                    </span>
                    {member.role !== 'OWNER' && (
                      <button
                        onClick={() => handleRemoveMember(member.user.id)}
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
              <Button size="sm" onClick={openNewCredential}>
                Ajouter un mot de passe
              </Button>
            </div>

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
                          {revealedPasswords[cred.id] ? (
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
                    </div>
                  </div>
                ))}
              </div>
            )}
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
    </div>
  );
}
