# BoxTracker

A full-stack application for tracking and managing inventory boxes with usage history and analytics.

## Project Overview

BoxTracker is a modern inventory management system built with:

- **Frontend**: React 19 with Radix UI components, React Hook Form, and Axios
- **Backend**: FastAPI with MongoDB, JWT authentication, and CORS support
- **Features**: Dashboard, inventory management, usage recording, history tracking, and user authentication

## Tech Stack

### Frontend

- **Framework**: React 19
- **UI Library**: Radix UI
- **Form Handling**: React Hook Form
- **HTTP Client**: Axios
- **Build Tool**: Create React App with Craco
- **Package Manager**: Yarn

### Backend

- **Framework**: FastAPI
- **Database**: MongoDB (Motor async driver)
- **Authentication**: JWT with bcrypt password hashing
- **CORS**: Enabled for cross-origin requests
- **Server**: Uvicorn

## Project Structure

```
boxtracker/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Inventory.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── RecordUsage.jsx
│   │   │   └── UsageHistory.jsx
│   │   ├── hooks/
│   │   │   └── use-toast.js
│   │   ├── lib/
│   │   │   └── utils.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── .env
├── backend/
│   ├── server.py
│   ├── .env
│   └── __pycache__/
└── README.md
```

## Prerequisites

- **Node.js** (v16 or higher)
- **Yarn** package manager
- **Python** (3.8 or higher)
- **MongoDB** (local or cloud connection)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd boxtracker
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/boxtracker
JWT_SECRET=your-secret-key-here
```

### 3. Frontend Setup

#### Install Dependencies

```bash
cd frontend
yarn install
```

#### Configure Environment Variables

Create a `.env` file in the `frontend/` directory:

```
REACT_APP_API_URL=http://localhost:8000
```

## Running the Application

### Start Backend Server

From the `backend/` directory (with virtual environment activated):

```bash
uvicorn server:app --reload
```

The backend will start on: `http://localhost:8000`

### Start Frontend Development Server

From the `frontend/` directory:

```bash
yarn start
```

The frontend will start on: `http://localhost:3000`

### Build Frontend for Production

```bash
cd frontend
yarn build
```

## Available Pages

- **Login** (`/login`) - User authentication
- **Dashboard** (`/dashboard`) - Overview and analytics
- **Inventory** (`/inventory`) - Manage boxes and items
- **Record Usage** (`/record-usage`) - Log item usage
- **Usage History** (`/usage-history`) - View usage records

## API Documentation

Once the backend is running, visit:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Git Workflow

### Push Changes

```bash
git add .
git commit -m "your message"
git push origin main
```

### If Merge Conflicts Occur

```bash
# Option 1: Abort the merge (revert changes)
git merge --abort

# Option 2: Resolve conflicts and continue
# Edit conflicted files, then:
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

## Troubleshooting

### Frontend Issues

#### Craco Config File Missing

If you get: `craco: Config file not found`

**Solution**: Create `craco.config.js` in the frontend root:

```javascript
module.exports = {
  // Add any custom configurations here
};
```

#### Yarn Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules yarn.lock
yarn install
yarn build
```

### Backend Issues

#### MongoDB Connection Error

- Verify MongoDB is running or accessible
- Check `MONGO_URL` in `.env` is correct
- Ensure IP is whitelisted in MongoDB Atlas (if using cloud)

#### Port Already in Use

```bash
# Change the port:
uvicorn server:app --reload --port 8001
```

## Environment Variables

### Backend (.env)

| Variable               | Description                             |
| ---------------------- | --------------------------------------- |
| `MONGO_URL`            | MongoDB connection string               |
| `JWT_SECRET`           | Secret key for JWT token signing        |
| `JWT_ALGORITHM`        | Algorithm for JWT (default: HS256)      |
| `JWT_EXPIRATION_HOURS` | JWT token expiration time (default: 24) |

### Frontend (.env)

| Variable | Description |
| `REACT_APP_API_URL` | Backend API URL |

## Development

### Code Structure

- **Frontend Pages**: React functional components located in `src/pages/`
- **Custom Hooks**: Reusable logic in `src/hooks/`
- **Utilities**: Helper functions in `src/lib/`
- **Backend Routes**: API endpoints defined in `backend/server.py`

### Running Tests

```bash
# Frontend
cd frontend
yarn test

# Backend
cd backend
pytest
```

## Deployment

### Frontend

```bash
# Build production bundle
cd frontend
yarn build

# Deploy the build/ directory to your hosting service
```

### Backend

```bash
# Install production dependencies
pip install -r requirements.txt

# Run with production server (e.g., Gunicorn)
gunicorn -w 4 -k uvicorn.workers.UvicornWorker server:app
```

## License

[Specify your license here]

## Support

For issues or questions, please open an issue in the repository or contact the development team.
