import React, { createContext, useCallback } from 'react';
import { Task, Tasks, Status } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { INITIAL_WORKSPACE_TASKS } from '../constants';

interface WorkspaceContextType {
  tasks: Tasks;
  setTasks: (tasks: Tasks) => void;
  addTask: (content: string, status: Status) => { success: boolean, taskId: string };
  moveTask: (taskId: string, newStatus: Status) => { success: boolean, error?: string };
  listTasks: (status?: Status) => Task[] | Tasks;
}

export const WorkspaceContext = createContext<WorkspaceContextType>(null!);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useLocalStorage<Tasks>('nexus-workspace-tasks', INITIAL_WORKSPACE_TASKS);

  const addTask = useCallback((content: string, status: Status = 'todo'): { success: boolean, taskId: string } => {
    const taskId = `task-${Date.now()}`;
    const newTask: Task = { id: taskId, content };

    setTasks(prevTasks => {
      const newColumn = [...prevTasks[status], newTask];
      return { ...prevTasks, [status]: newColumn };
    });

    return { success: true, taskId };
  }, [setTasks]);

  const moveTask = useCallback((taskId: string, newStatus: Status): { success: boolean, error?: string } => {
    let taskToMove: Task | undefined;
    let sourceStatus: Status | undefined;

    // Find the task and its original column
    for (const key in tasks) {
        const statusKey = key as Status;
        const foundIndex = tasks[statusKey].findIndex(t => t.id === taskId);
        if (foundIndex !== -1) {
            taskToMove = tasks[statusKey][foundIndex];
            sourceStatus = statusKey;
            break;
        }
    }

    if (!taskToMove || !sourceStatus) {
        return { success: false, error: `Task with ID '${taskId}' not found.` };
    }
    
    if (sourceStatus === newStatus) {
        return { success: false, error: `Task '${taskId}' is already in the '${newStatus}' column.`};
    }

    setTasks(prevTasks => {
        // Remove from source column
        const sourceColumn = prevTasks[sourceStatus!].filter(t => t.id !== taskId);
        // Add to target column
        const targetColumn = [...prevTasks[newStatus], taskToMove!];
        return {
            ...prevTasks,
            [sourceStatus!]: sourceColumn,
            [newStatus]: targetColumn
        };
    });

    return { success: true };
  }, [tasks, setTasks]);
  
  const listTasks = useCallback((status?: Status): Task[] | Tasks => {
    if (status) {
        return tasks[status];
    }
    return tasks;
  }, [tasks]);

  const value = {
    tasks,
    setTasks,
    addTask,
    moveTask,
    listTasks,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};
