# FleetTrack 🚛

Full-stack fleet management app with a React PWA frontend and Node/Express + PostgreSQL backend.

## Stack
- Frontend: React 18 + Vite + React Router v6 + Tailwind CSS + PWA manifest/service worker
- Backend: Node.js + Express + JWT + Sequelize
- Database: PostgreSQL
- OCR/Camera: Tesseract.js + react-webcam (`facingMode: "environment"`)

## Project structure
- `client/` React app
- `server/` Express API

## Setup
### 1) Install dependencies
```bash
cd client && npm install
cd ../server && npm install
```

### 2) Configure env
Copy `server/.env.example` to `server/.env` and update values:
- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`
- `CORS_ORIGINS` (comma-separated, defaults to `http://localhost:5173`)

### 3) Start PostgreSQL
Create DB named `fleettrack` and ensure `DATABASE_URL` points to it.

### 4) Seed data
```bash
cd server
npm run seed
```
Seeded users (password: `password123`):
- `admin@fleet.com`
- `manager@fleet.com`
- `john@fleet.com`
- `mary@fleet.com`

### 5) Run backend
```bash
cd server
npm run dev
```
API runs on `http://localhost:3000`.

### 6) Run frontend
```bash
cd client
npm run dev
```
Frontend runs on `http://localhost:5173`.

## API response format
- Success: `{ "success": true, "data": {} }`
- Error: `{ "success": false, "message": "..." }`

## Main endpoints
- `POST /api/auth/login`
- `GET /api/vehicles`
- `GET /api/vehicles/:id`
- `POST /api/vehicles` (admin only)
- `GET /api/vehicles/search?plate=ABC123`
- `POST /api/trips/scan-vehicle`
- `POST /api/trips/start`
- `PUT /api/trips/:id/end`
- `GET /api/trips?driverId=x`
- `GET /api/trips/:id`
- `GET /api/bookings?date=YYYY-MM-DD`
- `POST /api/bookings`
