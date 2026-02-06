'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

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
}

export default function KanbanColumn({
  column,
  tasks,
  onTaskClick,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const taskIds = tasks.map((task) => task.id);

  return (
    <div className="flex h-full min-w-[300px] max-w-[300px] flex-col rounded-xl bg-gray-50 shadow-sm border border-gray-200">
      {/* Header */}
      <div 
        className="flex items-center gap-2 p-3 bg-white rounded-t-xl"
        style={{ borderLeft: `4px solid ${column.color}` }}
      >
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        <h3 className="font-semibold text-gray-800 text-sm">{column.name}</h3>
        <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          {tasks.length}
        </span>
      </div>

      {/* Tasks */}
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2.5 overflow-y-auto p-3"
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
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Aucune tâche
          </div>
        )}
      </div>
    </div>
  );
}
