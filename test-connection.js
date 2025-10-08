const pool = require('./src/config/database');
const Space = require('./src/models/Space');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('✓ Database connected:', result.rows[0]);

    console.log('\nTesting Space.findAll()...');
    const spaces = await Space.findAll();
    console.log('✓ Spaces found:', spaces.length);
    console.log('Spaces:', JSON.stringify(spaces, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error);
    process.exit(1);
  }
}

testConnection();
