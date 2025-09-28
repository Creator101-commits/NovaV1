import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleClassroomAPI, syncGoogleClassroomData } from '@/lib/google-classroom';
import { useToast } from '@/hooks/use-toast';

interface ClassroomData {
  courses: any[];
  assignments: any[];
  isLoading: boolean;
  error: string | null;
  lastSynced: Date | null;
}

export const useGoogleClassroom = () => {
  const { userData, user, restoreUserData } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<ClassroomData>({
    courses: [],
    assignments: [],
    isLoading: false,
    error: null,
    lastSynced: null,
  });

  const syncClassroomData = async (showToast = true) => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let googleData: { courses: any[], assignments: any[] } = { courses: [], assignments: [] };
      let databaseClasses: any[] = [];
      
      // Fetch Google Classroom data if authenticated
      if (userData?.googleAccessToken) {
        try {
          googleData = await syncGoogleClassroomData(userData.googleAccessToken);
        } catch (googleError) {
          console.warn('Failed to sync Google Classroom data:', googleError);
          // Continue to fetch local data even if Google sync fails
        }
      }

      // Fetch custom classes from database
      if (user?.uid) {
        try {
          const response = await fetch(`/api/users/${user.uid}/classes`);
          if (response.ok) {
            databaseClasses = await response.json();
            console.log('Fetched database classes:', databaseClasses.length);
          } else {
            console.warn('Failed to fetch database classes:', response.status);
          }
        } catch (dbError) {
          console.warn('Failed to fetch database classes:', dbError);
        }
      }

      // Fetch custom assignments from localStorage
      let customAssignments = [];
      if (user?.uid) {
        const storageKey = `custom_assignments_${user.uid}`;
        customAssignments = JSON.parse(localStorage.getItem(storageKey) || '[]');
      }

      // Merge Google Classroom data with database classes
      const allCourses = [...googleData.courses, ...databaseClasses];
      const allAssignments = [...googleData.assignments, ...customAssignments];
      
      console.log('Classroom sync results:', {
        googleCourses: googleData.courses.length,
        databaseClasses: databaseClasses.length,
        googleAssignments: googleData.assignments.length,
        customAssignments: customAssignments.length,
        totalCourses: allCourses.length,
        totalAssignments: allAssignments.length,
        sampleCourse: allCourses[0], // Log first course for debugging
        sampleAssignment: allAssignments[0] // Log first assignment for debugging
      });
      
      setData(prev => ({
        ...prev,
        courses: allCourses,
        assignments: allAssignments,
        isLoading: false,
        lastSynced: new Date(),
      }));

      // Save to localStorage for persistence
      if (user?.uid) {
        try {
          const dataToCache = {
            courses: allCourses,
            assignments: allAssignments,
            cachedAt: new Date().toISOString()
          };
          localStorage.setItem(`classroom_data_${user.uid}`, JSON.stringify(dataToCache));
          
          // Also update global cache for immediate access
          (window as any).cachedClassroomData = {
            courses: allCourses,
            assignments: allAssignments,
            lastSynced: new Date()
          };
        } catch (error) {
          console.warn('Failed to save classroom data to localStorage:', error);
        }
      }

      if (showToast) {
        toast({
          title: "Sync Successful",
          description: `Synced ${allCourses.length} classes and ${allAssignments.length} assignments.`,
        });
      }

      return { courses: allCourses, assignments: allAssignments };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sync data';
      setData(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      
      if (showToast) {
        toast({
          title: "Sync Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }

      throw error;
    }
  };

  const clearData = () => {
    setData({
      courses: [],
      assignments: [],
      isLoading: false,
      error: null,
      lastSynced: null,
    });
  };

  // Auto-sync on component mount and when user changes (silent sync)
  useEffect(() => {
    if (user?.uid && data.courses.length === 0 && !data.isLoading) {
      // First try to load from cached data if available
      const cachedData = (window as any).cachedClassroomData;
      if (cachedData) {
        console.log('✅ Loading Google Classroom data from cache');
        setData(prev => ({
          ...prev,
          courses: cachedData.courses || [],
          assignments: cachedData.assignments || [],
          lastSynced: cachedData.lastSynced || null,
        }));
      } else {
        // No cached data, sync fresh data
        syncClassroomData(false).catch(console.error); // false = no toast notifications
      }
    }
  }, [user?.uid]); // Re-sync when user changes

  // Listen for auth restoration and update data accordingly
  useEffect(() => {
    const handleAuthRestore = () => {
      const cachedData = (window as any).cachedClassroomData;
      if (cachedData && user?.uid) {
        console.log('✅ Auth restored, updating Google Classroom data');
        setData(prev => ({
          ...prev,
          courses: cachedData.courses || [],
          assignments: cachedData.assignments || [],
          lastSynced: cachedData.lastSynced || null,
        }));
      }
    };

    // Check if data is available after auth restoration
    const interval = setInterval(() => {
      const cachedData = (window as any).cachedClassroomData;
      if (cachedData && data.courses.length === 0 && user?.uid) {
        handleAuthRestore();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.uid, data.courses.length]);

  return {
    ...data,
    syncClassroomData,
    clearData,
    hasValidToken: !!userData?.googleAccessToken,
    isAuthenticated: !!userData?.googleAccessToken,
  };
};
