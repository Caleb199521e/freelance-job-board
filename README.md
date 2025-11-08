# GhanaFreelance - Freelance Job Board

A full-stack freelance marketplace platform connecting Ghanaian freelancers with clients. Built with Node.js, Express, MongoDB, and vanilla JavaScript.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### For Freelancers
- Create professional profiles with skills and portfolio
- Browse and search available jobs by category, location, and budget
- Submit proposals with cover letters and bid amounts
- Track proposal status (pending, accepted, rejected)
- View proposal statistics and acceptance rates

### For Clients
- Post job opportunities with detailed requirements
- Receive and review proposals from freelancers
- Accept/reject proposals
- Manage posted jobs (edit, close, complete)
- View freelancer profiles and skills

### Platform Features
- JWT-based authentication and authorization
- Role-based access control (freelancer vs client)
- Real-time job filtering and search
- Responsive design with Tailwind CSS
- Secure password hashing with bcrypt
- MongoDB database with Mongoose ODM

## 🛠 Tech Stack

### Backend
- **Node.js** with ES modules
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment configuration

### Frontend
- **Vanilla JavaScript** (ES6+)
- **Tailwind CSS** - Styling
- **Font Awesome** - Icons
- **live-server** - Development server

### DevOps
- **nodemon** - Auto-restart backend
- **concurrently** - Run multiple scripts

## 📁 Project Structure

```
freelance-job-board/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection & utilities
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── models/
│   │   ├── Job.js               # Job schema with embedded proposals
│   │   └── User.js              # User schema (freelancer/client)
│   ├── routes/
│   │   ├── auth.js              # Signup/login endpoints
│   │   ├── jobs.js              # Job CRUD & filtering
│   │   └── proposals.js         # Proposal submission & management
│   ├── utils/
│   │   └── dbStatus.js          # Database health check utilities
│   └── server.js                # Express app setup & startup
├── frontend/
│   ├── css/
│   │   └── custom.css           # Custom styles
│   ├── js/
│   │   ├── config.js            # API base URL configuration
│   │   ├── auth.js              # Auth utilities & navbar
│   │   ├── main.js              # API client & job cards
│   │   ├── dashboard.js         # Dashboard logic
│   │   └── job.js               # Job detail & proposals
│   ├── index.html               # Homepage
│   ├── login.html               # Login page
│   ├── signup.html              # Signup page
│   ├── dashboard.html           # User dashboard
│   ├── job.html                 # Job detail page
│   ├── post-job.html            # Post job form
│   └── profile.html             # User profile
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json
├── tailwind.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
```powershell
git clone <repository-url>
cd freelance-job-board
```

2. **Install dependencies**
```powershell
npm install
```

3. **Environment variables**

The `.env` file is already configured with:
```env
MONGODB_URI=mongodb://localhost:27017/freelance-job-board
JWT_SECRET=<secure-key-already-set>
PORT=5000
NODE_ENV=development
```

No additional configuration needed. For production, update `MONGODB_URI` to your MongoDB Atlas connection string if needed.

4. **Start MongoDB** (if using local MongoDB)

```powershell
# Check if MongoDB service is running
Get-Service -Name MongoDB

# Start MongoDB service if stopped
net start MongoDB
```

For MongoDB Atlas, update `MONGODB_URI` in `.env` with your connection string.

5. **Start the development servers**

```powershell
# Start both backend and frontend
npm run dev

# Or start separately:
# Terminal 1 - Backend
npm run backend

# Terminal 2 - Frontend
npm run frontend
```

6. **Open the application**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 💻 Development

### Available Scripts

```powershell
# Run both backend and frontend concurrently
npm run dev

# Run backend only (with auto-restart)
npm run backend

# Run frontend only (live-server)
npm run frontend

# Run backend in production mode
npm start

# Database utilities
npm run db:status      # Check database connection status
npm run db:health      # Run health check
npm run generate-secret # Generate JWT secret
```

### Frontend Configuration

The frontend API base URL is configured in `frontend/js/config.js`:

```javascript
window.API_BASE = window.__API_BASE__ || 'http://localhost:5000/api';
```

To override in production, set `window.__API_BASE__` before loading config.js.

### Backend Configuration

The backend supports the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/freelance-job-board` |
| `JWT_SECRET` | Secret for JWT signing | `your-secret-key` |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:3000` |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |

### CORS Configuration

The backend automatically accepts requests from:
- Any localhost/127.0.0.1/[::1] origin on any port (development)
- The exact `CLIENT_URL` if specified

This allows using different dev servers (live-server, VS Code Live Server, etc.) without CORS issues.

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login and get JWT token

### Jobs
- `GET /api/jobs` - Get all jobs (with filters & pagination)
- `GET /api/jobs/:id` - Get single job by ID
- `POST /api/jobs` - Create new job (clients only, auth required)
- `PUT /api/jobs/:id` - Update job (owner only)
- `DELETE /api/jobs/:id` - Delete job (owner only)
- `PATCH /api/jobs/:id/status` - Update job status
- `GET /api/jobs/categories` - Get job categories with counts
- `GET /api/jobs/similar/:id` - Get similar jobs
- `GET /api/jobs/client/my-jobs` - Get client's posted jobs

### Proposals
- `POST /api/jobs/:id/proposals` - Submit proposal (freelancers only)
- `GET /api/jobs/:id/proposals` - Get job proposals (owner only)
- `GET /api/proposals/my-proposals` - Get freelancer's proposals
- `PATCH /api/jobs/:jobId/proposals/:proposalId/status` - Accept/reject proposal
- `DELETE /api/jobs/:jobId/proposals/:proposalId` - Withdraw proposal
- `GET /api/proposals/stats` - Get proposal statistics
- `GET /api/proposals/:proposalId` - Get single proposal

### System
- `GET /api/health` - Health check with database status
- `GET /api/database/info` - Database info (development only)

## 🔧 Troubleshooting

### Backend won't start

**Problem**: `npm run backend` exits immediately without error messages.

**Solution**: The server may be failing to connect to MongoDB. Check:
```powershell
# Test MongoDB connection
Test-NetConnection -ComputerName localhost -Port 27017

# Check MongoDB service
Get-Service -Name MongoDB

# Run server directly to see error output
node backend/server.js
```

### CORS errors in browser

**Problem**: "Access to fetch... has been blocked by CORS policy"

**Solution**: 
1. Ensure backend is running on port 5000
2. Check that `CLIENT_URL` in `.env` matches your frontend origin
3. The backend now accepts localhost/127.0.0.1 on any port in development

### Login page keeps reloading

**Problem**: Login page refreshes infinitely.

**Solution**: This is now fixed. The auth check no longer redirects when already on public pages (login, signup, index).

### Cannot GET /dashboard.html (404)

**Problem**: Clicking links results in 404 errors.

**Solution**: 
1. Ensure frontend server is running: `npm run frontend`
2. Access pages via the frontend server URL (e.g., http://localhost:3000/dashboard.html)
3. All links are now relative and should work regardless of host/port

### Signup/login requests fail with ERR_CONNECTION_REFUSED

**Problem**: Frontend can't reach backend API.

**Solution**:
1. Start backend: `npm run backend`
2. Verify backend is listening: `Invoke-RestMethod http://localhost:5000/api/health`
3. Check that `API_BASE` in frontend matches backend URL

### Database connection errors

**Problem**: "MongoDB connection error" or "Failed to start server"

**Solutions**:

**For local MongoDB:**
```powershell
# Start MongoDB service
net start MongoDB

# Or install MongoDB if not present
# Download from https://www.mongodb.com/try/download/community
```

**For MongoDB Atlas:**
1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Get your connection string
3. Update `MONGODB_URI` in `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freelance-job-board
```

### Port conflicts

**Problem**: "Port 5000 already in use" or "Port 3000 already in use"

**Solution**:
```powershell
# Find process using port 5000
netstat -ano | Select-String ":5000"

# Kill process by PID
taskkill /PID <process-id> /F

# Or change ports in .env and package.json
```

## 🎯 Development Tips

1. **Use the health endpoint** to verify backend is running:
   ```powershell
   Invoke-RestMethod http://localhost:5000/api/health
   ```

2. **Check database status** from the command line:
   ```powershell
   npm run db:health
   ```

3. **Generate secure JWT secrets** for production:
   ```powershell
   npm run generate-secret
   ```

4. **Monitor backend logs** - nodemon shows all requests and errors in real-time

5. **Use browser DevTools** - Network tab shows API requests, Console shows client errors

## 🔐 Security Notes

- Never commit `.env` file to version control
- Use strong JWT secrets in production (64+ character random string)
- Set `NODE_ENV=production` in production
- Set `CLIENT_URL` to exact frontend domain in production
- Keep dependencies updated: `npm audit` and `npm update`

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for the Ghanaian freelance community**
