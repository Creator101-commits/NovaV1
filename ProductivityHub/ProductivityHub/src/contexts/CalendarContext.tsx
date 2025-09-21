import React, { createContext, useContext, useState, ReactNode } from "react";
import { Calendar } from "lucide-react";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: "assignment" | "event" | "class" | "personal";
  color: string;
  location?: string;
  attendees?: string[];
  isAllDay?: boolean;
  assignmentId?: string; // Link to assignment if this event is for an assignment
}

interface CalendarContextType {
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, "id">) => string;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  getEventsForDate: (date: Date) => CalendarEvent[];
  addAssignmentToCalendar: (assignment: any) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
};

export const CalendarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: "1",
      title: "ACC Chemistry",
      startTime: new Date(2025, 7, 28, 14, 0), // Aug 28, 2pm
      endTime: new Date(2025, 7, 28, 15, 30),
      type: "class",
      color: "bg-blue-500",
    },
    {
      id: "2",
      title: "Mentor Meeting",
      startTime: new Date(2025, 7, 28, 19, 30), // Aug 28, 7:30pm
      endTime: new Date(2025, 7, 28, 20, 30),
      type: "event",
      color: "bg-green-500",
    },
    {
      id: "3",
      title: "Aarya Birthday",
      startTime: new Date(2025, 7, 31, 11, 0), // Aug 31, 11am
      endTime: new Date(2025, 7, 31, 12, 0),
      type: "personal",
      color: "bg-pink-500",
    },
    {
      id: "4",
      title: "Equicode Meeting",
      startTime: new Date(2025, 7, 31, 17, 0), // Aug 31, 5pm
      endTime: new Date(2025, 7, 31, 18, 0),
      type: "event",
      color: "bg-purple-500",
    },
    {
      id: "5",
      title: "Data Analytics",
      startTime: new Date(2025, 8, 1, 18, 0), // Sep 1, 6pm
      endTime: new Date(2025, 8, 1, 19, 0),
      type: "class",
      color: "bg-orange-500",
    },
    {
      id: "6",
      title: "Labor Day",
      startTime: new Date(2025, 8, 1),
      endTime: new Date(2025, 8, 1),
      type: "event",
      color: "bg-red-500",
      isAllDay: true,
    },
  ]);

  const addEvent = (event: Omit<CalendarEvent, "id">): string => {
    const id = Date.now().toString();
    const newEvent = { ...event, id };
    setEvents(prev => [...prev, newEvent]);
    return id;
  };

  const updateEvent = (id: string, eventUpdate: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(event => 
      event.id === id ? { ...event, ...eventUpdate } : event
    ));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const addAssignmentToCalendar = (assignment: any) => {
    // Check if assignment already has a calendar event
    const existingEvent = events.find(event => event.assignmentId === assignment.id);
    if (existingEvent) return;

    // Create calendar event for the assignment
    const dueTime = new Date(assignment.dueDate);
    const eventId = addEvent({
      title: `� ${assignment.title}`,
      description: `Assignment due for ${assignment.className}\n\n${assignment.description || ''}`,
      startTime: dueTime,
      endTime: new Date(dueTime.getTime() + 60 * 60 * 1000), // 1 hour duration
      type: "assignment",
      color: assignment.classColor || "bg-red-500",
      assignmentId: assignment.id,
    });

    return eventId;
  };

  return (
    <CalendarContext.Provider 
      value={{
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        getEventsForDate,
        addAssignmentToCalendar,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};
