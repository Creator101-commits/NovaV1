import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Target, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Flame, 
  Trophy, 
  TrendingUp,
  Calendar as CalendarIcon,
  Clock,
  Repeat,
  Star
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, parseISO } from "date-fns";

interface Habit {
  id: string;
  name: string;
  description: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'custom';
  targetCount: number;
  color: string;
  icon: string;
  streak: number;
  completions: { [date: string]: number };
  createdAt: string;
  isActive: boolean;
}

const HABIT_CATEGORIES = [
  'Study', 'Health', 'Personal', 'Work', 'Social', 'Creative', 'Other'
];

const HABIT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
];

const HABIT_ICONS = [
  'Target', 'BookOpen', 'Heart', 'Dumbbell', 'Coffee', 'Moon', 'Sun', 'Music'
];

export default function HabitTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'calendar'>('today');
  
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    category: 'Study',
    frequency: 'daily' as const,
    targetCount: 1,
    color: HABIT_COLORS[0],
    icon: HABIT_ICONS[0]
  });

  // Load habits from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`habits_${user?.uid}`);
    if (stored) {
      try {
        setHabits(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading habits:', error);
      }
    }
  }, [user]);

  // Save habits to localStorage
  const saveHabits = (updatedHabits: Habit[]) => {
    setHabits(updatedHabits);
    localStorage.setItem(`habits_${user?.uid}`, JSON.stringify(updatedHabits));
  };

  const createHabit = () => {
    if (!newHabit.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a habit name.",
        variant: "destructive"
      });
      return;
    }

    const habit: Habit = {
      id: Date.now().toString(),
      ...newHabit,
      streak: 0,
      completions: {},
      createdAt: new Date().toISOString(),
      isActive: true
    };

    saveHabits([...habits, habit]);
    setNewHabit({
      name: '',
      description: '',
      category: 'Study',
      frequency: 'daily',
      targetCount: 1,
      color: HABIT_COLORS[0],
      icon: HABIT_ICONS[0]
    });
    setIsAddingHabit(false);

    toast({
      title: "Habit Created",
      description: `"${habit.name}" has been added to your habits!`
    });
  };

  const toggleHabitCompletion = (habitId: string, date: string) => {
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const completions = { ...habit.completions };
        const currentCount = completions[date] || 0;
        
        if (currentCount >= habit.targetCount) {
          completions[date] = 0;
        } else {
          completions[date] = currentCount + 1;
        }

        // Update streak
        let newStreak = habit.streak;
        if (completions[date] >= habit.targetCount) {
          if (isToday(parseISO(date))) {
            newStreak = habit.streak + 1;
          }
        }

        return {
          ...habit,
          completions,
          streak: newStreak
        };
      }
      return habit;
    });

    saveHabits(updatedHabits);
  };

  const getHabitProgress = (habit: Habit, date: string) => {
    const completed = habit.completions[date] || 0;
    return Math.min((completed / habit.targetCount) * 100, 100);
  };

  const isHabitCompleted = (habit: Habit, date: string) => {
    const completed = habit.completions[date] || 0;
    return completed >= habit.targetCount;
  };

  const getTodayStats = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const completed = habits.filter(habit => isHabitCompleted(habit, today)).length;
    const total = habits.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  };

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate);
    const end = endOfWeek(selectedDate);
    return eachDayOfInterval({ start, end });
  };

  const stats = getTodayStats();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Habit Tracker
          </h1>
          <p className="text-muted-foreground mt-1">
            Build consistent habits and track your progress
          </p>
        </div>

        <Dialog open={isAddingHabit} onOpenChange={setIsAddingHabit}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Habit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Habit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="habit-name">Habit Name *</Label>
                <Input
                  id="habit-name"
                  placeholder="e.g., Read for 30 minutes"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="habit-description">Description</Label>
                <Input
                  id="habit-description"
                  placeholder="Optional description..."
                  value={newHabit.description}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="habit-category">Category</Label>
                  <Select 
                    value={newHabit.category} 
                    onValueChange={(value) => setNewHabit(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HABIT_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="habit-frequency">Frequency</Label>
                  <Select 
                    value={newHabit.frequency} 
                    onValueChange={(value: any) => setNewHabit(prev => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="habit-target">Daily Target</Label>
                <Input
                  id="habit-target"
                  type="number"
                  min="1"
                  max="10"
                  value={newHabit.targetCount}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, targetCount: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {HABIT_COLORS.map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newHabit.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewHabit(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddingHabit(false)}>
                  Cancel
                </Button>
                <Button onClick={createHabit}>
                  Create Habit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Progress</p>
                <p className="text-2xl font-bold">{stats.completed}/{stats.total}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{stats.percentage}%</div>
                <Progress value={stats.percentage} className="w-20 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Habits</p>
                <p className="text-2xl font-bold">{habits.filter(h => h.isActive).length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Best Streak</p>
                <p className="text-2xl font-bold">{Math.max(...habits.map(h => h.streak), 0)}</p>
              </div>
              <Flame className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Today
          </TabsTrigger>
          <TabsTrigger value="week" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Week View
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {habits.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Habits Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first habit to start building consistent routines.
                </p>
                <Button onClick={() => setIsAddingHabit(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Habit
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {habits.map(habit => {
                const today = format(new Date(), 'yyyy-MM-dd');
                const progress = getHabitProgress(habit, today);
                const completed = isHabitCompleted(habit, today);

                return (
                  <Card key={habit.id} className="group hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: habit.color }}
                          />
                          <div>
                            <h3 className="font-medium">{habit.name}</h3>
                            {habit.description && (
                              <p className="text-sm text-muted-foreground">{habit.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {habit.category}
                              </Badge>
                              {habit.streak > 0 && (
                                <div className="flex items-center gap-1 text-xs text-orange-600">
                                  <Flame className="h-3 w-3" />
                                  {habit.streak} day streak
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              {habit.completions[today] || 0} / {habit.targetCount}
                            </div>
                            <Progress value={progress} className="w-20 mt-1" />
                          </div>

                          <Button
                            variant={completed ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleHabitCompletion(habit.id, today)}
                            className="flex items-center gap-2"
                          >
                            {completed ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                            {completed ? 'Done' : 'Mark'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Week of {format(startOfWeek(selectedDate), 'MMM d, yyyy')}
            </h3>
          </div>

          <div className="space-y-4">
            {habits.map(habit => (
              <Card key={habit.id}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                    {habit.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {getWeekDays().map(day => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const completed = isHabitCompleted(habit, dateStr);
                      const progress = getHabitProgress(habit, dateStr);

                      return (
                        <div key={dateStr} className="text-center">
                          <div className="text-xs text-muted-foreground mb-2">
                            {format(day, 'EEE')}
                          </div>
                          <button
                            onClick={() => toggleHabitCompletion(habit.id, dateStr)}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs transition-colors ${
                              completed 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-gray-300 hover:border-gray-400'
                            } ${
                              isToday(day) ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                            }`}
                          >
                            {format(day, 'd')}
                          </button>
                          {progress > 0 && progress < 100 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {Math.round(progress)}%
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Habit Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {habits.map(habit => {
                      const totalDays = Object.keys(habit.completions).length;
                      const completedDays = Object.values(habit.completions).filter(count => count >= habit.targetCount).length;
                      const successRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

                      return (
                        <div key={habit.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: habit.color }}
                              />
                              <span className="font-medium">{habit.name}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{successRate}% success rate</span>
                              <div className="flex items-center gap-1">
                                <Flame className="h-4 w-4 text-orange-500" />
                                <span>{habit.streak} days</span>
                              </div>
                            </div>
                          </div>
                          <Progress value={successRate} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                      <Trophy className="h-6 w-6 text-yellow-600" />
                      <div>
                        <p className="font-medium text-sm">Consistency Champion</p>
                        <p className="text-xs text-muted-foreground">7+ day streak</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <Star className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-medium text-sm">Perfect Day</p>
                        <p className="text-xs text-muted-foreground">All habits completed</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <Target className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm">Habit Builder</p>
                        <p className="text-xs text-muted-foreground">Created 5+ habits</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
