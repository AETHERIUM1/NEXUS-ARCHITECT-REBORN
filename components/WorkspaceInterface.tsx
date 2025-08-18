import React, { useState, useContext } from 'react';
import { ViewContainer } from './ViewContainer';
import { Status, Task } from '../types';
import { WorkspaceContext } from '../contexts/WorkspaceContext';

const Column: React.FC<{
  title: string;
  tasks: Task[];
  status: Status;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string, sourceStatus: Status) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, targetStatus: Status) => void;
  isDraggingOver: boolean;
}> = ({ title, tasks, status, onDragStart, onDragOver, onDrop, isDraggingOver }) => (
  <div
    onDragOver={onDragOver}
    onDrop={(e) => onDrop(e, status)}
    className={`bg-slate-900/50 p-4 rounded-lg flex-1 transition-colors ${isDraggingOver ? 'bg-cyan-900/50' : ''}`}
  >
    <h3 className="font-bold text-lg text-white mb-4 border-b border-slate-700 pb-2">{title}</h3>
    <div className="space-y-3 min-h-[200px]">
      {tasks.map(task => (
        <div
          key={task.id}
          draggable
          onDragStart={(e) => onDragStart(e, task.id, status)}
          className="bg-slate-800 p-3 rounded-md shadow-md cursor-grab active:cursor-grabbing border border-slate-700 hover:border-cyan-500"
        >
          {task.content}
        </div>
      ))}
    </div>
  </div>
);

export const WorkspaceInterface: React.FC = () => {
  const { tasks, setTasks, addTask } = useContext(WorkspaceContext);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [draggingOver, setDraggingOver] = useState<Status | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string, sourceStatus: Status) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('sourceStatus', sourceStatus);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: Status) => {
    e.preventDefault();
    setDraggingOver(status);
  };
  
  const handleDragLeave = () => {
    setDraggingOver(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: Status) => {
    e.preventDefault();
    setDraggingOver(null);
    const taskId = e.dataTransfer.getData('taskId');
    const sourceStatus = e.dataTransfer.getData('sourceStatus') as Status;

    if (sourceStatus === targetStatus) return;

    let taskToMove: Task | undefined;
    const newTasks = { ...tasks };

    // Remove from source
    const sourceColumn = [...newTasks[sourceStatus]];
    const taskIndex = sourceColumn.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
      [taskToMove] = sourceColumn.splice(taskIndex, 1);
      newTasks[sourceStatus] = sourceColumn;
    }

    // Add to target
    if (taskToMove) {
      const targetColumn = [...newTasks[targetStatus]];
      targetColumn.push(taskToMove);
      newTasks[targetStatus] = targetColumn;
    }

    setTasks(newTasks);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim()) return;
    addTask(newTaskContent.trim(), 'todo');
    setNewTaskContent('');
  };

  return (
    <ViewContainer title="Team Workspace">
      <p className="text-slate-400 mb-2 max-w-3xl">
        Manage shared projects with a collaborative task board. Your board is saved locally and can be managed by NEXUS from the chat interface.
      </p>
      <p className="text-xs text-cyan-400 bg-cyan-900/30 p-2 rounded-md mb-8 max-w-3xl">
        Try this: Go to the main chat and say "add a task to deploy the staging server to the todo column".
      </p>


      <form onSubmit={handleAddTask} className="mb-8 flex gap-3">
        <input
          type="text"
          value={newTaskContent}
          onChange={(e) => setNewTaskContent(e.target.value)}
          placeholder="Add a new task to 'To Do'..."
          className="flex-grow bg-slate-900/80 border border-slate-700 rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
        />
        <button type="submit" className="px-6 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-500 disabled:bg-slate-600">
          Add Task
        </button>
      </form>

      <div className="flex flex-col md:flex-row gap-6" onDragLeave={handleDragLeave}>
        <Column
          title="To Do"
          tasks={tasks.todo}
          status="todo"
          onDragStart={handleDragStart}
          onDragOver={(e) => handleDragOver(e, 'todo')}
          onDrop={handleDrop}
          isDraggingOver={draggingOver === 'todo'}
        />
        <Column
          title="In Progress"
          tasks={tasks.inProgress}
          status="inProgress"
          onDragStart={handleDragStart}
          onDragOver={(e) => handleDragOver(e, 'inProgress')}
          onDrop={handleDrop}
          isDraggingOver={draggingOver === 'inProgress'}
        />
        <Column
          title="Done"
          tasks={tasks.done}
          status="done"
          onDragStart={handleDragStart}
          onDragOver={(e) => handleDragOver(e, 'done')}
          onDrop={handleDrop}
          isDraggingOver={draggingOver === 'done'}
        />
      </div>
    </ViewContainer>
  );
};
