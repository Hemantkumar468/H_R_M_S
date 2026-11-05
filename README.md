# HRMS Enterprise Monorepo

Production-ready Human Resource Management System (HRMS) built as a modular enterprise monorepo with strict separation of frontend and backend.

## Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui design tokens, React Hook Form + Zod, TanStack Query, Recharts, Lucide Icons, PWA Support.
- **Backend**: Node.js, Express.js, TypeScript, Mongoose (MongoDB Atlas), Winston Logger, Helmet, CORS, Express Rate Limit, Cookie Parser.
- **Database**: MongoDB Atlas only.
- **Architecture**: Monorepo with npm workspaces (`packages/shared`, `backend`, `frontend`).
- **Auth & RBAC**: JWT Access & Refresh Token rotation in httpOnly secure cookies, bcrypt, granular permission & role enforcement.
- **Deployment**: Backend on Render (Web Service), Frontend on Vercel.

---

## Monorepo Directory Structure

```
hrms/
├── backend/                 # Express + TypeScript REST API
│   ├── src/
│   │   ├── config/          # Environment & Database config, Winston logger
│   │   ├── controllers/     # Route controllers
│   │   ├── middlewares/     # Error, notFound, requestLogger, auth middlewares
│   │   ├── models/          # Mongoose data models
│   │   ├── routes/          # Express API routes (/api/v1)
│   │   ├── services/        # Business logic services
│   │   ├── utils/           # AppError, asyncHandler, response formatting
│   │   ├── validators/      # Zod input validation schemas
│   │   ├── app.ts           # Express app setup
│   │   └── server.ts        # Server entry point & graceful shutdown
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # Next.js App Router (Mobile-First)
│   ├── public/              # Static assets, PWA manifest.json, sw.js
│   ├── src/
│   │   ├── app/             # App Router pages and layouts
│   │   ├── components/      # UI primitives & feature components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Shared client utilities
│   │   ├── services/        # Axios API client & endpoints
│   │   ├── store/           # Client stores
│   │   └── types/           # Client type definitions
│   ├── .env.example
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── package.json
│   └── tsconfig.json
├── packages/
│   └── shared/              # Common TypeScript definitions, enums & schemas
│       ├── src/
│       │   ├── common.ts    # Status enums, pagination schemas, API response types
│       │   ├── roles.ts     # User roles (Super Admin, HR Admin, Manager, Employee) & RBAC
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── render.yaml              # Render blueprint deployment configuration
├── DEPLOYMENT.md            # Complete deployment guide for Render & Vercel
├── package.json             # Monorepo root scripts & dev dependencies
└── README.md
```

---

## Getting Started

### 1. Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Database**: MongoDB Atlas cluster

### 2. Environment Setup

Both backend and frontend have `.env.example` templates:

```bash
# Backend (.env)
cp backend/.env.example backend/.env

# Frontend (.env.local)
cp frontend/.env.example frontend/.env.local
```

### 3. Installation

From the root repository:

```bash
npm install
```

### 4. Build Shared Package

```bash
npm run build:shared
```

### 5. Running in Development

Run both backend and frontend concurrently:

```bash
npm run dev
```

Or run individually:

- Backend: `npm run dev:backend` (runs on http://localhost:5000)
- Frontend: `npm run dev:frontend` (runs on http://localhost:3000)

### 6. Health Check

Verify backend connectivity:

```bash
curl http://localhost:5000/api/v1/health
```

### 7. Deployment

For detailed production deployment instructions (Backend on Render, Frontend on Vercel, MongoDB Atlas):
See [DEPLOYMENT.md](file:///D:/Hrms/DEPLOYMENT.md).
