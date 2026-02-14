# BoxTrack - Inventory Management App PRD

## Original Problem Statement
Create an app to track boxes inventory with ability to input daily usage quantities and alerts when inventory goes below defined minimum levels.

## User Choices
- Track: Name, Quantity, Cost per box type
- Dashboard alerts for low inventory (visual only)
- Usage trends with charts/graphs
- Username/password authentication
- Prediction system for reorder timing
- Excel export for inventory
- Simple, easy-to-use UI

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI + Recharts
- **Backend**: FastAPI (Python) with JWT authentication
- **Database**: MongoDB
- **Design**: Swiss Industrial aesthetic (sharp edges, high contrast)

## Core Requirements
1. Box inventory CRUD (name, quantity, cost, min threshold)
2. Record daily usage (deducts from quantity)
3. Dashboard with KPI stats
4. Low stock alerts when quantity <= threshold
5. Usage trends chart (7/14/30 days)
6. Usage history table
7. User authentication (username/password)
8. Usage-based predictions (days until empty/reorder)
9. Excel export

## What's Been Implemented (Feb 14, 2026)
- ✅ Full CRUD for box types
- ✅ Dashboard with 4 KPI cards
- ✅ Low stock alert banner
- ✅ Record usage page with date picker
- ✅ Usage trends with bar/line charts
- ✅ Usage history table
- ✅ Responsive sidebar navigation
- ✅ Input validation (backend)
- ✅ Stock validation when recording usage
- ✅ JWT username/password authentication
- ✅ Prediction system (avg daily usage → days until empty/reorder)
- ✅ Prediction alerts on dashboard and inventory table
- ✅ Excel export (.xlsx) with full inventory data + predictions
- ✅ Logout functionality

## API Endpoints
### Auth
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login and get JWT token
- GET /api/auth/me - Get current user info

### Inventory (Protected)
- GET/POST /api/boxes - List/Create boxes (includes predictions)
- GET/PUT/DELETE /api/boxes/{id} - Get/Update/Delete box
- POST /api/usage - Record usage
- GET /api/usage - Get usage history
- GET /api/usage/trends - Get daily aggregated trends
- GET /api/stats - Dashboard statistics
- GET /api/export/inventory - Download Excel file

## Next Action Items (P0-P2)
### P0 - Critical
- None currently

### P1 - High Priority
- Add "Quick Restock" button to easily increase quantities

### P2 - Future Enhancements
- Email notifications for low stock
- Supplier management
- Purchase order tracking
