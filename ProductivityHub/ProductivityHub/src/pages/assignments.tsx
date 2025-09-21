import React, { useMemo, useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
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
  Check
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function Assignments() {
  const { assignments, courses, isLoading, error, syncClassroomData, isAuthenticated } = useGoogleClassroom();
  const { user } = useAuth();
  const { toast } = useToast();
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

  const handleSync = async () => {
    setIsSyncing(true);
    await syncClassroomData(true); // true = show toast notifications for manual sync
    setIsSyncing(false);
  };

  const markAssignmentComplete = (assignmentId: string) => {
    if (!user?.uid) return;

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
  };

  const deleteCustomAssignment = (assignmentId: string) => {
    if (!user?.uid) return;

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
  };

  const handleCreateAssignment = async () => {
    if (!newAssignment.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an assignment title.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingAssignment(true);
    try {
      let dueDate = null;
      if (newAssignment.dueDate) {
        const dateTime = newAssignment.dueTime 
          ? `${newAssignment.dueDate}T${newAssignment.dueTime}:00`
          : `${newAssignment.dueDate}T23:59:59`;
        dueDate = new Date(dateTime).toISOString();
      }

      const assignmentData = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: newAssignment.title,
        description: newAssignment.description || null,
        dueDate,
        classId: newAssignment.classId === 'none' ? null : newAssignment.classId || null,
        priority: newAssignment.priority,
        status: 'pending',
        isCustom: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to localStorage instead of API call
      const storageKey = `custom_assignments_${user?.uid}`;
      const existingAssignments = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updatedAssignments = [...existingAssignments, assignmentData];
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

      // Refresh data to include new assignment
      await syncClassroomData(false);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create assignment.",
        variant: "destructive",
      });
    } finally {
      setIsAddingAssignment(false);
    }
  };

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
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Assignments</h1>
        <div className="flex items-center gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
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

          <Button 
            onClick={handleSync} 
            disabled={isLoading || isSyncing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${(isLoading || isSyncing) ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Assignments'}
          </Button>
        </div>
      </div>

      {!isAuthenticated && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You can create custom assignments below. To sync with Google Classroom, please sign in with your Google account.
          </AlertDescription>
        </Alert>
      )}

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

      {isLoading && !assignments.length && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your assignments...</p>
        </div>
      )}

      {!isLoading && assignments.length === 0 && (
        <Alert>
          <BookOpen className="h-4 w-4" />
          <AlertDescription>
            No assignments found. Click "Add Assignment" to create your first custom assignment, or sync with Google Classroom if you have assignments there.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && filteredAssignments.length === 0 && assignments.length > 0 && (
        <Alert>
          <Search className="h-4 w-4" />
          <AlertDescription>
            No assignments match your current filters. Try adjusting your search or filter criteria.
          </AlertDescription>
        </Alert>
      )}

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
                        {assignment.status !== 'completed' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => markAssignmentComplete(assignment.id)}
                            className="flex items-center gap-2"
                          >
                            <Check className="h-4 w-4" />
                            Mark Complete
                          </Button>
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
    </div>
  );
}
