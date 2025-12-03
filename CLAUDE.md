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
- **Turso (libSQL)** - Embedded SQLite database for order persistence

### State Management
The app uses minimal state management:
- **localStorage**: Persists selected table number (key: `'tableNumber'`)
- **React hooks**: Only used in client components (Modal, ItemPage)
- Most components are server components by default

### Database

**Turso/libSQL** - Embedded SQLite database
- Local development: Uses `file:local.db` (SQLite file in project root)
- Production: Can connect to Turso cloud database via environment variables
- Database client: `@libsql/client` package
- Configuration: `src/lib/db.js`

**Database Schema:**
```sql
-- Orders table
orders (
  id INTEGER PRIMARY KEY,
  table_number INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT,
  updated_at TEXT
)

-- Order items table
order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  item_name TEXT NOT NULL,
  item_slug TEXT NOT NULL,
  cup_size TEXT,
  milk_type TEXT,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TEXT
)
```

**Environment Variables:**
- `TURSO_DATABASE_URL`: Database URL (optional for local dev)
- `TURSO_AUTH_TOKEN`: Authentication token (optional for local dev)
- If not set, uses local SQLite file at `file:local.db`

**API Routes:**
- `POST /api/orders` - Create new order
- `GET /api/orders` - List orders (supports `?tableNumber=X` and `?status=pending` filters)

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

On first API request, the database is automatically initialized with required tables. You can also manually initialize the database:

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

## Deployment on DigitalOcean App Platform

**Local Development:**
- Database uses local SQLite file (`local.db`)
- No environment variables required

**Production Setup:**
1. Create a Turso database: `turso db create lifecafe-prod`
2. Get database URL: `turso db show lifecafe-prod --url`
3. Generate auth token: `turso db tokens create lifecafe-prod`
4. Set environment variables in DigitalOcean App Platform:
   - `TURSO_DATABASE_URL`: Your Turso database URL
   - `TURSO_AUTH_TOKEN`: Your Turso auth token
5. Deploy app - database will auto-initialize on first API request
