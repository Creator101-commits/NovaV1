import { auth } from './firebase';

/**
 * Utility functions for making authenticated API calls to Oracle backend
 */

const API_BASE_URL = 'http://localhost:5000';

// Wait for auth to be ready
const waitForAuth = (): Promise<string | null> => {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser.uid);
    } else {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user?.uid || null);
      });
    }
  });
};

export const makeAuthenticatedRequest = async (endpoint: string, options: RequestInit = {}) => {
  // Wait for authentication state to be ready
  const userId = await waitForAuth();
  
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  console.log('🔍 API Debug:', { 
    url, 
    userId,
    authCurrentUser: auth.currentUser ? { uid: auth.currentUser.uid, email: auth.currentUser.email } : null
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add user ID to headers if available
  if (userId) {
    headers['x-user-id'] = userId;
    console.log('✅ Adding user ID to headers:', userId);
  } else {
    console.warn('⚠️ No user ID available - user may not be authenticated');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('🔍 API Response:', { 
      url, 
      status: response.status, 
      ok: response.ok,
      statusText: response.statusText 
    });

    // Return the response object directly so the caller can check .ok and .status
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Flashcard API functions
export const flashcardAPI = {
  // Get all flashcards for a user
  getFlashcards: async (userId: string) => {
    return makeAuthenticatedRequest(`/api/flashcards?userId=${userId}`);
  },

  // Create a new flashcard
  createFlashcard: async (flashcard: {
    userId: string;
    front: string;
    back: string;
    difficulty: "easy" | "medium" | "hard";
    classId?: string;
  }) => {
    return makeAuthenticatedRequest('/api/flashcards', {
      method: 'POST',
      body: JSON.stringify(flashcard),
    });
  },

  // Update a flashcard
  updateFlashcard: async (id: string, updates: {
    front?: string;
    back?: string;
    difficulty?: "easy" | "medium" | "hard";
    reviewCount?: number;
    lastReviewed?: string;
  }) => {
    return makeAuthenticatedRequest(`/api/flashcards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete a flashcard
  deleteFlashcard: async (id: string) => {
    return makeAuthenticatedRequest(`/api/flashcards/${id}`, {
      method: 'DELETE',
    });
  },
};

// Generic API functions for backward compatibility
export const apiGet = async (endpoint: string) => {
  return makeAuthenticatedRequest(endpoint, { method: 'GET' });
};

export const apiPost = async (endpoint: string, data: any) => {
  return makeAuthenticatedRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const apiPut = async (endpoint: string, data: any) => {
  return makeAuthenticatedRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const apiDelete = async (endpoint: string) => {
  return makeAuthenticatedRequest(endpoint, { method: 'DELETE' });
};