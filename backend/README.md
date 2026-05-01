## Resource Scheduling Backend (Prototype)

### Setup

```bash
cd backend
npm install
npm run dev
```

### Auth

- Register: `POST /api/auth/register`
- Login: `POST /api/auth/login` (returns `token`)

Use:

`Authorization: Bearer <token>`

### Role-protected APIs

- Seller share resource: `POST /api/resource/share` (role: `seller`)
- Buyer request resource: `POST /api/task/request` (role: `buyer`)
- Admin dashboard: `GET /api/admin/dashboard` (role: `admin`)

