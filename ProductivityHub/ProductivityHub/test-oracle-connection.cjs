// Simple Oracle connection test
require('dotenv').config();
const oracledb = require('oracledb');
const path = require('path');

async function testConnection() {
  console.log('🧪 Testing Oracle connection...\n');
  
  try {
    // Try to initialize Oracle client without wallet
    console.log('1. Testing Oracle client initialization...');
    
    // Set environment variables
    process.env.TNS_ADMIN = path.resolve('./server/oracle_wallet');
    
    // Try different initialization approaches
    try {
      oracledb.initOracleClient({
        configDir: path.resolve('./server/oracle_wallet'),
        walletPassword: "oracle123"
      });
      console.log('✅ Oracle client initialized with wallet');
    } catch (initError) {
      console.log('⚠️ Wallet initialization failed:', initError.message);
      console.log('🔄 Trying without wallet initialization...');
    }
    
    // Try to connect
    console.log('\n2. Testing database connection...');
    const connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECTION_STRING,
      walletLocation: path.resolve('./server/oracle_wallet'),
      walletPassword: "oracle123"
    });
    
    console.log('✅ Connected to Oracle Database successfully!');
    
    // Test a simple query
    console.log('\n3. Testing simple query...');
    const result = await connection.execute('SELECT SYSDATE FROM DUAL');
    console.log('✅ Query executed successfully');
    console.log('📅 Current date:', result.rows[0][0]);
    
    // Test table access
    console.log('\n4. Testing table access...');
    const tablesResult = await connection.execute('SELECT COUNT(*) as table_count FROM user_tables');
    console.log('✅ Table access successful');
    console.log('📊 Number of tables:', tablesResult.rows[0][0]);
    
    await connection.close();
    console.log('\n🎉 All Oracle connection tests passed!');
    
  } catch (error) {
    console.error('❌ Oracle connection test failed:', error.message);
    console.error('Error code:', error.errorNum);
    console.error('Stack:', error.stack);
  }
}

testConnection();
