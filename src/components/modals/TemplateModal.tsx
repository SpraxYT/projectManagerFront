'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (templateId: string) => void;
  projectId: string;
}

export default function TemplateModal({
  isOpen,
  onClose,
  onApply,
  projectId,
}: TemplateModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.getTemplates();
      setTemplates(response.templates || []);
    } catch (error) {
      console.error('Erreur chargement templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedTemplate) return;

    try {
      setApplying(true);
      await api.applyTemplate(projectId, selectedTemplate);
      onApply(selectedTemplate);
      onClose();
    } catch (error) {
      console.error('Erreur application template:', error);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Appliquer un template"
      size="lg"
    >
      <div className="space-y-4">
        {/* Warning */}
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
          <p className="font-medium mb-1">⚠️ Attention</p>
          <p>L'application d'un template va <strong>supprimer toutes les colonnes et tâches existantes</strong> et les remplacer par celles du template.</p>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
          </div>
        ) : (
          <div className="grid gap-3 max-h-[500px] overflow-y-auto">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`text-left rounded-lg border-2 p-4 transition-all ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{template.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                  {selectedTemplate === template.id && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between border-t pt-4">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleApply}
            disabled={!selectedTemplate || applying}
          >
            {applying ? 'Application...' : 'Appliquer le template'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
