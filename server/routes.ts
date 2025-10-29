import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { optimizedStorage } from "./optimized-storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertClassSchema, 
  insertAssignmentSchema,
  insertFlashcardSchema,
  insertFlashcardDeckSchema,
  insertFlashcardReviewSchema,
  insertPomodoroSessionSchema, 
  insertAiSummarySchema,
  insertNoteSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to extract user ID from request
  const getUserId = (req: any): string => {
    // Check for user ID in request headers - authentication required
    // Firebase token verification is handled by frontend
    const userId = req.headers['x-user-id'] || req.headers['user-id'];
    
    console.log(' Server Debug - Headers:', {
      'x-user-id': req.headers['x-user-id'],
      'user-id': req.headers['user-id'],
      allHeaders: Object.keys(req.headers)
    });
    
    if (userId) {
      console.log(' User ID found:', userId);
      return userId as string;
    }
    
    // No fallback - require proper authentication
    console.error(' No user ID provided in request headers');
    throw new Error('Authentication required: No user ID provided');
  };

  // Firebase to Oracle sync endpoint
  app.post("/api/auth/sync", async (req, res) => {
    try {
      const { uid, email, displayName, photoURL, accessToken } = req.body;
      
      if (!uid || !email) {
        return res.status(400).json({ message: "Missing required user data" });
      }

      // Check if user already exists
      let user = await optimizedStorage.getUser(uid);
      
      if (user) {
        // Update existing user
        const updateData = {
          name: displayName || user.name,
          email,
          avatar: photoURL || user.avatar,
          googleAccessToken: accessToken || user.googleAccessToken,
        };
        
        user = await optimizedStorage.updateUser(uid, updateData);
        console.log(` Updated user: ${email}`);
      } else {
        // Create new user
        const userData = {
          name: displayName || email.split('@')[0],
          email,
          firstName: displayName?.split(' ')[0] || '',
          lastName: displayName?.split(' ').slice(1).join(' ') || '',
          avatar: photoURL || null,
          googleId: uid,
          googleAccessToken: accessToken || null,
        };
        
        // Use Firebase UID as the Oracle database user ID
        user = await optimizedStorage.createUserWithId(uid, userData);
        console.log(` Created new user: ${email}`);
      }
      
      res.json({ success: true, user });
    } catch (error) {
      console.error(' Error syncing user:', error);
      res.status(500).json({ message: "Failed to sync user" });
    }
  });

  // Google Classroom sync endpoint
  app.post("/api/sync/google-classroom", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { classes: googleClasses, assignments: googleAssignments } = req.body;

      if (!googleClasses || !googleAssignments) {
        return res.status(400).json({ message: "Missing Google Classroom data" });
      }

      const syncedClasses = [];
      const syncedAssignments = [];

      // Sync classes
      for (const googleClass of googleClasses) {
        try {
          // Check if class already exists by googleClassroomId
          const existingClasses = await optimizedStorage.getClassesByUserId(userId);
          const existingClass = existingClasses.find(c => c.googleClassroomId === googleClass.id);

          if (existingClass) {
            // Update existing class
            const updatedClass = await optimizedStorage.updateClass(existingClass.id, {
              name: googleClass.name,
              section: googleClass.section || null,
              description: googleClass.descriptionHeading || null,
              teacherName: googleClass.teacherName || null,
              teacherEmail: googleClass.teacherEmail || null,
              source: 'google_classroom',
              syncStatus: 'synced',
            });
            syncedClasses.push(updatedClass);
          } else {
            // Create new class
            const classData = insertClassSchema.parse({
              userId,
              googleClassroomId: googleClass.id,
              name: googleClass.name,
              section: googleClass.section || null,
              description: googleClass.descriptionHeading || null,
              teacherName: googleClass.teacherName || null,
              teacherEmail: googleClass.teacherEmail || null,
              color: googleClass.color || '#42a5f5',
              source: 'google_classroom',
              syncStatus: 'synced',
            });
            const newClass = await optimizedStorage.createClass(classData);
            syncedClasses.push(newClass);
          }
        } catch (error) {
          console.error(`Failed to sync class ${googleClass.id}:`, error);
        }
      }

      // Sync assignments
      for (const googleAssignment of googleAssignments) {
        try {
          // Find the corresponding class in our database
          const correspondingClass = syncedClasses.find(
            c => c?.googleClassroomId === googleAssignment.courseId
          );

          if (!correspondingClass) {
            console.warn(`No class found for assignment ${googleAssignment.id}`);
            continue;
          }

          // Check if assignment already exists by googleClassroomId
          const existingAssignments = await optimizedStorage.getAssignmentsByUserId(userId);
          const existingAssignment = existingAssignments.find(
            a => a.googleClassroomId === googleAssignment.id
          );

          if (existingAssignment) {
            // Update existing assignment
            const updatedAssignment = await optimizedStorage.updateAssignment(existingAssignment.id, {
              title: googleAssignment.title,
              description: googleAssignment.description || null,
              dueDate: googleAssignment.dueDate ? new Date(googleAssignment.dueDate) : null,
              source: 'google_classroom',
              syncStatus: 'synced',
            });
            syncedAssignments.push(updatedAssignment);
          } else {
            // Create new assignment
            const assignmentData = insertAssignmentSchema.parse({
              userId,
              classId: correspondingClass.id,
              googleClassroomId: googleAssignment.id,
              title: googleAssignment.title,
              description: googleAssignment.description || null,
              dueDate: googleAssignment.dueDate ? new Date(googleAssignment.dueDate) : null,
              status: 'pending',
              priority: 'medium',
              isCustom: false,
              source: 'google_classroom',
              syncStatus: 'synced',
            });
            const newAssignment = await optimizedStorage.createAssignment(assignmentData);
            syncedAssignments.push(newAssignment);
          }
        } catch (error) {
          console.error(`Failed to sync assignment ${googleAssignment.id}:`, error);
        }
      }

      res.json({
        success: true,
        syncedClasses: syncedClasses.length,
        syncedAssignments: syncedAssignments.length,
        classes: syncedClasses,
        assignments: syncedAssignments,
      });
    } catch (error) {
      console.error(' Error syncing Google Classroom data:', error);
      res.status(500).json({ message: "Failed to sync Google Classroom data" });
    }
  });

  // Google Calendar sync endpoint
  app.post("/api/sync/google-calendar", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { events } = req.body;

      if (!events) {
        return res.status(400).json({ message: "Missing Google Calendar events" });
      }

      // Just log the calendar sync, don't create assignments from calendar events
      console.log(` Received ${events.length} calendar events for user ${userId}`);
      console.log('Note: Calendar events are NOT synced as assignments');

      res.json({
        success: true,
        syncedEvents: events.length,
        message: "Calendar events received but not synced as assignments",
      });
    } catch (error) {
      console.error(' Error syncing Google Calendar events:', error);
      res.status(500).json({ message: "Failed to sync Google Calendar events" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Class routes
  app.get("/api/users/:userId/classes", async (req, res) => {
    try {
      const classes = await storage.getClassesByUserId(req.params.userId);
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.post("/api/users/:userId/classes", async (req, res) => {
    try {
      const classData = insertClassSchema.parse({ ...req.body, userId: req.params.userId });
      const newClass = await storage.createClass(classData);
      res.status(201).json(newClass);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid class data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create class" });
    }
  });

  app.delete("/api/classes/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteClass(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Class not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete class" });
    }
  });

  // Assignment routes
  app.get("/api/users/:userId/assignments", async (req, res) => {
    try {
      const assignments = await storage.getAssignmentsByUserId(req.params.userId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.post("/api/users/:userId/assignments", async (req, res) => {
    try {
      const assignmentData = insertAssignmentSchema.parse({ ...req.body, userId: req.params.userId });
      const assignment = await storage.createAssignment(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid assignment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  app.put("/api/assignments/:id", async (req, res) => {
    try {
      const assignmentData = insertAssignmentSchema.partial().parse(req.body);
      const assignment = await storage.updateAssignment(req.params.id, assignmentData);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid assignment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update assignment" });
    }
  });

  app.delete("/api/assignments/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteAssignment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete assignment" });
    }
  });

  // Flashcard routes
  app.get("/api/users/:userId/flashcards", async (req, res) => {
    try {
      const flashcards = await storage.getFlashcardsByUserId(req.params.userId);
      res.json(flashcards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flashcards" });
    }
  });

  app.post("/api/users/:userId/flashcards", async (req, res) => {
    try {
      const flashcardData = insertFlashcardSchema.parse({ ...req.body, userId: req.params.userId });
      const flashcard = await storage.createFlashcard(flashcardData);
      res.status(201).json(flashcard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid flashcard data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create flashcard" });
    }
  });

  app.put("/api/flashcards/:id", async (req, res) => {
    try {
      const flashcardData = insertFlashcardSchema.partial().parse(req.body);
      const flashcard = await storage.updateFlashcard(req.params.id, flashcardData);
      if (!flashcard) {
        return res.status(404).json({ message: "Flashcard not found" });
      }
      res.json(flashcard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid flashcard data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update flashcard" });
    }
  });

  app.delete("/api/flashcards/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteFlashcard(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Flashcard not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete flashcard" });
    }
  });

  // Flashcard Deck routes
  app.get("/api/users/:userId/flashcard-decks", async (req, res) => {
    try {
      const decks = await storage.getDecksByUserId(req.params.userId);
      res.json(decks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch decks" });
    }
  });

  app.post("/api/users/:userId/flashcard-decks", async (req, res) => {
    try {
      const deckData = insertFlashcardDeckSchema.parse({ ...req.body, userId: req.params.userId });
      const deck = await storage.createDeck(deckData);
      res.status(201).json(deck);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid deck data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create deck" });
    }
  });

  app.put("/api/flashcard-decks/:id", async (req, res) => {
    try {
      const deckData = insertFlashcardDeckSchema.partial().parse(req.body);
      const deck = await storage.updateDeck(req.params.id, deckData);
      if (!deck) {
        return res.status(404).json({ message: "Deck not found" });
      }
      res.json(deck);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid deck data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update deck" });
    }
  });

  app.delete("/api/flashcard-decks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDeck(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Deck not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete deck" });
    }
  });

  app.get("/api/flashcard-decks/:deckId/flashcards", async (req, res) => {
    try {
      const flashcards = await storage.getFlashcardsByDeck(req.params.deckId);
      res.json(flashcards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flashcards for deck" });
    }
  });

  // Flashcard Review and Statistics routes
  app.post("/api/flashcards/:id/review", async (req, res) => {
    try {
      const userId = getUserId(req);
      const reviewData = insertFlashcardReviewSchema.parse({
        ...req.body,
        userId,
        flashcardId: req.params.id,
      });
      const review = await storage.recordReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to record review" });
    }
  });

  app.get("/api/users/:userId/flashcard-stats/daily", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const stats = await storage.getDailyStats(req.params.userId, days);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily stats" });
    }
  });

  app.get("/api/users/:userId/flashcard-stats/decks", async (req, res) => {
    try {
      const stats = await storage.getDeckStats(req.params.userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deck stats" });
    }
  });

  app.get("/api/users/:userId/flashcard-stats/retention", async (req, res) => {
    try {
      const deckId = req.query.deckId as string | undefined;
      const curve = await storage.getRetentionCurve(req.params.userId, deckId);
      res.json(curve);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch retention curve" });
    }
  });

  // Pomodoro session routes
  app.get("/api/users/:userId/pomodoro-sessions", async (req, res) => {
    try {
      const sessions = await storage.getPomodoroSessionsByUserId(req.params.userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pomodoro sessions" });
    }
  });

  app.post("/api/users/:userId/pomodoro-sessions", async (req, res) => {
    try {
      const sessionData = insertPomodoroSessionSchema.parse({ ...req.body, userId: req.params.userId });
      const session = await storage.createPomodoroSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid pomodoro session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create pomodoro session" });
    }
  });

  // AI summary routes
  app.get("/api/users/:userId/ai-summaries", async (req, res) => {
    try {
      const summaries = await storage.getAiSummariesByUserId(req.params.userId);
      res.json(summaries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI summaries" });
    }
  });

  app.post("/api/users/:userId/ai-summaries", async (req, res) => {
    try {
      const summaryData = insertAiSummarySchema.parse({ ...req.body, userId: req.params.userId });
      const summary = await storage.createAiSummary(summaryData);
      res.status(201).json(summary);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid AI summary data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create AI summary" });
    }
  });

  app.delete("/api/ai-summaries/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteAiSummary(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "AI summary not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete AI summary" });
    }
  });


  // Notes routes - Updated to use real authentication
  app.get("/api/notes", async (req, res) => {
    try {
      const userId = getUserId(req);
      console.log(' Fetching notes for user:', userId);
      const notes = await storage.getNotesByUserId(userId);
      console.log(' Found notes:', notes.length);
      res.json(notes);
    } catch (error) {
      console.error(' Error fetching notes:', error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const userId = getUserId(req);
      const noteData = insertNoteSchema.parse({ ...req.body, userId });
      const note = await storage.createNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.put("/api/notes/:id", async (req, res) => {
    try {
      const noteData = insertNoteSchema.partial().parse(req.body);
      const note = await storage.updateNote(req.params.id, noteData);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteNote(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Classes route for notes page
  app.get("/api/classes", async (req, res) => {
    try {
      const userId = getUserId(req);
      const classes = await storage.getClassesByUserId(userId);
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  // Session-based assignment routes
  app.post("/api/assignments", async (req, res) => {
    try {
      const userId = getUserId(req);
      const assignmentData = insertAssignmentSchema.parse({ ...req.body, userId });
      const assignment = await storage.createAssignment(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid assignment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  // Session-based class routes
  app.post("/api/classes", async (req, res) => {
    try {
      const userId = getUserId(req);
      const classData = insertClassSchema.parse({ ...req.body, userId });
      const newClass = await storage.createClass(classData);
      res.status(201).json(newClass);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid class data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create class" });
    }
  });

  // YouTube transcript route
  app.post("/api/youtube-transcript", async (req, res) => {
    try {
      const { videoId } = req.body;
      if (!videoId) {
        return res.status(400).json({ message: "Video ID is required" });
      }

      // In a real implementation, you would use a YouTube transcript API
      // For now, return a placeholder response
      const transcript = `This is a placeholder transcript for video ${videoId}. In a real implementation, this would fetch the actual transcript using a service like youtube-transcript-api or similar.`;
      
      res.json({ transcript });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch YouTube transcript" });
    }
  });

  // Analytics routes
  app.get("/api/users/:userId/analytics", async (req, res) => {
    try {
      const analytics = await storage.getUserAnalytics(req.params.userId);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Calendar OAuth callback routes
  app.post("/api/auth/calendar/callback", async (req, res) => {
    try {
      const { code, provider, redirectUri } = req.body;
      
      if (!code || !provider) {
        return res.status(400).json({ message: "Missing code or provider" });
      }

      let tokenResponse;
      
      if (provider === 'google') {
        // Exchange Google OAuth code for access token
        const tokenUrl = 'https://oauth2.googleapis.com/token';
        const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET; // Server-side secret
        
        if (!clientId || !clientSecret) {
          return res.status(500).json({ message: "Google OAuth not configured" });
        }

        tokenResponse = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });
      } else if (provider === 'outlook') {
        // Exchange Microsoft OAuth code for access token
        const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
        const clientId = process.env.VITE_MICROSOFT_CLIENT_ID;
        const clientSecret = process.env.MICROSOFT_CLIENT_SECRET; // Server-side secret
        
        if (!clientId || !clientSecret) {
          return res.status(500).json({ message: "Microsoft OAuth not configured" });
        }

        tokenResponse = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
            scope: 'https://graph.microsoft.com/calendars.read https://graph.microsoft.com/calendars.readwrite',
          }),
        });
      } else {
        return res.status(400).json({ message: "Unsupported provider" });
      }

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error(`${provider} token exchange error:`, errorData);
        return res.status(400).json({ message: `Failed to exchange ${provider} authorization code` });
      }

      const tokenData = await tokenResponse.json();
      
      res.json({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
      });
    } catch (error) {
      console.error('Calendar OAuth callback error:', error);
      res.status(500).json({ message: "OAuth callback failed" });
    }
  });

  // Test endpoint to check calendar configuration
  app.get("/api/test/calendar-config", async (req, res) => {
    try {
      const config = {
        googleClientId: process.env.VITE_GOOGLE_CLIENT_ID ? 'Configured' : 'Missing',
        googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Configured' : 'Missing',
        microsoftClientId: process.env.VITE_MICROSOFT_CLIENT_ID ? 'Configured' : 'Missing',
        microsoftClientSecret: process.env.MICROSOFT_CLIENT_SECRET ? 'Configured' : 'Missing',
      };
      
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Failed to check configuration" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
