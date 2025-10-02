import oracledb from 'oracledb';
import path from 'path';

// Initialize Oracle Client with wallet location (requires Oracle Instant Client)
let oracleClientAvailable = false;
try {
  const walletLocation = process.env.TNS_ADMIN || path.resolve(process.cwd(), 'server', 'oracle_wallet');
  oracledb.initOracleClient({
    configDir: walletLocation
  });
  oracleClientAvailable = true;
  console.log('✅ Oracle Client initialized successfully');
} catch (error) {
  console.log('⚠️  Oracle Client initialization:', (error as Error).message);
  console.log('📝 Oracle Instant Client not installed. Database features will be limited.');
  console.log('💡 To install Oracle Instant Client:');
  console.log('   1. Download from: https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html');
  console.log('   2. Extract to a folder and add to PATH');
  console.log('   3. Install Visual Studio Redistributable');
  oracleClientAvailable = false;
}

// Connection configuration
const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECTION_STRING,
  walletLocation: process.env.TNS_ADMIN || path.resolve(process.cwd(), 'server', 'oracle_wallet'),
  walletPassword: process.env.ORACLE_WALLET_PASSWORD || "Oracle123456",
  poolMin: 1,
  poolMax: 10,
  poolIncrement: 1,
  poolTimeout: 300, // seconds
  stmtCacheSize: 23
};

let pool: oracledb.Pool | null = null;

export async function initializeDatabase() {
  try {
    if (!oracleClientAvailable) {
      throw new Error('Oracle Client is not available. Please install Oracle Instant Client to use database features.');
    }

    if (!process.env.ORACLE_USER || !process.env.ORACLE_PASSWORD || !process.env.ORACLE_CONNECTION_STRING) {
      throw new Error('Oracle database environment variables are not set');
    }

    console.log('Initializing Oracle connection pool...');
    pool = await oracledb.createPool(dbConfig);
    console.log('✅ Oracle database pool created successfully');
    return pool;
  } catch (error) {
    console.error('❌ Error creating Oracle database pool:', error);
    throw error;
  }
}

export async function getConnection() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase() first.');
  }
  return await pool.getConnection();
}

export async function closeDatabase() {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('Oracle database pool closed');
  }
}

// Helper function to execute queries
export async function executeQuery(sql: string, binds: any = {}, options: any = {}) {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...options
    });
    
    // Handle LOB data if present
    if (result.rows) {
      for (const row of result.rows as any[]) {
        for (const [key, value] of Object.entries(row)) {
          if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Lob') {
            try {
              // Type assertion for LOB object
              const lobValue = value as any;
              if (lobValue.getData && typeof lobValue.getData === 'function') {
                row[key] = await lobValue.getData();
              }
            } catch (lobError) {
              console.error('Error reading LOB data:', lobError);
              row[key] = null; // Set to null if LOB reading fails
            }
          }
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
  }
}

// Helper function to execute queries with connection management
export async function executeQueryWithConnection<T>(
  callback: (connection: oracledb.Connection) => Promise<T>
): Promise<T> {
  let connection;
  try {
    connection = await getConnection();
    return await callback(connection);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
  }
}

export { oracledb };