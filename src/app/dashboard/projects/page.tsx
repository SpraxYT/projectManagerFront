'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Link from 'next/link';

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
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
  _count: {
    credentials: number;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadProjects();
  }, [search, statusFilter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      
      const response = await api.getProjects(params);
      setProjects(response.projects || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des projets:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'Actif';
      case 'PAUSED':
        return 'En pause';
      case 'ARCHIVED':
        return 'Archivé';
      case 'COMPLETED':
        return 'Terminé';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement des projets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projets</h1>
          <p className="mt-2 text-gray-600">
            Gérez vos projets et leurs accès
          </p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button>
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau projet
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher un projet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Actif</option>
          <option value="PAUSED">En pause</option>
          <option value="COMPLETED">Terminé</option>
          <option value="ARCHIVED">Archivé</option>
        </select>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun projet</h3>
          <p className="mt-2 text-gray-600">
            Commencez par créer votre premier projet
          </p>
          <Link href="/dashboard/projects/new">
            <Button className="mt-4">Créer un projet</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="group relative rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                      {project.description}
                    </p>
                  )}
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(project.status)}`}>
                  {getStatusLabel(project.status)}
                </span>
              </div>

              {/* URLs */}
              <div className="mb-4 space-y-1">
                {project.prodUrl && (
                  <div className="flex items-center text-xs text-gray-600">
                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Production
                  </div>
                )}
                {project.betaUrl && (
                  <div className="flex items-center text-xs text-gray-600">
                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Beta
                  </div>
                )}
                {project.repoUrl && (
                  <div className="flex items-center text-xs text-gray-600">
                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    Repository
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {project.members.length} membre{project.members.length > 1 ? 's' : ''}
                </div>
                <div className="flex items-center text-gray-600">
                  <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  {project._count.credentials} mot{project._count.credentials > 1 ? 's' : ''} de passe
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
