# LifeCafe

A modern web-based point-of-sale (POS) system for cafes, built with Next.js and MongoDB. Designed for seamless ordering with a customer-facing interface and barista workflow management.

## Features

### Customer Ordering
- **Table Selection**: Users select their table number before ordering
- **Menu Categories**: Browse drinks, lunch, breakfast, and other categories
- **Cart System**: Add multiple items to cart before sending order to kitchen
- **Item Customization**: Configure drink sizes, milk types, syrups, and other options
  - Regular options displayed prominently
  - Collapsible options with defaults (e.g., milk preferences)
  - Optional extras for add-ons
- **Visual Feedback**: Pulsing cart button and confirmation animations
- **Order Review**: Review complete order with pricing before submitting

### Barista Interface
- **Horizontal Column Layout**: Each table displayed as a scrollable column
- **Two-Step Workflow**:
  1. Mark order as "Ready" (order appears with 50% opacity)
  2. "Sent to Table" to complete and remove from view
- **Real-time Updates**: Auto-refresh every 10 seconds
- **Visual Indicators**:
  - Elapsed time with color coding (green < 5min, amber 5-10min, red > 10min)
  - Item separators for multi-item orders
  - Total price per table
- **Order Management**: Cancel orders or reorder from history
- **Orders Log**: View completed and cancelled orders

### Admin Panel
- **Orders Log**: View all orders (pending, ready, completed, cancelled)
- **Terminal-style UI**: Monospace font with color-coded statuses
- **Auto-refresh**: Updates every 10 seconds

## Tech Stack

- **Frontend**: Next.js 15.5.4 with App Router, React 19.1.0
- **Styling**: Tailwind CSS 4
- **Database**: MongoDB (local or MongoDB Atlas)
- **Build Tool**: Turbopack

## Getting Started

### Prerequisites

1. **Node.js** (v18 or later)
2. **MongoDB** (v5.0 or later) OR **MongoDB Atlas** account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lifecafe
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
# For local MongoDB
MONGODB_URI=mongodb://localhost:27017/lifecafe

# OR for MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lifecafe
```

4. Start development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Database Setup

The database initializes automatically on first API request. MongoDB creates collections and indexes automatically. No manual setup required.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── orders/          # Order API endpoints
│   ├── barista/             # Barista order management page
│   ├── cart/                # Cart review and checkout
│   ├── danmin/              # Admin panel
│   ├── drinks/              # Drinks menu category
│   ├── item/[slug]/         # Dynamic item detail pages
│   ├── component/           # Reusable components
│   ├── modal.js             # Table selection modal
│   └── navbar.js            # Navigation bar with cart
├── lib/
│   ├── cart.js              # Cart management utilities
│   └── db.js                # MongoDB connection and helpers
└── menu.json                # Menu data configuration
```

## Key Routes

- `/` - Home (category selection)
- `/drinks` - Drinks menu
- `/lunch` - Lunch menu
- `/item/[slug]` - Item detail with customization
- `/cart` - Cart review before submitting
- `/barista` - Barista order management interface
- `/danmin` - Admin panel with full order log

## API Endpoints

- `POST /api/orders` - Create new order
- `GET /api/orders` - List orders (supports `?status=` and `?tableNumber=` filters)
- `GET /api/orders/[id]` - Get single order
- `PATCH /api/orders/[id]` - Update order status
- `DELETE /api/orders/[id]` - Delete order

### Order Statuses
- `pending` - Order submitted, not yet started
- `ready` - Order completed, waiting to be served
- `completed` - Order served to table
- `cancelled` - Order cancelled

## Menu Configuration

Menu items are defined in `src/menu.json` with support for:

- **Basic items**: Name, slug, price
- **Options**: Size, milk type, temperature, etc.
- **Collapsible options**: Options with defaults that auto-collapse after selection
- **Extras**: Optional add-ons displayed in expandable sections
- **Position**: Custom ordering within categories

Example:
```json
{
  "name": "Latte",
  "slug": "latte",
  "options": {
    "shots": [
      {"value": "single", "price": 2.60},
      {"value": "double", "price": 3.00}
    ],
    "syrup": [
      {"value": "none", "price": 0.00},
      {"value": "vanilla", "price": 0.50}
    ]
  },
  "extras": ["syrup"],
  "position": 3
}
```

## Development Commands

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Deployment

### MongoDB Atlas Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Configure database access (username/password)
3. Allow network access from anywhere (0.0.0.0/0)
4. Get connection string and add to environment variables

### DigitalOcean App Platform

1. Connect your Git repository
2. Add environment variable:
   - `MONGODB_URI`: Your MongoDB connection string
3. Deploy automatically on push

## Contributing

This project uses conventional commit messages:
- `feat:` New features
- `fix:` Bug fixes
- `chore:` Maintenance tasks
- `docs:` Documentation updates

## License

[Add your license here]

## Support

For issues or questions, please open an issue on GitHub.
