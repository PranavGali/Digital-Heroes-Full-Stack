import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';
import { Lead } from './models/Lead';
import { Note } from './models/Note';
import { Activity } from './models/Activity';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lead-manager-crm';

const seed = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('Database connected.');

    // Clear collections
    console.log('Purging legacy data...');
    await User.deleteMany({});
    await Lead.deleteMany({});
    await Note.deleteMany({});
    await Activity.deleteMany({});
    console.log('Collections cleared.');

    // Create Users
    console.log('Seeding users...');
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

    console.log('Users created:');
    console.log(`- Admin: ${admin.email} (pass: password123)`);
    console.log(`- Member: ${alice.email} (pass: password123)`);
    console.log(`- Member: ${bob.email} (pass: password123)`);

    // Create Leads
    console.log('Seeding leads...');
    const lead1 = await Lead.create({
      name: 'John Doe',
      email: 'johndoe@gmail.com',
      phone: '555-0199',
      company: 'Acme Corp',
      status: 'New',
      source: 'Google Search',
      assignedTo: undefined,
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

    const lead6 = await Lead.create({
      name: 'Jessica Taylor',
      email: 'j.taylor@retailpulse.org',
      phone: '555-0188',
      company: 'RetailPulse',
      status: 'Lost',
      source: 'Cold Call',
      assignedTo: alice._id,
    });

    console.log('Leads created.');

    // Seed Activities for Leads
    console.log('Seeding activities...');
    // Lead 1: New
    await Activity.create({
      leadId: lead1._id,
      type: 'created',
      description: 'Lead captured via Public Webform.',
    });

    // Lead 2: Contacted (Alice assigned)
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

    // Lead 3: Qualified (Alice assigned, with notes)
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

    // Lead 4: Proposal Sent (Bob assigned)
    await Activity.create({
      leadId: lead4._id,
      type: 'created',
      description: 'Lead registered.',
    });
    await Activity.create({
      leadId: lead4._id,
      userId: admin._id,
      type: 'assigned',
      description: `Lead assigned to ${bob.name}.`,
    });
    await Activity.create({
      leadId: lead4._id,
      userId: bob._id,
      type: 'status_change',
      description: "Status changed to 'Proposal Sent' - pricing document dispatched.",
    });

    // Lead 5: Won (Bob assigned)
    await Activity.create({
      leadId: lead5._id,
      type: 'created',
      description: 'Inbound submission received.',
    });
    await Activity.create({
      leadId: lead5._id,
      userId: admin._id,
      type: 'assigned',
      description: `Lead assigned to ${bob.name}.`,
    });
    await Activity.create({
      leadId: lead5._id,
      userId: bob._id,
      type: 'status_change',
      description: "Status changed to 'Won' - contract signed.",
    });

    // Lead 6: Lost
    await Activity.create({
      leadId: lead6._id,
      type: 'created',
      description: 'Imported via outbound prospecting list.',
    });
    await Activity.create({
      leadId: lead6._id,
      userId: admin._id,
      type: 'assigned',
      description: `Lead assigned to ${alice.name}.`,
    });
    await Activity.create({
      leadId: lead6._id,
      userId: alice._id,
      type: 'status_change',
      description: "Status marked 'Lost' - competitor selected.",
    });

    console.log('Activities seeded.');

    // Seed Notes
    console.log('Seeding notes...');
    await Note.create({
      leadId: lead2._id,
      userId: alice._id,
      content: 'Called Sarah, spoke briefly. She requested a follow-up email with pricing details.',
    });
    await Activity.create({
      leadId: lead2._id,
      userId: alice._id,
      type: 'note_added',
      description: 'New note added: "Called Sarah, spoke briefly..."',
    });

    await Note.create({
      leadId: lead3._id,
      userId: alice._id,
      content: 'Discovery call completed. Fits our target profile perfectly. Budget is $15k.',
    });
    await Activity.create({
      leadId: lead3._id,
      userId: alice._id,
      type: 'note_added',
      description: 'New note added: "Discovery call completed..."',
    });

    await Note.create({
      leadId: lead5._id,
      userId: bob._id,
      content: 'Contract fully signed. Kickoff scheduled for next Monday.',
    });
    await Activity.create({
      leadId: lead5._id,
      userId: bob._id,
      type: 'note_added',
      description: 'New note added: "Contract fully signed..."',
    });

    console.log('Notes seeded.');
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

seed();
