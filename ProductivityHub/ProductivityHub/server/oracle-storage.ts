import { executeQuery, executeQueryWithConnection, initializeDatabase, oracledb } from './oracle-database';
import { randomUUID } from 'crypto';
import type {
  User,
  InsertUser,
  Class,
  InsertClass,
  Assignment,
  InsertAssignment,
  Flashcard,
  InsertFlashcard,
  MoodEntry,
  InsertMoodEntry,
  JournalEntry,
  InsertJournalEntry,
  PomodoroSession,
  InsertPomodoroSession,
  AiSummary,
  InsertAiSummary,
  Note,
  InsertNote
} from "@shared/schema";

export class OracleStorage {
  private initialized = false;
  private oracleAvailable = false;

  async initialize() {
    if (!this.initialized) {
      try {
        await initializeDatabase();
        this.oracleAvailable = true;
        this.initialized = true;
        console.log('✅ Oracle storage initialized successfully');
      } catch (error) {
        console.warn('⚠️ Oracle database not available, using fallback mode:', (error as Error).message);
        this.oracleAvailable = false;
        this.initialized = true; // Mark as initialized to avoid repeated attempts
        throw new Error('Oracle database not available - fallback to localStorage');
      }
    }
  }

  private async ensureOracleAvailable() {
    await this.initialize();
    if (!this.oracleAvailable) {
      throw new Error('Oracle database is not available. Please install Oracle Instant Client to use database features.');
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    await this.ensureOracleAvailable();
    const result = await executeQuery('SELECT * FROM users WHERE id = :id', { id });
    
    if (!result.rows || result.rows.length === 0) {
      return undefined;
    }
    
    const row = result.rows[0] as any;
    return {
      id: row.ID,
      name: row.NAME,
      email: row.EMAIL,
      firstName: row.FIRST_NAME,
      lastName: row.LAST_NAME,
      avatar: row.AVATAR,
      googleId: row.GOOGLE_ID,
      googleAccessToken: row.GOOGLE_ACCESS_TOKEN,
      googleRefreshToken: row.GOOGLE_REFRESH_TOKEN,
      preferences: row.PREFERENCES,
      createdAt: row.CREATED_AT,
      updatedAt: row.UPDATED_AT
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    await this.ensureOracleAvailable();
    const result = await executeQuery('SELECT * FROM users WHERE email = :email', { email });
    
    if (!result.rows || result.rows.length === 0) {
      return undefined;
    }
    
    const row = result.rows[0] as any;
    return {
      id: row.ID,
      name: row.NAME,
      email: row.EMAIL,
      firstName: row.FIRST_NAME,
      lastName: row.LAST_NAME,
      avatar: row.AVATAR,
      googleId: row.GOOGLE_ID,
      googleAccessToken: row.GOOGLE_ACCESS_TOKEN,
      googleRefreshToken: row.GOOGLE_REFRESH_TOKEN,
      preferences: row.PREFERENCES,
      createdAt: row.CREATED_AT,
      updatedAt: row.UPDATED_AT
    };
  }

  async createUser(user: InsertUser): Promise<User> {
    await this.ensureOracleAvailable();
    const id = randomUUID();
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const sql = `
      INSERT INTO users (id, name, email, first_name, last_name, avatar, google_id, 
                        google_access_token, google_refresh_token, preferences, 
                        created_at, updated_at)
      VALUES (:id, :name, :email, :firstName, :lastName, :avatar, :googleId,
              :googleAccessToken, :googleRefreshToken, :preferences,
              :createdAt, :updatedAt)
    `;
    
    await executeQuery(sql, {
      id,
      name: user.name,
      email: user.email,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      avatar: user.avatar || null,
      googleId: user.googleId || null,
      googleAccessToken: user.googleAccessToken || null,
      googleRefreshToken: user.googleRefreshToken || null,
      preferences: user.preferences || null,
      createdAt,
      updatedAt
    });

    return {
      id,
      name: user.name,
      email: user.email,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      avatar: user.avatar || null,
      googleId: user.googleId || null,
      googleAccessToken: user.googleAccessToken || null,
      googleRefreshToken: user.googleRefreshToken || null,
      preferences: user.preferences || null,
      createdAt,
      updatedAt
    };
  }

  async createUserWithId(userId: string, user: InsertUser): Promise<User> {
    await this.initialize();
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const sql = `
      INSERT INTO users (id, name, email, first_name, last_name, avatar, google_id, 
                        google_access_token, google_refresh_token, preferences, 
                        created_at, updated_at)
      VALUES (:id, :name, :email, :firstName, :lastName, :avatar, :googleId,
              :googleAccessToken, :googleRefreshToken, :preferences,
              :createdAt, :updatedAt)
    `;
    
    await executeQuery(sql, {
      id: userId,
      name: user.name,
      email: user.email,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      avatar: user.avatar || null,
      googleId: user.googleId || null,
      googleAccessToken: user.googleAccessToken || null,
      googleRefreshToken: user.googleRefreshToken || null,
      preferences: user.preferences || null,
      createdAt,
      updatedAt
    });

    return {
      id: userId,
      name: user.name,
      email: user.email,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      avatar: user.avatar || null,
      googleId: user.googleId || null,
      googleAccessToken: user.googleAccessToken || null,
      googleRefreshToken: user.googleRefreshToken || null,
      preferences: user.preferences || null,
      createdAt,
      updatedAt
    };
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    await this.initialize();
    const updatedAt = new Date();
    
    const setParts: string[] = [];
    const binds: any = { id, updatedAt };
    
    // Map camelCase keys to UPPER_CASE column names
    const columnMap: Record<string, string> = {
      id: 'ID',
      name: 'NAME',
      email: 'EMAIL',
      firstName: 'FIRST_NAME',
      lastName: 'LAST_NAME',
      avatar: 'AVATAR',
      googleId: 'GOOGLE_ID',
      googleAccessToken: 'GOOGLE_ACCESS_TOKEN',
      googleRefreshToken: 'GOOGLE_REFRESH_TOKEN',
      preferences: 'PREFERENCES',
      createdAt: 'CREATED_AT',
      updatedAt: 'UPDATED_AT'
    };
    
    Object.entries(userData).forEach(([key, value]) => {
      if (value !== undefined) {
        const columnName = columnMap[key] || key.toUpperCase();
        setParts.push(`${columnName} = :${key}`);
        binds[key] = value;
      }
    });
    
    if (setParts.length === 0) {
      return this.getUser(id);
    }
    
    const sql = `UPDATE users SET ${setParts.join(', ')}, UPDATED_AT = :updatedAt WHERE ID = :id`;
    await executeQuery(sql, binds);
    
    return this.getUser(id);
  }

  // Notes methods
  async getNotesByUserId(userId: string): Promise<Note[]> {
    await this.ensureOracleAvailable();
    
    return await executeQueryWithConnection(async (connection) => {
      const result = await connection.execute(
        'SELECT * FROM notes WHERE user_id = :userId ORDER BY created_at DESC', 
        { userId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true }
      );
      
      // Convert Oracle result to plain objects and handle LOB content
      const notes = await Promise.all((result.rows || []).map(async (row: any) => {
        let content = row.CONTENT;
        
        // If content is a LOB (Large Object), read its data
        if (content && typeof content === 'object' && content.getData) {
          try {
            content = await content.getData();
          } catch (error) {
            console.error('Error reading LOB data:', error);
            content = '';
          }
        }
        
        return {
          id: row.ID,
          userId: row.USER_ID,
          classId: row.CLASS_ID,
          title: row.TITLE,
          content: content,
          category: row.CATEGORY,
          tags: row.TAGS,
          isPinned: row.IS_PINNED === 1,
          color: row.COLOR,
          createdAt: row.CREATED_AT,
          updatedAt: row.UPDATED_AT
        };
      }));
      
      console.log(`✅ Found notes: ${notes.length}`);
      return notes;
    });
  }

  async getNote(id: string): Promise<Note | undefined> {
    await this.ensureOracleAvailable();
    
    return await executeQueryWithConnection(async (connection) => {
      const result = await connection.execute(
        'SELECT * FROM notes WHERE id = :id', 
        { id },
        { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true }
      );
      
      if (!result.rows || result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0] as any;
      let content = row.CONTENT;
      
      // If content is a LOB (Large Object), read its data
      if (content && typeof content === 'object' && content.getData) {
        try {
          content = await content.getData();
        } catch (error) {
          console.error('Error reading LOB data:', error);
          content = '';
        }
      }
      
      return {
        id: row.ID,
        userId: row.USER_ID,
        classId: row.CLASS_ID,
        title: row.TITLE,
        content: content,
        category: row.CATEGORY,
        tags: row.TAGS,
        isPinned: row.IS_PINNED === 1,
        color: row.COLOR,
        createdAt: row.CREATED_AT,
        updatedAt: row.UPDATED_AT
      };
    });
  }

  async createNote(note: InsertNote): Promise<Note> {
    await this.initialize();
    const id = randomUUID();
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const sql = `
      INSERT INTO notes (ID, USER_ID, CLASS_ID, TITLE, CONTENT, CATEGORY, TAGS, 
                        IS_PINNED, COLOR, CREATED_AT, UPDATED_AT)
      VALUES (:id, :userId, :classId, :title, :content, :category, :tags,
              :isPinned, :color, :createdAt, :updatedAt)
    `;
    
    await executeQuery(sql, {
      id,
      userId: note.userId,
      classId: note.classId || null,
      title: note.title,
      content: note.content,
      category: note.category || null,
      tags: note.tags || null,
      isPinned: note.isPinned ? 1 : 0,
      color: note.color || null,
      createdAt,
      updatedAt
    });

    return {
      id,
      userId: note.userId,
      classId: note.classId || null,
      title: note.title,
      content: note.content,
      category: note.category || null,
      tags: note.tags || null,
      isPinned: note.isPinned || false,
      color: note.color || null,
      createdAt,
      updatedAt
    };
  }

  async updateNote(id: string, noteData: Partial<InsertNote>): Promise<Note | undefined> {
    await this.initialize();
    const updatedAt = new Date();
    
    const setParts: string[] = [];
    const binds: any = { id, updatedAt };
    
    // Map camelCase keys to UPPER_CASE column names
    const columnMap: Record<string, string> = {
      id: 'ID',
      userId: 'USER_ID',
      classId: 'CLASS_ID',
      title: 'TITLE',
      content: 'CONTENT',
      category: 'CATEGORY',
      tags: 'TAGS',
      isPinned: 'IS_PINNED',
      color: 'COLOR',
      createdAt: 'CREATED_AT',
      updatedAt: 'UPDATED_AT'
    };
    
    Object.entries(noteData).forEach(([key, value]) => {
      if (value !== undefined) {
        const columnName = columnMap[key] || key.toUpperCase();
        if (key === 'isPinned') {
          setParts.push(`${columnName} = :isPinned`);
          binds.isPinned = value ? 1 : 0;
        } else {
          setParts.push(`${columnName} = :${key}`);
          binds[key] = value;
        }
      }
    });
    
    if (setParts.length === 0) {
      return this.getNote(id);
    }
    
    const sql = `UPDATE notes SET ${setParts.join(', ')}, UPDATED_AT = :updatedAt WHERE ID = :id`;
    await executeQuery(sql, binds);
    
    return this.getNote(id);
  }

  async deleteNote(id: string): Promise<boolean> {
    await this.initialize();
    const result = await executeQuery('DELETE FROM notes WHERE ID = :id', { id });
    return (result.rowsAffected || 0) > 0;
  }

  // Class methods
  async getClassesByUserId(userId: string): Promise<Class[]> {
    await this.initialize();
    console.log('📚 Fetching classes for user:', userId);
    
    const result = await executeQuery(
      'SELECT * FROM classes WHERE user_id = :userId ORDER BY created_at DESC',
      { userId }
    );
    
    if (!result.rows || result.rows.length === 0) {
      console.log('✅ No classes found for user:', userId);
      return [];
    }
    
    console.log('✅ Found classes:', result.rows.length);
    
    return result.rows.map((row: any) => ({
      id: row.ID,
      userId: row.USER_ID,
      googleClassroomId: row.GOOGLE_CLASSROOM_ID,
      name: row.NAME,
      section: row.SECTION,
      description: row.DESCRIPTION,
      teacherName: row.TEACHER_NAME,
      teacherEmail: row.TEACHER_EMAIL,
      color: row.COLOR,
      createdAt: row.CREATED_AT
    }));
  }

  async createClass(classData: InsertClass): Promise<Class> {
    await this.initialize();
    const id = randomUUID();
    const createdAt = new Date();
    
    console.log('📚 Creating class:', { id, ...classData });
    
    const sql = `
      INSERT INTO classes (id, user_id, google_classroom_id, name, section, 
                          description, teacher_name, teacher_email, color, created_at)
      VALUES (:id, :userId, :googleClassroomId, :name, :section,
              :description, :teacherName, :teacherEmail, :color, :createdAt)
    `;
    
    await executeQuery(sql, {
      id,
      userId: classData.userId,
      googleClassroomId: classData.googleClassroomId || null,
      name: classData.name,
      section: classData.section || null,
      description: classData.description || null,
      teacherName: classData.teacherName || null,
      teacherEmail: classData.teacherEmail || null,
      color: classData.color || '#42a5f5',
      createdAt
    });
    
    console.log('✅ Class created successfully');
    
    return {
      id,
      userId: classData.userId,
      googleClassroomId: classData.googleClassroomId || null,
      name: classData.name,
      section: classData.section || null,
      description: classData.description || null,
      teacherName: classData.teacherName || null,
      teacherEmail: classData.teacherEmail || null,
      color: classData.color || '#42a5f5',
      createdAt
    };
  }

  async deleteClass(id: string): Promise<boolean> {
    await this.initialize();
    console.log('📚 Deleting class:', id);
    
    const result = await executeQuery('DELETE FROM classes WHERE id = :id', { id });
    const success = Boolean(result.rowsAffected && result.rowsAffected > 0);
    
    if (success) {
      console.log('✅ Class deleted successfully');
    } else {
      console.log('❌ Class not found');
    }
    
    return success;
  }
  
  // Assignment methods
  async getAssignmentsByUserId(userId: string): Promise<Assignment[]> {
    await this.initialize();
    console.log('📋 Fetching assignments for user:', userId);
    
    const result = await executeQuery(
      'SELECT * FROM assignments WHERE user_id = :userId ORDER BY created_at DESC',
      { userId }
    );
    
    if (!result.rows || result.rows.length === 0) {
      console.log('✅ No assignments found for user:', userId);
      return [];
    }
    
    console.log('✅ Found assignments:', result.rows.length);
    
    return result.rows.map((row: any) => ({
      id: row.ID,
      userId: row.USER_ID,
      classId: row.CLASS_ID,
      googleClassroomId: row.GOOGLE_CLASSROOM_ID,
      title: row.TITLE,
      description: row.DESCRIPTION,
      dueDate: row.DUE_DATE,
      status: row.STATUS,
      priority: row.PRIORITY,
      isCustom: Boolean(row.IS_CUSTOM),
      completedAt: row.COMPLETED_AT,
      createdAt: row.CREATED_AT
    }));
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    await this.initialize();
    const id = randomUUID();
    const createdAt = new Date();
    
    console.log('📋 Creating assignment:', { id, ...assignment });
    
    const sql = `
      INSERT INTO assignments (id, user_id, class_id, google_classroom_id, title, 
                              description, due_date, status, priority, is_custom, 
                              completed_at, created_at)
      VALUES (:id, :userId, :classId, :googleClassroomId, :title,
              :description, :dueDate, :status, :priority, :isCustom,
              :completedAt, :createdAt)
    `;
    
    await executeQuery(sql, {
      id,
      userId: assignment.userId,
      classId: assignment.classId || null,
      googleClassroomId: assignment.googleClassroomId || null,
      title: assignment.title,
      description: assignment.description || null,
      dueDate: assignment.dueDate || null,
      status: assignment.status || 'pending',
      priority: assignment.priority || 'medium',
      isCustom: assignment.isCustom ? 1 : 0,
      completedAt: assignment.completedAt || null,
      createdAt
    });
    
    console.log('✅ Assignment created successfully');
    
    return {
      id,
      userId: assignment.userId,
      classId: assignment.classId || null,
      googleClassroomId: assignment.googleClassroomId || null,
      title: assignment.title,
      description: assignment.description || null,
      dueDate: assignment.dueDate || null,
      status: assignment.status || 'pending',
      priority: assignment.priority || 'medium',
      isCustom: assignment.isCustom || false,
      completedAt: assignment.completedAt || null,
      createdAt
    };
  }

  async updateAssignment(id: string, assignment: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    await this.initialize();
    console.log('📋 Updating assignment:', id, assignment);
    
    const setParts = [];
    const params: any = { id };
    
    if (assignment.title !== undefined) {
      setParts.push('title = :title');
      params.title = assignment.title;
    }
    if (assignment.description !== undefined) {
      setParts.push('description = :description');
      params.description = assignment.description;
    }
    if (assignment.dueDate !== undefined) {
      setParts.push('due_date = :dueDate');
      params.dueDate = assignment.dueDate;
    }
    if (assignment.status !== undefined) {
      setParts.push('status = :status');
      params.status = assignment.status;
    }
    if (assignment.priority !== undefined) {
      setParts.push('priority = :priority');
      params.priority = assignment.priority;
    }
    if (assignment.isCustom !== undefined) {
      setParts.push('is_custom = :isCustom');
      params.isCustom = assignment.isCustom ? 1 : 0;
    }
    if (assignment.completedAt !== undefined) {
      setParts.push('completed_at = :completedAt');
      params.completedAt = assignment.completedAt;
    }
    if (assignment.classId !== undefined) {
      setParts.push('class_id = :classId');
      params.classId = assignment.classId;
    }
    
    if (setParts.length === 0) {
      console.log('⚠️ No fields to update');
      return undefined;
    }
    
    const sql = `UPDATE assignments SET ${setParts.join(', ')} WHERE id = :id`;
    await executeQuery(sql, params);
    
    // Return updated assignment
    const result = await executeQuery('SELECT * FROM assignments WHERE id = :id', { id });
    if (!result.rows || result.rows.length === 0) {
      console.log('❌ Assignment not found after update');
      return undefined;
    }
    
    const row = result.rows[0] as any;
    console.log('✅ Assignment updated successfully');
    
    return {
      id: row.ID,
      userId: row.USER_ID,
      classId: row.CLASS_ID,
      googleClassroomId: row.GOOGLE_CLASSROOM_ID,
      title: row.TITLE,
      description: row.DESCRIPTION,
      dueDate: row.DUE_DATE,
      status: row.STATUS,
      priority: row.PRIORITY,
      isCustom: Boolean(row.IS_CUSTOM),
      completedAt: row.COMPLETED_AT,
      createdAt: row.CREATED_AT
    };
  }

  async deleteAssignment(id: string): Promise<boolean> {
    await this.initialize();
    console.log('📋 Deleting assignment:', id);
    
    const result = await executeQuery('DELETE FROM assignments WHERE id = :id', { id });
    const success = Boolean(result.rowsAffected && result.rowsAffected > 0);
    
    if (success) {
      console.log('✅ Assignment deleted successfully');
    } else {
      console.log('❌ Assignment not found');
    }
    
    return success;
  }
  
  // Flashcard methods
  async getFlashcardsByUserId(userId: string): Promise<Flashcard[]> {
    await this.initialize();
    console.log('📝 Fetching flashcards for user:', userId);
    
    const result = await executeQuery(
      'SELECT * FROM flashcards WHERE user_id = :userId ORDER BY created_at DESC',
      { userId }
    );
    
    if (!result.rows || result.rows.length === 0) {
      console.log('✅ No flashcards found for user:', userId);
      return [];
    }
    
    console.log('✅ Found flashcards:', result.rows.length);
    
    return result.rows.map((row: any) => ({
      id: row.ID,
      userId: row.USER_ID,
      classId: row.CLASS_ID,
      front: row.FRONT,
      back: row.BACK,
      difficulty: row.DIFFICULTY,
      lastReviewed: row.LAST_REVIEWED,
      reviewCount: row.REVIEW_COUNT,
      createdAt: row.CREATED_AT
    }));
  }

  async createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard> {
    await this.initialize();
    const id = randomUUID();
    const createdAt = new Date();
    
    console.log('📝 Creating flashcard:', { id, ...flashcard });
    
    const sql = `
      INSERT INTO flashcards (id, user_id, class_id, front, back, difficulty, 
                             last_reviewed, review_count, created_at)
      VALUES (:id, :userId, :classId, :front, :back, :difficulty,
              :lastReviewed, :reviewCount, :createdAt)
    `;
    
    await executeQuery(sql, {
      id,
      userId: flashcard.userId,
      classId: flashcard.classId || null,
      front: flashcard.front,
      back: flashcard.back,
      difficulty: flashcard.difficulty || 'medium',
      lastReviewed: flashcard.lastReviewed || null,
      reviewCount: flashcard.reviewCount || 0,
      createdAt
    });
    
    console.log('✅ Flashcard created successfully');
    
    return {
      id,
      userId: flashcard.userId,
      classId: flashcard.classId || null,
      front: flashcard.front,
      back: flashcard.back,
      difficulty: flashcard.difficulty || 'medium',
      lastReviewed: flashcard.lastReviewed || null,
      reviewCount: flashcard.reviewCount || 0,
      createdAt
    };
  }

  async updateFlashcard(id: string, flashcard: Partial<InsertFlashcard>): Promise<Flashcard | undefined> {
    await this.initialize();
    console.log('📝 Updating flashcard:', id, flashcard);
    
    const setParts = [];
    const params: any = { id };
    
    if (flashcard.front !== undefined) {
      setParts.push('front = :front');
      params.front = flashcard.front;
    }
    if (flashcard.back !== undefined) {
      setParts.push('back = :back');
      params.back = flashcard.back;
    }
    if (flashcard.difficulty !== undefined) {
      setParts.push('difficulty = :difficulty');
      params.difficulty = flashcard.difficulty;
    }
    if (flashcard.lastReviewed !== undefined) {
      setParts.push('last_reviewed = :lastReviewed');
      params.lastReviewed = flashcard.lastReviewed;
    }
    if (flashcard.reviewCount !== undefined) {
      setParts.push('review_count = :reviewCount');
      params.reviewCount = flashcard.reviewCount;
    }
    if (flashcard.classId !== undefined) {
      setParts.push('class_id = :classId');
      params.classId = flashcard.classId;
    }
    
    if (setParts.length === 0) {
      console.log('⚠️ No fields to update');
      return undefined;
    }
    
    const sql = `UPDATE flashcards SET ${setParts.join(', ')} WHERE id = :id`;
    await executeQuery(sql, params);
    
    // Return updated flashcard
    const result = await executeQuery('SELECT * FROM flashcards WHERE id = :id', { id });
    if (!result.rows || result.rows.length === 0) {
      console.log('❌ Flashcard not found after update');
      return undefined;
    }
    
    const row = result.rows[0] as any;
    console.log('✅ Flashcard updated successfully');
    
    return {
      id: row.ID,
      userId: row.USER_ID,
      classId: row.CLASS_ID,
      front: row.FRONT,
      back: row.BACK,
      difficulty: row.DIFFICULTY,
      lastReviewed: row.LAST_REVIEWED,
      reviewCount: row.REVIEW_COUNT,
      createdAt: row.CREATED_AT
    };
  }

  async deleteFlashcard(id: string): Promise<boolean> {
    await this.initialize();
    console.log('📝 Deleting flashcard:', id);
    
    const result = await executeQuery('DELETE FROM flashcards WHERE id = :id', { id });
    const success = Boolean(result.rowsAffected && result.rowsAffected > 0);
    
    if (success) {
      console.log('✅ Flashcard deleted successfully');
    } else {
      console.log('❌ Flashcard not found');
    }
    
    return success;
  }
  
  // Mood Entry methods
  async getMoodEntriesByUserId(userId: string): Promise<MoodEntry[]> {
    await this.initialize();
    console.log('😊 Fetching mood entries for user:', userId);
    
    const result = await executeQuery(
      'SELECT * FROM mood_entries WHERE user_id = :userId ORDER BY created_at DESC',
      { userId }
    );
    
    if (!result.rows || result.rows.length === 0) {
      console.log('✅ No mood entries found for user:', userId);
      return [];
    }
    
    console.log('✅ Found mood entries:', result.rows.length);
    
    return result.rows.map((row: any) => ({
      id: row.ID,
      userId: row.USER_ID,
      mood: row.MOOD,
      notes: row.NOTES,
      date: row.DATE_ENTRY,
      createdAt: row.CREATED_AT
    }));
  }

  async createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry> {
    await this.initialize();
    const id = randomUUID();
    const createdAt = new Date();
    const date = new Date();
    
    console.log('😊 Creating mood entry:', { id, ...entry });
    
    const sql = `
      INSERT INTO mood_entries (id, user_id, mood, notes, date_entry, created_at)
      VALUES (:id, :userId, :mood, :notes, :dateValue, :createdAt)
    `;
    
    await executeQuery(sql, {
      id,
      userId: entry.userId,
      mood: entry.mood,
      notes: entry.notes || null,
      dateValue: date,
      createdAt
    });
    
    console.log('✅ Mood entry created successfully');
    
    return {
      id,
      userId: entry.userId,
      mood: entry.mood,
      notes: entry.notes || null,
      date,
      createdAt
    };
  }
  
  // Journal Entry methods
  async getJournalEntriesByUserId(userId: string): Promise<JournalEntry[]> {
    await this.initialize();
    console.log('📓 Fetching journal entries for user:', userId);
    
    const result = await executeQuery(
      'SELECT * FROM journal_entries WHERE user_id = :userId ORDER BY created_at DESC',
      { userId }
    );
    
    if (!result.rows || result.rows.length === 0) {
      console.log('✅ No journal entries found for user:', userId);
      return [];
    }
    
    console.log('✅ Found journal entries:', result.rows.length);
    
    return result.rows.map((row: any) => ({
      id: row.ID,
      userId: row.USER_ID,
      content: row.CONTENT,
      date: row.DATE_ENTRY,
      createdAt: row.CREATED_AT
    }));
  }

  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    await this.initialize();
    const id = randomUUID();
    const createdAt = new Date();
    const date = new Date();
    
    console.log('📓 Creating journal entry:', { id, ...entry });
    
    const sql = `
      INSERT INTO journal_entries (id, user_id, content, date_entry, created_at)
      VALUES (:id, :userId, :content, :dateValue, :createdAt)
    `;
    
    await executeQuery(sql, {
      id,
      userId: entry.userId,
      content: entry.content,
      dateValue: date,
      createdAt
    });
    
    console.log('✅ Journal entry created successfully');
    
    return {
      id,
      userId: entry.userId,
      content: entry.content,
      date,
      createdAt
    };
  }

  async updateJournalEntry(id: string, entry: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined> {
    await this.initialize();
    console.log('📓 Updating journal entry:', id, entry);
    
    const setParts = [];
    const params: any = { id };
    
    if (entry.content !== undefined) {
      setParts.push('content = :content');
      params.content = entry.content;
    }
    if (entry.date !== undefined) {
      setParts.push('date = :date');
      params.date = entry.date;
    }
    
    if (setParts.length === 0) {
      console.log('⚠️ No fields to update');
      return undefined;
    }
    
    const sql = `UPDATE journal_entries SET ${setParts.join(', ')} WHERE id = :id`;
    await executeQuery(sql, params);
    
    // Return updated journal entry
    const result = await executeQuery('SELECT * FROM journal_entries WHERE id = :id', { id });
    if (!result.rows || result.rows.length === 0) {
      console.log('❌ Journal entry not found after update');
      return undefined;
    }
    
    const row = result.rows[0] as any;
    console.log('✅ Journal entry updated successfully');
    
    return {
      id: row.ID,
      userId: row.USER_ID,
      content: row.CONTENT,
      date: row.DATE_ENTRY,
      createdAt: row.CREATED_AT
    };
  }

  async deleteJournalEntry(id: string): Promise<boolean> {
    await this.initialize();
    console.log('📓 Deleting journal entry:', id);
    
    const result = await executeQuery('DELETE FROM journal_entries WHERE id = :id', { id });
    const success = Boolean(result.rowsAffected && result.rowsAffected > 0);
    
    if (success) {
      console.log('✅ Journal entry deleted successfully');
    } else {
      console.log('❌ Journal entry not found');
    }
    
    return success;
  }
  
  // Pomodoro Session methods
  async getPomodoroSessionsByUserId(userId: string): Promise<PomodoroSession[]> {
    await this.initialize();
    console.log('🍅 Fetching pomodoro sessions for user:', userId);
    
    const result = await executeQuery(
      'SELECT * FROM pomodoro_sessions WHERE user_id = :userId ORDER BY completed_at DESC',
      { userId }
    );
    
    if (!result.rows || result.rows.length === 0) {
      console.log('✅ No pomodoro sessions found for user:', userId);
      return [];
    }
    
    console.log('✅ Found pomodoro sessions:', result.rows.length);
    
    return result.rows.map((row: any) => ({
      id: row.ID,
      userId: row.USER_ID,
      duration: row.DURATION,
      type: row.TYPE,
      completedAt: row.COMPLETED_AT
    }));
  }

  async createPomodoroSession(session: InsertPomodoroSession): Promise<PomodoroSession> {
    await this.initialize();
    const id = randomUUID();
    const completedAt = new Date();
    
    console.log('🍅 Creating pomodoro session:', { id, ...session });
    
    const sql = `
      INSERT INTO pomodoro_sessions (id, user_id, duration, type, completed_at)
      VALUES (:id, :userId, :duration, :type, :completedAt)
    `;
    
    await executeQuery(sql, {
      id,
      userId: session.userId,
      duration: session.duration,
      type: session.type || 'work',
      completedAt
    });
    
    console.log('✅ Pomodoro session created successfully');
    
    return {
      id,
      userId: session.userId,
      duration: session.duration,
      type: session.type || 'work',
      completedAt
    };
  }
  
  // AI Summary methods
  async getAiSummariesByUserId(userId: string): Promise<AiSummary[]> {
    await this.initialize();
    console.log('🤖 Fetching AI summaries for user:', userId);
    
    const result = await executeQuery(
      'SELECT * FROM ai_summaries WHERE user_id = :userId ORDER BY created_at DESC',
      { userId }
    );
    
    if (!result.rows || result.rows.length === 0) {
      console.log('✅ No AI summaries found for user:', userId);
      return [];
    }
    
    console.log('✅ Found AI summaries:', result.rows.length);
    
    return result.rows.map((row: any) => ({
      id: row.ID,
      userId: row.USER_ID,
      title: row.TITLE,
      originalContent: row.ORIGINAL_CONTENT,
      summary: row.SUMMARY_CONTENT,
      summaryType: row.SUMMARY_TYPE,
      fileType: row.FILE_TYPE,
      createdAt: row.CREATED_AT
    }));
  }

  async createAiSummary(summary: InsertAiSummary): Promise<AiSummary> {
    await this.initialize();
    const id = randomUUID();
    const createdAt = new Date();
    
    console.log('🤖 Creating AI summary:', { id, title: summary.title });
    
    const sql = `
      INSERT INTO ai_summaries (id, user_id, title, original_content, summary_content, 
                               summary_type, file_type, created_at)
      VALUES (:id, :userId, :title, :originalContent, :summary,
              :summaryType, :fileType, :createdAt)
    `;
    
    await executeQuery(sql, {
      id,
      userId: summary.userId,
      title: summary.title,
      originalContent: summary.originalContent || null,
      summary: summary.summary,
      summaryType: summary.summaryType || 'quick',
      fileType: summary.fileType || null,
      createdAt
    });
    
    console.log('✅ AI summary created successfully');
    
    return {
      id,
      userId: summary.userId,
      title: summary.title,
      originalContent: summary.originalContent || null,
      summary: summary.summary,
      summaryType: summary.summaryType || 'quick',
      fileType: summary.fileType || null,
      createdAt
    };
  }

  async deleteAiSummary(id: string): Promise<boolean> {
    await this.initialize();
    console.log('🤖 Deleting AI summary:', id);
    
    const result = await executeQuery('DELETE FROM ai_summaries WHERE id = :id', { id });
    const success = Boolean(result.rowsAffected && result.rowsAffected > 0);
    
    if (success) {
      console.log('✅ AI summary deleted successfully');
    } else {
      console.log('❌ AI summary not found');
    }
    
    return success;
  }
  
  
  async getUserAnalytics(userId: string): Promise<any> { return {}; }
}