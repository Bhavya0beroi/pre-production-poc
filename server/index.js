const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shoots (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        date TEXT,
        duration TEXT,
        location TEXT,
        equipment JSONB DEFAULT '[]'::jsonb,
        status TEXT DEFAULT 'new_request',
        requestor JSONB,
        vendor_quote JSONB,
        approved BOOLEAN DEFAULT FALSE,
        approved_amount DECIMAL,
        invoice_file JSONB,
        paid BOOLEAN DEFAULT FALSE,
        rejection_reason TEXT,
        approval_email TEXT,
        cancellation_reason TEXT,
        activities JSONB DEFAULT '[]'::jsonb,
        email_thread_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        shoot_date TIMESTAMP WITH TIME ZONE,
        request_group_id TEXT,
        is_multi_shoot BOOLEAN DEFAULT FALSE,
        multi_shoot_index INTEGER,
        total_shoots_in_request INTEGER
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS catalog_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        daily_rate DECIMAL NOT NULL,
        category TEXT NOT NULL,
        last_updated TEXT
      )
    `);

    console.log('Database tables initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all shoots
app.get('/api/shoots', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shoots ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching shoots:', error);
    res.status(500).json({ error: 'Failed to fetch shoots' });
  }
});

// Create or update a shoot
app.post('/api/shoots', async (req, res) => {
  try {
    const shoot = req.body;
    console.log('POST /api/shoots - Received:', shoot.id, 'status:', shoot.status);
    const result = await pool.query(`
      INSERT INTO shoots (
        id, name, date, duration, location, equipment, status, requestor,
        vendor_quote, approved, approved_amount, invoice_file, paid,
        rejection_reason, approval_email, cancellation_reason, activities,
        email_thread_id, created_at, shoot_date, request_group_id,
        is_multi_shoot, multi_shoot_index, total_shoots_in_request
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        date = EXCLUDED.date,
        duration = EXCLUDED.duration,
        location = EXCLUDED.location,
        equipment = EXCLUDED.equipment,
        status = EXCLUDED.status,
        requestor = EXCLUDED.requestor,
        vendor_quote = EXCLUDED.vendor_quote,
        approved = EXCLUDED.approved,
        approved_amount = EXCLUDED.approved_amount,
        invoice_file = EXCLUDED.invoice_file,
        paid = EXCLUDED.paid,
        rejection_reason = EXCLUDED.rejection_reason,
        approval_email = EXCLUDED.approval_email,
        cancellation_reason = EXCLUDED.cancellation_reason,
        activities = EXCLUDED.activities,
        email_thread_id = EXCLUDED.email_thread_id,
        shoot_date = EXCLUDED.shoot_date,
        request_group_id = EXCLUDED.request_group_id,
        is_multi_shoot = EXCLUDED.is_multi_shoot,
        multi_shoot_index = EXCLUDED.multi_shoot_index,
        total_shoots_in_request = EXCLUDED.total_shoots_in_request
      RETURNING *
    `, [
      shoot.id,
      shoot.name,
      shoot.date,
      shoot.duration,
      shoot.location,
      JSON.stringify(shoot.equipment || []),
      shoot.status,
      JSON.stringify(shoot.requestor),
      JSON.stringify(shoot.vendor_quote),
      shoot.approved,
      shoot.approved_amount,
      JSON.stringify(shoot.invoice_file),
      shoot.paid,
      shoot.rejection_reason,
      shoot.approval_email,
      shoot.cancellation_reason,
      JSON.stringify(shoot.activities || []),
      shoot.email_thread_id,
      shoot.created_at || new Date().toISOString(),
      shoot.shoot_date,
      shoot.request_group_id,
      shoot.is_multi_shoot,
      shoot.multi_shoot_index,
      shoot.total_shoots_in_request
    ]);
    
    console.log('POST /api/shoots - Saved:', result.rows[0].id, 'status:', result.rows[0].status);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving shoot:', error);
    res.status(500).json({ error: 'Failed to save shoot', details: error.message });
  }
});

// Delete a shoot
app.delete('/api/shoots/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM shoots WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting shoot:', error);
    res.status(500).json({ error: 'Failed to delete shoot' });
  }
});

// Get all catalog items
app.get('/api/catalog', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM catalog_items ORDER BY category, name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching catalog:', error);
    res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

// Create or update catalog item
app.post('/api/catalog', async (req, res) => {
  try {
    const item = req.body;
    const result = await pool.query(`
      INSERT INTO catalog_items (id, name, daily_rate, category, last_updated)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        daily_rate = EXCLUDED.daily_rate,
        category = EXCLUDED.category,
        last_updated = EXCLUDED.last_updated
      RETURNING *
    `, [item.id, item.name, item.daily_rate, item.category, item.last_updated]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving catalog item:', error);
    res.status(500).json({ error: 'Failed to save catalog item' });
  }
});

// Bulk upsert catalog items
app.post('/api/catalog/bulk', async (req, res) => {
  try {
    const items = req.body;
    for (const item of items) {
      await pool.query(`
        INSERT INTO catalog_items (id, name, daily_rate, category, last_updated)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          daily_rate = EXCLUDED.daily_rate,
          category = EXCLUDED.category,
          last_updated = EXCLUDED.last_updated
      `, [item.id, item.name, item.daily_rate, item.category, item.last_updated]);
    }
    res.json({ success: true, count: items.length });
  } catch (error) {
    console.error('Error bulk saving catalog:', error);
    res.status(500).json({ error: 'Failed to save catalog items' });
  }
});

// Start server
app.listen(port, async () => {
  console.log(`API Server running on port ${port}`);
  await initDatabase();
});

