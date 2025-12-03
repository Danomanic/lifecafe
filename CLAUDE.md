# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LifeCafe is a web-based point-of-sale (POS) system for cafe ordering. It allows users to select a table, browse menu items by category (drinks, lunch), configure item options (cup size, milk type), and place orders.

## Development Commands

```bash
# Start development server (with Turbopack)
npm run dev

# Build for production
npm build

# Start production server
npm start

# Run linter
npm run lint

# Initialize database (creates tables)
npm run db:init
```

The dev server runs on http://localhost:3000

## Architecture

### Tech Stack
- **Next.js 15.5.4** with App Router (`/src/app` directory)
- **React 19.1.0** (mostly server components)
- **Tailwind CSS 4** for styling
- **Turbopack** for fast builds
- **PostgreSQL** database via `pg` package (local and production)

### State Management
The app uses minimal state management:
- **localStorage**: Persists selected table number (key: `'tableNumber'`)
- **React hooks**: Only used in client components (Modal, ItemPage)
- Most components are server components by default

### Database

The application uses **PostgreSQL** for both local development and production.

**Database Configuration:**
- Location: `src/lib/db.js`
- Client: `pg` (node-postgres)
- Connection pooling enabled
- SSL: Automatically enabled for non-localhost connections
  - Supports CA certificate file (`db-ca-certificate.crt` in project root)
  - Falls back to environment variable `DATABASE_CA_CERT` if file not found
  - Accepts self-signed certificates from managed database providers

**Database Schema:**
```sql
-- Orders table
orders (
  id SERIAL PRIMARY KEY,
  table_number INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Order items table
order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  item_slug TEXT NOT NULL,
  options_json TEXT,
  quantity INTEGER DEFAULT 1,
  price NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
)
```

**Environment Variables:**

*Local Development:*
- `DATABASE_URL`: PostgreSQL connection string
  - Default: `postgresql://lifecafe:lifecafe@localhost:5432/lifecafe`
  - Format: `postgresql://username:password@host:port/database`

*Production:*
- `DATABASE_URL`: PostgreSQL connection string (required)
  - Format: `postgresql://user:password@host:port/database?sslmode=require`
  - Provided by DigitalOcean Managed Database

**Local Setup:**
See `POSTGRES_SETUP.md` for detailed instructions on installing and configuring PostgreSQL locally.

**API Routes:**
- `POST /api/orders` - Create new order
- `GET /api/orders` - List orders (supports `?tableNumber=X` and `?status=pending` filters)
- `GET /api/orders/[id]` - Get single order
- `PATCH /api/orders/[id]` - Update order status
- `DELETE /api/orders/[id]` - Delete order

### Key Components

**Modal** (`src/app/modal.js`)
- Client component (`"use client"`) for table selection
- Manages table number in localStorage
- 14 table options displayed in 3-column grid
- Uses `useState` and `useEffect` for state/persistence

**ItemButton** (`src/app/component/itemButton.js`)
- Reusable menu item button component
- Props: `name`, `link`, `colour`
- Default color: 'stone-900'

**Navbar** (`src/app/navbar.js`)
- Global navigation with table selection modal and home button
- Appears on all pages

### Route Structure

**Pages:**
```
/                      → Home (category selection)
/drinks               → Drinks menu
/lunch                → Lunch menu
/item/[slug]          → Dynamic item detail page with options (client component)
```

**API Routes:**
```
POST /api/orders      → Create new order
GET  /api/orders      → List orders (optional filters: tableNumber, status)
```

### Data Flow

1. User selects table number via Modal → stored in localStorage
2. User selects category (Drinks/Lunch)
3. User selects menu item → navigates to `/item/[slug]`
4. User configures options (cup size, milk type)
5. User submits order → POST to `/api/orders`
6. API creates order record and order items in database
7. User redirected to drinks page with success message

## Important Implementation Details

### Tailwind Dynamic Colors
ItemButton uses dynamic color classes (`bg-${colour}-900`). To prevent purging, colors are safelisted in `tailwind.config.js`:

```javascript
safelist: ["bg-yellow-900", "bg-red-900", "bg-slate-900", "bg-stone-900"]
```

When adding new menu categories with different colors, add them to the safelist.

### Table Number Persistence
The table number is stored in browser localStorage and persists across page refreshes. The Modal component handles this:
- Initialization: `useEffect` reads from localStorage on mount
- Selection: Extracts number from button `innerText`, saves to localStorage

### Database Initialization

**Prerequisites:**
1. PostgreSQL must be installed and running locally
2. Database and user must be created (see `POSTGRES_SETUP.md`)
3. `DATABASE_URL` environment variable must be set in `.env.local`

**Initialize Tables:**
On first API request, the database is automatically initialized with required tables. You can also manually initialize:

```bash
npm run db:init
```

### Current Limitations
- Menu items are hardcoded in page components (not stored in database)
- No order confirmation page after submission
- No kitchen display system to view pending orders
- No order status updates (orders remain 'pending')
- No authentication or multi-user session management
- Item page only supports single item orders (no cart/batch ordering)

## Menu Structure

Menu items are currently hardcoded in category pages:
- **Drinks**: Flat White, Latte, Americano, Cappuccino
- **Lunch**: Minimal placeholder content

Item detail pages use Next.js dynamic routing with `[slug]` parameter and are client components that:
- Load table number from localStorage
- Submit orders to `/api/orders` API endpoint
- Display validation errors and loading states
- Redirect to drinks page on successful order placement

## Getting Started

### Prerequisites

1. **Node.js** (v18 or later)
2. **PostgreSQL** (v14 or later)

### Local Development Setup

1. **Install PostgreSQL**
   - See `POSTGRES_SETUP.md` for detailed installation instructions for your OS

2. **Create Database**
   ```bash
   psql postgres
   ```
   ```sql
   CREATE DATABASE lifecafe;
   CREATE USER lifecafe WITH PASSWORD 'lifecafe';
   GRANT ALL PRIVILEGES ON DATABASE lifecafe TO lifecafe;
   \c lifecafe
   GRANT ALL ON SCHEMA public TO lifecafe;
   \q
   ```

3. **Configure Environment**
   ```bash
   cp .env.local.example .env.local
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Initialize Database** (automatic on first API request)
   - Or manually: `npm run db:init`

## Deployment on DigitalOcean App Platform

### Production Setup with DigitalOcean Managed Database

**Step 1: Create PostgreSQL Database**
1. Go to DigitalOcean Dashboard → Databases
2. Click "Create Database"
3. Select:
   - Database engine: **PostgreSQL** (latest version)
   - Datacenter region: Choose closest to your app
   - Database configuration: Select size based on needs (Basic plan is fine for small apps)
   - Database name: `lifecafe-db` (or any name you prefer)
4. Click "Create Database Cluster"

**Step 2: Get Database Connection String and Certificate**
1. Once database is created, go to "Connection Details"
2. Connection parameters format: Select **Connection String**
3. Copy the connection string (format: `postgresql://username:password@host:port/database?sslmode=require`)
4. **Download CA Certificate:**
   - Scroll down to "Connection Details"
   - Click "Download CA Certificate"
   - Save as `db-ca-certificate.crt` in your project root directory
   - This certificate is required for secure SSL connections
5. Note: You can also get individual connection parameters:
   - Host
   - Port
   - Username
   - Password
   - Database name

**Step 3: Configure Trusted Sources (Security)**
1. In database settings, go to "Trusted Sources"
2. Add your DigitalOcean App Platform app
   - Option A: Select your app from the dropdown if it's already created
   - Option B: Temporarily allow all IPs during setup, then restrict later

**Step 4: Configure App Platform Environment Variables**
1. Go to your App Platform app settings
2. Navigate to "Settings" → "App-Level Environment Variables"
3. Add the following environment variable:
   - Key: `DATABASE_URL`
   - Value: Your PostgreSQL connection string (from Step 2)
   - Scope: Check both "build" and "runtime"
   - Encrypt: ✓ (recommended for security)
4. Save changes

**Step 5: Add CA Certificate to Repository**
1. Place the downloaded `db-ca-certificate.crt` in your project root
2. **Important:** The certificate file is automatically excluded from git (in `.gitignore`)
3. For deployment, you have two options:
   - **Option A (Recommended):** Add certificate content as environment variable `DATABASE_CA_CERT`
   - **Option B:** Manually upload certificate to server (not recommended for App Platform)

**Step 6: Deploy Application**
1. Deploy or redeploy your app
2. The app will automatically:
   - Detect PostgreSQL via `DATABASE_URL`
   - Load CA certificate from file or environment variable
   - Initialize database tables on first API request
   - Use SSL for all database connections

**Step 7: Verify Deployment**
1. Open your deployed app URL
2. Check logs for "SSL certificate loaded" message
3. Select a table and place a test order
4. Check DigitalOcean database metrics to verify connections
5. View logs in App Platform to confirm successful database initialization

### Environment Variable Summary

**Local Development**
- `DATABASE_URL`: `postgresql://lifecafe:lifecafe@localhost:5432/lifecafe`
  - Create `.env.local` file with this variable
  - See `POSTGRES_SETUP.md` for setup instructions

**Production (DigitalOcean)**
- `DATABASE_URL`: PostgreSQL connection string (provided by DigitalOcean)
  - Automatically includes `?sslmode=require` parameter
- `DATABASE_CA_CERT` (optional): CA certificate content as environment variable
  - Alternative to including certificate file in deployment
  - Get content from `db-ca-certificate.crt` file

### Troubleshooting

**Connection Issues:**
- Verify database is running and accessible
- Check trusted sources/firewall settings in DigitalOcean database settings
- Confirm connection string is correct (check for typos)
- Check app logs for specific error messages

**SSL Certificate Issues:**
If you see "self-signed certificate" errors:
- Ensure the `db-ca-certificate.crt` file is in your project root
- Download the certificate from DigitalOcean database "Connection Details"
- For deployment, set `DATABASE_CA_CERT` environment variable with certificate content
- Check logs for "SSL certificate loaded" message
- Ensure your `DATABASE_URL` contains `?sslmode=require`
- The app automatically handles self-signed certificates with proper CA validation

**Database Not Initializing:**
- Check application logs for errors
- Manually run `npm run db:init` locally to test
- Verify app has network access to database
- Ensure database user has proper permissions (see POSTGRES_SETUP.md)
