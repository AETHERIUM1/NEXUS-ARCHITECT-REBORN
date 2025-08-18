import { FunctionDeclaration, Type } from "@google/genai";

export const workspaceTools: FunctionDeclaration[] = [
  {
    name: "addTask",
    description: "Adds a new task to the workspace Kanban board.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        content: { 
            type: Type.STRING, 
            description: "The detailed content or description of the task." 
        },
        status: { 
            type: Type.STRING, 
            enum: ["todo", "inProgress", "done"], 
            description: "The column to add the task to. Defaults to 'todo' if not specified." 
        }
      },
      required: ["content"]
    }
  },
  {
    name: "moveTask",
    description: "Moves an existing task to a different column on the board. To find the task ID, you can first list the tasks.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            taskId: {
                type: Type.STRING,
                description: "The ID of the task to move (e.g., 'task-1')."
            },
            newStatus: {
                type: Type.STRING,
                enum: ["todo", "inProgress", "done"],
                description: "The destination column for the task."
            }
        },
        required: ["taskId", "newStatus"]
    }
  },
  {
    name: "listTasks",
    description: "Lists all tasks currently on the board, optionally filtering by a specific column.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            status: {
                type: Type.STRING,
                enum: ["todo", "inProgress", "done"],
                description: "Optional. The column to list tasks from."
            }
        }
    }
  }
];
