import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, handleAuthRedirect, getUserData, signInWithGoogle, signUpWithEmail, signInWithEmail } from "@/lib/firebase";
import { syncGoogleClassroomData } from "@/lib/google-classroom";

interface AuthContextType {
  user: User | null;
  userData: any;
  loading: boolean;
  signIn: (enableSync?: boolean) => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  signUpWithEmailPassword: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasGoogleAccess: boolean;
  hasGoogleCalendar: boolean;
  restoreUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Helper functions for localStorage persistence
  const saveUserDataToStorage = (userId: string, data: any) => {
    try {
      localStorage.setItem(`user_data_${userId}`, JSON.stringify({
        ...data,
        cachedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.warn('Failed to save user data to localStorage:', error);
    }
  };

  const getUserDataFromStorage = (userId: string) => {
    try {
      const stored = localStorage.getItem(`user_data_${userId}`);
      if (stored) {
        const data = JSON.parse(stored);
        // Check if cache is still valid (24 hours)
        const cacheAge = Date.now() - new Date(data.cachedAt).getTime();
        if (cacheAge < 24 * 60 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      console.warn('Failed to get user data from localStorage:', error);
    }
    return null;
  };

  const saveClassroomDataToStorage = (userId: string, courses: any[], assignments: any[]) => {
    try {
      const data = {
        courses,
        assignments,
        cachedAt: new Date().toISOString()
      };
      localStorage.setItem(`classroom_data_${userId}`, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save classroom data to localStorage:', error);
    }
  };

  const getClassroomDataFromStorage = (userId: string) => {
    try {
      const stored = localStorage.getItem(`classroom_data_${userId}`);
      if (stored) {
        const data = JSON.parse(stored);
        // Check if cache is still valid (6 hours for classroom data)
        const cacheAge = Date.now() - new Date(data.cachedAt).getTime();
        if (cacheAge < 6 * 60 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      console.warn('Failed to get classroom data from localStorage:', error);
    }
    return null;
  };

  const clearUserStorage = (userId: string) => {
    try {
      localStorage.removeItem(`user_data_${userId}`);
      localStorage.removeItem(`classroom_data_${userId}`);
      localStorage.removeItem(`custom_assignments_${userId}`);
      localStorage.removeItem(`google_calendars_${userId}`);
      localStorage.removeItem(`google_events_${userId}`);
      localStorage.removeItem(`google_calendar_last_sync_${userId}`);
    } catch (error) {
      console.warn('Failed to clear user storage:', error);
    }
  };

  const restoreUserData = async () => {
    if (!user?.uid) return;

    try {
      // First try to get cached user data
      let data = getUserDataFromStorage(user.uid);
      
      if (!data) {
        // If no cache, fetch from Firestore
        data = await getUserData(user.uid);
        if (data) {
          saveUserDataToStorage(user.uid, data);
        }
      } else {
        console.log('✅ Restored user data from cache');
      }

      setUserData(data);

      // If user has Google access, restore classroom data
      if (data?.hasGoogleAccess && data?.googleAccessToken) {
        // First try to get cached classroom data
        let classroomData = getClassroomDataFromStorage(user.uid);
        
        if (!classroomData) {
          // If no cache, fetch fresh data from Google Classroom
          try {
            console.log('🔄 Fetching fresh Google Classroom data...');
            const freshData = await syncGoogleClassroomData(data.googleAccessToken);
            classroomData = {
              courses: freshData.courses,
              assignments: freshData.assignments,
              cachedAt: new Date().toISOString()
            };
            saveClassroomDataToStorage(user.uid, freshData.courses, freshData.assignments);
            console.log('✅ Fresh Google Classroom data fetched and cached');
          } catch (error) {
            console.warn('Failed to fetch fresh Google Classroom data:', error);
          }
        } else {
          console.log('✅ Restored Google Classroom data from cache');
        }

        // Store classroom data in a global state for other components to access
        if (classroomData) {
          (window as any).cachedClassroomData = {
            courses: classroomData.courses,
            assignments: classroomData.assignments,
            lastSynced: new Date(classroomData.cachedAt)
          };
        }
      }
    } catch (error) {
      console.error("Error restoring user data:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // First try to get cached user data immediately
        const cachedData = getUserDataFromStorage(user.uid);
        if (cachedData) {
          setUserData(cachedData);
          setLoading(false);
          console.log('✅ User authenticated with cached data');
          
          // Restore classroom data in background
          if (cachedData?.hasGoogleAccess && cachedData?.googleAccessToken) {
            restoreUserData().catch(console.error);
          }
        } else {
          // No cache, fetch from Firestore
          try {
            const data = await getUserData(user.uid);
            setUserData(data);
            if (data) {
              saveUserDataToStorage(user.uid, data);
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
          setLoading(false);
        }
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    // Handle redirect result on page load
    handleAuthRedirect().catch(console.error);

    return unsubscribe;
  }, []);

  const signIn = async (enableSync: boolean = true) => {
    try {
      await signInWithGoogle(enableSync);
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const signInWithEmailPassword = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password);
    } catch (error) {
      console.error("Error signing in with email:", error);
      throw error;
    }
  };

  const signUpWithEmailPassword = async (email: string, password: string, displayName: string) => {
    try {
      await signUpWithEmail(email, password, displayName);
    } catch (error) {
      console.error("Error signing up with email:", error);
      throw error;
    }
  };

  const signOut = async () => {
    const { signOutUser } = await import("@/lib/firebase");
    
    // Clear cached data before signing out
    if (user?.uid) {
      clearUserStorage(user.uid);
    }
    
    await signOutUser();
  };

  const hasGoogleAccess = userData?.hasGoogleAccess === true;
  const hasGoogleCalendar = userData?.hasGoogleCalendar === true;

  const value = {
    user,
    userData,
    loading,
    signIn,
    signInWithEmailPassword,
    signUpWithEmailPassword,
    signOut,
    hasGoogleAccess,
    hasGoogleCalendar,
    restoreUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
