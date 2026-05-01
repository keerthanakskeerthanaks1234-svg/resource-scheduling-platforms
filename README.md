# ResourceNode — Resource scheduling platform

A MERN-based app where **sellers** share compute (CPU/RAM), **buyers** request resources and run tasks in a notebook UI, and **admins** monitor nodes, users, tasks, logs, analytics, and **seller listings** (including **Stop sharing** so listings disappear from buyers’ Request Resources).

## Prerequisites

- **Node.js** 18+ and npm  
- **Python** 3.11+ (`python` on PATH; on Linux/macOS you can set `PYTHON_BIN=python3`)  
- **MongoDB** (e.g. MongoDB Atlas)

## Environment (`backend/.env`)

Copy or create `backend/.env` (this file is gitignored):

| Variable | Example | Purpose |
|----------|---------|---------|
| `PORT` | `3001` | Express API port |
| `JWT_SECRET` | strong random string | JWT signing |
| `MONGO_URI` | `mongodb+srv://...` | Database |
| `CORS_ORIGIN` | `http://localhost:5000,http://localhost:5173` | Allowed browser origins |
| `AGENT_PORT` | `5001` | Python agent HTTP port |
| `BACKEND_URL` | `http://127.0.0.1:3001` | Where `agent.py` POSTs node registration |
| `PYTHON_BIN` | `python` or `python3` | Python used for task execution (optional) |

## Install (Windows, macOS, Linux)

```bash
# Backend
cd backend
npm install
pip install -r requirements.txt

# Frontend (new terminal or after backend)
cd ../frontend
npm install
```

## Run locally (no Replit)

Use **two terminals** from the project root.

**Terminal 1 — API + agent**

```bash
cd backend
npm run dev
```

This starts Express on `http://localhost:3001` (or `PORT`) and spawns `agent.py` on `AGENT_PORT` (default `5001`) for system metrics and node heartbeat.

**Terminal 2 — frontend**

```bash
cd frontend
npm run dev
```

Vite serves the UI (default `http://localhost:5000` per `vite.config.js`) and **proxies** `/api` to `http://localhost:3001`.

Open **http://localhost:5000** in your browser.

## Architecture (short)

```
[React + Vite :5000]  --proxy /api-->  [Express :3001]  -->  [MongoDB]
                                              |
                                              +--> spawns agent.py :5001
```

Key API groups: `/api/auth`, `/api/resource`, `/api/task`, `/api/node`, `/api/admin`.

## Roles & test accounts

Register in the UI with the desired role, or use a seeded admin if you have one in your database.

| Role | Typical use |
|------|-------------|
| **Admin** | Dashboard, nodes, **Resources** (stop/resume/delete seller listings), users, tasks, logs, analytics |
| **Seller** | Share CPU/RAM listings |
| **Buyer** | Request Resources, Notebook, My Tasks |

## Admin: stop seller sharing

In **Admin → Resources**, use **Stop sharing** on a listing. Its status becomes `stopped` and it is **no longer returned** by `GET /api/resource/available`, so it does not appear under the buyer’s **Request Resources**. **Resume** makes it visible again; **Delete** removes the document (not allowed while the listing is `busy`).

## Production notes

- Set a strong `JWT_SECRET` and restrict `CORS_ORIGIN` to your real frontend URL(s).  
- Ensure the machine running the backend has **Python** available if buyers execute code in the notebook.  
- Build the frontend: `cd frontend && npm run build` — serve `frontend/dist` with a static host or integrate with Express as you prefer.
