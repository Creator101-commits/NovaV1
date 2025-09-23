import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCalendar } from '@/contexts/CalendarContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Calendar, 
  BookOpen, 
  Star, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock3,
  Pin,
  Database,
  Target,
  TrendingUp,
  FileText,
  Calculator,
  Brain,
  Zap,
  ArrowRight,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Mock data - replace with actual API calls
const mockRecentlyVisited = [
  { id: 1, name: "Study Scheduler", icon: Calendar, lastVisited: "Jul 2, 2024", color: "bg-blue-500" },
  { id: 2, name: "Notes Overview", icon: FileText, lastVisited: "Mar 27", color: "bg-green-500" },
  { id: 3, name: "Flashcards", icon: Brain, lastVisited: "Jul 2, 2024", color: "bg-purple-500" },
  { id: 4, name: "Spanish", icon: BookOpen, lastVisited: "Jul 2, 2024", color: "bg-orange-500" },
  { id: 5, name: "Manual", icon: FileText, lastVisited: "Dec 2, 2024", color: "bg-red-500" },
  { id: 6, name: "AI Chat", icon: Brain, lastVisited: "Jun 15", color: "bg-indigo-500" }
];

const mockUpcomingEvents = [
  { id: 1, title: "Math Exam", date: "Tomorrow", time: "2:00 PM", type: "exam" },
  { id: 2, title: "Spanish Presentation", date: "Friday", time: "10:00 AM", type: "presentation" },
  { id: 3, title: "Chemistry Lab", date: "Next Week", time: "9:00 AM", type: "lab" }
];

const mockDailyActivities = [
  { id: 1, name: "Wake up and freshen up", status: "done", icon: "🌅" },
  { id: 2, name: "Have breakfast", status: "done", icon: "🍳" },
  { id: 3, name: "Work or study", status: "in-progress", icon: "📚" },
  { id: 4, name: "Have lunch", status: "not-started", icon: "🍽️" },
  { id: 5, name: "Exercise", status: "not-started", icon: "🏃" }
];

const mockLearningResources = [
  { id: 1, title: "The ultimate guide to study techniques", type: "read", time: "5m read", thumbnail: "📖" },
  { id: 2, title: "Customize & organize your notes", type: "watch", time: "9m watch", thumbnail: "🎥" },
  { id: 3, title: "Getting started with flashcards", type: "read", time: "8m read", thumbnail: "🧠" },
  { id: 4, title: "Using AI to boost your productivity", type: "watch", time: "3m watch", thumbnail: "🤖" }
];

const mockFeaturedTemplates = [
  { id: 1, name: "Study Planner", description: "Organize your study schedule", icon: Calendar, color: "bg-blue-500" },
  { id: 2, name: "Note Templates", description: "Structured note-taking", icon: FileText, color: "bg-green-500" },
  { id: 3, name: "Grade Tracker", description: "Track your academic progress", icon: TrendingUp, color: "bg-purple-500" },
  { id: 4, name: "Budget Planner", description: "Manage your student finances", icon: Calculator, color: "bg-orange-500" }
];

const mockPinnedDatabases = [
  { id: 1, name: "Study Notes", icon: FileText, count: 24 },
  { id: 2, name: "Flashcards", icon: Brain, count: 156 },
  { id: 3, name: "Assignments", icon: Target, count: 8 }
];

// Calendar Component
function CalendarComponent() {
  const { events } = useCalendar();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get calendar events for the current month
  const getEventsForMonth = () => {
    if (!events) return [];
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventsForDay = (day: number) => {
    const monthEvents = getEventsForMonth();
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    return monthEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.getDate() === day;
    });
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                        currentDate.getFullYear() === today.getFullYear();

  return (
    <Card className="notion-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigateMonth('prev')}
              className="h-8 w-8 p-0 hover:bg-muted/50 transition-colors duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigateMonth('next')}
              className="h-8 w-8 p-0 hover:bg-muted/50 transition-colors duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-medium text-foreground">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={index} className="h-10" />;
              }
              
              const dayEvents = getEventsForDay(day);
              const isToday = isCurrentMonth && day === today.getDate();
              
              return (
                <div
                  key={day}
                  className={`h-10 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all duration-200 ${
                    isToday 
                      ? 'bg-foreground text-background font-medium hover:bg-foreground/90' 
                      : 'notion-hover hover:bg-muted/50 hover:shadow-sm hover:scale-105'
                  }`}
                >
                  <span className="text-sm">{day}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {dayEvents.slice(0, 2).map((_, eventIndex) => (
                        <div 
                          key={eventIndex} 
                          className="w-1 h-1 rounded-full bg-foreground"
                        />
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events Summary */}
        {events && events.length > 0 ? (
          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-foreground mb-3">Upcoming Events</h3>
            <div className="space-y-2">
              {events.slice(0, 3).map((event, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg notion-hover cursor-pointer transition-all duration-200 hover:bg-muted/50">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.startTime).toLocaleDateString()} at {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 pt-4 border-t border-border text-center">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-2">No upcoming events</p>
            <Button variant="ghost" size="sm" className="text-xs hover:bg-muted/50 transition-colors duration-200">
              <Plus className="w-3 h-3 mr-1" />
              Add event
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Get dynamic greeting based on time
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section - Dynamic Greeting */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-normal text-foreground">
            {getGreeting()}{user?.displayName ? `, ${user.displayName}` : ''}
          </h1>
          <p className="text-base text-muted-foreground">Welcome Home</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Recently Visited */}
          <div className="space-y-6">
            
            {/* Recently Visited */}
            <Card className="notion-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Recently visited
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {mockRecentlyVisited.slice(0, 4).map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <div
                        key={item.id}
                        className="flex-shrink-0 w-40 p-3 rounded-lg notion-hover cursor-pointer transition-all duration-200 hover:bg-muted/50 hover:shadow-sm hover:scale-[1.02]"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded ${item.color} flex items-center justify-center`}>
                            <IconComponent className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground text-sm truncate">{item.name}</h3>
                            <p className="text-xs text-muted-foreground">{item.lastVisited}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Featured Templates */}
            <Card className="notion-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Star className="w-4 h-4 text-muted-foreground" />
                  Featured templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {mockFeaturedTemplates.slice(0, 3).map((template) => {
                    const IconComponent = template.icon;
                    return (
                      <div
                        key={template.id}
                        className="flex-shrink-0 w-36 p-3 rounded-lg notion-hover cursor-pointer transition-all duration-200 hover:bg-muted/50 hover:shadow-sm hover:scale-[1.02]"
                      >
                        <div className="space-y-2">
                          <div className="w-full h-12 bg-muted rounded flex items-center justify-center">
                            <div className={`w-6 h-6 rounded ${template.color} flex items-center justify-center`}>
                              <IconComponent className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground text-xs">{template.name}</h3>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Upcoming Events */}
          <div className="space-y-6">
            
            {/* Upcoming Events */}
            <Card className="notion-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Upcoming events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mockUpcomingEvents.length > 0 ? (
                  <div className="space-y-2">
                    {mockUpcomingEvents.slice(0, 3).map((event) => (
                       <div
                         key={event.id}
                         className="p-3 rounded-lg notion-hover cursor-pointer transition-all duration-200 hover:bg-muted/50 hover:shadow-sm hover:scale-[1.01]"
                       >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground text-sm">{event.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{event.date}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{event.time}</span>
                            </div>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${
                            event.type === 'exam' ? 'bg-red-500' : 
                            event.type === 'presentation' ? 'bg-blue-500' : 'bg-green-500'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">No upcoming events</p>
                     <Button variant="ghost" size="sm" className="text-xs hover:bg-muted/50 transition-colors duration-200">
                       <Plus className="w-3 h-3 mr-1" />
                       New event
                     </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Access */}
            <Card className="notion-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Pin className="w-4 h-4 text-muted-foreground" />
                  Quick access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {mockPinnedDatabases.slice(0, 4).map((db) => {
                    const IconComponent = db.icon;
                    return (
                      <div
                        key={db.id}
                        className="p-3 rounded-lg notion-hover cursor-pointer transition-all duration-200 hover:bg-muted/50 hover:shadow-sm hover:scale-[1.01]"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                            <IconComponent className="w-3 h-3 text-foreground" />
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground text-xs">{db.name}</h3>
                            <p className="text-xs text-muted-foreground">{db.count} items</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Wide Calendar Component - Positioned at bottom */}
        <CalendarComponent />
      </div>
    </div>
  );
}