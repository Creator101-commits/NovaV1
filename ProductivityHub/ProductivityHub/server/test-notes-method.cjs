/**
 * Test getNotesByUserId Method Directly
 */

require('dotenv').config({ path: '../.env' });
const oracledb = require('oracledb');
const path = require('path');

async function executeQuery(sql, binds = {}) {
  let connection;
  try {
    // Initialize Oracle client
    try {
      const walletLocation = path.resolve(process.cwd(), 'oracle_wallet');
      oracledb.initOracleClient({
        configDir: walletLocation
      });
    } catch (err) {
      console.log('Oracle client already initialized or error:', err.message);
    }

    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECTION_STRING,
      walletLocation: path.resolve(process.cwd(), 'oracle_wallet'),
      walletPassword: "oracle123"
    });

    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });

    return result;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function testGetNotesByUserId() {
  try {
    console.log('🔍 Testing getNotesByUserId method...');
    
    const userId = '4YPC6fwceJVCf9WLZHOsApByRyS2';
    console.log('User ID:', userId);
    
    // Execute the same query as in Oracle storage
    const result = await executeQuery('SELECT * FROM notes WHERE user_id = :userId ORDER BY created_at DESC', { userId });
    
    console.log('\n=== Raw Oracle Result ===');
    console.log('Rows count:', result.rows?.length || 0);
    
    if (result.rows && result.rows.length > 0) {
      console.log('First row keys:', Object.keys(result.rows[0]));
      console.log('First row sample:', result.rows[0]);
      
      // Test the mapping logic
      console.log('\n=== Testing Mapping Logic ===');
      const notes = (result.rows || []).map((row, index) => {
        console.log(`\nMapping row ${index + 1}:`);
        console.log('Row keys:', Object.keys(row));
        
        const mapped = {
          id: row.ID,
          userId: row.USER_ID,
          classId: row.CLASS_ID,
          title: row.TITLE,
          content: row.CONTENT,
          category: row.CATEGORY,
          tags: row.TAGS,
          isPinned: row.IS_PINNED === 1,
          color: row.COLOR,
          createdAt: row.CREATED_AT,
          updatedAt: row.UPDATED_AT
        };
        
        console.log('Mapped object:', mapped);
        return mapped;
      });
      
      console.log('\n=== Final Notes Array ===');
      console.log('Notes count:', notes.length);
      
      // Test JSON serialization
      console.log('\n=== Testing JSON Serialization ===');
      try {
        const jsonString = JSON.stringify(notes);
        console.log('✅ JSON serialization successful!');
        console.log('JSON length:', jsonString.length);
        console.log('Sample JSON:', jsonString.substring(0, 200) + '...');
      } catch (jsonError) {
        console.error('❌ JSON serialization failed:', jsonError.message);
        
        // Try to identify the problematic object
        notes.forEach((note, i) => {
          try {
            JSON.stringify(note);
            console.log(`Note ${i} serializes OK`);
          } catch (err) {
            console.error(`Note ${i} serialization failed:`, err.message);
            console.log('Problematic note:', note);
          }
        });
      }
    } else {
      console.log('No notes found for this user');
    }
    
  } catch (error) {
    console.error('❌ Error in getNotesByUserId test:', error);
    console.error('Stack trace:', error.stack);
  }
}

testGetNotesByUserId();