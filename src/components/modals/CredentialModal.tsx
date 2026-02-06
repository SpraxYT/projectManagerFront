'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface CredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  credential?: any;
}

export default function CredentialModal({
  isOpen,
  onClose,
  onSave,
  credential,
}: CredentialModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'OTHER',
    name: '',
    username: '',
    password: '',
    url: '',
    notes: '',
  });

  useEffect(() => {
    if (credential) {
      setFormData({
        type: credential.type || 'OTHER',
        name: credential.name || '',
        username: credential.username || '',
        password: '', // Ne pas pré-remplir le mot de passe pour la sécurité
        url: credential.url || '',
        notes: credential.notes || '',
      });
    } else {
      setFormData({
        type: 'OTHER',
        name: '',
        username: '',
        password: '',
        url: '',
        notes: '',
      });
    }
  }, [credential, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si on édite et qu'il n'y a pas de mot de passe, ne pas l'envoyer
    const dataToSend = { ...formData };
    if (credential && !dataToSend.password) {
      delete dataToSend.password;
    }

    setLoading(true);
    try {
      await onSave(dataToSend);
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
          {credential ? 'Modifier le mot de passe' : 'Ajouter un mot de passe'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="FTP">FTP</option>
              <option value="DATABASE">Base de données</option>
              <option value="ADMIN">Panneau Admin</option>
              <option value="API">API</option>
              <option value="SSH">SSH</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>

          <Input
            label="Nom"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Ex: FTP Production, Admin Panel"
          />

          <Input
            label="Nom d'utilisateur"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="Ex: admin, root"
          />

          <Input
            label="Mot de passe"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!credential}
            placeholder={credential ? 'Laisser vide pour ne pas modifier' : '••••••••'}
          />

          <Input
            label="URL"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="https://..."
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Informations complémentaires..."
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : credential ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
