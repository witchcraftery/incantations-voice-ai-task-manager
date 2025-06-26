import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const migrations = [
  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
  )`,

  // User preferences
  `CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
  )`,

  // Tasks table
  `CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
    due_date TIMESTAMP,
    project VARCHAR(255),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    extracted_from VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,

  // Conversations table
  `CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,

  // Messages table
  `CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('user', 'assistant')),
    content TEXT NOT NULL,
    is_voice_input BOOLEAN DEFAULT FALSE,
    extracted_task_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  // User patterns (for background agent)
  `CREATE TABLE IF NOT EXISTS user_patterns (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    pattern_type VARCHAR(50) NOT NULL,
    pattern_data JSONB NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,

  // Email integrations
  `CREATE TABLE IF NOT EXISTS email_integrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email_id VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    sender VARCHAR(255),
    extracted_tasks INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    analysis_result JSONB,
    processed_at TIMESTAMP DEFAULT NOW()
  )`,

  // Indexes for performance
  `CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)`,
  `CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)`,
  `CREATE INDEX IF NOT EXISTS idx_user_patterns_user_id ON user_patterns(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_email_integrations_user_id ON email_integrations(user_id)`
];

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');

    for (let i = 0; i < migrations.length; i++) {
      console.log(`⚡ Running migration ${i + 1}/${migrations.length}`);
      await db.query(migrations[i]);
    }

    console.log('✅ All migrations completed successfully!');
    
    // Insert default admin user if none exists
    const adminCheck = await db.query('SELECT COUNT(*) FROM users');
    if (parseInt(adminCheck.rows[0].count) === 0) {
      await db.query(
        `INSERT INTO users (email, name, avatar_url, google_id) 
         VALUES ($1, $2, $3, $4)`,
        ['admin@witchcraftery.io', 'Admin User', null, null]
      );
      console.log('👤 Default admin user created');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
