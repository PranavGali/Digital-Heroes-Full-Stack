import { Response, NextFunction } from 'express';
import { Lead, LeadStatus } from '../models/Lead';
import { Note } from '../models/Note';
import { Activity } from '../models/Activity';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

// 1. Create Lead (Supports public capture form and authenticated creation)
export const createLead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, phone, company, source, status } = req.body;

    if (!name || !email || !phone) {
      res.status(400).json({ success: false, message: 'Name, email, and phone are required.' });
      return;
    }

    // Determine assignee (if provided by authenticated admin/member)
    let assignedTo = null;
    if (req.user && req.body.assignedTo) {
      assignedTo = req.body.assignedTo;
    }

    const lead = await Lead.create({
      name,
      email,
      phone,
      company,
      source: source || 'Public Webform',
      status: status || 'New',
      assignedTo,
    });

    // Log creation activity
    await Activity.create({
      leadId: lead._id,
      userId: req.user ? req.user.id : undefined,
      type: 'created',
      description: `Lead created via ${lead.source}.`,
    });

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// 2. Get Leads (Supports search, filter, sorting, pagination, role-based visibility)
export const getLeads = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search as string;
    const status = req.query.status as string;
    const assignedTo = req.query.assignedTo as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;

    let query: any = {};

    // Role-based visibility
    if (req.user?.role === 'member') {
      // Members can only see their assigned leads
      query.assignedTo = req.user.id;
    } else if (assignedTo) {
      // Admins can filter by assignee
      query.assignedTo = assignedTo === 'unassigned' ? null : assignedTo;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Search query (case-insensitive search on name, email, company)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    // Perform query and count
    const totalLeads = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email role')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      pagination: {
        totalLeads,
        totalPages: Math.ceil(totalLeads / limit),
        currentPage: page,
        limit,
      },
      data: leads,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Lead by ID (Pulls detailed lead info along with notes and activity history)
export const getLeadById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const lead = await Lead.findById(id).populate('assignedTo', 'name email role');
    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found.' });
      return;
    }

    // Enforce member view limits
    if (req.user?.role === 'member' && lead.assignedTo?._id.toString() !== req.user.id) {
      res.status(403).json({ success: false, message: 'Access denied to this lead.' });
      return;
    }

    // Fetch notes and activities
    const notes = await Note.find({ leadId: lead._id })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    const activities = await Activity.find({ leadId: lead._id })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        lead,
        notes,
        activities,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Lead details (Members can update their assigned leads, Admins can update all)
export const updateLead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, phone, company, status, source } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found.' });
      return;
    }

    // Enforce member limits
    if (req.user?.role === 'member' && lead.assignedTo?.toString() !== req.user.id) {
      res.status(403).json({ success: false, message: 'Access denied. You can only update assigned leads.' });
      return;
    }

    const prevStatus = lead.status;
    let statusChanged = false;

    if (name) lead.name = name;
    if (email) lead.email = email;
    if (phone) lead.phone = phone;
    if (company !== undefined) lead.company = company;
    if (source) lead.source = source;

    if (status && status !== prevStatus) {
      lead.status = status as LeadStatus;
      statusChanged = true;
    }

    await lead.save();

    // Log Activity
    if (statusChanged) {
      await Activity.create({
        leadId: lead._id,
        userId: req.user?.id,
        type: 'status_change',
        description: `Lead status updated from '${prevStatus}' to '${status}'.`,
      });
    } else {
      await Activity.create({
        leadId: lead._id,
        userId: req.user?.id,
        type: 'updated',
        description: 'Lead profile updated.',
      });
    }

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// 5. Assign Lead (Admin Only)
export const assignLead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body; // User ID or null

    const lead = await Lead.findById(id);
    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found.' });
      return;
    }

    let assigneeName = 'Unassigned';
    if (assignedTo) {
      const user = await User.findById(assignedTo);
      if (!user) {
        res.status(404).json({ success: false, message: 'Target user for assignment not found.' });
        return;
      }
      assigneeName = user.name;
      lead.assignedTo = user._id;
    } else {
      lead.assignedTo = undefined;
    }

    await lead.save();

    // Log assignment Activity
    await Activity.create({
      leadId: lead._id,
      userId: req.user?.id,
      type: 'assigned',
      description: `Lead assigned to: ${assigneeName}.`,
    });

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// 6. Add Note (Members can note their leads, Admins can note any)
export const addNote = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      res.status(400).json({ success: false, message: 'Note content is required.' });
      return;
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found.' });
      return;
    }

    // Enforce member limits
    if (req.user?.role === 'member' && lead.assignedTo?.toString() !== req.user.id) {
      res.status(403).json({ success: false, message: 'Access denied. You can only comment on assigned leads.' });
      return;
    }

    const note = await Note.create({
      leadId: lead._id,
      userId: req.user?.id,
      content,
    });

    // Populate user info before returning note
    const populatedNote = await note.populate('userId', 'name email');

    // Log Activity
    await Activity.create({
      leadId: lead._id,
      userId: req.user?.id,
      type: 'note_added',
      description: `New note added: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
    });

    res.status(201).json({ success: true, data: populatedNote });
  } catch (error) {
    next(error);
  }
};
