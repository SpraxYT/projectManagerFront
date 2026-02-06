'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
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

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
};

const priorityIcons = {
  LOW: '🟢',
  MEDIUM: '🟡',
  HIGH: '🟠',
  URGENT: '🔴',
};

export default function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const completedSubtasks = task.subtasks.filter((s) => s.isCompleted).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`cursor-pointer rounded-lg border border-gray-200 bg-white p-3 transition-all hover:shadow-md hover:border-gray-300 ${
        isDragging ? 'rotate-2 scale-105 shadow-lg' : ''
      }`}
    >
      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map((tl) => (
            <span
              key={tl.label.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${tl.label.color}20`,
                color: tl.label.color,
              }}
            >
              {tl.label.icon && <span>{tl.label.icon}</span>}
              {tl.label.name}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <h4 className="mb-2 font-medium text-gray-900">{task.title}</h4>

      {/* Description preview */}
      {task.description && (
        <p className="mb-2 line-clamp-2 text-sm text-gray-600">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Priority */}
          <span
            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${
              priorityColors[task.priority]
            }`}
          >
            {priorityIcons[task.priority]}
          </span>

          {/* Subtasks */}
          {totalSubtasks > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}

          {/* Comments */}
          {task._count.comments > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              {task._count.comments}
            </span>
          )}
        </div>

        {/* Assignees */}
        {task.assignments.length > 0 && (
          <div className="flex -space-x-2">
            {task.assignments.slice(0, 3).map((assignment) => (
              <div
                key={assignment.user.id}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white ring-2 ring-white"
                title={`${assignment.user.firstName} ${assignment.user.lastName}`}
              >
                {assignment.user.firstName.charAt(0)}
                {assignment.user.lastName.charAt(0)}
              </div>
            ))}
            {task.assignments.length > 3 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-xs font-semibold text-gray-600 ring-2 ring-white">
                +{task.assignments.length - 3}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Due Date */}
      {task.dueDate && (
        <div className="mt-2 text-xs text-gray-500">
          📅 {new Date(task.dueDate).toLocaleDateString('fr-FR')}
        </div>
      )}
    </div>
  );
}
