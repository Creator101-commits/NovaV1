import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  RefreshCw
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday
} from "date-fns";
import { useCalendar, CalendarEvent } from "@/contexts/CalendarContext";
import { useActivity } from "@/contexts/ActivityContext";
import { useSmartScheduling } from "@/hooks/useSmartScheduling";
import { useGoogleCalendarSync } from "@/hooks/useGoogleCalendarSync";
import { useGoogleClassroom } from "@/hooks/useGoogleClassroom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Calendar() {
  const { user, userData, hasGoogleCalendar } = useAuth();
  const { events, addEvent, getEventsForDate } = useCalendar();
  const { addActivity } = useActivity();
  const { generateOptimalSchedule, saveScheduleToCalendar } = useSmartScheduling();
  const {
    events: googleEvents,
    calendars: googleCalendars,
    isConnected: isGoogleConnected,
    syncCalendarData,
    createEvent: createGoogleEvent,
    lastSync
  } = useGoogleCalendarSync();
  const { syncClassroomData } = useGoogleClassroom();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startTime: undefined as Date | undefined,
    endTime: undefined as Date | undefined,
    type: "event" as const,
    location: "",
    isAllDay: false,
  });

  // Merge local events with Google Calendar events
  const getAllEvents = () => {
    const localEvents = events;
    
    // Convert Google Calendar events to local format
    const convertedGoogleEvents: CalendarEvent[] = googleEvents.map(googleEvent => {
      // Ensure dates are valid Date objects
      const startTime = googleEvent.startTime instanceof Date 
        ? googleEvent.startTime 
        : new Date(googleEvent.startTime);
      const endTime = googleEvent.endTime instanceof Date 
        ? googleEvent.endTime 
        : new Date(googleEvent.endTime);

      return {
        id: googleEvent.id,
        title: googleEvent.title,
        start: startTime,
        end: endTime,
        startTime: startTime, // For backward compatibility with calendar display
        endTime: endTime,     // For backward compatibility with calendar display
        description: googleEvent.description,
        location: googleEvent.location,
        isAllDay: false, // We'll determine this from the dates
        priority: 'medium' as const,
        category: 'meeting' as const,
        color: 'bg-blue-500', // Google events in blue
        type: 'event' as const,
        source: 'google' as const,
        googleEventId: googleEvent.googleEventId,
        calendarName: googleEvent.calendarName,
      };
    }).filter(event => 
      // Only include events with valid dates
      event.startTime instanceof Date && !isNaN(event.startTime.getTime()) &&
      event.endTime instanceof Date && !isNaN(event.endTime.getTime())
    );

    return [...localEvents, ...convertedGoogleEvents];
  };

  // Get events for a specific date (including Google events)
  const getAllEventsForDate = (date: Date) => {
    const allEvents = getAllEvents();
    return allEvents.filter(event => {
      const eventDate = event.startTime;
      return eventDate && isSameDay(new Date(eventDate), date);
    });
  };

  // Get calendar grid days
  const getCalendarDays = () => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Add new event
  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.startTime) return;

    const startTime = newEvent.startTime;
    const endTime = newEvent.endTime || new Date(startTime.getTime() + 60 * 60 * 1000);

    // Add to local calendar
    const eventId = addEvent({
      title: newEvent.title,
      description: newEvent.description,
      startTime,
      endTime,
      type: newEvent.type,
      color: getColorForType(newEvent.type),
      location: newEvent.location,
      isAllDay: newEvent.isAllDay,
    });

    // Also add to Google Calendar if connected
    if (isGoogleConnected) {
      try {
        await createGoogleEvent({
          title: newEvent.title,
          description: newEvent.description,
          startTime,
          endTime,
          location: newEvent.location,
        });
        toast({
          title: "Event Created",
          description: "Event added to both local calendar and Google Calendar",
        });
      } catch (error) {
        console.warn('Failed to create Google Calendar event:', error);
        toast({
          title: "Partial Success",
          description: "Event created locally, but failed to sync with Google Calendar",
          variant: "destructive"
        });
      }
    }

    // Add activity for event creation
    addActivity({
      label: `Created event: ${newEvent.title}`,
      icon: CalendarIcon,
      tone: "text-green-500",
      type: "calendar",
      relatedId: eventId,
      route: "/calendar"
    });

    setIsEventDialogOpen(false);
    setNewEvent({
      title: "",
      description: "",
      startTime: undefined,
      endTime: undefined,
      type: "event",
      location: "",
      isAllDay: false,
    });
  };

  // Handle sync of both Google Classroom and Google Calendar
  const handleSync = async () => {
    if (!user) return;

    setIsSyncing(true);
    try {
      // Sync both Google Classroom assignments and Google Calendar events
      await Promise.all([
        syncClassroomData(),
        syncCalendarData()
      ]);

      toast({
        title: "Sync Complete",
        description: `Synced ${googleEvents.length} calendar events and assignments`,
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: "Could not sync data. Please check your Google account connection.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case "assignment": return "bg-red-500";
      case "class": return "bg-blue-500";
      case "event": return "bg-green-500";
      case "personal": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const calendarDays = getCalendarDays();

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      {/* Gentle Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Your Calendar
        </h1>
        <p className="text-sm text-muted-foreground">
          Keep track of your schedule and important dates
        </p>
      </div>

      {/* Simple Actions */}
      <div className="flex gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={goToToday} className="text-sm">
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
          className="text-sm"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync'}
        </Button>
          <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-bg">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium">Event Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter event title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter event description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="mt-2 min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="startTime" className="text-sm font-medium">Start Date & Time</Label>
                    <DateTimePicker
                      date={newEvent.startTime}
                      onDateChange={(date) => setNewEvent({ ...newEvent, startTime: date })}
                      placeholder="Pick start date & time"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-sm font-medium">End Date & Time</Label>
                    <DateTimePicker
                      date={newEvent.endTime}
                      onDateChange={(date) => setNewEvent({ ...newEvent, endTime: date })}
                      placeholder="Pick end date & time"
                      disabled={!newEvent.startTime}
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="type" className="text-sm font-medium">Event Type</Label>
                    <Select value={newEvent.type} onValueChange={(value: any) => setNewEvent({ ...newEvent, type: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="class">Class</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-sm font-medium">Location (Optional)</Label>
                    <Input
                      id="location"
                      placeholder="Event location"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="gradient-bg" onClick={handleAddEvent}>
                    Add Event
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-semibold min-w-48 text-center text-foreground">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="bg-card border-border">
        <CardContent className="p-0 bg-card">
          {/* Header Row */}
          <div className="grid grid-cols-7 border-b border-border">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-4 text-center text-sm font-medium text-muted-foreground bg-muted/50"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const dayEvents = getAllEventsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-32 p-2 border-r border-b border-border cursor-pointer hover:bg-accent/50 transition-colors bg-card ${
                    !isCurrentMonth ? "bg-muted/20 text-muted-foreground" : "bg-card text-foreground"
                  } ${isSelected ? "bg-primary/10" : ""}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="space-y-1">
                    <div className={`text-sm font-medium ${
                      isTodayDate 
                        ? "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center" 
                        : ""
                    }`}>
                      {format(day, "d")}
                    </div>
                    
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs px-1 py-0.5 rounded text-white truncate ${event.color}`}
                          title={`${event.title} ${event.isAllDay ? "" : `at ${format(event.startTime, "h:mm a")}`}`}
                        >
                          {event.isAllDay ? (
                            event.title
                          ) : (
                            <>
                              <Clock className="inline h-2 w-2 mr-1" />
                              {format(event.startTime, "h:mm a")} {event.title}
                            </>
                          )}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Events */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Events for {format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getAllEventsForDate(selectedDate).length > 0 ? (
              <div className="space-y-3">
                {getAllEventsForDate(selectedDate).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border"
                  >
                    <div className={`w-3 h-3 rounded-full ${event.color}`}></div>
                    <div className="flex-1">
                      <h4 className="font-medium">{event.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {event.isAllDay 
                              ? "All day" 
                              : `${format(event.startTime, "h:mm a")} - ${format(event.endTime, "h:mm a")}`
                            }
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {event.type}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No events scheduled for this day</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => setIsEventDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
