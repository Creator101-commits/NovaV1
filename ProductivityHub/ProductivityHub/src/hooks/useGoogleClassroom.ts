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
      
      // Fetch Google Classroom data if authenticated
      if (userData?.googleAccessToken) {
        try {
          googleData = await syncGoogleClassroomData(userData.googleAccessToken);
        } catch (googleError) {
          console.warn('Failed to sync Google Classroom data:', googleError);
          // Continue to fetch local data even if Google sync fails
        }
      }

      // Fetch custom assignments from localStorage
      let customAssignments = [];
      if (user?.uid) {
        const storageKey = `custom_assignments_${user.uid}`;
        customAssignments = JSON.parse(localStorage.getItem(storageKey) || '[]');
      }

      // Merge Google Classroom data with custom data
      const allCourses = [...googleData.courses];
      const allAssignments = [...googleData.assignments, ...customAssignments];
      
      console.log('Google Classroom sync results:', {
        googleCourses: googleData.courses.length,
        googleAssignments: googleData.assignments.length,
        customAssignments: customAssignments.length,
        totalAssignments: allAssignments.length,
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
          description: `Synced ${allCourses.length} courses and ${allAssignments.length} assignments.`,
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

  // Auto-sync on component mount (silent sync)
  useEffect(() => {
    if (data.courses.length === 0 && !data.isLoading) {
      syncClassroomData(false).catch(console.error); // false = no toast notifications
    }
  }, []);

  return {
    ...data,
    syncClassroomData,
    clearData,
    hasValidToken: !!userData?.googleAccessToken,
    isAuthenticated: !!userData?.googleAccessToken,
  };
};
