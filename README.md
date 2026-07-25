# HeroCRM: Lead Management System

A production-grade, full-stack Lead Management System built for the Digital Heroes Qualification Task (Role 04). Featuring a public ingestion web form, JWT authentication, role-based authorization (Admin vs. Member), paginated search/filter lead pipelines, note tracking, and activity audit trails.

---

## Workspace Layout
```
/
├── backend/             # Express & MongoDB API
│   ├── src/
│   │   ├── controllers/ # HTTP Route Handlers
│   │   ├── middleware/  # Auth checking and Global Error handlers
│   │   ├── models/      # Mongoose Schema Definitions (User, Lead, Note, Activity)
│   │   ├── tests/       # API Integration Testing Suites (Vitest + Supertest)
│   │   └── seed.ts      # Database Initial Population Script
│   └── package.json
│
├── frontend/            # Vite + React Client
│   ├── src/
│   │   ├── api/         # Axios Interceptor Client Configuration
│   │   ├── components/  # Navbars, Footers, and Route Protections
│   │   ├── context/     # React Global Auth State Context
│   │   └── pages/       # Layout Views (Dashboards, Details, Forms)
│   └── package.json
│
└── docs/                # Task B Governance & Strategy Documentation
    ├── ASSESSMENT_DOCUMENT.md
    ├── MIGRATION_PLAN.md
    ├── CONCRETE_REFACTOR.md
    └── ENGINEERING_STANDARDS.md
```

---

## Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) running locally or a MongoDB Atlas connection string.

### 2. Environment Configurations

#### Backend (`/backend/.env`)
Create a `.env` file in the `/backend` folder:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/lead-manager-crm
JWT_SECRET=super_secret_signing_key_for_security_compliance
JWT_EXPIRES_IN=1d
NODE_ENV=development
```

#### Frontend (`/frontend/.env`)
Create a `.env` file in the `/frontend` folder:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Installation & Database Seeding

Open two terminal terminals, or execute sequentially:

#### Setup Backend:
```bash
cd backend
npm install
npm run seed     # Pre-populates the database with sample data
npm run dev      # Launches dev server on http://localhost:5000
```

#### Setup Frontend:
```bash
cd frontend
npm install
npm run dev      # Launches Vite dev server on http://localhost:3000
```

---

## Demo Credentials (Seeded Data)

Log in via the interface on [http://localhost:3000/login](http://localhost:3000/login) using these credentials:

| Email | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| **admin@crm.com** | `password123` | `admin` | Full CRM access, lead assignment capabilities, and global stats tracking. |
| **alice@crm.com** | `password123` | `member` | Access is restricted to leads explicitly assigned to Alice. |
| **bob@crm.com** | `password123` | `member` | Access is restricted to leads explicitly assigned to Bob. |

---

## API Endpoints Documentation

All requests return headers configured for JSON payloads (`Content-Type: application/json`).

### 1. Authentication Endpoints

#### Register a New Account
- **Route**: `POST /api/auth/register`
- **Auth**: Public
- **Payload**:
  ```json
  {
    "name": "Alex Smith",
    "email": "alex@crm.com",
    "password": "password123",
    "role": "member"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "id": "603d2e...",
      "name": "Alex Smith",
      "email": "alex@crm.com",
      "role": "member"
    }
  }
  ```

#### Authenticate & Login
- **Route**: `POST /api/auth/login`
- **Auth**: Public
- **Payload**:
  ```json
  {
    "email": "admin@crm.com",
    "password": "password123"
  }
  ```
- **Success Response (200 OK)**: Returns a JWT token to be stored by the client and sent in `Authorization: Bearer <token>` headers.

#### Fetch Authenticated Session User
- **Route**: `GET /api/auth/me`
- **Auth**: Bearer Token
- **Success Response (200 OK)**: Returns the verified user's profile metadata.

---

### 2. Lead Management Endpoints

#### Ingest a Lead (Public Form Submission)
- **Route**: `POST /api/leads`
- **Auth**: Public OR Authenticated (Optional)
- **Payload**:
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@acme.com",
    "phone": "555-0102",
    "company": "Acme Corp"
  }
  ```
- **Success Response (201 Created)**: Logs the submission, appends a `created` activity timeline event, and returns the DB model representation.

#### List Leads (Paginated, Filtered, Searched)
- **Route**: `GET /api/leads`
- **Auth**: Bearer Token
- **Query Params**:
  - `page` (number, default: `1`)
  - `limit` (number, default: `10`)
  - `search` (string, filters name/email/company by regex)
  - `status` (string, matches exact enum state)
  - `assignedTo` (string, matches assignee ID or `'unassigned'`)
  - `sortBy` (string, default: `'createdAt'`)
  - `sortOrder` (string: `'asc'` or `'desc'`)
- **Behavior**: Admins view all records matching parameters. Members are hard-scoped to only receive leads assigned to their User ID, regardless of criteria sent.

#### Fetch Specific Lead
- **Route**: `GET /api/leads/:id`
- **Auth**: Bearer Token
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "lead": { ... },
      "notes": [ ... ],
      "activities": [ ... ]
    }
  }
  ```

#### Update Lead Details & Status
- **Route**: `PUT /api/leads/:id`
- **Auth**: Bearer Token (Members can only update their assigned leads)
- **Payload**:
  ```json
  {
    "status": "Qualified",
    "company": "Acme Solutions Ltd"
  }
  ```
- **Success Response (200 OK)**: Updates values, logs status transformations or profile changes in the `Activity` schema.

#### Assign Lead Owner (Admin Only)
- **Route**: `PUT /api/leads/:id/assign`
- **Auth**: Bearer Token + Role must be `admin`
- **Payload**:
  ```json
  {
    "assignedTo": "603d2e..."
  }
  ```

#### Append Client Note
- **Route**: `POST /api/leads/:id/notes`
- **Auth**: Bearer Token (Members can only annotate their assigned leads)
- **Payload**:
  ```json
  {
    "content": "Followed up. Sent over corporate slide decks."
  }
  ```

---

### 3. User Directories Endpoints

#### List User Directory
- **Route**: `GET /api/users`
- **Auth**: Bearer Token
- **Success Response (200 OK)**: Returns names, emails, and roles of registered CRM members (useful for compiling assignee dropdown UI).

---

## Running Test Suites

Backend endpoint integrity is validated through integration testing using **Vitest** and **Supertest** which connect to a temporary local test database (`crm-test`).

```bash
cd backend
npm run test
```

---

## Deployment Guidelines

### Backend (Render Deployment)
1. Register on [Render.com](https://render.com) and deploy a new **Web Service**.
2. Link your Git repository and set Build Command to `npm run build` and Start Command to `npm start`.
3. In the Render Environmental settings tab, set the values matching those in your backend configuration (`MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`).

### Database (MongoDB Atlas)
1. Spin up a free shared tier database on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. whitelist inbound connections from any host (`0.0.0.0/0`) to allow Render nodes to connect.
3. Grab the connection string format (`mongodb+srv://...`) and supply it as the `MONGODB_URI` environment variable on Render.

### Frontend (Vercel Deployment)
1. Deploy a new project on [Vercel](https://vercel.com).
2. Configure environment variables in Vercel settings, mapping `VITE_API_URL` to your production backend URI (e.g. `https://crm-api.onrender.com/api`).
3. Vercel automatically detects the Vite configuration and builds the static assets securely.

---

## AI Usage Statement

We utilized Gemini 3.5 Flash to accelerate the development of backend schemas, test configurations, and Tailwind styling foundations. Post-generation, we manually refactored the database bootstrap connection to support dynamic in-memory database execution, removed redundant icon imports to comply with strict TS compilation flags, and removed all generic AI demo templates from the client panels to ensure a polished human-designed corporate look.
