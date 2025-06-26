-- Initialize the database with required extensions and basic setup
-- This script runs automatically when PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create database if it doesn't exist (this is typically handled by POSTGRES_DB)
-- But we can add any additional setup here

-- Create indexes for better performance (these will be created by migrations too)
-- This is just a placeholder for any database initialization

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully!';
END $$;
