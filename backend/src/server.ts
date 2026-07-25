import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app';
import { User } from './models/User';
import { Lead } from './models/Lead';
import { Note } from './models/Note';
import { Activity } from './models/Activity';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function autoSeed() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('✅ Database already contains data. Skipping auto-seed.');
      return;
    }

    console.log('🌱 Database is empty. Running auto-seed for demo environment...');

    // Create Users
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@crm.com',
      password: 'password123',
      role: 'admin',
    });

    const alice = await User.create({
      name: 'Alice Jones',
      email: 'alice@crm.com',
      password: 'password123',
      role: 'member',
    });

    const bob = await User.create({
      name: 'Bob Miller',
      email: 'bob@crm.com',
      password: 'password123',
      role: 'member',
    });

    // Create Leads
    const lead1 = await Lead.create({
      name: 'John Doe',
      email: 'johndoe@gmail.com',
      phone: '555-0199',
      company: 'Acme Corp',
      status: 'New',
      source: 'Google Search',
    });

    const lead2 = await Lead.create({
      name: 'Sarah Smith',
      email: 'sarah.smith@techflow.io',
      phone: '555-0144',
      company: 'TechFlow Solutions',
      status: 'Contacted',
      source: 'LinkedIn Outreach',
      assignedTo: alice._id,
    });

    const lead3 = await Lead.create({
      name: 'Michael Chang',
      email: 'm.chang@apex.co',
      phone: '555-0177',
      company: 'Apex Trading Group',
      status: 'Qualified',
      source: 'Public Webform',
      assignedTo: alice._id,
    });

    const lead4 = await Lead.create({
      name: 'Emily Davis',
      email: 'emily@davisbuilders.com',
      phone: '555-0112',
      company: 'Davis Builders Ltd',
      status: 'Proposal Sent',
      source: 'Referral',
      assignedTo: bob._id,
    });

    const lead5 = await Lead.create({
      name: 'David Wilson',
      email: 'dwilson@globalventures.com',
      phone: '555-0100',
      company: 'Global Ventures Inc',
      status: 'Won',
      source: 'Direct Website',
      assignedTo: bob._id,
    });

    // Seed Activities
    await Activity.create({
      leadId: lead1._id,
      type: 'created',
      description: 'Lead captured via Public Webform.',
    });

    await Activity.create({
      leadId: lead2._id,
      type: 'created',
      description: 'Lead entered system via LinkedIn.',
    });
    await Activity.create({
      leadId: lead2._id,
      userId: admin._id,
      type: 'assigned',
      description: `Lead assigned to ${alice.name}.`,
    });
    await Activity.create({
      leadId: lead2._id,
      userId: alice._id,
      type: 'status_change',
      description: "Status transitioned from 'New' to 'Contacted'.",
    });

    await Activity.create({
      leadId: lead3._id,
      type: 'created',
      description: 'Lead submitted online web form.',
    });
    await Activity.create({
      leadId: lead3._id,
      userId: admin._id,
      type: 'assigned',
      description: `Lead assigned to ${alice.name}.`,
    });
    await Activity.create({
      leadId: lead3._id,
      userId: alice._id,
      type: 'status_change',
      description: "Status changed to 'Qualified' following discovery call.",
    });

    // Seed Notes
    await Note.create({
      leadId: lead2._id,
      userId: alice._id,
      content: 'Called Sarah. She requested a follow-up email with pricing details.',
    });
    await Activity.create({
      leadId: lead2._id,
      userId: alice._id,
      type: 'note_added',
      description: 'New note added: "Called Sarah..."',
    });

    console.log('✨ Auto-seeding completed successfully.');
  } catch (err) {
    console.error('❌ Auto-seeding failed:', err);
  }
}

async function startServer() {
  let mongoUri = process.env.MONGODB_URI;

  // Smart fallback: if no custom connection string is detected, launch in-memory MongoDB
  if (!mongoUri) {
    console.log('⚠️  No MONGODB_URI detected. Launching automated in-memory MongoDB fallback...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      console.log(`🚀 Temporary in-memory MongoDB launched at: ${mongoUri}`);
    } catch (err) {
      console.error('Failed to start in-memory MongoDB. Defaulting to local connection...', err);
      mongoUri = 'mongodb://127.0.0.1:27017/lead-manager-crm';
    }
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Successfully connected to MongoDB.');
    
    // Run the auto-seeding check
    await autoSeed();

    app.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

startServer();
