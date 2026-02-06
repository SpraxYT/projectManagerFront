'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  task: any;
  projectId: string;
  canEdit: boolean;
}

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  task,
  projectId,
  canEdit,
}: TaskModalProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'comments'>('details');
  
  // Task data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  
  // Related data
  const [labels, setLabels] = useState<any[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  
  // UI states
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isNewTask = !task?.id;

  useEffect(() => {
    if (isOpen) {
      if (task?.id) {
        loadTaskDetails();
      } else {
        resetForm();
      }
      loadLabels();
      loadMembers();
    }
  }, [isOpen, task]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setDueDate('');
    setSelectedLabels([]);
    setSelectedMembers([]);
    setSubtasks([]);
    setComments([]);
  };

  const loadTaskDetails = async () => {
    try {
      const response = await api.getTaskById(task.id);
      const taskData = response.task;
      
      setTitle(taskData.title || '');
      setDescription(taskData.description || '');
      setPriority(taskData.priority || 'MEDIUM');
      setDueDate(taskData.dueDate ? taskData.dueDate.split('T')[0] : '');
      setSelectedLabels(taskData.labels?.map((tl: any) => tl.label.id) || []);
      setSelectedMembers(taskData.assignments?.map((a: any) => a.user.id) || []);
      setSubtasks(taskData.subtasks || []);
      setComments(taskData.comments || []);
    } catch (error) {
      console.error('Erreur chargement tâche:', error);
    }
  };

  const loadLabels = async () => {
    try {
      const response = await api.getLabels(projectId);
      setLabels(response.labels || []);
    } catch (error) {
      console.error('Erreur chargement labels:', error);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await api.getProjectMembers(projectId);
      setMembers(response.members || []);
    } catch (error) {
      console.error('Erreur chargement membres:', error);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Le titre est requis');
      return;
    }

    setLoading(true);
    try {
      const data = {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        assignees: selectedMembers,
        labelIds: selectedLabels,
      };

      if (isNewTask) {
        await api.createTask(task.columnId, data);
      } else {
        await api.updateTask(task.id, data);
        
        // Gérer les assignations
        const currentAssignees = task.assignments?.map((a: any) => a.user.id) || [];
        const toAdd = selectedMembers.filter((id) => !currentAssignees.includes(id));
        const toRemove = currentAssignees.filter((id: string) => !selectedMembers.includes(id));
        
        for (const userId of toAdd) {
          await api.assignTask(task.id, userId);
        }
        for (const userId of toRemove) {
          await api.unassignTask(task.id, userId);
        }
        
        // Gérer les labels
        const currentLabels = task.labels?.map((tl: any) => tl.label.id) || [];
        const labelsToAdd = selectedLabels.filter((id) => !currentLabels.includes(id));
        const labelsToRemove = currentLabels.filter((id: string) => !selectedLabels.includes(id));
        
        for (const labelId of labelsToAdd) {
          await api.addLabelToTask(task.id, labelId);
        }
        for (const labelId of labelsToRemove) {
          await api.removeLabelFromTask(task.id, labelId);
        }
      }

      onSave();
    } catch (error: any) {
      alert(error.error || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task?.id) return;
    
    try {
      await api.deleteTask(task.id);
      onSave();
    } catch (error: any) {
      alert(error.error || 'Erreur lors de la suppression');
    }
  };

  // Subtasks
  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !task?.id) return;

    try {
      const response = await api.createSubtask(task.id, { title: newSubtaskTitle });
      setSubtasks([...subtasks, response.subtask]);
      setNewSubtaskTitle('');
    } catch (error: any) {
      alert(error.error || 'Erreur');
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    try {
      const response = await api.toggleSubtask(subtaskId);
      setSubtasks(subtasks.map((s) => (s.id === subtaskId ? response.subtask : s)));
    } catch (error: any) {
      alert(error.error || 'Erreur');
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await api.deleteSubtask(subtaskId);
      setSubtasks(subtasks.filter((s) => s.id !== subtaskId));
    } catch (error: any) {
      alert(error.error || 'Erreur');
    }
  };

  // Comments
  const handleAddComment = async () => {
    if (!newComment.trim() || !task?.id) return;

    try {
      const response = await api.createComment(task.id, { content: newComment });
      setComments([...comments, response.comment]);
      setNewComment('');
    } catch (error: any) {
      alert(error.error || 'Erreur');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.deleteComment(commentId);
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (error: any) {
      alert(error.error || 'Erreur');
    }
  };

  const toggleLabel = (labelId: string) => {
    if (selectedLabels.includes(labelId)) {
      setSelectedLabels(selectedLabels.filter((id) => id !== labelId));
    } else {
      setSelectedLabels([...selectedLabels, labelId]);
    }
  };

  const toggleMember = (userId: string) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isNewTask ? 'Nouvelle tâche' : 'Modifier la tâche'}
        size="xl"
      >
        <div className="space-y-4">
          {/* Title */}
          <Input
            label="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la tâche..."
            required
            disabled={!canEdit}
          />

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la tâche..."
              rows={4}
              disabled={!canEdit}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Priorité
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                disabled={!canEdit}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="LOW">🟢 Basse</option>
                <option value="MEDIUM">🟡 Moyenne</option>
                <option value="HIGH">🟠 Haute</option>
                <option value="URGENT">🔴 Urgente</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Date d'échéance
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={!canEdit}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Étiquettes
            </label>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  disabled={!canEdit}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition-all ${
                    selectedLabels.includes(label.id)
                      ? 'ring-2 ring-blue-500'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: `${label.color}20`,
                    color: label.color,
                  }}
                >
                  {label.icon && <span>{label.icon}</span>}
                  {label.name}
                </button>
              ))}
            </div>
          </div>

          {/* Assignees */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Assigné à
            </label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <button
                  key={member.user.id}
                  type="button"
                  onClick={() => toggleMember(member.user.id)}
                  disabled={!canEdit}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                    selectedMembers.includes(member.user.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                    {member.user.firstName.charAt(0)}
                    {member.user.lastName.charAt(0)}
                  </div>
                  {member.user.firstName} {member.user.lastName}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs (only for existing tasks) */}
          {!isNewTask && (
            <>
              <div className="border-t pt-4">
                <div className="flex gap-4 border-b">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`pb-2 text-sm font-medium transition-colors ${
                      activeTab === 'details'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Détails
                  </button>
                  <button
                    onClick={() => setActiveTab('subtasks')}
                    className={`pb-2 text-sm font-medium transition-colors ${
                      activeTab === 'subtasks'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Sous-tâches ({subtasks.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`pb-2 text-sm font-medium transition-colors ${
                      activeTab === 'comments'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Commentaires ({comments.length})
                  </button>
                </div>
              </div>

              {/* Subtasks Tab */}
              {activeTab === 'subtasks' && (
                <div className="space-y-3">
                  {canEdit && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                        placeholder="Nouvelle sous-tâche..."
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <Button size="sm" onClick={handleAddSubtask}>
                        Ajouter
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 p-2"
                      >
                        <input
                          type="checkbox"
                          checked={subtask.isCompleted}
                          onChange={() => handleToggleSubtask(subtask.id)}
                          disabled={!canEdit}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span
                          className={`flex-1 text-sm ${
                            subtask.isCompleted
                              ? 'text-gray-400 line-through'
                              : 'text-gray-700'
                          }`}
                        >
                          {subtask.title}
                        </span>
                        {canEdit && (
                          <button
                            onClick={() => handleDeleteSubtask(subtask.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    {subtasks.length === 0 && (
                      <p className="text-center text-sm text-gray-400">
                        Aucune sous-tâche
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Comments Tab */}
              {activeTab === 'comments' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      rows={2}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <Button size="sm" onClick={handleAddComment}>
                      Envoyer
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-lg border border-gray-200 p-3"
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                              {comment.user.firstName.charAt(0)}
                              {comment.user.lastName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {comment.user.firstName} {comment.user.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          {user?.id === comment.user.id && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-center text-sm text-gray-400">
                        Aucun commentaire
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex justify-between border-t pt-4">
            <div>
              {!isNewTask && canEdit && (
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Supprimer
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}>
                Annuler
              </Button>
              {canEdit && (
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'Enregistrement...' : isNewTask ? 'Créer' : 'Mettre à jour'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Supprimer la tâche"
        message="Êtes-vous sûr de vouloir supprimer cette tâche ?"
        details={[
          'Toutes les sous-tâches seront supprimées',
          'Tous les commentaires seront supprimés',
          'Cette action est irréversible',
        ]}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />
    </>
  );
}
