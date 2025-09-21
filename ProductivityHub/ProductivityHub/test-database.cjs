// Test script to verify database operations
require('dotenv').config();

async function testDatabase() {
  console.log('🧪 Testing database operations...\n');
  
  try {
    // Test Oracle connection
    const oracledb = require('oracledb');
    const path = require('path');
    
    // Initialize Oracle client
    const walletLocation = path.resolve('./server/oracle_wallet');
    oracledb.initOracleClient({
      configDir: walletLocation
    });
    
    // Connect to database
    const connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECTION_STRING,
      walletLocation: walletLocation,
      walletPassword: "oracle123"
    });
    
    console.log('✅ Connected to Oracle Database');
    
    console.log('1. Testing Oracle connection...');
    const result = await connection.execute('SELECT table_name FROM user_tables WHERE table_name IN (\'USERS\', \'NOTES\', \'FLASHCARDS\', \'AI_SUMMARIES\')');
    console.log('✅ Oracle connection successful');
    console.log('📊 Available tables:', result.rows.map(row => row[0]));
    
    // Test creating a test user
    console.log('\n2. Testing user creation...');
    const testUserId = 'test-user-' + Date.now();
    const createUserResult = await connection.execute(`
      INSERT INTO users (id, name, email, first_name, last_name, created_at, updated_at)
      VALUES (:id, :name, :email, :firstName, :lastName, :createdAt, :updatedAt)
    `, {
      id: testUserId,
      name: 'Test User',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Test user created successfully');
    
    // Test creating a test note
    console.log('\n3. Testing note creation...');
    const testNoteId = 'test-note-' + Date.now();
    const createNoteResult = await connection.execute(`
      INSERT INTO notes (id, user_id, title, content, category, is_pinned, color, created_at, updated_at)
      VALUES (:id, :userId, :title, :content, :category, :isPinned, :color, :createdAt, :updatedAt)
    `, {
      id: testNoteId,
      userId: testUserId,
      title: 'Test Note',
      content: 'This is a test note content',
      category: 'general',
      isPinned: 0,
      color: '#ffffff',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Test note created successfully');
    
    // Test creating a test flashcard
    console.log('\n4. Testing flashcard creation...');
    const testFlashcardId = 'test-flashcard-' + Date.now();
    const createFlashcardResult = await connection.execute(`
      INSERT INTO flashcards (id, user_id, front, back, difficulty, review_count, created_at)
      VALUES (:id, :userId, :front, :back, :difficulty, :reviewCount, :createdAt)
    `, {
      id: testFlashcardId,
      userId: testUserId,
      front: 'What is the capital of France?',
      back: 'Paris',
      difficulty: 'easy',
      reviewCount: 0,
      createdAt: new Date()
    });
    console.log('✅ Test flashcard created successfully');
    
    // Test creating a test AI summary
    console.log('\n5. Testing AI summary creation...');
    const testSummaryId = 'test-summary-' + Date.now();
    const createSummaryResult = await connection.execute(`
      INSERT INTO ai_summaries (id, user_id, title, original_content, summary_content, summary_type, created_at)
      VALUES (:id, :userId, :title, :originalContent, :summaryContent, :summaryType, :createdAt)
    `, {
      id: testSummaryId,
      userId: testUserId,
      title: 'Test Summary',
      originalContent: 'This is the original content',
      summaryContent: 'This is the summary content',
      summaryType: 'quick',
      createdAt: new Date()
    });
    console.log('✅ Test AI summary created successfully');
    
    // Test reading the created data
    console.log('\n6. Testing data retrieval...');
    const notesResult = await connection.execute('SELECT * FROM notes WHERE user_id = :userId', { userId: testUserId });
    const flashcardsResult = await connection.execute('SELECT * FROM flashcards WHERE user_id = :userId', { userId: testUserId });
    const summariesResult = await connection.execute('SELECT * FROM ai_summaries WHERE user_id = :userId', { userId: testUserId });
    
    console.log('✅ Data retrieval successful');
    console.log(`📝 Notes found: ${notesResult.rows.length}`);
    console.log(`🎴 Flashcards found: ${flashcardsResult.rows.length}`);
    console.log(`🤖 AI summaries found: ${summariesResult.rows.length}`);
    
    // Clean up test data
    console.log('\n7. Cleaning up test data...');
    await connection.execute('DELETE FROM ai_summaries WHERE user_id = :userId', { userId: testUserId });
    await connection.execute('DELETE FROM flashcards WHERE user_id = :userId', { userId: testUserId });
    await connection.execute('DELETE FROM notes WHERE user_id = :userId', { userId: testUserId });
    await connection.execute('DELETE FROM users WHERE id = :userId', { userId: testUserId });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All database operations working correctly!');
    
    // Close connection
    await connection.close();
    console.log('🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDatabase();
