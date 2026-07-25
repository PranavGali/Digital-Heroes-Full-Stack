# Concrete Refactor: Modernizing Legacy Controllers

This document demonstrates a practical refactoring of a critical API controller. We contrast a legacy JavaScript lead update handler with a structured, type-safe TypeScript implementation that enforces validation and clean error handling.

---

## 1. The Legacy Code ("Bad Code")

This code is written in raw JavaScript. It suffers from callback-hell/nested promises, lacks structured validation, mixes concerns (routing, business logic, DB queries, emails, responses), handles errors unsafely, and has no typing support.

```javascript
// controllers/legacyLeadController.js
const Lead = require('../models/Lead');
const User = require('../models/User');
const nodemailer = require('nodemailer');

exports.updateLead = function(req, res) {
  const leadId = req.params.id;
  const updates = req.body;

  // 1. Missing validation - directly querying database with untrusted input
  Lead.findById(leadId, function(err, lead) {
    if (err) {
      return res.status(500).send({ message: "DB Error", error: err });
    }
    if (!lead) {
      return res.status(404).send({ message: "Lead not found" });
    }

    // 2. Mutable updates directly mapped from body
    if (updates.status) {
      lead.status = updates.status;
    }
    if (updates.assignedTo) {
      lead.assignedTo = updates.assignedTo;
    }
    if (updates.name) {
      lead.name = updates.name;
    }

    lead.save(function(err, savedLead) {
      if (err) {
        return res.status(400).send({ message: "Save failed", error: err });
      }

      // 3. Side effects nested inside the controller callback
      if (updates.assignedTo) {
        User.findById(updates.assignedTo, function(err, user) {
          if (user) {
            // Hardcoded SMTP credentials or manual transport creation
            let transporter = nodemailer.createTransport({
              host: "smtp.mailtrap.io",
              port: 2525,
              auth: { user: "user", pass: "pass" }
            });

            transporter.sendMail({
              from: '"CRM" <crm@company.com>',
              to: user.email,
              subject: "New Lead Assigned",
              text: `You have been assigned lead: ${lead.name}`
            }, function(mailErr, info) {
              if (mailErr) {
                console.log("Email failed to send", mailErr);
              }
              // Send response
              res.status(200).json({ success: true, lead: savedLead });
            });
          } else {
            res.status(200).json({ success: true, lead: savedLead });
          }
        });
      } else {
        res.status(200).json({ success: true, lead: savedLead });
      }
    });
  });
};
```

### Critical Flaws in the Legacy Code:
1. **Callback Hell**: Deeply nested callbacks make code hard to read, maintain, and unit-test.
2. **Security & Input Validation**: Zero input validation before querying DB or saving.
3. **Implicit Side Effects**: Direct creation of SMTP configurations inside a controller route.
4. **Poor Error Resilience**: Unhandled exceptions will crash the entire Node process.
5. **No Type Safety**: Hard to see schema shape without database inspections.

---

## 2. The Refactored Code ("Good Code")

Here is the refactored version using **TypeScript**, **Zod** for schema validation, **async/await**, a separate **Service Layer** for business logic/side effects, and a **Global Custom Error** class.

### Step A: Define Request Validation Schema (`src/validators/leadValidator.ts`)
```typescript
import { z } from 'zod';

export const UpdateLeadSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    status: z.enum(['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost']).optional(),
    assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid User ID format").optional(),
  })
});
```

### Step B: Encapsulate Business Logic (`src/services/leadService.ts`)
```typescript
import { Lead, ILead } from '../models/Lead';
import { User } from '../models/User';
import { Activity } from '../models/Activity';
import { NotFoundError, BadRequestError } from '../errors/customErrors';
import { emailService } from './emailService';

export class LeadService {
  public static async updateLead(
    leadId: string, 
    userId: string, 
    updates: Partial<ILead>
  ): Promise<ILead> {
    const lead = await Lead.findById(leadId);
    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    const previousStatus = lead.status;
    const previousAssignee = lead.assignedTo?.toString();

    // Apply updates safely
    if (updates.name !== undefined) lead.name = updates.name;
    
    let isStatusChanged = false;
    if (updates.status !== undefined && updates.status !== lead.status) {
      lead.status = updates.status;
      isStatusChanged = true;
    }

    let isAssigneeChanged = false;
    if (updates.assignedTo !== undefined && updates.assignedTo.toString() !== previousAssignee) {
      // Validate that assignee exists and has appropriate role
      const userExists = await User.findById(updates.assignedTo);
      if (!userExists) {
        throw new BadRequestError('Assigned user does not exist');
      }
      lead.assignedTo = updates.assignedTo;
      isAssigneeChanged = true;
    }

    const savedLead = await lead.save();

    // Log Activity Timeline Events
    if (isStatusChanged) {
      await Activity.create({
        leadId: savedLead._id,
        userId,
        type: 'status_change',
        description: `Status changed from ${previousStatus} to ${savedLead.status}`
      });
    }

    if (isAssigneeChanged) {
      await Activity.create({
        leadId: savedLead._id,
        userId,
        type: 'assigned',
        description: `Lead assigned to ${updates.assignedTo}`
      });

      // Delegate email side-effect asynchronously
      const user = await User.findById(updates.assignedTo);
      if (user?.email) {
        emailService.sendAssignmentNotification(user.email, savedLead.name).catch(err => {
          // Log error asynchronously without blocking HTTP response
          console.error(`Failed to dispatch assignment email for lead: ${savedLead._id}`, err);
        });
      }
    }

    return savedLead;
  }
}
```

### Step C: Keep Controller Lean (`src/controllers/leadController.ts`)
```typescript
import { Request, Response, NextFunction } from 'express';
import { LeadService } from '../services/leadService';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const updateLead = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id as string;
    
    // Core logic execution delegated to service
    const updatedLead = await LeadService.updateLead(id, userId, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      data: updatedLead
    });
  } catch (error) {
    // Delegated to global express error middleware
    next(error);
  }
};
```

---

## 3. Explanations of Key Improvements

1. **Separation of Concerns (SoC)**: The route controller is now only responsible for deserializing HTTP inputs and returning HTTP codes. The Service Layer encapsulates business and database modifications, while the validator handles constraints.
2. **Type Safety & Intellisense**: With TypeScript interfaces, developers know exactly which properties are editable on a lead without digging through source files.
3. **Decoupled Side Effects**: Nodemailer configuration and email dispatch are encapsulated inside an independent `emailService`. If email systems fail, the API request does not fail.
4. **Structured Request Validation**: Zod acts as a middleware validation shield, filtering out corrupt, malformed, or injected fields before database execution occurs.
5. **Centralized Error Propagation**: Replaced nested callback checks with a unified `try/catch` boundary. Custom errors like `NotFoundError` automatically bubble up to an Express global error handling middleware, returning standardized JSON formats to client requests.
