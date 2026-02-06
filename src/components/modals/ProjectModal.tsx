'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  project?: any;
}

export default function ProjectModal({ isOpen, onClose, onSave, project }: ProjectModalProps) {
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'ACTIVE',
        prodUrl: project.prodUrl || '',
        betaUrl: project.betaUrl || '',
        repoUrl: project.repoUrl || '',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'ACTIVE',
        prodUrl: '',
        betaUrl: '',
        repoUrl: '',
        startDate: '',
        endDate: '',
      });
    }
  }, [project, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <form onSubmit={handleSubmit}>
        <h2 className="mb-6 text-xl font-semibold text-gray-900">
          {project ? 'Modifier le projet' : 'Nouveau projet'}
        </h2>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Informations de base */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Informations générales</h3>
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
                  rows={3}
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
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Liens</h3>
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
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Dates</h3>
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
        </div>

        <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : project ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
