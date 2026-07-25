import express from 'express';
import cors from 'cors';
import { register, login, getMe } from './controllers/authController';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  assignLead,
  addNote,
} from './controllers/leadController';
import { getUsers } from './controllers/userController';
import { requireAuth, requireRole } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middlewares
app.use(cors({ origin: '*' })); // Allow cross-origin requests from frontends
app.use(express.json());

// Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to HeroCRM API Gateway.',
    version: '1.0.0',
    status: 'online',
  });
});

// API Base Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, status: 'healthy', timestamp: new Date() });
});

// Authentication Routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/me', requireAuth, getMe);

// Lead Routes
// Note: POST /api/leads is public capture form (no auth required) or auth-based
app.post('/api/leads', (req, res, next) => {
  // If authorization header exists, authenticate it, otherwise allow public
  if (req.headers.authorization) {
    requireAuth(req, res, next);
  } else {
    next();
  }
}, createLead);

app.get('/api/leads', requireAuth, getLeads);
app.get('/api/leads/:id', requireAuth, getLeadById);
app.put('/api/leads/:id', requireAuth, updateLead);
app.put('/api/leads/:id/assign', requireAuth, requireRole(['admin']), assignLead);
app.post('/api/leads/:id/notes', requireAuth, addNote);

// User Routes
app.get('/api/users', requireAuth, getUsers);

// Catch-all 404 Route
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API Endpoint not found.' });
});

// Error Middleware
app.use(errorHandler);

export default app;
