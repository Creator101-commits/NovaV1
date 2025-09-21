/**
 * Debug Mood Entries Table Issue
 */

const { config } = require('dotenv');
config({ path: '.env' });

async function debugMoodEntriesSimple() {
  console.log('🔍 Debugging mood_entries table...');
  
  try {
    // Import the storage class
    const { OracleStorage } = await import('./oracle-storage.js');
    const storage = new OracleStorage();
    
    const userId = '4YPC6fwceJVCf9WLZHOsApByRyS2';
    console.log('Testing getMoodEntriesByUserId with user:', userId);
    
    const entries = await storage.getMoodEntriesByUserId(userId);
    console.log('✅ Success! Mood entries:', entries.length);
    console.log('Entries:', entries);
    
  } catch (error) {
    console.error('❌ Error details:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    // Also show the OracleError details if available
    if (error.errorNum) {
      console.error('Oracle Error Number:', error.errorNum);
      console.error('Oracle Error Position:', error.offset);
    }
  }
}

debugMoodEntriesSimple().catch(console.error);