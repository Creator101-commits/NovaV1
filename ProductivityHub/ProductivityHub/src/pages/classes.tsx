import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SyncFeatureWrapper } from '@/components/SyncFeatureWrapper';
import { useGoogleClassroom } from '@/hooks/useGoogleClassroom';
import { useToast } from '@/hooks/use-toast';
import { usePersistentData } from '@/hooks/usePersistentData';
import { useClassManagement } from '@/hooks/useClassManagement';
import { apiGet, apiPost } from '@/lib/api';
import { RefreshCw, BookOpen, Users, Calendar, ExternalLink, AlertCircle, CheckCircle, Plus, Palette, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Classes() {
  const { courses, isLoading, error, syncClassroomData, isAuthenticated } = useGoogleClassroom();
  const { toast } = useToast();
  const { isRestoring } = usePersistentData();
  const { createClass, confirmDeleteClass, isDeleting, isCreating } = useClassManagement();
  const [isSyncing, setIsSyncing] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    section: '',
    description: '',
    teacherName: '',
    teacherEmail: '',
    color: '#42a5f5'
  });

  const classColors = [
    '#42a5f5', '#66bb6a', '#ff7043', '#ab47bc', '#26c6da',
    '#ffca28', '#ec407a', '#5c6bc0', '#ffa726', '#8bc34a',
    '#f06292', '#29b6f6', '#ff8a65', '#ba68c8', '#4db6ac'
  ];

  const handleSync = async () => {
    setIsSyncing(true);
    await syncClassroomData(true); // true = show toast notifications for manual sync
    setIsSyncing(false);
  };

  const handleCreateClass = async () => {
    if (!newClass.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a class name.",
        variant: "destructive",
      });
      return;
    }

    try {
      const classData = {
        name: newClass.name,
        section: newClass.section || undefined,
        description: newClass.description || undefined,
        teacherName: newClass.teacherName || undefined,
        teacherEmail: newClass.teacherEmail || undefined,
        color: newClass.color,
      };

      await createClass(classData);

      // Reset form
      setNewClass({
        name: '',
        section: '',
        description: '',
        teacherName: '',
        teacherEmail: '',
        color: '#42a5f5'
      });

      // Refresh data
      await syncClassroomData(false); // Silent refresh to include new class
      
    } catch (error: any) {
      // Error handling is done in the hook
      console.error('Error creating class:', error);
    }
  };

  const handleDeleteClass = async (course: any) => {
    // Only allow deletion of custom classes (not Google Classroom classes)
    if (course.googleClassroomId || course.courseState) {
      toast({
        title: "Cannot Delete",
        description: "Google Classroom classes cannot be deleted from this interface.",
        variant: "destructive",
      });
      return;
    }

    try {
      const deleted = await confirmDeleteClass(course.id, course.name);
      if (deleted) {
        // Refresh data after successful deletion
        await syncClassroomData(false);
      }
    } catch (error: any) {
      // Error handling is done in the hook
      console.error('Error deleting class:', error);
    }
  };

  // Remove the authentication check since users can now create custom classes
  // even without Google Classroom integration
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Classes</h1>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="className">Class Name *</Label>
                  <Input
                    id="className"
                    placeholder="Enter class name..."
                    value={newClass.name}
                    onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    placeholder="Enter section (e.g., Period 1, Room 101)..."
                    value={newClass.section}
                    onChange={(e) => setNewClass(prev => ({ ...prev, section: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter class description..."
                    value={newClass.description}
                    onChange={(e) => setNewClass(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="teacherName">Teacher Name</Label>
                    <Input
                      id="teacherName"
                      placeholder="Enter teacher name..."
                      value={newClass.teacherName}
                      onChange={(e) => setNewClass(prev => ({ ...prev, teacherName: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="teacherEmail">Teacher Email</Label>
                    <Input
                      id="teacherEmail"
                      type="email"
                      placeholder="Enter teacher email..."
                      value={newClass.teacherEmail}
                      onChange={(e) => setNewClass(prev => ({ ...prev, teacherEmail: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Class Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {classColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          newClass.color === color ? 'border-gray-900' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewClass(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <DialogTrigger asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogTrigger>
                  <Button 
                    onClick={handleCreateClass}
                    disabled={isCreating}
                  >
                    {isCreating ? 'Creating...' : 'Create Class'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <SyncFeatureWrapper 
            feature="Google Classroom Sync" 
            description="Automatically sync classes, assignments, and resources from your Google Classroom account."
          >
            <Button 
              onClick={handleSync} 
              disabled={isLoading || isSyncing || isRestoring}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${(isLoading || isSyncing || isRestoring) ? 'animate-spin' : ''}`} />
              {isRestoring ? 'Restoring...' : isSyncing ? 'Syncing...' : 'Sync Classes'}
            </Button>
          </SyncFeatureWrapper>
        </div>
      </div>

      {!isAuthenticated && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You can create custom classes below. To sync with Google Classroom, please sign in with your Google account.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && !courses.length && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your classes...</p>
        </div>
      )}

      {!isLoading && courses.length === 0 && (
        <Alert>
          <BookOpen className="h-4 w-4" />
          <AlertDescription>
            No classes found. Make sure you have courses in Google Classroom or try syncing again.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg leading-tight">
                  {course.name}
                </CardTitle>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  {course.courseState ? (
                    <Badge 
                      variant={course.courseState === 'ACTIVE' ? 'default' : 'secondary'}
                    >
                      {course.courseState === 'ACTIVE' ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      )}
                      {course.courseState}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                      Custom
                    </Badge>
                  )}
                  
                  {/* Delete button for custom classes only */}
                  {!course.courseState && !course.googleClassroomId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClass(course)}
                      disabled={isDeleting === course.id}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      {isDeleting === course.id ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
              {course.section && (
                <p className="text-sm text-muted-foreground">{course.section}</p>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              {course.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {course.description}
                </p>
              )}

              <Separator />

              <div className="space-y-3">
                {course.teacherName && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Teacher: {course.teacherName}</span>
                  </div>
                )}

                {course.createdAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Created: {new Date(course.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {course.alternateLink && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4"
                  onClick={() => window.open(course.alternateLink, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Classroom
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length > 0 && (
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            Showing {courses.length} class{courses.length !== 1 ? 'es' : ''} from Google Classroom
          </p>
        </div>
      )}
    </div>
  );
}
