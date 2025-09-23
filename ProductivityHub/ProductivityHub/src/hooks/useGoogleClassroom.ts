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
  const { userData, user } = useAuth();
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
      syncClassroomData(false).catch(console.error); // false = no toast notifications
    }
  }, [user?.uid]); // Re-sync when user changes

  return {
    ...data,
    syncClassroomData,
    clearData,
    hasValidToken: !!userData?.googleAccessToken,
    isAuthenticated: !!userData?.googleAccessToken,
  };
};
