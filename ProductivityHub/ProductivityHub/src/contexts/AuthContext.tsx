import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, handleAuthRedirect, getUserData, signInWithGoogle, signUpWithEmail, signInWithEmail } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  userData: any;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  signUpWithEmailPassword: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasGoogleAccess: boolean;
  hasGoogleCalendar: boolean;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const data = await getUserData(user.uid);
          setUserData(data);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    // Handle redirect result on page load
    handleAuthRedirect().catch(console.error);

    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      await signInWithGoogle();
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
