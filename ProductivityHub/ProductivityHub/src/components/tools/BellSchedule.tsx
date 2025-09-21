import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { BellSchedule, InsertBellSchedule } from "@shared/schema";
import {
  Bell,
  Plus,
  Clock,
  Edit,
  Trash2,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";



export const BellScheduleComponent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [periods, setPeriods] = useState<BellSchedule[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<BellSchedule | null>(null);
  const [newPeriod, setNewPeriod] = useState({
    periodName: "",
    startTime: "",
    endTime: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load bell schedule from database
  const loadBellSchedule = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      const response = await apiGet(`/api/users/${user.uid}/bell-schedule`);
      if (response.ok) {
        const data = await response.json();
        setPeriods(data);
        console.log('✅ Loaded bell schedule:', data.length);
      } else {
        console.error('Failed to load bell schedule:', response.status);
        toast({
          title: "Error",
          description: "Failed to load bell schedule",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading bell schedule:', error);
      toast({
        title: "Error",
        description: "Failed to load bell schedule",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load bell schedule on component mount
  useEffect(() => {
    loadBellSchedule();
  }, [user?.uid]);

  const addPeriod = async () => {
    if (!user?.uid || !newPeriod.periodName.trim() || !newPeriod.startTime || !newPeriod.endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (newPeriod.startTime >= newPeriod.endTime) {
      toast({
        title: "Error",
        description: "Start time must be before end time",
        variant: "destructive",
      });
      return;
    }

    try {
      const periodData = {
        periodName: newPeriod.periodName.trim(),
        startTime: newPeriod.startTime,
        endTime: newPeriod.endTime,
      };

      const response = await apiPost(`/api/users/${user.uid}/bell-schedule`, periodData);
      
      if (response.ok) {
        const createdPeriod = await response.json();
        setPeriods(prev => [...prev, createdPeriod]);
        
        setNewPeriod({ periodName: "", startTime: "", endTime: "" });
        setIsAddDialogOpen(false);
        
        toast({
          title: "Success",
          description: "Period added successfully!",
        });
      } else {
        throw new Error('Failed to add period');
      }
    } catch (error) {
      console.error('Error adding period:', error);
      toast({
        title: "Error",
        description: "Failed to add period",
        variant: "destructive",
      });
    }
  };

  const updatePeriod = async () => {
    if (!user?.uid || !editingPeriod || !newPeriod.periodName.trim() || !newPeriod.startTime || !newPeriod.endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (newPeriod.startTime >= newPeriod.endTime) {
      toast({
        title: "Error",
        description: "Start time must be before end time",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiPut(`/api/bell-schedule/${editingPeriod.id}`, {
        periodName: newPeriod.periodName.trim(),
        startTime: newPeriod.startTime,
        endTime: newPeriod.endTime,
        dayOfWeek: newPeriod.dayOfWeek,
      });
      
      if (response.ok) {
        const updatedPeriod = await response.json();
        setPeriods(prev => prev.map(p => p.id === editingPeriod.id ? updatedPeriod : p));
        
        setEditingPeriod(null);
        setNewPeriod({ periodName: "", startTime: "", endTime: "" });
        
        toast({
          title: "Success",
          description: "Period updated successfully!",
        });
      } else {
        throw new Error('Failed to update period');
      }
    } catch (error) {
      console.error('Error updating period:', error);
      toast({
        title: "Error",
        description: "Failed to update period",
        variant: "destructive",
      });
    }
  };

  const deletePeriod = async (id: string) => {
    try {
      const response = await apiDelete(`/api/bell-schedule/${id}`);
      
      if (response.ok) {
        setPeriods(prev => prev.filter(p => p.id !== id));
        
        toast({
          title: "Deleted",
          description: "Period removed from schedule",
        });
      } else {
        throw new Error('Failed to delete period');
      }
    } catch (error) {
      console.error('Error deleting period:', error);
      toast({
        title: "Error",
        description: "Failed to delete period",
        variant: "destructive",
      });
    }
  };

  const startEdit = (period: BellSchedule) => {
    setEditingPeriod(period);
    setNewPeriod({
      periodName: period.periodName,
      startTime: period.startTime,
      endTime: period.endTime,
      dayOfWeek: period.dayOfWeek,
    });
  };

  const cancelEdit = () => {
    setEditingPeriod(null);
    setNewPeriod({ periodName: "", startTime: "", endTime: "", dayOfWeek: 1 });
  };

  const getCurrentPeriod = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = format(now, "HH:mm");
    
    return periods.find(period => 
      period.dayOfWeek === currentDay &&
      currentTime >= period.startTime &&
      currentTime <= period.endTime
    );
  };

  const getNextPeriod = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = format(now, "HH:mm");
    
    // Find next period today
    const todayPeriods = periods
      .filter(period => period.dayOfWeek === currentDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    const nextToday = todayPeriods.find(period => period.startTime > currentTime);
    if (nextToday) return nextToday;
    
    // Find first period tomorrow or next weekday
    for (let i = 1; i <= 7; i++) {
      const nextDay = (currentDay + i) % 7;
      const nextDayPeriods = periods
        .filter(period => period.dayOfWeek === nextDay)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      if (nextDayPeriods.length > 0) {
        return nextDayPeriods[0];
      }
    }
    
    return null;
  };

  const getPeriodsForDay = (dayOfWeek: number) => {
    return periods
      .filter(period => period.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const currentPeriod = getCurrentPeriod();
  const nextPeriod = getNextPeriod();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-primary" />
              Bell Schedule
            </CardTitle>
            <Dialog 
              open={isAddDialogOpen || !!editingPeriod} 
              onOpenChange={(open) => {
                if (!open) {
                  setIsAddDialogOpen(false);
                  cancelEdit();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button 
                  className="gradient-bg"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Period
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingPeriod ? "Edit Period" : "Add New Period"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="periodName">Period Name</Label>
                    <Input
                      id="periodName"
                      placeholder="e.g., Period 1, Math, Lunch"
                      value={newPeriod.periodName}
                      onChange={(e) => setNewPeriod(prev => ({ ...prev, periodName: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={newPeriod.startTime}
                        onChange={(e) => setNewPeriod(prev => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={newPeriod.endTime}
                        onChange={(e) => setNewPeriod(prev => ({ ...prev, endTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={editingPeriod ? updatePeriod : addPeriod}
                      className="gradient-bg"
                    >
                      {editingPeriod ? "Update" : "Add"} Period
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Current/Next Period Status */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Current Period</span>
                </div>
                {currentPeriod ? (
                  <div>
                    <p className="text-lg font-semibold">{currentPeriod.periodName}</p>
                    <p className="text-sm text-muted-foreground">
                      {currentPeriod.startTime} - {currentPeriod.endTime}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No current period</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Next Period</span>
                </div>
                {nextPeriod ? (
                  <div>
                    <p className="text-lg font-semibold">{nextPeriod.periodName}</p>
                    <p className="text-sm text-muted-foreground">
                      {daysOfWeek[nextPeriod.dayOfWeek]} {nextPeriod.startTime} - {nextPeriod.endTime}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No upcoming periods</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Weekly Schedule */}
          <div className="space-y-4">
            {daysOfWeek.map((day, dayIndex) => {
              const dayPeriods = getPeriodsForDay(dayIndex);
              
              if (dayPeriods.length === 0) return null;
              
              return (
                <div key={dayIndex}>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Badge variant="outline" className="mr-2">
                      {day}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {dayPeriods.length} periods
                    </span>
                  </h3>
                  
                  <div className="grid gap-2">
                    {dayPeriods.map((period) => (
                      <div 
                        key={period.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          currentPeriod?.id === period.id 
                            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" 
                            : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-sm font-mono text-muted-foreground">
                            {period.startTime} - {period.endTime}
                          </div>
                          <div className="font-medium">{period.periodName}</div>
                          {currentPeriod?.id === period.id && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                              Current
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => startEdit(period)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => deletePeriod(period.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {periods.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No periods scheduled</p>
              <p className="text-sm">Add your first period to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
