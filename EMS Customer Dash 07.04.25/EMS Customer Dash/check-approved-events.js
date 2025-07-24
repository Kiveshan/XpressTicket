const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'XPRT2',
  password: '1234567890',
  port: 5432,
});

async function checkApprovedEvents() {
  try {
    const result = await pool.query("SELECT COUNT(*) as count FROM events WHERE status = 'Approved'");
    console.log(`Number of approved events: ${result.rows[0].count}`);
    
    // Get the list of approved events
    const eventsResult = await pool.query("SELECT event_id, name, status FROM events WHERE status = 'Approved'");
    console.log('Approved events:');
    console.table(eventsResult.rows);
    
  } catch (error) {
    console.error('Error checking approved events:', error);
  } finally {
    await pool.end();
  }
}

checkApprovedEvents();
