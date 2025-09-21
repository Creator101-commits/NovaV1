import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleCalendarService, getCachedCalendarData, shouldRefreshCalendarData, syncGoogleCalendarOnLogin } from '@/lib/google-calendar-service';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: Array<{
    email: string;
    name?: string;
    status?: string;
  }>;
  calendarId?: string;
  calendarName?: string;
  isGoogleEvent: boolean;
  googleEventId?: string;
  status: 'confirmed' | 'cancelled' | 'tentative';
  htmlLink?: string;
}

interface Calendar {
  id: string;
  name: string;
  description?: string;
  isPrimary?: boolean;
  backgroundColor?: string;
  isGoogleCalendar: boolean;
}

export const useGoogleCalendarSync = () => {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Check if user has Google Calendar access
  useEffect(() => {
    if (userData?.hasGoogleCalendar && userData?.googleAccessToken) {
      setIsConnected(true);
      loadCachedData();
    }
  }, [userData]);

  // Load cached calendar data
  const loadCachedData = useCallback(() => {
    if (!user?.uid) return;

    const cached = getCachedCalendarData(user.uid);
    
    // Transform Google Calendar events to our format
    const transformedEvents: CalendarEvent[] = cached.events.map((googleEvent: any) => ({
      id: `google-${googleEvent.id}`,
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description,
      startTime: new Date(googleEvent.start?.dateTime || googleEvent.start?.date),
      endTime: new Date(googleEvent.end?.dateTime || googleEvent.end?.date),
      location: googleEvent.location,
      attendees: googleEvent.attendees?.map((attendee: any) => ({
        email: attendee.email,
        name: attendee.displayName,
        status: attendee.responseStatus,
      })),
      calendarId: googleEvent.calendarId,
      calendarName: googleEvent.calendarName,
      isGoogleEvent: true,
      googleEventId: googleEvent.id,
      status: googleEvent.status || 'confirmed',
      htmlLink: googleEvent.htmlLink,
    }));

    const transformedCalendars: Calendar[] = cached.calendars.map((googleCal: any) => ({
      id: googleCal.id,
      name: googleCal.summary,
      description: googleCal.description,
      isPrimary: googleCal.primary,
      backgroundColor: googleCal.backgroundColor,
      isGoogleCalendar: true,
    }));

    setEvents(transformedEvents);
    setCalendars(transformedCalendars);
    setLastSync(cached.lastSync);
  }, [user?.uid]);

  // Manual sync function
  const syncCalendarData = useCallback(async () => {
    if (!userData?.googleAccessToken || !user?.uid) {
      toast({
        title: "Sync Failed",
        description: "No Google Calendar access. Please sign in again.",
        variant: "destructive"
      });
      return false;
    }

    setIsLoading(true);
    try {
      const calendarData = await syncGoogleCalendarOnLogin(userData.googleAccessToken, user.uid);
      loadCachedData(); // Refresh the UI with new data
      
      toast({
        title: "Sync Complete",
        description: `Synced ${calendarData.calendars.length} calendars and ${calendarData.events.length} events`,
      });
      
      return true;
    } catch (error) {
      console.error('Manual calendar sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync calendar data. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userData?.googleAccessToken, user?.uid, loadCachedData, toast]);

  // Auto-refresh if data is stale
  useEffect(() => {
    if (isConnected && user?.uid && shouldRefreshCalendarData(user.uid, 60)) {
      syncCalendarData();
    }
  }, [isConnected, user?.uid, syncCalendarData]);

  // Create a new event in Google Calendar
  const createEvent = useCallback(async (event: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    calendarId?: string;
  }) => {
    if (!userData?.googleAccessToken) return null;

    try {
      const calendarService = new GoogleCalendarService(userData.googleAccessToken);
      
      const googleEvent = await calendarService.createEvent(event.calendarId || 'primary', {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        location: event.location,
      });

      // Refresh data after creating
      await syncCalendarData();

      toast({
        title: "Event Created",
        description: `"${event.title}" has been added to your Google Calendar`,
      });

      return googleEvent;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      toast({
        title: "Failed to Create Event",
        description: "Could not create the event in Google Calendar",
        variant: "destructive"
      });
      return null;
    }
  }, [userData?.googleAccessToken, syncCalendarData, toast]);

  // Update an existing event
  const updateEvent = useCallback(async (eventId: string, updates: {
    title?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    location?: string;
  }) => {
    if (!userData?.googleAccessToken) return false;

    try {
      const event = events.find(e => e.id === eventId || e.googleEventId === eventId);
      if (!event?.googleEventId || !event?.calendarId) return false;

      const calendarService = new GoogleCalendarService(userData.googleAccessToken);

      const updateData: any = {};
      if (updates.title) updateData.summary = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.startTime) {
        updateData.start = {
          dateTime: updates.startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      }
      if (updates.endTime) {
        updateData.end = {
          dateTime: updates.endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      }
      if (updates.location !== undefined) updateData.location = updates.location;

      await calendarService.updateEvent(event.calendarId, event.googleEventId, updateData);

      // Refresh data after updating
      await syncCalendarData();

      toast({
        title: "Event Updated",
        description: "The event has been updated in Google Calendar",
      });

      return true;
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      toast({
        title: "Failed to Update Event",
        description: "Could not update the event in Google Calendar",
        variant: "destructive"
      });
      return false;
    }
  }, [userData?.googleAccessToken, events, syncCalendarData, toast]);

  // Delete an event
  const deleteEvent = useCallback(async (eventId: string) => {
    if (!userData?.googleAccessToken) return false;

    try {
      const event = events.find(e => e.id === eventId || e.googleEventId === eventId);
      if (!event?.googleEventId || !event?.calendarId) return false;

      const calendarService = new GoogleCalendarService(userData.googleAccessToken);
      await calendarService.deleteEvent(event.calendarId, event.googleEventId);

      // Refresh data after deleting
      await syncCalendarData();

      toast({
        title: "Event Deleted",
        description: "The event has been removed from Google Calendar",
      });

      return true;
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      toast({
        title: "Failed to Delete Event",
        description: "Could not delete the event from Google Calendar",
        variant: "destructive"
      });
      return false;
    }
  }, [userData?.googleAccessToken, events, syncCalendarData, toast]);

  return {
    // Data
    events,
    calendars,
    lastSync,
    isConnected,
    isLoading,
    
    // Actions
    syncCalendarData,
    createEvent,
    updateEvent,
    deleteEvent,
    
    // Utility
    needsSync: user?.uid ? shouldRefreshCalendarData(user.uid, 60) : false,
  };
};
