'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskModal from '../modals/TaskModal';
import { api } from '@/lib/api';

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
  tasks: Task[];
}

interface KanbanBoardProps {
  projectId: string;
  canEdit: boolean;
}

export default function KanbanBoard({ projectId, canEdit }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadBoard();
  }, [projectId]);

  const loadBoard = async () => {
    try {
      setLoading(true);
      const response = await api.getAllTasks(projectId);
      if (response.board && response.board.columns) {
        setColumns(response.board.columns);
      }
    } catch (error) {
      console.error('Erreur chargement board:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = findTask(active.id as string);
    setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeTask = findTask(activeId);
    const overTask = findTask(overId);

    if (!activeTask) return;

    const activeColumn = findColumn(activeTask.columnId);
    const overColumn = overTask ? findColumn(overTask.columnId) : findColumn(overId);

    if (!activeColumn || !overColumn) return;

    if (activeColumn.id !== overColumn.id) {
      setColumns((columns) => {
        const newColumns = [...columns];
        const activeColIndex = newColumns.findIndex((c) => c.id === activeColumn.id);
        const overColIndex = newColumns.findIndex((c) => c.id === overColumn.id);

        const activeTasks = [...newColumns[activeColIndex].tasks];
        const overTasks = [...newColumns[overColIndex].tasks];

        const activeTaskIndex = activeTasks.findIndex((t) => t.id === activeId);
        const [movedTask] = activeTasks.splice(activeTaskIndex, 1);

        if (overTask) {
          const overTaskIndex = overTasks.findIndex((t) => t.id === overId);
          overTasks.splice(overTaskIndex, 0, { ...movedTask, columnId: overColumn.id });
        } else {
          overTasks.push({ ...movedTask, columnId: overColumn.id });
        }

        newColumns[activeColIndex].tasks = activeTasks;
        newColumns[overColIndex].tasks = overTasks;

        return newColumns;
      });
    } else {
      setColumns((columns) => {
        const newColumns = [...columns];
        const columnIndex = newColumns.findIndex((c) => c.id === activeColumn.id);
        const tasks = [...newColumns[columnIndex].tasks];

        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);

        newColumns[columnIndex].tasks = arrayMove(tasks, activeIndex, overIndex);

        return newColumns;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = findTask(activeId);
    if (!activeTask) return;

    const newColumnId = activeTask.columnId;
    const newPosition = columns
      .find((c) => c.id === newColumnId)
      ?.tasks.findIndex((t) => t.id === activeId) || 0;

    try {
      await api.moveTask(activeId, {
        columnId: newColumnId,
        position: newPosition,
      });
    } catch (error) {
      console.error('Erreur déplacement tâche:', error);
      loadBoard(); // Recharger en cas d'erreur
    }
  };

  const findTask = (id: string): Task | undefined => {
    for (const column of columns) {
      const task = column.tasks.find((t) => t.id === id);
      if (task) return task;
    }
  };

  const findColumn = (id: string): Column | undefined => {
    return columns.find((c) => c.id === id);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleCreateTask = (columnId: string) => {
    setSelectedTask({ columnId } as any);
    setIsTaskModalOpen(true);
  };

  const handleTaskModalClose = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  const handleTaskSaved = () => {
    loadBoard();
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={column.tasks}
              onTaskClick={handleTaskClick}
              onCreateTask={() => handleCreateTask(column.id)}
              canEdit={canEdit}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} onClick={() => {}} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={handleTaskModalClose}
          onSave={handleTaskSaved}
          task={selectedTask}
          projectId={projectId}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}
