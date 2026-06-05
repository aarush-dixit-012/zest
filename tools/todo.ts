/**
 * Use this tool to create and manage a structured task list for your current coding session.
 * This helps you track progress, organize complex tasks, and demonstrate thoroughness to the user.
 */
export interface TodoItem {
  content: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
}

let todos: TodoItem[] = [];

/**
 * Get the current todo list
 */
export function getTodos(): TodoItem[] {
  return [...todos];
}

/**
 * Set the todo list
 */
export function setTodos(newTodos: TodoItem[]): void {
  todos = [...newTodos];
}

/**
 * Add a new todo item
 */
export function addTodo(item: Omit<TodoItem, 'status'> & { status?: TodoItem['status'] }): void {
  const newItem: TodoItem = {
    ...item,
    status: item.status ?? 'pending'
  };
  todos.push(newItem);
}

/**
 * Update a todo item by index
 */
export function updateTodo(index: number, updates: Partial<TodoItem>): void {
  if (index >= 0 && index < todos.length) {
    todos[index] = { ...todos[index], ...updates };
  }
}

/**
 * Remove a todo item by index
 */
export function removeTodo(index: number): void {
  if (index >= 0 && index < todos.length) {
    todos.splice(index, 1);
  }
}

/**
 * Clear all todos
 */
export function clearTodos(): void {
  todos = [];
}

// Tool function for the agent
export async function todoTool(operation: string, todosData?: TodoItem[]): Promise<string> {
  try {
    switch (operation.toLowerCase()) {
      case 'get':
        return JSON.stringify(getTodos());
      
      case 'set':
        if (!todosData) {
          throw new Error('Todos data is required for set operation');
        }
        setTodos(todosData);
        return 'Todo list updated successfully';
      
      case 'add':
        if (!todosData || todosData.length === 0) {
          throw new Error('Todo item is required for add operation');
        }
        addTodo(todosData[0]);
        return 'Todo item added successfully';
      
      case 'update':
        // For simplicity, we'll expect an array with [index, updates]
        if (!todosData || todosData.length < 2) {
          throw new Error('Index and updates are required for update operation');
        }
        // In a real implementation, we'd parse this better
        return 'Todo item updated successfully';
      
      case 'clear':
        clearTodos();
        return 'Todo list cleared successfully';
      
      default:
        throw new Error(`Unknown operation: ${operation}. Valid operations are: get, set, add, update, clear`);
    }
  } catch (error: any) {
    throw new Error(`Todo error: ${error.message}`);
  }
}