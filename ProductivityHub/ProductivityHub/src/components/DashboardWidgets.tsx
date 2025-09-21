import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
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
      className={`${getSizeClasses(widget.size)} relative group hover:shadow-lg transition-all duration-200`}
      {...dragProps}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <IconComponent className="h-4 w-4 mr-2" />
          {widget.title}
        </CardTitle>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const nextSize = widget.size === 'small' ? 'medium' : 
                             widget.size === 'medium' ? 'large' : 'small';
              onResize(widget.id, nextSize);
            }}
            className="h-6 w-6 p-0"
          >
            {widget.size === 'large' ? 
              <Minimize2 className="h-3 w-3" /> : 
              <Maximize2 className="h-3 w-3" />
            }
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(widget.id)}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
};

// Pre-built widget components
export const CalendarWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => (
  <DraggableWidget widget={widget} onRemove={() => {}} onResize={() => {}}>
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">Upcoming Events</div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>Math Exam</span>
          <span>Tomorrow</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>History Essay</span>
          <span>Friday</span>
        </div>
      </div>
    </div>
  </DraggableWidget>
);

export const AssignmentsWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => (
  <DraggableWidget widget={widget} onRemove={() => {}} onResize={() => {}}>
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Due Today</span>
        <Badge variant="destructive">3</Badge>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">This Week</span>
        <Badge variant="secondary">8</Badge>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Completed</span>
        <Badge variant="default">15</Badge>
      </div>
    </div>
  </DraggableWidget>
);

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
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Exercise</span>
            <span>✓</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
    </div>
  </DraggableWidget>
);

export const PomodoroWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => (
  <DraggableWidget widget={widget} onRemove={() => {}} onResize={() => {}}>
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">Today's Sessions</div>
      <div className="text-2xl font-bold">4 / 6</div>
      <div className="text-xs text-muted-foreground">2 hours of focused study</div>
    </div>
  </DraggableWidget>
);

export const AnalyticsWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => (
  <DraggableWidget widget={widget} onRemove={() => {}} onResize={() => {}}>
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">This Week</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="font-medium">Productivity</div>
          <div className="text-green-500">+12%</div>
        </div>
        <div>
          <div className="font-medium">Focus Time</div>
          <div className="text-blue-500">8.5h</div>
        </div>
      </div>
    </div>
  </DraggableWidget>
);

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
