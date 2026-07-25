import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import { User } from '../models/User';
import { Lead } from '../models/Lead';
import { Note } from '../models/Note';
import { Activity } from '../models/Activity';

let mongoServer: MongoMemoryServer;
let adminToken: string;
let member1Token: string;
let member2Token: string;
let member1Id: string;
let member2Id: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Clear data
  await User.deleteMany({});
  await Lead.deleteMany({});
  await Note.deleteMany({});
  await Activity.deleteMany({});

  // Seed Admin
  const adminRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Admin User', email: 'admin@test.com', password: 'password123', role: 'admin' });
  adminToken = adminRes.body.token;

  // Seed Member 1
  const m1Res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Member One', email: 'member1@test.com', password: 'password123', role: 'member' });
  member1Token = m1Res.body.token;
  member1Id = m1Res.body.user.id;

  // Seed Member 2
  const m2Res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Member Two', email: 'member2@test.com', password: 'password123', role: 'member' });
  member2Token = m2Res.body.token;
  member2Id = m2Res.body.user.id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Lead Management CRM API Tests', () => {
  let sharedLeadId: string;

  it('should allow anyone (public) to submit a lead', async () => {
    const res = await request(app)
      .post('/api/leads')
      .send({
        name: 'Public Customer',
        email: 'public@client.com',
        phone: '123-456-7890',
        company: 'Public Ventures',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Public Customer');
    expect(res.body.data.status).toBe('New');
    expect(res.body.data.assignedTo).toBeNull();

    sharedLeadId = res.body.data._id;
  });

  it('should block non-authenticated users from listing leads', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(401);
  });

  it('should allow Admin to see the newly created unassigned lead', async () => {
    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]._id).toBe(sharedLeadId);
  });

  it('should show member 1 zero leads (since none are assigned to them)', async () => {
    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${member1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  it('should allow Admin to assign lead to Member 1', async () => {
    const res = await request(app)
      .put(`/api/leads/${sharedLeadId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignedTo: member1Id });

    expect(res.status).toBe(200);
    expect(res.body.data.assignedTo).toBe(member1Id);

    // Verify activity timeline logged the assignment
    const leadDetails = await request(app)
      .get(`/api/leads/${sharedLeadId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    const activities = leadDetails.body.data.activities;
    expect(activities.some((act: any) => act.type === 'assigned')).toBe(true);
  });

  it('should block Member 1 from reassigning the lead', async () => {
    const res = await request(app)
      .put(`/api/leads/${sharedLeadId}/assign`)
      .set('Authorization', `Bearer ${member1Token}`)
      .send({ assignedTo: member2Id });

    expect(res.status).toBe(403); // Forbidden for members
  });

  it('should allow Member 1 to see the lead now that it is assigned to them', async () => {
    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${member1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]._id).toBe(sharedLeadId);
  });

  it('should deny Member 2 access to Member 1s lead', async () => {
    const res = await request(app)
      .get(`/api/leads/${sharedLeadId}`)
      .set('Authorization', `Bearer={some_mock_token}`) // Using direct invalid check
      .set('Authorization', `Bearer ${member2Token}`);

    expect(res.status).toBe(403);
  });

  it('should allow Member 1 to update lead status and add notes', async () => {
    const updateRes = await request(app)
      .put(`/api/leads/${sharedLeadId}`)
      .set('Authorization', `Bearer ${member1Token}`)
      .send({ status: 'Contacted' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe('Contacted');

    const noteRes = await request(app)
      .post(`/api/leads/${sharedLeadId}/notes`)
      .set('Authorization', `Bearer ${member1Token}`)
      .send({ content: 'Had a quick phone call, positive response.' });

    expect(noteRes.status).toBe(201);
    expect(noteRes.body.data.content).toContain('phone call');

    const detailsRes = await request(app)
      .get(`/api/leads/${sharedLeadId}`)
      .set('Authorization', `Bearer ${member1Token}`);

    expect(detailsRes.body.data.notes.length).toBe(1);
    expect(detailsRes.body.data.activities.some((act: any) => act.type === 'status_change')).toBe(true);
    expect(detailsRes.body.data.activities.some((act: any) => act.type === 'note_added')).toBe(true);
  });
});
