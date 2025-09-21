// Test Oracle connection without wallet
require('dotenv').config();
const oracledb = require('oracledb');

async function testDirectConnection() {
  console.log('🧪 Testing Oracle direct connection...\n');
  
  try {
    // Try connection without wallet
    console.log('1. Testing direct connection without wallet...');
    const connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECTION_STRING
      // No wallet parameters
    });
    
    console.log('✅ Direct connection successful!');
    
    // Test a simple query
    const result = await connection.execute('SELECT SYSDATE FROM DUAL');
    console.log('📅 Current date:', result.rows[0][0]);
    
    // Test table access
    const tablesResult = await connection.execute('SELECT COUNT(*) as table_count FROM user_tables');
    console.log('📊 Number of tables:', tablesResult.rows[0][0]);
    
    await connection.close();
    console.log('\n🎉 Direct Oracle connection works!');
    
  } catch (error) {
    console.error('❌ Direct connection failed:', error.message);
    console.error('Error code:', error.errorNum);
  }
}

testDirectConnection();
