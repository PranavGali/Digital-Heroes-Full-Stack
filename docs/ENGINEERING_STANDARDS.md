# Engineering Standards & Governance Guidelines

This document defines the architecture patterns, directory structures, naming conventions, version control policies, testing protocols, security guidelines, and system monitoring benchmarks. It also includes strategies to align a development team around these standards.

---

## 1. Architectural Blueprint & Structure

We enforce a modular, layered clean architecture. Codebases are divided by responsibility:

```
  ┌─────────────────────────────────────────────────────────┐
  │                   Vite/React Client                     │
  └────────────────────────────┬────────────────────────────┘
                               │ HTTP / JSON
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │                 Express REST API Router                 │
  └────────────────────────────┬────────────────────────────┘
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │                 Zod Validation Shield                   │
  └────────────────────────────┬────────────────────────────┘
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │                Business Service Layer                   │
  └────────────────────────────┬────────────────────────────┘
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │           Mongoose Schema / MongoDB Database            │
  └─────────────────────────────────────────────────────────┘
```

### Folder Structure Convention

#### Backend Layout
```
/backend
├── src/
│   ├── config/          # DB config, environment validation
│   ├── controllers/     # Deserialization and HTTP responses
│   ├── middleware/      # Authentication, role guarding, CORS, error handling
│   ├── models/          # Mongoose database schemas
│   ├── routes/          # Express routing mounts
│   ├── services/        # Pure core business logic, side-effects
│   ├── tests/           # Integration and unit tests
│   ├── types/           # TS declaration overrides
│   ├── validators/      # Zod validation schemas
│   ├── app.ts           # Express server bootstrap
│   └── server.ts        # Database connection and startup listener
├── package.json
└── tsconfig.json
```

#### Frontend Layout
```
/frontend
├── src/
│   ├── api/             # Axios instance, request/response models
│   ├── components/      # Global shared UI elements (Buttons, Navbar, Footer)
│   ├── context/         # Auth, global theme, notification providers
│   ├── hooks/           # Custom reusable React hooks
│   ├── layouts/         # Layout shells (Dashboard shell, auth shell)
│   ├── pages/           # Page routes (Dashboard, Login, Details)
│   ├── index.css        # Global Tailwind stylesheets
│   ├── main.tsx         # React root initialization
│   └── vite-env.d.ts
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## 2. Naming & Code Style Conventions

### Naming Schemes
- **Files & Folders**: 
  - React Components/Pages: PascalCase (e.g. `PublicLeadForm.tsx`).
  - Backend controllers, models, services, and middlewares: camelCase (e.g. `leadController.ts`, `authMiddleware.ts`).
  - Database models: PascalCase singular (e.g. `Lead.ts`, `User.ts`).
- **Classes**: PascalCase (e.g. `LeadService`).
- **Interfaces & Types**: PascalCase, prefixed with `I` for Mongoose documents (e.g. `ILead`).
- **Functions & Variables**: camelCase (e.g. `createLead`, `isValidId`).
- **Environment Variables**: UPPERCASE_SNAKE_CASE (e.g. `MONGODB_URI`, `JWT_SECRET`).

### Code Style
- **TypeScript**: Mandatory strict mode (`"strict": true`). No usage of `any` types.
- **ESLint & Prettier**: Automated linting rules run on commit (via Husky + lint-staged). Single quotes, semi-colons, and 2-space indentation are standard.

---

## 3. Git Workflow & PR Reviews

We adopt a strict **Git Flow** variant:

1. **Branch Naming**:
   - Features: `feat/issue-number-short-description` (e.g. `feat/102-jwt-auth`)
   - Bugfixes: `fix/issue-number-short-description` (e.g. `fix/99-cors-error`)
   - Hotfixes: `hotfix/short-description`
2. **Pull Request (PR) Requirements**:
   - All PRs must target `main` (or `develop`) and must build without errors.
   - Requires at least 1 peer approval before merge.
   - 100% of pipeline tests must pass.
3. **PR Review Protocol**:
   - Focus reviews on architectural correctness, security vulnerabilities (no leaked tokens, sql injections), test coverage, and clarity.
   - Use constructive feedback tags: `[Nit]`, `[Chore]`, `[Blocker]`.

---

## 4. Testing & CI/CD Pipelines

- **Test Suite Strategy**:
  - Unit tests: Validate utilities, validations, and helpers.
  - Integration tests: Validate full API round-trips (Router -> Middleware -> Service -> Mock DB) using Vitest + Supertest.
  - UI Testing: Automated end-to-end user flows validated via Playwright/Cypress.
- **CI/CD Integration**:
  - On push: Build checks, lint checks, and test runner execute.
  - On merge: Deploy staging/production.
  - Production deployments use automated health-check endpoints. If a health check fails, the deployment is automatically rolled back.

---

## 5. Security & Secrets Management

- **Environment Isolation**: Never commit `.env` files to Git. Add `.env` to `.gitignore`.
- **Production Secrets**: Injected directly into the deployment platforms (Vercel env dashboard for frontend, Render env variables dashboard for backend).
- **Token Security**: Store JWTs in secure cookies (`httpOnly`, `secure`, `sameSite: strict`) where possible to prevent XSS. For token exchanges, use short-lived JWT access tokens and long-lived refresh tokens.
- **Data Protection**: Enforce HTTPS only, CORS whitelists, and Helmet.js headers. Hash passwords using `bcrypt` (10 rounds).

---

## 6. Observability: Logging & Monitoring

- **Logging Level**: Use a structured logging library like `winston` or `pino` to write logs in JSON format to stdout, separating `debug`, `info`, `warn`, and `error` levels.
- **Error Tracking**: Integrate Sentry or Datadog to capture uncaught runtime exceptions in real time.
- **APM & Performance Metrics**: Monitor server latency, CPU utilization, database connection pool exhaustion, and memory leaks.

---

## 7. Strategy: Aligning a Resistant Team

When rolling out these standards to a team resistant to change, we avoid top-down mandates, which foster resentment. Instead, we use a collaborative adoption strategy:

1. **Establish the "Why" (Empathy first)**: Frame standards not as rules to police engineers, but as safety shields that prevent production outages, reduce night-time page duties, and accelerate developers' daily feedback loops.
2. **Build Automation, Remove Friction**: If a developer has to run 5 manual commands to check linting, they won't do it. Build these checks into Husky pre-commit hooks, automatic editor format-on-save configurations, and CI gates. The system does the policing, not the tech lead.
3. **Pioneer by Example (The RFC Path)**: Before changing a standard, author a light "Request for Comments" (RFC) document. Allow team members to debate, comment, and suggest edits. Make them feel like co-authors of the standards.
4. **Gradual Adoption Strategy**: Don't force a rewrite of the entire codebase overnight. Introduce new standards to *new files only* first, using tools like ESLint to warn on legacy files and error on new ones. Refactor old code gradually during scheduled tech-debt tasks.
