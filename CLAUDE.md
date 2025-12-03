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
- **MongoDB** database via `mongodb` package (local and production)

### State Management
The app uses minimal state management:
- **localStorage**: Persists selected table number (key: `'tableNumber'`)
- **React hooks**: Only used in client components (Modal, ItemPage)
- Most components are server components by default

### Database

The application uses **MongoDB** for both local development and production.

**Database Configuration:**
- Location: `src/lib/db.js`
- Client: `mongodb` (official MongoDB driver)
- Connection pooling enabled via singleton pattern
- Supports both local MongoDB and cloud services (MongoDB Atlas, etc.)

**Database Schema:**

*Collections:*
- `orders`: Main order documents
- `order_items`: Individual items within orders

*Orders Collection:*
```javascript
{
  _id: ObjectId,
  tableNumber: Number,
  status: String, // 'pending', 'completed', 'cancelled'
  createdAt: Date,
  updatedAt: Date
}
```

*Order Items Collection:*
```javascript
{
  _id: ObjectId,
  orderId: ObjectId, // Reference to orders._id
  itemName: String,
  itemSlug: String,
  options: Object, // Flexible object for any item options
  quantity: Number,
  price: Number,
  notes: String,
  createdAt: Date
}
```

**Indexes:**
- `orders`: `tableNumber`, `status`, `createdAt` (descending)
- `order_items`: `orderId`

**Environment Variables:**

*Local Development:*
- `MONGODB_URI`: MongoDB connection string
  - Default: `mongodb://localhost:27017/lifecafe`
  - Format: `mongodb://[username:password@]host:port/database`

*Production (MongoDB Atlas or other cloud):*
- `MONGODB_URI`: MongoDB connection string (required)
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/lifecafe`
  - Connection string provided by your MongoDB cloud service

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
1. MongoDB must be installed and running locally (or use MongoDB Atlas for cloud)
2. No manual database/collection creation needed - MongoDB creates them automatically
3. `MONGODB_URI` environment variable must be set in `.env.local`

**Initialize Database:**
On first API request, the database is automatically initialized with indexes. You can also manually initialize:

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
2. **MongoDB** (v5.0 or later) OR **MongoDB Atlas** (cloud)

### Local Development Setup

1. **Install MongoDB (Local Option)**

   **macOS (using Homebrew):**
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community@7.0
   brew services start mongodb-community@7.0
   ```

   **Ubuntu/Debian:**
   ```bash
   # Import MongoDB public key
   wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

   # Add MongoDB repository
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

   # Install MongoDB
   sudo apt-get update
   sudo apt-get install -y mongodb-org

   # Start MongoDB
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

   **Windows:**
   - Download MongoDB Community Server from https://www.mongodb.com/try/download/community
   - Run the installer and follow the setup wizard
   - MongoDB will start automatically as a Windows service

2. **OR Use MongoDB Atlas (Cloud Option)**
   - Sign up at https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Get your connection string from "Connect" → "Connect your application"
   - Update `.env.local` with your Atlas connection string

3. **Configure Environment**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local`:
   ```
   # For local MongoDB
   MONGODB_URI=mongodb://localhost:27017/lifecafe

   # OR for MongoDB Atlas
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lifecafe
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
   - Database and collections are created automatically
   - Indexes are created on first request
   - Or manually: `npm run db:init`

## Deployment on DigitalOcean App Platform

### Option 1: MongoDB Atlas (Recommended for Production)

**Step 1: Create MongoDB Atlas Cluster**
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a new project
3. Click "Build a Database"
4. Select **M0 Free** tier (or paid tier for production)
5. Choose your cloud provider and region (closest to your app)
6. Create cluster (takes 3-5 minutes)

**Step 2: Configure Database Access**
1. Go to "Database Access" in Atlas dashboard
2. Click "Add New Database User"
3. Create a username and password (save these!)
4. Set privileges to "Read and write to any database"
5. Click "Add User"

**Step 3: Configure Network Access**
1. Go to "Network Access" in Atlas dashboard
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production, you can restrict to DigitalOcean App Platform IPs later
4. Click "Confirm"

**Step 4: Get Connection String**
1. Go to "Database" and click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<database>` with `lifecafe` (or your preferred name)
6. Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/lifecafe?retryWrites=true&w=majority`

**Step 5: Configure App Platform Environment Variables**
1. Go to your DigitalOcean App Platform app settings
2. Navigate to "Settings" → "App-Level Environment Variables"
3. Add the following environment variable:
   - Key: `MONGODB_URI`
   - Value: Your MongoDB Atlas connection string
   - Scope: Check both "build" and "runtime"
   - Encrypt: ✓ (recommended for security)
4. Save changes

**Step 6: Deploy Application**
1. Push your code to Git
2. DigitalOcean will automatically redeploy
3. The app will automatically:
   - Connect to MongoDB Atlas
   - Create database and collections on first request
   - Create indexes for optimal performance

**Step 7: Verify Deployment**
1. Open your deployed app URL
2. Check logs for "MongoDB connection initialized"
3. Select a table and place a test order
4. Check MongoDB Atlas metrics to verify connections
5. View data in Atlas dashboard under "Browse Collections"

### Option 2: Self-Hosted MongoDB

If you prefer to host MongoDB yourself:
1. Set up a MongoDB instance on a VPS or cloud server
2. Configure authentication and security
3. Get your connection string: `mongodb://username:password@host:port/lifecafe`
4. Add `MONGODB_URI` to App Platform environment variables
5. Ensure MongoDB server is accessible from your App Platform app

### Environment Variable Summary

**Local Development**
- `MONGODB_URI`: `mongodb://localhost:27017/lifecafe`
  - Create `.env.local` file with this variable
  - Or use MongoDB Atlas connection string for cloud testing

**Production (MongoDB Atlas)**
- `MONGODB_URI`: MongoDB Atlas connection string
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/lifecafe`
  - Get from Atlas dashboard

**Production (Self-Hosted)**
- `MONGODB_URI`: Self-hosted MongoDB connection string
  - Format: `mongodb://username:password@host:port/lifecafe`

### Troubleshooting

**Connection Issues:**
- Verify MongoDB is running and accessible
- Check network access settings in MongoDB Atlas
- Confirm connection string is correct (check for typos)
- Ensure password doesn't contain special characters that need URL encoding
- Check app logs for specific error messages

**Authentication Errors:**
- Verify database user exists with correct permissions
- Check username and password in connection string
- Ensure user has "Read and write" privileges

**Database Not Initializing:**
- Check application logs for errors
- Manually run `npm run db:init` locally to test
- Verify app has network access to MongoDB
- For Atlas, ensure IP whitelist includes 0.0.0.0/0 or App Platform IPs

**Performance Issues:**
- Check MongoDB Atlas metrics for slow queries
- Verify indexes are created (check logs for "Database initialized")
- Consider upgrading from M0 free tier for production workloads
- Enable connection pooling (already configured in `src/lib/db.js`)
