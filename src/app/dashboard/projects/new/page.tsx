'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Link from 'next/link';

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE',
    prodUrl: '',
    betaUrl: '',
    repoUrl: '',
    startDate: '',
    endDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.createProject(formData);
      router.push(`/dashboard/projects/${response.project.id}`);
    } catch (err: any) {
      setError(err.error || 'Erreur lors de la création du projet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux projets
        </Link>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg bg-white p-8 shadow">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Nouveau projet</h1>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de base */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h2>
              
              <div className="space-y-4">
                <Input
                  label="Nom du projet"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Mon Super Projet"
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Description du projet..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Statut <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="ACTIVE">Actif</option>
                    <option value="PAUSED">En pause</option>
                    <option value="COMPLETED">Terminé</option>
                    <option value="ARCHIVED">Archivé</option>
                  </select>
                </div>
              </div>
            </div>

            {/* URLs */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Liens</h2>
              
              <div className="space-y-4">
                <Input
                  label="URL Production"
                  type="url"
                  value={formData.prodUrl}
                  onChange={(e) => setFormData({ ...formData, prodUrl: e.target.value })}
                  placeholder="https://mon-projet.com"
                />

                <Input
                  label="URL Beta"
                  type="url"
                  value={formData.betaUrl}
                  onChange={(e) => setFormData({ ...formData, betaUrl: e.target.value })}
                  placeholder="https://beta.mon-projet.com"
                />

                <Input
                  label="Repository"
                  type="url"
                  value={formData.repoUrl}
                  onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
                  placeholder="https://github.com/username/project"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Dates</h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Date de début"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />

                <Input
                  label="Date de fin"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
              <Link href="/dashboard/projects">
                <Button type="button" variant="secondary">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Création...' : 'Créer le projet'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
