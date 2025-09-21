/**
 * Test All Oracle Tables Implementation
 * This tests all the newly implemented Oracle table operations
 */

require('dotenv').config({ path: '.env' });

async function loadOracleStorage() {
  // Use dynamic import for TypeScript file with tsx
  const tsx = require('tsx/cjs');
  return require('./oracle-storage.ts').OracleStorage;
}

const TEST_USER_ID = '4YPC6fwceJVCf9WLZHOsApByRyS2'; // Firebase user ID

async function testAllTables() {
  console.log('🧪 Testing All Oracle Table Implementations\n');
  
  const OracleStorage = await loadOracleStorage();
  const storage = new OracleStorage();
  
  try {
    // Test Flashcards
    console.log('📝 Testing Flashcards...');
    const flashcards = await storage.getFlashcardsByUserId(TEST_USER_ID);
    console.log(`✅ Found ${flashcards.length} flashcards`);
    
    // Test Classes
    console.log('\n📚 Testing Classes...');
    const classes = await storage.getClassesByUserId(TEST_USER_ID);
    console.log(`✅ Found ${classes.length} classes`);
    
    // Test Assignments
    console.log('\n📋 Testing Assignments...');
    const assignments = await storage.getAssignmentsByUserId(TEST_USER_ID);
    console.log(`✅ Found ${assignments.length} assignments`);
    
    // Test Mood Entries
    console.log('\n😊 Testing Mood Entries...');
    const moodEntries = await storage.getMoodEntriesByUserId(TEST_USER_ID);
    console.log(`✅ Found ${moodEntries.length} mood entries`);
    
    // Test Journal Entries
    console.log('\n📓 Testing Journal Entries...');
    const journalEntries = await storage.getJournalEntriesByUserId(TEST_USER_ID);
    console.log(`✅ Found ${journalEntries.length} journal entries`);
    
    // Test Pomodoro Sessions
    console.log('\n🍅 Testing Pomodoro Sessions...');
    const pomodoroSessions = await storage.getPomodoroSessionsByUserId(TEST_USER_ID);
    console.log(`✅ Found ${pomodoroSessions.length} pomodoro sessions`);
    
    // Test AI Summaries
    console.log('\n🤖 Testing AI Summaries...');
    const aiSummaries = await storage.getAiSummariesByUserId(TEST_USER_ID);
    console.log(`✅ Found ${aiSummaries.length} AI summaries`);
    
    // Test Bell Schedule
    console.log('\n🔔 Testing Bell Schedule...');
    const bellSchedule = await storage.getBellScheduleByUserId(TEST_USER_ID);
    console.log(`✅ Found ${bellSchedule.length} bell schedule entries`);
    
    // Test Notes (already working)
    console.log('\n📝 Testing Notes...');
    const notes = await storage.getNotesByUserId(TEST_USER_ID);
    console.log(`✅ Found ${notes.length} notes`);
    
    console.log('\n🎉 All table tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Flashcards: ${flashcards.length}`);
    console.log(`- Classes: ${classes.length}`);
    console.log(`- Assignments: ${assignments.length}`);
    console.log(`- Mood Entries: ${moodEntries.length}`);
    console.log(`- Journal Entries: ${journalEntries.length}`);
    console.log(`- Pomodoro Sessions: ${pomodoroSessions.length}`);
    console.log(`- AI Summaries: ${aiSummaries.length}`);
    console.log(`- Bell Schedule: ${bellSchedule.length}`);
    console.log(`- Notes: ${notes.length}`);
    
  } catch (error) {
    console.error('❌ Error testing tables:', error);
  }
}

// Test create operations
async function testCreateOperations() {
  console.log('\n🧪 Testing Create Operations...\n');
  
  const OracleStorage = await loadOracleStorage();
  const storage = new OracleStorage();
  
  try {
    // Test creating a flashcard
    console.log('📝 Creating test flashcard...');
    const newFlashcard = await storage.createFlashcard({
      userId: TEST_USER_ID,
      front: 'What is Oracle Database?',
      back: 'A relational database management system developed by Oracle Corporation',
      difficulty: 'medium'
    });
    console.log('✅ Flashcard created:', newFlashcard.id);
    
    // Test creating a class
    console.log('\n📚 Creating test class...');
    const newClass = await storage.createClass({
      userId: TEST_USER_ID,
      name: 'Advanced Database Systems',
      section: 'CS 541',
      description: 'Learn advanced database concepts including Oracle integration',
      color: '#4CAF50'
    });
    console.log('✅ Class created:', newClass.id);
    
    // Test creating an assignment
    console.log('\n📋 Creating test assignment...');
    const newAssignment = await storage.createAssignment({
      userId: TEST_USER_ID,
      classId: newClass.id,
      title: 'Oracle Database Migration Project',
      description: 'Migrate existing PostgreSQL database to Oracle Cloud',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      priority: 'high'
    });
    console.log('✅ Assignment created:', newAssignment.id);
    
    console.log('\n🎉 Create operations test completed!');
    
  } catch (error) {
    console.error('❌ Error testing create operations:', error);
  }
}

async function runAllTests() {
  await testAllTables();
  await testCreateOperations();
}

runAllTests().catch(console.error);