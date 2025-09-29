import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";
import { useLocation } from "wouter";
import {
  GripVertical,
  X,
  Maximize2,
  Minimize2,
  Calendar,
  CheckSquare,
  Target,
  StickyNote,
  Timer,
  BarChart3,
  Book,
  Plus,
  ArrowRight,
  Clock,
  TrendingUp,
  Brain,
  FileText,
  CheckCircle2,
  AlertCircle,
  BookOpen,
} from "lucide-react";

interface DashboardWidget {
  id: string;
  type: 'calendar' | 'assignments' | 'habits' | 'notes' | 'pomodoro' | 'analytics' | 'flashcards';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  config?: Record<string, any>;
  isVisible: boolean;
}

interface WidgetProps {
  widget: DashboardWidget;
  onRemove: (widgetId: string) => void;
  onResize: (widgetId: string, newSize: 'small' | 'medium' | 'large') => void;
  children: React.ReactNode;
  data?: any;
}

const getWidgetIcon = (type: string) => {
  switch (type) {
    case 'calendar': return Calendar;
    case 'assignments': return CheckSquare;
    case 'habits': return Target;
    case 'notes': return StickyNote;
    case 'pomodoro': return Timer;
    case 'analytics': return BarChart3;
    case 'flashcards': return Book;
    default: return BarChart3;
  }
};

export const DraggableWidget: React.FC<WidgetProps> = ({ 
  widget, 
  onRemove, 
  onResize, 
  children, 
  data 
}) => {
  const { useDraggable } = useDragAndDrop();
  
  const dragProps = useDraggable({
    id: widget.id,
    type: 'dashboard-widget',
    data: widget,
  });

  const IconComponent = getWidgetIcon(widget.type);

  const getSizeClasses = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small':
        return 'col-span-1 row-span-1 min-h-[200px]';
      case 'medium':
        return 'col-span-2 row-span-2 min-h-[300px]';
      case 'large':
        return 'col-span-3 row-span-3 min-h-[400px]';
      default:
        return 'col-span-2 row-span-2 min-h-[300px]';
    }
  };

  return (
    <Card 
      className={`${getSizeClasses(widget.size)} relative`}
      {...dragProps}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">
          {widget.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
};

// Pre-built widget components
export const CalendarWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  const [, setLocation] = useLocation();
  
  return (
    <DraggableWidget widget={widget} onRemove={() => {}} onResize={() => {}}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Calendar</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation('/calendar')}
            className="h-6 px-2 text-xs"
          >
            View All
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <div className="text-center py-4">
          <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Calendar Widget</p>
          <p className="text-xs text-muted-foreground">Click "View All" to open calendar</p>
        </div>
      </div>
    </DraggableWidget>
  );
};

export const AssignmentsWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  const { analytics, isLoading } = useDashboardAnalytics();
  const [, setLocation] = useLocation();
  
  if (isLoading) {
    return (
      <DraggableWidget widget={widget} onRemove={() => {}} onResize={() => {}}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </DraggableWidget>
    );
  }

  return (
    <DraggableWidget widget={widget} onRemove={() => {}} onResize={() => {}}>
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-semibold text-foreground">{analytics.totalAssignments}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Completed</span>
            <span className="text-foreground">{analytics.completedAssignments}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pending</span>
            <span className="text-foreground">{analytics.pendingAssignments}</span>
          </div>
        </div>
        
        {analytics.totalAssignments > 0 && (
          <div className="pt-2">
            <div className="text-xs text-muted-foreground mb-1">
              {Math.round((analytics.completedAssignments / analytics.totalAssignments) * 100)}% complete
            </div>
            <Progress 
              value={(analytics.completedAssignments / analytics.totalAssignments) * 100} 
              className="h-1"
            />
          </div>
        )}
      </div>
    </DraggableWidget>
  );
};

export const HabitsWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => (
  <DraggableWidget widget={widget} onRemove={() => {}} onResize={() => {}}>
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">Today's Progress</div>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Study 2 hours</span>
            <span>1.5/2</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Exercise</span>
            <span>✓</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
    </div>
  </DraggableWidget>
);

export const PomodoroWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  const { analytics, isLoading } = useDashboardAnalytics();
  
  if (isLoading) {
    return (
      <DraggableWidget widget={widget} onRemove={() => {}} onResize={() => {}}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </DraggableWidget>
    );
  }

  const totalStudyTimeHours = Math.round(analytics.totalStudyTime / 60 * 10) / 10;

  return (
    <DraggableWidget widget={widget} onRemove={() => {}} onResize={() => {}}>
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-semibold text-foreground">{analytics.todaySessions}</div>
          <div className="text-xs text-muted-foreground">Today's Sessions</div>
        </div>
        
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Study Time</span>
            <span className="text-foreground">{totalStudyTimeHours}h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Sessions</span>
            <span className="text-foreground">{analytics.totalPomodoroSessions}</span>
          </div>
        </div>
      </div>
    </DraggableWidget>
  );
};

export const AnalyticsWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  const { analytics, isLoading } = useDashboardAnalytics();
  const [, setLocation] = useLocation();
  
  if (isLoading) {
    return (
      <DraggableWidget widget={widget} onRemove={() => {}} onResize={() => {}}>
        <div className="space-y-2">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </DraggableWidget>
    );
  }

  const totalStudyTimeHours = Math.round(analytics.totalStudyTime / 60 * 10) / 10;

  return (
    <DraggableWidget widget={widget} onRemove={() => {}} onResize={() => {}}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Productivity</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation('/analytics')}
            className="h-6 px-2 text-xs"
          >
            View Details
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{analytics.productivityScore}</div>
            <div className="text-xs text-muted-foreground">Productivity Score</div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <div className="font-medium text-foreground">{totalStudyTimeHours}h</div>
              <div className="text-muted-foreground">Study Time</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <div className="font-medium text-foreground">{analytics.totalNotes}</div>
              <div className="text-muted-foreground">Notes</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <div className="font-medium text-foreground">{analytics.completedAssignments}</div>
              <div className="text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <div className="font-medium text-foreground">{analytics.reviewedFlashcards}</div>
              <div className="text-muted-foreground">Reviewed</div>
            </div>
          </div>
        </div>
      </div>
    </DraggableWidget>
  );
};

export const NotesWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  const { analytics, isLoading } = useDashboardAnalytics();
  
  if (isLoading) {
    return (
      <DraggableWidget widget={widget} onRemove={() => {}} onResize={() => {}}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </DraggableWidget>
    );
  }

  return (
    <DraggableWidget widget={widget} onRemove={() => {}} onResize={() => {}}>
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-semibold text-foreground">{analytics.totalNotes}</div>
          <div className="text-xs text-muted-foreground">Total Notes</div>
        </div>
        
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Recent</span>
            <span className="text-foreground">{analytics.recentNotes}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">This Week</span>
            <span className="text-foreground">{analytics.recentNotes}</span>
          </div>
        </div>
      </div>
    </DraggableWidget>
  );
};

export const FlashcardsWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  const { analytics, isLoading } = useDashboardAnalytics();
  
  if (isLoading) {
    return (
      <DraggableWidget widget={widget} onRemove={() => {}} onResize={() => {}}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </DraggableWidget>
    );
  }

  const reviewProgress = analytics.totalFlashcards > 0 
    ? Math.round((analytics.reviewedFlashcards / analytics.totalFlashcards) * 100)
    : 0;

  return (
    <DraggableWidget widget={widget} onRemove={() => {}} onResize={() => {}}>
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-semibold text-foreground">{analytics.totalFlashcards}</div>
          <div className="text-xs text-muted-foreground">Total Cards</div>
        </div>
        
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reviewed</span>
            <span className="text-foreground">{analytics.reviewedFlashcards}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-foreground">{reviewProgress}%</span>
          </div>
        </div>
        
        <div className="pt-1">
          <Progress value={reviewProgress} className="h-1" />
        </div>
      </div>
    </DraggableWidget>
  );
};

// Widget gallery for adding new widgets
export const WidgetGallery: React.FC<{
  onAddWidget: (type: DashboardWidget['type'], title: string) => void;
}> = ({ onAddWidget }) => {
  const widgetTypes = [
    { type: 'calendar' as const, title: 'Calendar', icon: Calendar },
    { type: 'assignments' as const, title: 'Assignments', icon: CheckSquare },
    { type: 'habits' as const, title: 'Habits', icon: Target },
    { type: 'notes' as const, title: 'Notes', icon: StickyNote },
    { type: 'pomodoro' as const, title: 'Pomodoro Timer', icon: Timer },
    { type: 'analytics' as const, title: 'Quick Stats', icon: BarChart3 },
    { type: 'flashcards' as const, title: 'Flashcards', icon: Book },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
      {widgetTypes.map(({ type, title, icon: Icon }) => (
        <Button
          key={type}
          variant="outline"
          className="h-20 flex flex-col items-center justify-center space-y-1"
          onClick={() => onAddWidget(type, title)}
        >
          <Icon className="h-6 w-6" />
          <span className="text-xs">{title}</span>
        </Button>
      ))}
    </div>
  );
};
