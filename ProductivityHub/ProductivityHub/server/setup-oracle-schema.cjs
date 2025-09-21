/**
 * Oracle Database Schema Setup Script
 */

require('dotenv').config({ path: '../.env' });
const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');

async function setupOracleSchema() {
  console.log('🚀 Setting up Oracle Database Schema...\n');
  
  // Set environment variables explicitly
  const walletPath = path.resolve('./server/oracle_wallet');
  process.env.TNS_ADMIN = walletPath;
  
  let connection;
  
  try {
    // Connect to Oracle
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECTION_STRING,
      walletLocation: walletPath,
      walletPassword: "oracle123"
    });
    
    console.log('✅ Connected to Oracle Database');
    
    // Read schema file
    const schemaPath = path.resolve('./server/migrations/oracle_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split into individual statements
    const statements = schema.split(';').filter(s => s.trim());
    
    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt) {
        try {
          await connection.execute(stmt);
          const preview = stmt.substring(0, 60).replace(/\s+/g, ' ');
          console.log(`✅ [${i+1}/${statements.length}] ${preview}...`);
        } catch (err) {
          const preview = stmt.substring(0, 60).replace(/\s+/g, ' ');
          if (err.message.includes('already exists')) {
            console.log(`⚠️  [${i+1}/${statements.length}] ${preview}... (already exists)`);
          } else {
            console.log(`❌ [${i+1}/${statements.length}] ${preview}... ERROR: ${err.message.substring(0, 100)}`);
          }
        }
      }
    }
    
    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    const result = await connection.execute(`
      SELECT table_name 
      FROM user_tables 
      ORDER BY table_name
    `);
    
    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`   📋 ${row[0]}`);
    });
    
    console.log('\n🎉 Oracle Database schema setup complete!');
    
  } catch (err) {
    console.error('❌ Schema setup failed:', err.message);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('🔌 Connection closed');
      } catch (err) {
        console.error('❌ Error closing connection:', err.message);
      }
    }
  }
}

setupOracleSchema();