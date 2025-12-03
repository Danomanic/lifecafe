# PostgreSQL Local Setup Guide

This guide will help you set up PostgreSQL locally for the LifeCafe application.

## Installation

### macOS (using Homebrew)

```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Add PostgreSQL to your PATH (add to ~/.zshrc or ~/.bash_profile)
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Ubuntu/Debian Linux

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Windows

1. Download PostgreSQL installer from https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` user
4. PostgreSQL service should start automatically

## Database Setup

### 1. Connect to PostgreSQL

```bash
# On macOS/Linux (connect as your user)
psql postgres

# Or if you need to use the postgres superuser
sudo -u postgres psql
```

### 2. Create Database and User

```sql
-- Create the database
CREATE DATABASE lifecafe;

-- Create a user with password
CREATE USER lifecafe WITH PASSWORD 'lifecafe';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON DATABASE lifecafe TO lifecafe;

-- Connect to the lifecafe database
\c lifecafe

-- Grant schema privileges (PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO lifecafe;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO lifecafe;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO lifecafe;

-- Exit psql
\q
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

The file should contain:

```
DATABASE_URL=postgresql://lifecafe:lifecafe@localhost:5432/lifecafe
```

**Note:** If you used different credentials, update the connection string:
- Format: `postgresql://username:password@host:port/database`
- Example: `postgresql://myuser:mypassword@localhost:5432/lifecafe`

### 4. Initialize Database Tables

The application will automatically create tables on first API request. You can also manually initialize:

```bash
npm run db:init
```

## Verify Setup

### Test PostgreSQL Connection

```bash
# Test connection with psql
psql -U lifecafe -d lifecafe -h localhost

# If successful, you'll see:
# lifecafe=>

# List tables (after running the app once)
\dt

# Exit
\q
```

### Test Application

```bash
# Start the development server
npm run dev

# Open http://localhost:3000 in your browser
# Try selecting a table and placing an order
```

## Common Issues

### "psql: command not found"

PostgreSQL is not in your PATH. Add it:

**macOS (Homebrew):**
```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Linux:**
```bash
sudo apt install postgresql-client
```

### "connection refused" Error

PostgreSQL service is not running:

**macOS:**
```bash
brew services start postgresql@15
```

**Linux:**
```bash
sudo systemctl start postgresql
```

**Check status:**
```bash
# macOS
brew services list

# Linux
sudo systemctl status postgresql
```

### "authentication failed" Error

Your credentials don't match. Either:

1. Update your `.env.local` with correct credentials
2. Or recreate the user:

```sql
-- Connect as postgres user
psql postgres

-- Drop and recreate user
DROP USER IF EXISTS lifecafe;
CREATE USER lifecafe WITH PASSWORD 'lifecafe';
GRANT ALL PRIVILEGES ON DATABASE lifecafe TO lifecafe;
```

### "permission denied for schema public"

Grant proper permissions:

```sql
-- Connect to lifecafe database as superuser
psql -d lifecafe postgres

-- Grant permissions
GRANT ALL ON SCHEMA public TO lifecafe;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO lifecafe;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO lifecafe;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO lifecafe;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO lifecafe;
```

## Useful PostgreSQL Commands

```sql
-- List all databases
\l

-- Connect to a database
\c lifecafe

-- List all tables
\dt

-- Describe a table
\d orders
\d order_items

-- View data
SELECT * FROM orders;
SELECT * FROM order_items;

-- Delete all data (for testing)
TRUNCATE orders, order_items RESTART IDENTITY CASCADE;

-- Drop tables
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- Exit psql
\q
```

## Uninstalling (if needed)

### macOS

```bash
# Stop service
brew services stop postgresql@15

# Uninstall
brew uninstall postgresql@15

# Remove data (optional)
rm -rf /opt/homebrew/var/postgresql@15
```

### Linux

```bash
# Stop service
sudo systemctl stop postgresql

# Uninstall
sudo apt remove --purge postgresql postgresql-contrib

# Remove data (optional)
sudo rm -rf /var/lib/postgresql
```

## Production Database

For production deployment on DigitalOcean App Platform, see the "Deployment on DigitalOcean App Platform" section in CLAUDE.md.
