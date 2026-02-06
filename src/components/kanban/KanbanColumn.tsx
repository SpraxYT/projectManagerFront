'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import Button from '../ui/Button';

interface Task {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  position: number;
  assignments: Array<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  labels: Array<{
    label: {
      id: string;
      name: string;
      color: string;
      icon?: string;
    };
  }>;
  subtasks: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
  }>;
  _count: {
    comments: number;
  };
}

interface Column {
  id: string;
  name: string;
  color: string;
  position: number;
}

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onCreateTask: () => void;
  canEdit: boolean;
}

export default function KanbanColumn({
  column,
  tasks,
  onTaskClick,
  onCreateTask,
  canEdit,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const taskIds = tasks.map((task) => task.id);

  return (
    <div className="flex h-full min-w-[320px] max-w-[320px] flex-col rounded-lg border-2 border-gray-300 bg-white shadow-md">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4"
        style={{ borderBottom: `3px solid ${column.color}` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full shadow-sm"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-bold text-gray-900">{column.name}</h3>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 shadow-sm">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks */}
      <div
        ref={setNodeRef}
        className="flex-1 space-y-3 overflow-y-auto p-4 bg-gray-50/50"
        style={{ minHeight: '200px' }}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-gray-400 font-medium">
            Aucune tâche
          </div>
        )}
      </div>

      {/* Add Task Button */}
      {canEdit && (
        <div className="border-t border-gray-200 p-3 bg-white">
          <button
            onClick={onCreateTask}
            className="w-full text-left text-sm text-gray-500 hover:text-gray-700 transition-colors py-2 px-3 rounded hover:bg-gray-50"
          >
            + Ajouter une tâche
          </button>
        </div>
      )}
    </div>
  );
}
