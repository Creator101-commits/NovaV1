import { useAuth } from "@/contexts/AuthContext";
import { useActivity } from "@/contexts/ActivityContext";
import { useGoogleClassroom } from "@/hooks/useGoogleClassroom";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useGamification } from "@/hooks/useGamification";
import { useNotifications } from "@/hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TriangleAlert,
  CalendarDays,
  CheckCircle2,
  Flame,
  Search,
  Bot,
  StickyNote,
  Plus,
  ChevronRight,
  Clock,
  RefreshCw,
  AlertCircle,
  Settings,
  Grid,
  Download,
  Upload,
} from "lucide-react";
import { format, isToday, isThisWeek, addDays } from "date-fns";
import { useMemo } from "react";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Priority = "high" | "medium" | "low";
type Status = "pending" | "completed";

export default function Dashboard() {
  const { user, userData } = useAuth();
  const { getRecentActivities, addActivity } = useActivity();
  const { assignments, courses, isLoading, error, syncClassroomData, hasValidToken } = useGoogleClassroom();
  const [, setLocation] = useLocation();
  
  // New productivity features
  const {
    dashboardLayouts,
    activeDashboard,
    useDraggable,
    useDroppable,
    addWidgetToDashboard,
    moveWidget,
    removeWidget,
    autoArrangeWidgets,
    exportDashboardLayout,
    importDashboardLayout,
  } = useDragAndDrop();
  
  const { 
    userStats, 
    awardXP,
    calculateLevel,
  } = useGamification();
  
  const { requestPermission, scheduleNotification } = useNotifications();

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const firstName = userData?.firstName || user?.displayName?.split(" ")[0] || "Student";

  // Convert Google Classroom assignments to our format for dashboard
  const formattedAssignments = assignments.map((assignment: any) => {
    const course = courses.find((c: any) => c.id === assignment.courseId);
    let dueDate = null;
    
    if (assignment.dueDate) {
      const { year, month, day } = assignment.dueDate;
      dueDate = new Date(year, month - 1, day);
      
      if (assignment.dueTime) {
        const { hours, minutes } = assignment.dueTime;
        dueDate.setHours(hours, minutes);
      }
    }
    
    return {
      id: assignment.id,
      title: assignment.title,
      className: course?.name || 'Unknown Course',
      dueDate: dueDate,
      priority: 'medium' as const,
      status: assignment.state === 'PUBLISHED' ? 'pending' as const : 'completed' as const,
    };
  });

  // Get recent activities from context
  const recentActivities = getRecentActivities(2);

  // Calculate stats from real data
  const stats = useMemo(() => {
    const pendingAssignments = formattedAssignments.filter(a => 
      ['pending', 'TODO'].includes(a.status) || (!a.status && a.dueDate)
    );
    const dueToday = pendingAssignments.filter(a => a.dueDate && isToday(a.dueDate)).length;
    const thisWeek = pendingAssignments.filter(a => a.dueDate && isThisWeek(a.dueDate, { weekStartsOn: 1 })).length;
    const completed = formattedAssignments.filter(a => 
      ['completed', 'TURNED_IN'].includes(a.status)
    ).length;
    
    return {
      dueToday,
      thisWeek,
      completed,
      streak: 12, // This would come from activity tracking
      trend: { today: 1, week: -2 } // This would be calculated from historical data
    };
  }, [formattedAssignments]);

  // Get upcoming assignments (next 3)
  const upcomingAssignments = formattedAssignments
    .filter(a => (['pending', 'TODO'].includes(a.status) || (!a.status && a.dueDate)) && a.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 3);

  const handleSyncData = async () => {
    try {
      await syncClassroomData(true); // true = show toast notifications for manual sync
    } catch (error) {
      console.error('Failed to sync data:', error);
    }
  };

  // Navigation functions
  const navigateToAIChat = () => {
    addActivity({
      label: "Opened AI Chat & Summarization",
      icon: Bot,
      tone: "text-indigo-400",
      type: "ai",
      route: "/ai-chat"
    });
    setLocation("/ai-chat");
  };
  
  const navigateToToolbox = () => {
    addActivity({
      label: "Opened Productivity Toolbox",
      icon: StickyNote,
      tone: "text-purple-500",
      type: "flashcard",
      route: "/toolbox"
    });
    setLocation("/toolbox");
  };
  
  const navigateToCalendar = () => {
    addActivity({
      label: "Opened Calendar Planner",
      icon: CalendarDays,
      tone: "text-blue-500",
      type: "calendar",
      route: "/calendar"
    });
    setLocation("/calendar");
  };

  const navigateToAssignments = () => {
    setLocation("/assignments");
  };

  const handleCompleteAssignment = (assignment: any) => {
    // Here you would typically update the assignment status in your data store
    addActivity({
      label: `Completed ${assignment.title}`,
      icon: CheckCircle2,
      tone: "text-emerald-500",
      type: "assignment",
      relatedId: assignment.id,
      route: "/assignments"
    });
  };

  const handleAddTask = () => {
    // Navigate to assignments page where user can add a new task
    setLocation("/assignments");
  };

  const handleActivityClick = (activity: any) => {
    if (activity.route) {
      setLocation(activity.route);
    }
  };

  // Derived lists for tabs
  const lists = useMemo(() => {
    const all = upcomingAssignments.sort((a, b) => a.dueDate ? a.dueDate.getTime() - (b.dueDate?.getTime() || 0) : 0);
    return {
      all,
      today: all.filter((a) => a.dueDate && isToday(a.dueDate)),
      week: all.filter((a) => a.dueDate && isThisWeek(a.dueDate, { weekStartsOn: 1 })),
    };
  }, [upcomingAssignments]);

  const trendChip = (n: number) => (
    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-md ${n >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
      {n >= 0 ? "+" : ""}
      {n}
    </span>
  );

  const priorityDot = (p: Priority) =>
    p === "high" ? "bg-rose-500" : p === "medium" ? "bg-amber-400" : "bg-sky-400";

  const duePill = (d: Date) => {
    if (isToday(d)) return <Badge variant="destructive">Due today</Badge>;
    const inDays = Math.ceil((d.getTime() - now.getTime()) / 86400000);
    if (inDays === 1) return <Badge className="bg-amber-500/15 text-amber-400">Tomorrow</Badge>;
    if (inDays <= 7) return <Badge className="bg-indigo-500/15 text-indigo-400">This week</Badge>;
    return <Badge variant="outline">{inDays}d</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* Top bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{greeting}, {firstName}! 👋</h1>
          <p className="text-muted-foreground">{format(now, "EEEE, MMMM d, yyyy")}</p>
        </div>
        <div className="flex w-full md:w-auto items-center gap-3">
          {/* Gamification Stats */}
          <Card className="px-3 py-2">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">Level {calculateLevel(userStats.totalXP).level}</Badge>
              <span className="text-sm font-medium">{userStats.totalXP} XP</span>
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm">{userStats.streak}</span>
            </div>
          </Card>

          {/* Dashboard Customization */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Customize
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Dashboard Layout</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => autoArrangeWidgets(activeDashboard)}>
                <Grid className="h-4 w-4 mr-2" />
                Auto Arrange
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportDashboardLayout(activeDashboard)}>
                <Download className="h-4 w-4 mr-2" />
                Export Layout
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    try {
                      await importDashboardLayout(file);
                    } catch (error) {
                      console.error('Import failed:', error);
                    }
                  }
                };
                input.click();
              }}>
                <Upload className="h-4 w-4 mr-2" />
                Import Layout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {!hasValidToken && (
            <Alert className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Sign in with Google to sync classroom data
              </AlertDescription>
            </Alert>
          )}
          {hasValidToken && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSyncData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Syncing...' : 'Sync'}
            </Button>
          )}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search assignments, courses, notes…" className="pl-9" />
          </div>
          <Button size="sm" className="gap-2" onClick={handleAddTask}>
            <Plus className="h-4 w-4" /> Add task
          </Button>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Due today" value={stats.dueToday} icon={<TriangleAlert className="h-5 w-5 text-rose-400" />} chip={trendChip(stats.trend.today)} />
        <KPI label="Due this week" value={stats.thisWeek} icon={<CalendarDays className="h-5 w-5 text-amber-400" />} />
        <KPI label="Completed total" value={stats.completed} icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />} />
        <KPI label="Study streak" value={stats.streak} icon={<Flame className="h-5 w-5 text-primary" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming assignments</CardTitle>
                <Button variant="ghost" size="sm" className="gap-1" onClick={navigateToAssignments}>
                  View all <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="today" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="week">This week</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>

                {(["today", "week", "all"] as const).map((key) => (
                  <TabsContent key={key} value={key}>
                    <div className="space-y-3">
                      {lists[key].map((a) => (
                        <div key={a.id} className="group flex items-center justify-between rounded-lg border border-border/60 bg-card/60 px-4 py-3 backdrop-blur transition hover:bg-card">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`h-2.5 w-2.5 rounded-full ${priorityDot(a.priority as Priority)}`} />
                            <div className="min-w-0">
                              <div className="truncate font-medium">{a.title}</div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="px-1.5 py-0.5 rounded bg-muted/40">{a.className}</span>
                                <span>•</span>
                                <span>Due {a.dueDate ? format(a.dueDate, "MMM d, h:mm a") : 'No due date'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {a.dueDate && duePill(a.dueDate)}
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              aria-label="Mark complete" 
                              className="h-8 w-8"
                              onClick={() => handleCompleteAssignment(a)}
                            >
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {lists[key].length === 0 && (
                        <div className="text-sm text-muted-foreground py-6 text-center">
                          No items here—plan your next study sprint.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity yet. Start using the app to see your activity here!</p>
                  </div>
                ) : (
                  recentActivities.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div 
                        key={activity.id} 
                        className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 rounded-lg p-2 transition-colors"
                        onClick={() => handleActivityClick(activity)}
                      >
                        <div className={`h-8 w-8 rounded-full bg-muted/40 grid place-items-center`}>
                          <Icon className={`h-4 w-4 ${activity.tone}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm">{activity.label}</div>
                          <div className="text-xs text-muted-foreground">{activity.time}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Pomodoro Timer Link */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold">Pomodoro Timer</h3>
                <p className="text-sm text-muted-foreground">Access the full Pomodoro timer in the toolbox</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="relative grid h-24 w-24 place-items-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-primary/0" />
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setLocation("/toolbox")} className="gap-2">
                    <Clock className="h-4 w-4" />
                    Open Timer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="secondary" 
                className="w-full justify-start gap-2"
                onClick={navigateToAIChat}
              >
                <Bot className="h-4 w-4" /> Summarize with AI
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={navigateToToolbox}
              >
                <StickyNote className="h-4 w-4" /> Create flashcards
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={navigateToCalendar}
              >
                <CalendarDays className="h-4 w-4" /> Add to planner
              </Button>
            </CardContent>
          </Card>

          {/* Daily motivation */}
          <Card className="bg-gradient-to-tr from-sky-600/20 to-indigo-600/10 border-transparent">
            <CardContent className="p-6 text-sky-50">
              <h3 className="mb-2 flex items-center gap-2 text-sky-100">
                ✨ Daily motivation
              </h3>
              <p className="text-sm/6 opacity-90">
                “Success is not final, failure is not fatal: it is the courage to continue that counts.”
              </p>
              <p className="mt-1 text-xs opacity-75">— Winston Churchill</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ----- Small KPI tile component ----- */
function KPI({
  label,
  value,
  icon,
  chip,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  chip?: React.ReactNode;
}) {
  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-xs">{label}</div>
          {icon}
        </div>
        <div className="mt-2 flex items-baseline">
          <div className="text-3xl font-semibold">{value}</div>
          {chip}
        </div>
      </CardContent>
    </Card>
  );
}
