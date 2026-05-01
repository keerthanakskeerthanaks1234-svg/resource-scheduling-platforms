# ResourceNode — Distributed Compute Marketplace

## Project Overview
A MERN-based platform where users share or rent compute resources. A Python agent reports node health, a scheduler allocates tasks, and a notebook UI (Zeppelin-style) lets buyers submit and view real execution results.

## Architecture

```
[React Frontend :5000]
       |
       v (proxy /api)
[Node/Express API :3001] ─── [MongoDB Atlas]
       |
       ├── /api/auth       (login, register, roles)
       ├── /api/node       (agent registration, listing)
       ├── /api/resource   (seller shares CPU/RAM)
       ├── /api/task       (buyer submits/executes tasks)
       └── /api/admin      (analytics, logs)
       |
       v (spawns)
[agent.py Flask :5001]    (psutil — CPU/RAM/Battery/Disk)
       |
       v (POST every 30s)
[/api/node/register]      (heartbeat to resource pool)
```

## User Roles

| Role   | Actions |
|--------|---------|
| Seller | Share CPU/RAM/Battery via form → stored in resource pool |
| Buyer  | Use Notebook to write & execute Python code on allocated nodes |
| Admin  | Monitor all nodes, tasks, users, logs in real-time |

## Key Features

### Task Execution Engine (CORE)
- `POST /api/task/execute` — receives Python code + RAM requirement
- Scheduler finds node/resource with sufficient RAM & battery ≥ 15%
- Runs code via Node.js `child_process` (spawn python3 tmpfile)
- 30-second timeout protection
- Stores output in MongoDB, returns result to notebook UI

### Battery Protection (Triple Safety)
1. `agent.py` skips registration if battery < 15%
2. Backend rejects node registration if battery < 15%
3. Frontend disables resource sharing form if battery < 15%

### Node Registration
- `agent.py` runs as Flask server on :5001
- On startup + every 30s: POSTs system info to `/api/node/register`
- Backend upserts node with CPU/RAM/Battery/Storage/hostname
- Nodes marked "offline" after 5 min of no heartbeat

### Zeppelin Notebook
- Python code editor with syntax highlighting
- Configurable RAM requirement
- Real execution via backend (no simulation)
- Task history panel with status tracking
- File upload (.csv, .txt, .json, .py) appended to code
- Download/save output locally

## Tech Stack
- **Frontend**: React 19 + Vite + TailwindCSS + Framer Motion + Recharts
- **Backend**: Node.js + Express 5 + Mongoose
- **Database**: MongoDB Atlas
- **Agent**: Python 3.11 + Flask + psutil
- **Execution**: Node.js child_process (python3)

## Workflows
- `Start application` — Vite dev server on port 5000 (webview)
- `Backend API` — Express server on port 3001 + agent.py on 5001

## File Structure
```
backend/
  server.js           Main Express server + agent spawn
  agent.py            Flask system monitor + node registration
  .env                PORT=3001, JWT_SECRET, MONGO_URI
  controllers/
    authController.js   Register/Login (bcrypt + JWT)
    resourceController.js Seller resource sharing
    taskController.js   Task execution engine (child_process)
    nodeController.js   Node registration + stats
    adminController.js  Full monitoring dashboard
  models/
    User.js     (seller/buyer/admin)
    Resource.js (cpu/ram/battery/status)
    Task.js     (code/output/language/status)
    Node.js     (hostname/cpu/ram/battery/status/lastSeen)
  routes/
    authRoutes.js, resourceRoutes.js, taskRoutes.js,
    nodeRoutes.js, adminRoutes.js

frontend/src/
  App.jsx               Main app, role-based nav, authFetch
  pages/
    Login.jsx           Register/Login (buyer/seller/admin roles)
    Dashboard.jsx       Role dashboard + quick actions
    SellResources.jsx   Seller: share form + active listings
    RentResources.jsx   Buyer: browse available resources
    ZeppelinNotebook.jsx Real Python execution notebook
    MyBookings.jsx      Buyer task history
    Navbar.jsx          Sidebar nav + logout
```

## Data Flow
Agent → Backend → MongoDB → Scheduler → Execution Engine → Output → Notebook UI

## Test Accounts
Register via the UI:
- Admin: role = "Admin"
- Seller: role = "Seller"
- Buyer: role = "Buyer"
