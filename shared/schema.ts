import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatar: text("avatar"),
  googleId: text("google_id").unique(),
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  googleClassroomId: text("google_classroom_id"),
  name: text("name").notNull(),
  section: text("section"),
  description: text("description"),
  teacherName: text("teacher_name"),
  teacherEmail: text("teacher_email"),
  color: text("color").default("#42a5f5"),
  source: text("source").default("manual"), // manual, google_classroom
  syncStatus: text("sync_status").default("synced"), // synced, pending, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  classId: varchar("class_id").references(() => classes.id),
  googleClassroomId: text("google_classroom_id"),
  googleCalendarId: text("google_calendar_id"),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  status: text("status").default("pending"), // pending, completed, overdue
  priority: text("priority").default("medium"), // low, medium, high
  isCustom: boolean("is_custom").default(false),
  source: text("source").default("manual"), // manual, google_classroom, google_calendar
  syncStatus: text("sync_status").default("synced"), // synced, pending, failed
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Flashcard Decks (folders for organizing flashcards)
export const flashcardDecks = pgTable("flashcard_decks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  parentDeckId: varchar("parent_deck_id"), // For subdecks
  color: text("color").default("#3b82f6"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const flashcards = pgTable("flashcards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  deckId: varchar("deck_id").references(() => flashcardDecks.id),
  classId: varchar("class_id").references(() => classes.id),
  cardType: text("card_type").default("basic"), // basic, cloze
  front: text("front").notNull(),
  back: text("back").notNull(),
  clozeText: text("cloze_text"), // For cloze deletion cards
  clozeIndex: integer("cloze_index"), // Which cloze to show (c1, c2, etc.)
  difficulty: text("difficulty").default("medium"), // easy, medium, hard
  lastReviewed: timestamp("last_reviewed"),
  reviewCount: integer("review_count").default(0),
  correctCount: integer("correct_count").default(0),
  incorrectCount: integer("incorrect_count").default(0),
  easeFactor: integer("ease_factor").default(250), // For spaced repetition (250 = 2.5)
  interval: integer("interval").default(0), // Days until next review
  maturityLevel: text("maturity_level").default("new"), // new, learning, young, mature
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Flashcard Review History (for detailed statistics)
export const flashcardReviews = pgTable("flashcard_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  flashcardId: varchar("flashcard_id").references(() => flashcards.id).notNull(),
  deckId: varchar("deck_id").references(() => flashcardDecks.id),
  wasCorrect: boolean("was_correct").notNull(),
  timeSpent: integer("time_spent"), // Seconds spent on review
  reviewDate: timestamp("review_date").defaultNow(),
  easeFactor: integer("ease_factor"), // Ease factor at time of review
  interval: integer("interval"), // Interval at time of review
  createdAt: timestamp("created_at").defaultNow(),
});

export const moodEntries = pgTable("mood_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  mood: integer("mood").notNull(), // 1-5 scale
  notes: text("notes"),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pomodoroSessions = pgTable("pomodoro_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  duration: integer("duration").notNull(), // in minutes
  type: text("type").default("work"), // work, break
  completedAt: timestamp("completed_at").defaultNow(),
});

export const aiSummaries = pgTable("ai_summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  originalContent: text("original_content"),
  summary: text("summary").notNull(),
  summaryType: text("summary_type").default("quick"), // quick, detailed, bullet
  fileType: text("file_type"), // pdf, text, audio, youtube
  createdAt: timestamp("created_at").defaultNow(),
});


export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  classId: varchar("class_id").references(() => classes.id), // Optional, can be linked to a specific class
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").default("general"), // general, lecture, homework, study, etc.
  tags: text("tags").array(), // Array of tags for organization
  isPinned: boolean("is_pinned").default(false).notNull(),
  color: text("color").default("#ffffff"), // For color coding notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClassSchema = createInsertSchema(classes).omit({ id: true, createdAt: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true });
export const insertFlashcardDeckSchema = createInsertSchema(flashcardDecks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFlashcardSchema = createInsertSchema(flashcards).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFlashcardReviewSchema = createInsertSchema(flashcardReviews).omit({ id: true, createdAt: true });
export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({ id: true, createdAt: true });
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, createdAt: true });
export const insertPomodoroSessionSchema = createInsertSchema(pomodoroSessions).omit({ id: true });
export const insertAiSummarySchema = createInsertSchema(aiSummaries).omit({ id: true, createdAt: true });
export const insertNoteSchema = createInsertSchema(notes).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type FlashcardDeck = typeof flashcardDecks.$inferSelect;
export type InsertFlashcardDeck = z.infer<typeof insertFlashcardDeckSchema>;
export type Flashcard = typeof flashcards.$inferSelect;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type FlashcardReview = typeof flashcardReviews.$inferSelect;
export type InsertFlashcardReview = z.infer<typeof insertFlashcardReviewSchema>;
export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type PomodoroSession = typeof pomodoroSessions.$inferSelect;
export type InsertPomodoroSession = z.infer<typeof insertPomodoroSessionSchema>;
export type AiSummary = typeof aiSummaries.$inferSelect;
export type InsertAiSummary = z.infer<typeof insertAiSummarySchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
