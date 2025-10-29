import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useGoogleClassroom } from '@/hooks/useGoogleClassroom';
import { useAuth } from '@/contexts/AuthContext';
import { usePersistentData } from '@/hooks/usePersistentData';
import { useToast } from '@/hooks/use-toast';
import { ErrorHandler } from '@/lib/errorHandler';
import { AssignmentSkeleton } from '@/components/LoadingSkeletons';
import { NoAssignments, ErrorState, EmptyState } from '@/components/EmptyStates';
import { assignmentSchema, validateForm } from '@/lib/validationSchemas';
import { 
  Calendar, 
  BookOpen, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Users,
  Plus,
  Trash2,
  Check,
  Edit2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function Assignments() {
  const { assignments, courses, isLoading, error, syncClassroomData, isAuthenticated } = useGoogleClassroom();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isRestoring, isRestored } = usePersistentData();
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '',
    classId: 'none',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  // Personal Todo List State
  interface TodoItem {
    id: string;
    title: string;
    status: 'In progress' | 'Mark received';
    dueDate: string;
    submittedTime: string;
    priority: 'Low' | 'Medium' | 'High';
  }

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [editingTodo, setEditingTodo] = useState<string | null>(null);
  const [editingDueDate, setEditingDueDate] = useState<string | null>(null);
  const [editingSubmittedTime, setEditingSubmittedTime] = useState<string | null>(null);
  const [todosLoaded, setTodosLoaded] = useState(false);

  // Load todos from localStorage on mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('personal_todos');
    console.log('Loading todos from localStorage:', savedTodos);
    if (savedTodos) {
      try {
        const parsed = JSON.parse(savedTodos);
        setTodos(parsed);
        console.log('Loaded todos:', parsed);
      } catch (error) {
        console.error('Error loading todos from localStorage:', error);
      }
    }
    setTodosLoaded(true);
  }, []);

  // Save todos to localStorage whenever they change (but only after initial load)
  useEffect(() => {
    if (todosLoaded) {
      console.log('Saving todos to localStorage:', todos);
      try {
        localStorage.setItem('personal_todos', JSON.stringify(todos));
      } catch (error) {
        console.error('Error saving todos to localStorage:', error);
      }
    }
  }, [todos, todosLoaded]);

  const addTodo = useCallback(() => {
    if (!newTodoTitle.trim()) {
      toast({
        title: "Empty Task",
        description: "Please enter a task title",
        variant: "destructive"
      });
      return;
    }
    
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}`,
      title: newTodoTitle.trim(),
      status: 'In progress',
      dueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      submittedTime: '',
      priority: 'Medium'
    };
    
    setTodos(prevTodos => [...prevTodos, newTodo]);
    setNewTodoTitle('');
    
    toast({
      title: "Task Added",
      description: `"${newTodo.title}" has been added to your todo list`,
    });
  }, [newTodoTitle, toast]);

  const updateTodo = useCallback((id: string, field: keyof TodoItem, value: any) => {
    setTodos(prevTodos => prevTodos.map(todo => 
      todo.id === id ? { ...todo, [field]: value } : todo
    ));
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
    toast({
      title: "Task Deleted",
      description: "The task has been removed from your todo list",
    });
  }, [toast]);

  const toggleTodoStatus = useCallback((id: string) => {
    setTodos(prevTodos => prevTodos.map(todo => 
      todo.id === id 
        ? { 
            ...todo, 
            status: todo.status === 'In progress' ? 'Mark received' : 'In progress',
            submittedTime: todo.status === 'In progress' 
              ? new Date().toLocaleString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })
              : ''
          }
        : todo
    ));
  }, []);


  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    await syncClassroomData(true); // true = show toast notifications for manual sync
    setIsSyncing(false);
  }, [syncClassroomData]);

  const markAssignmentComplete = useCallback(async (assignmentId: string) => {
    if (!user?.uid) return;

    try {
      // Update in database via API
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
        },
        body: JSON.stringify({
          status: 'completed',
          completedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Failed to mark assignment as complete');
      }

      const updatedAssignment = await response.json();
      console.log('Assignment marked complete:', updatedAssignment);

      // Update localStorage cache
      const storageKey = `custom_assignments_${user.uid}`;
      const assignments = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updatedAssignments = assignments.map((assignment: any) => 
        assignment.id === assignmentId 
          ? { ...assignment, status: 'completed', completedAt: new Date().toISOString() }
          : assignment
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedAssignments));
      
      toast({
        title: "Assignment Completed",
        description: "Great job! Assignment marked as complete.",
      });
      
      // Refresh the assignments list
      syncClassroomData(false);
    } catch (error: any) {
      console.error('Error marking assignment complete:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to mark assignment as complete. Please try again.',
        variant: "destructive"
      });
    }
  }, [user, syncClassroomData, toast]);

  const deleteCustomAssignment = useCallback(async (assignmentId: string) => {
    if (!user?.uid) return;

    try {
      // Delete from database via API
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.uid,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete assignment');
      }

      // Update localStorage cache
      const storageKey = `custom_assignments_${user.uid}`;
      const assignments = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updatedAssignments = assignments.filter((assignment: any) => assignment.id !== assignmentId);
      localStorage.setItem(storageKey, JSON.stringify(updatedAssignments));
      
      toast({
        title: "Assignment Deleted",
        description: "Custom assignment has been deleted.",
      });
      
      // Refresh the assignments list
      syncClassroomData(false);
    } catch (error: any) {
      ErrorHandler.handle(
        error,
        'Failed to delete assignment. Please try again.',
        { context: 'deleteCustomAssignment' }
      );
    }
  }, [user, syncClassroomData]);

  const handleCreateAssignment = useCallback(async () => {
    // Validate form data with Zod
    const validation = validateForm(assignmentSchema, newAssignment);
    
    if (!validation.success) {
      ErrorHandler.handleValidationError(validation.errors);
      return;
    }

    if (!user?.uid) {
      ErrorHandler.handleAuthError(new Error('User not authenticated'));
      return;
    }

    setIsAddingAssignment(true);
    
    // Prepare assignment data
    let dueDate = null;
    if (newAssignment.dueDate) {
      const dateTime = newAssignment.dueTime 
        ? `${newAssignment.dueDate}T${newAssignment.dueTime}:00`
        : `${newAssignment.dueDate}T23:59:59`;
      dueDate = new Date(dateTime).toISOString();
    }

    const assignmentData = {
      title: newAssignment.title,
      description: newAssignment.description || null,
      dueDate,
      classId: newAssignment.classId === 'none' ? null : newAssignment.classId || null,
      priority: newAssignment.priority,
      status: 'pending',
      isCustom: true,
      source: 'manual',
      syncStatus: 'synced',
    };

    // OPTIMISTIC UPDATE: Create temporary assignment with temporary ID
    const tempId = `temp-${Date.now()}`;
    const tempAssignment = {
      ...assignmentData,
      id: tempId,
      createdAt: new Date().toISOString(),
      userId: user.uid,
      _optimistic: true, // Flag for UI to show pending state
    };

    // Immediately update UI (localStorage cache)
    const storageKey = `custom_assignments_${user.uid}`;
    const existingAssignments = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const optimisticAssignments = [...existingAssignments, tempAssignment];
    localStorage.setItem(storageKey, JSON.stringify(optimisticAssignments));
    
    // Trigger re-render with optimistic data
    await syncClassroomData(false);

    try {
      // Save to database via API
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
        },
        body: JSON.stringify(assignmentData),
      });

      if (!response.ok) {
        throw new Error('Failed to create assignment');
      }

      const createdAssignment = await response.json();

      // Replace temporary assignment with real one
      const updatedAssignments = optimisticAssignments.map(a => 
        a.id === tempId ? { ...createdAssignment, _optimistic: false } : a
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedAssignments));

      toast({
        title: "Success!",
        description: "Assignment created successfully.",
      });

      // Reset form and close dialog
      setNewAssignment({
        title: '',
        description: '',
        dueDate: '',
        dueTime: '',
        classId: 'none',
        priority: 'medium'
      });
      setShowAddDialog(false);

      // Refresh data to include real assignment
      await syncClassroomData(false);
      
    } catch (error: any) {
      // ROLLBACK: Remove optimistic assignment on failure
      const rollbackAssignments = optimisticAssignments.filter(a => a.id !== tempId);
      localStorage.setItem(storageKey, JSON.stringify(rollbackAssignments));
      await syncClassroomData(false); // Update UI to remove failed assignment
      
      ErrorHandler.handle(
        error,
        'Failed to create assignment. Your changes have been reverted.',
        { context: 'handleCreateAssignment' }
      );
    } finally {
      setIsAddingAssignment(false);
    }
  }, [user, newAssignment, syncClassroomData, toast]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (assignment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'todo' && (assignment.status === 'TODO' || assignment.status === 'pending')) ||
        (statusFilter === 'submitted' && (assignment.status === 'TURNED_IN' || assignment.status === 'completed')) ||
        (statusFilter === 'late' && assignment.status === 'LATE') ||
        (statusFilter === 'overdue' && (() => {
          if (!assignment.dueDate) return false;
          try {
            const dueDate = new Date(assignment.dueDate);
            return !isNaN(dueDate.getTime()) && dueDate < new Date() && 
                   assignment.status !== 'TURNED_IN' && assignment.status !== 'completed';
          } catch (error) {
            return false;
          }
        })());
      
      const matchesClass = classFilter === 'all' || assignment.classId === classFilter;
      
      return matchesSearch && matchesStatus && matchesClass;
    });
  }, [assignments, searchTerm, statusFilter, classFilter]);

  const getAssignmentStatus = (assignment: any) => {
    if (assignment.status === 'TURNED_IN' || assignment.status === 'completed') return { label: 'Submitted', variant: 'default' as const, icon: CheckCircle };
    if (assignment.status === 'LATE') return { label: 'Late', variant: 'destructive' as const, icon: AlertCircle };
    
    // Check if overdue
    if (assignment.dueDate) {
      try {
        const dueDate = new Date(assignment.dueDate);
        if (!isNaN(dueDate.getTime()) && dueDate < new Date()) {
          return { label: 'Overdue', variant: 'destructive' as const, icon: AlertCircle };
        }
      } catch (error) {
        console.warn('Error parsing due date for status check:', assignment.dueDate);
      }
    }
    
    return { label: 'To Do', variant: 'secondary' as const, icon: Clock };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 border-red-200 bg-red-50';
      case 'medium': return 'text-yellow-600 border-yellow-200 bg-yellow-50';
      case 'low': return 'text-green-600 border-green-200 bg-green-50';
      default: return 'text-gray-600 border-gray-200 bg-gray-50';
    }
  };

  // Remove the authentication check since users can now create custom assignments
  // even without Google Classroom integration
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      {/* Gentle Header */}
      <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Your Assignments
          </h1>
        <p className="text-sm text-muted-foreground">
          Keep track of what you need to complete
        </p>
      </div>

      {/* Simple Actions */}
      <div className="flex gap-3 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing || isRestoring}
          className="text-sm"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing || isRestoring ? 'animate-spin' : ''}`} />
          {isSyncing || isRestoring ? 'Syncing...' : 'Sync'}
        </Button>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="text-sm">
              <Plus className="h-3 w-3 mr-1" />
              Add Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter assignment title..."
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter assignment description..."
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newAssignment.dueDate}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dueTime">Due Time</Label>
                    <Input
                      id="dueTime"
                      type="time"
                      value={newAssignment.dueTime}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, dueTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="class">Class</Label>
                    <Select
                      value={newAssignment.classId}
                      onValueChange={(value) => setNewAssignment(prev => ({ ...prev, classId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Class</SelectItem>
                        {courses.map(course => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newAssignment.priority}
                      onValueChange={(value: 'low' | 'medium' | 'high') => 
                        setNewAssignment(prev => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateAssignment}
                    disabled={isAddingAssignment}
                  >
                    {isAddingAssignment ? 'Creating...' : 'Create Assignment'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

      {/* Authentication Alert - Temporarily commented out */}
      {/* {!isAuthenticated && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You can create custom assignments below. To sync with Google Classroom, please sign in with your Google account.
          </AlertDescription>
        </Alert>
      )} */}

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-40">
                  <BookOpen className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {(isLoading || isRestoring) && !assignments.length ? (
        <AssignmentSkeleton />
      ) : null}

      {!isLoading && !isRestoring && assignments.length === 0 ? (
        <NoAssignments onAdd={() => setShowAddDialog(true)} />
      ) : null}

      {!isLoading && !isRestoring && filteredAssignments.length === 0 && assignments.length > 0 ? (
        <EmptyState
          icon={<Search className="h-12 w-12" />}
          title="No matching assignments"
          description="No assignments match your current filters. Try adjusting your search or filter criteria."
          action={{
            label: "Clear Filters",
            onClick: () => {
              setSearchTerm('');
              setStatusFilter('all');
              setClassFilter('all');
            }
          }}
        />
      ) : null}

      <div className="space-y-4">
        {filteredAssignments.map((assignment) => {
          const status = getAssignmentStatus(assignment);
          const StatusIcon = status.icon;
          const courseName = courses.find(c => c.id === assignment.classId)?.name || 
                           (assignment.classId ? 'Unknown Course' : 'No Class');
          
          return (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight mb-2">
                      {assignment.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{courseName}</span>
                      {assignment.isCustom && !assignment.classId && (
                        <Badge variant="secondary" className="text-xs">Personal</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant={status.variant} className="flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                    
                    {assignment.isCustom && (
                      <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                        Custom
                      </Badge>
                    )}
                    
                    {assignment.priority && assignment.priority !== 'none' && (
                      <Badge 
                        variant="outline" 
                        className={`capitalize ${getPriorityColor(assignment.priority)}`}
                      >
                        {assignment.priority} Priority
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {assignment.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {assignment.description}
                  </p>
                )}

                <Separator />

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    {assignment.dueDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Due: {(() => {
                            try {
                              const dueDate = new Date(assignment.dueDate);
                              if (isNaN(dueDate.getTime())) {
                                console.warn('Invalid due date:', assignment.dueDate, 'for assignment:', assignment.title);
                                return assignment.dueDate; // Fallback to raw value if invalid
                              }
                              const formattedDate = dueDate.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              });
                              const formattedTime = dueDate.toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true
                              });
                              return `${formattedDate} at ${formattedTime}`;
                            } catch (error) {
                              console.error('Error formatting due date:', error, assignment.dueDate);
                              return assignment.dueDate; // Fallback to raw value if error
                            }
                          })()}
                        </span>
                      </div>
                    )}
                    {!assignment.dueDate && assignment.isCustom && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>No due date set</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {assignment.isCustom && (
                      <>
                        {assignment.status !== 'completed' ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => markAssignmentComplete(assignment.id)}
                            className="flex items-center gap-2"
                          >
                            <Check className="h-4 w-4" />
                            Mark Complete
                          </Button>
                        ) : (
                          <Badge variant="default" className="bg-green-600 text-white flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Completed
                          </Badge>
                        )}
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteCustomAssignment(assignment.id)}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </>
                    )}
                    
                    {assignment.alternateLink && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(assignment.alternateLink, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in Classroom
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAssignments.length > 0 && (
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            Showing {filteredAssignments.length} of {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} 
            {isAuthenticated ? ' from Google Classroom and custom assignments' : ' (custom assignments only)'}
          </p>
        </div>
      )}

      {/* Personal Todo List */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Check className="h-5 w-5" />
              Personal Todo List
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              {todos.length} {todos.length === 1 ? 'Task' : 'Tasks'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add New Todo */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add a new task..."
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTodo();
                }
              }}
              className="flex-1"
            />
            <Button 
              onClick={addTodo} 
              size="sm" 
              type="button"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Todo Table */}
          <div className="rounded-md border">
            <div className="bg-muted/50">
              <div className="grid grid-cols-[40px_1fr_140px_140px_180px_120px_60px] gap-4 p-3 text-sm font-medium text-muted-foreground">
                <div></div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Title
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Status
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Due Date
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Submitted
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Priority
                </div>
                <div></div>
              </div>
            </div>

            <div className="divide-y">
              {todos.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No tasks yet. Add one above to get started!
                </div>
              ) : (
                todos.map((todo) => (
                  <div key={todo.id} className="grid grid-cols-[40px_1fr_140px_140px_180px_120px_60px] gap-4 p-3 items-center hover:bg-muted/30 transition-colors">
                    <div>
                      <button
                        type="button"
                        onClick={() => toggleTodoStatus(todo.id)}
                        className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                          todo.status === 'Mark received' 
                            ? 'bg-primary border-primary' 
                            : 'border-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {todo.status === 'Mark received' && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </button>
                    </div>
                    
                    <div>
                      {editingTodo === todo.id ? (
                        <Input
                          value={todo.title}
                          onChange={(e) => updateTodo(todo.id, 'title', e.target.value)}
                          onBlur={() => setEditingTodo(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              setEditingTodo(null);
                            }
                          }}
                          autoFocus
                          className="h-8"
                        />
                      ) : (
                        <div 
                          className="flex items-center gap-2 cursor-pointer group"
                          onClick={() => setEditingTodo(todo.id)}
                        >
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className={todo.status === 'Mark received' ? 'line-through text-muted-foreground' : ''}>
                            {todo.title}
                          </span>
                          <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Badge 
                        variant={todo.status === 'In progress' ? 'default' : 'secondary'}
                        className={todo.status === 'In progress' ? 'bg-blue-500' : 'bg-green-500'}
                      >
                        {todo.status}
                      </Badge>
                    </div>
                    
                    <div>
                      {editingDueDate === todo.id ? (
                        <Input
                          type="text"
                          value={todo.dueDate}
                          onChange={(e) => updateTodo(todo.id, 'dueDate', e.target.value)}
                          onBlur={() => setEditingDueDate(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              setEditingDueDate(null);
                            }
                          }}
                          autoFocus
                          className="h-8 text-sm"
                          placeholder="Due Date"
                        />
                      ) : (
                        <div 
                          className="text-sm flex items-center gap-2 cursor-pointer group"
                          onClick={() => setEditingDueDate(todo.id)}
                        >
                          <Calendar className="h-3 w-3" />
                          <span>{todo.dueDate}</span>
                          <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      {editingSubmittedTime === todo.id ? (
                        <Input
                          type="text"
                          value={todo.submittedTime}
                          onChange={(e) => updateTodo(todo.id, 'submittedTime', e.target.value)}
                          onBlur={() => setEditingSubmittedTime(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              setEditingSubmittedTime(null);
                            }
                          }}
                          autoFocus
                          className="h-8 text-sm"
                          placeholder="Submitted Time"
                        />
                      ) : (
                        <div 
                          className="text-sm cursor-pointer group flex items-center gap-2"
                          onClick={() => setEditingSubmittedTime(todo.id)}
                        >
                          <span>{todo.submittedTime || '-'}</span>
                          <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Select 
                        value={todo.priority} 
                        onValueChange={(value: 'Low' | 'Medium' | 'High') => updateTodo(todo.id, 'priority', value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">
                            <Badge variant="outline" className="bg-gray-500">Low</Badge>
                          </SelectItem>
                          <SelectItem value="Medium">
                            <Badge variant="outline" className="bg-yellow-500">Medium</Badge>
                          </SelectItem>
                          <SelectItem value="High">
                            <Badge variant="outline" className="bg-red-500">High</Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTodo(todo.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
