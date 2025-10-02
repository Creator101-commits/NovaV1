import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { syncGoogleCalendarOnLogin } from "./google-calendar-service";

const firebaseConfig = {
  apiKey: "AIzaSyDmx9WX5GHpG8Gx0xhJpNWJwo6_0fmAOsE",
  authDomain: "studypal-47e1d.firebaseapp.com",
  projectId: "studypal-47e1d",
  storageBucket: "studypal-47e1d.firebasestorage.app",
  messagingSenderId: "858977827115",
  appId: "1:858977827115:web:1dc47aa54ebc977afa2d6e",
  measurementId: "G-LEDJPPD35J"
};

// Debug logging
console.log('Firebase config loaded:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with error handling
let db: any = null;
let storage: any = null;

try {
  db = getFirestore(app);
  console.log('Firestore initialized successfully');
} catch (error) {
  console.warn('Firestore not available:', error);
  // Firestore will remain null if not available
}

try {
  storage = getStorage(app);
  console.log('Storage initialized successfully');
} catch (error) {
  console.warn('Storage not available:', error);
  // Storage will remain null if not available
}

export { db, storage };

// Initialize Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Configure Google Auth Provider with Calendar scopes
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar');
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
// Using only valid Google Classroom API scopes
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.student-submissions.students.readonly');

export const signInWithGoogle = async (enableSync: boolean = true) => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    
    // Store user data in Firestore only if available
    const user = result.user;
    if (db && token) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          name: user.displayName,
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          avatar: user.photoURL,
          googleAccessToken: enableSync ? token : null,
          authProvider: 'google',
          hasGoogleAccess: enableSync, // Key flag to enable sync features
          hasGoogleCalendar: enableSync, // New flag for calendar access
          updatedAt: new Date(),
        }, { merge: true });
        console.log('User data saved to Firestore');

        // Only sync Google Calendar data if sync is enabled
        if (enableSync) {
          try {
            console.log('Starting Google Calendar sync...');
            const calendarData = await syncGoogleCalendarOnLogin(token, user.uid);
            console.log(`Synced ${calendarData.calendars.length} calendars and ${calendarData.events.length} events`);
          } catch (calendarError) {
            console.warn('Failed to sync Google Calendar data during login:', calendarError);
            // Don't fail the login if calendar sync fails
          }
        } else {
          console.log('Google sync disabled - skipping data synchronization');
        }

        // Sync user to Oracle database
        try {
          console.log('Syncing user to Oracle database...');
          const response = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              accessToken: enableSync ? token : null,
            }),
          });

          if (response.ok) {
            console.log('✅ User synced to Oracle database');
          } else {
            console.warn('Failed to sync user to Oracle database:', await response.text());
          }
        } catch (oracleError) {
          console.warn('Failed to sync user to Oracle database:', oracleError);
          // Don't fail the login if Oracle sync fails
        }
      } catch (firestoreError) {
        console.warn('Failed to save user data to Firestore:', firestoreError);
        // Continue without Firestore - user is still authenticated
      }
    } else {
      console.warn('Firestore not available - user data not saved');
    }
    
    return { user, token: enableSync ? token : null };
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    // Fallback to redirect for mobile devices or if popup is blocked
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      return signInWithRedirect(auth, googleProvider);
    }
    throw error;
  }
};

// Alternative redirect sign-in for fallback
export const signInWithGoogleRedirect = () => {
  return signInWithRedirect(auth, googleProvider);
};

export const handleAuthRedirect = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      // Store user data in Firestore only if available
      const user = result.user;
      if (db && token) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            name: user.displayName,
            firstName: user.displayName?.split(' ')[0] || '',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            avatar: user.photoURL,
            googleAccessToken: token,
            authProvider: 'google',
            hasGoogleAccess: true, // Key flag to enable sync features
            hasGoogleCalendar: true, // New flag for calendar access
            updatedAt: new Date(),
          }, { merge: true });
          console.log('User data saved to Firestore via redirect');

          // Automatically sync Google Calendar data
          try {
            console.log('Starting Google Calendar sync from redirect...');
            const calendarData = await syncGoogleCalendarOnLogin(token, user.uid);
            console.log(`Synced ${calendarData.calendars.length} calendars and ${calendarData.events.length} events`);
          } catch (calendarError) {
            console.warn('Failed to sync Google Calendar data during redirect login:', calendarError);
          }
        } catch (firestoreError) {
          console.warn('Failed to save user data to Firestore via redirect:', firestoreError);
        }
      } else {
        console.warn('Firestore not available - user data not saved via redirect');
      }
      
      return { user, token };
    }
  } catch (error) {
    console.error('Auth redirect error:', error);
    throw error;
  }
};

export const signOutUser = () => {
  return signOut(auth);
};

export const getUserData = async (uid: string) => {
  if (!db) {
    console.warn('Firestore not available - cannot get user data');
    return null;
  }
  
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const updateUserData = async (uid: string, data: any) => {
  if (!db) {
    console.warn('Firestore not available - cannot update user data');
    return;
  }
  
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: new Date(),
    });
    console.log('User data updated successfully');
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
};

// Email/Password Authentication
export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Update the user's display name
    await updateProfile(user, {
      displayName: displayName
    });

    // Store user data in Firestore (without Google access token)
    if (db) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          name: displayName,
          firstName: displayName?.split(' ')[0] || '',
          lastName: displayName?.split(' ').slice(1).join(' ') || '',
          avatar: null,
          authProvider: 'email',
          hasGoogleAccess: false, // Key flag to disable sync features
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log('Email user data saved to Firestore');

        // Sync user to Oracle database
        try {
          console.log('Syncing email user to Oracle database...');
          const response = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uid: user.uid,
              email: user.email,
              displayName: displayName,
              photoURL: null,
              accessToken: null,
            }),
          });

          if (response.ok) {
            console.log('✅ Email user synced to Oracle database');
          } else {
            console.warn('Failed to sync email user to Oracle database:', await response.text());
          }
        } catch (oracleError) {
          console.warn('Failed to sync email user to Oracle database:', oracleError);
        }
      } catch (firestoreError) {
        console.warn('Failed to save user data to Firestore:', firestoreError);
      }
    }

    return { user };
  } catch (error) {
    console.error('Error creating account with email:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Update last sign in time
    if (db) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          lastSignIn: new Date(),
        });
      } catch (firestoreError) {
        console.warn('Failed to update sign in time:', firestoreError);
      }

      // Sync user to Oracle database on sign in
      try {
        console.log('Syncing signed-in user to Oracle database...');
        const response = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            accessToken: null,
          }),
        });

        if (response.ok) {
          console.log('✅ Signed-in user synced to Oracle database');
        } else {
          console.warn('Failed to sync signed-in user to Oracle database:', await response.text());
        }
      } catch (oracleError) {
        console.warn('Failed to sync signed-in user to Oracle database:', oracleError);
      }
    }

    return { user };
  } catch (error) {
    console.error('Error signing in with email:', error);
    throw error;
  }
};
