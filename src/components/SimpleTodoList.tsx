import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Check, 
  Plus, 
  Trash2,
  ListTodo
} from 'lucide-react';

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export function SimpleTodoList() {
  const { toast } = useToast();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [todosLoaded, setTodosLoaded] = useState(false);

  // Load todos from localStorage on mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('dashboard_todos');
    if (savedTodos) {
      try {
        const parsed = JSON.parse(savedTodos);
        setTodos(parsed);
      } catch (error) {
        console.error('Error loading todos from localStorage:', error);
      }
    }
    setTodosLoaded(true);
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    if (todosLoaded) {
      try {
        localStorage.setItem('dashboard_todos', JSON.stringify(todos));
      } catch (error) {
        console.error('Error saving todos to localStorage:', error);
      }
    }
  }, [todos, todosLoaded]);

  const addTodo = useCallback(() => {
    if (!newTodoTitle.trim()) {
      return;
    }
    
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}`,
      title: newTodoTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    
    setTodos(prevTodos => [...prevTodos, newTodo]);
    setNewTodoTitle('');
    
    toast({
      title: "Task Added",
      description: `"${newTodo.title}" added to your list`,
    });
  }, [newTodoTitle, toast]);

  const toggleTodo = useCallback((id: string) => {
    setTodos(prevTodos => prevTodos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
  }, []);

  const completedCount = todos.filter(t => t.completed).length;
  const pendingCount = todos.filter(t => !t.completed).length;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            Quick Tasks
          </CardTitle>
          <div className="flex gap-2">
            {pendingCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {pendingCount} pending
              </Badge>
            )}
            {completedCount > 0 && (
              <Badge variant="outline" className="text-xs text-green-600">
                {completedCount} done
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add New Todo */}
        <div className="flex gap-2">
          <Input
            placeholder="Add a quick task..."
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTodo();
              }
            }}
            className="h-9 text-sm"
          />
          <Button 
            onClick={addTodo} 
            size="sm" 
            className="h-9 px-3"
            disabled={!newTodoTitle.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Todo List */}
        <div className="space-y-2 max-h-[280px] overflow-y-auto">
          {todos.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No tasks yet. Add one above!
            </div>
          ) : (
            todos.map((todo) => (
              <div 
                key={todo.id} 
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <button
                  type="button"
                  onClick={() => toggleTodo(todo.id)}
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    todo.completed 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-muted-foreground/50 hover:border-primary'
                  }`}
                >
                  {todo.completed && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </button>
                
                <span className={`flex-1 text-sm ${
                  todo.completed 
                    ? 'line-through text-muted-foreground' 
                    : 'text-foreground'
                }`}>
                  {todo.title}
                </span>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTodo(todo.id)}
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
