import SupportTicket from '../models/SupportTicket.js';
import SupportMessage from '../models/SupportMessage.js';
import BackgroundJob from '../models/BackgroundJob.js';
import User from '../models/User.js';
import { recordAdminAction } from '../services/adminAuditService.js';
import { createCustomerNotification } from '../services/customerNotificationService.js';

// @desc    Get all tickets with filters & pagination
// @route   GET /api/v1/admin/support/tickets
export const getTickets = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const query = {};

        if (req.query.status && req.query.status !== 'ALL') {
            query.status = req.query.status;
        }
        if (req.query.priority && req.query.priority !== 'ALL') {
            query.priority = req.query.priority;
        }
        if (req.query.category && req.query.category !== 'ALL') {
            query.category = req.query.category;
        }
        if (req.query.assignedAdminId) {
            query.assignedAdminId = req.query.assignedAdminId === 'UNASSIGNED' ? { $exists: false } : req.query.assignedAdminId;
        }
        if (req.query.search) {
            query.$or = [
                { ticketNumber: { $regex: req.query.search, $options: 'i' } },
                { subject: { $regex: req.query.search, $options: 'i' } },
                { orderNumber: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const sort = req.query.sort === 'oldest' ? { lastActivityAt: 1 } : { lastActivityAt: -1 };

        const tickets = await SupportTicket.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name email')
            .populate('assignedAdminId', 'name');

        const total = await SupportTicket.countDocuments(query);

        res.json({
            success: true,
            data: {
                tickets,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error retrieving tickets' }});
    }
};

// @desc    Get ticket details (including internal notes)
// @route   GET /api/v1/admin/support/tickets/:ticketNumber
export const getTicketDetails = async (req, res) => {
    try {
        const ticket = await SupportTicket.findOne({ ticketNumber: req.params.ticketNumber })
            .populate('userId', 'name email')
            .populate('assignedAdminId', 'name');

        if (!ticket) {
            return res.status(404).json({ success: false, error: { message: 'Ticket not found' }});
        }

        // Fetch all messages (including internal)
        const messages = await SupportMessage.find({ ticketId: ticket._id })
            .sort({ createdAt: 1 })
            .populate('senderId', 'name role');

        res.json({
            success: true,
            data: {
                ticket,
                messages
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error retrieving ticket details' }});
    }
};

// @desc    Update ticket status
// @route   PATCH /api/v1/admin/support/tickets/:ticketNumber/status
export const updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: { message: 'Invalid status' }});
        }

        const ticket = await SupportTicket.findOne({ ticketNumber: req.params.ticketNumber }).populate('userId', 'email name');
        if (!ticket) {
            return res.status(404).json({ success: false, error: { message: 'Ticket not found' }});
        }

        const oldStatus = ticket.status;
        ticket.status = status;
        ticket.lastActivityAt = new Date();
        await ticket.save();

        await recordAdminAction({
            adminUserId: req.user._id,
            action: 'SUPPORT_TICKET_STATUS_CHANGED',
            resourceType: 'SupportTicket',
            resourceId: ticket._id,
            previousState: { status: oldStatus },
            newState: { status: ticket.status }
        });

        // Optional: If resolved or closed, notify customer
        if ((status === 'RESOLVED' || status === 'CLOSED') && oldStatus !== status) {
            await createCustomerNotification({
                userId: ticket.userId._id,
                type: 'TICKET_RESOLVED',
                title: 'Support Ticket Resolved',
                message: `Your ticket ${ticket.ticketNumber} has been marked as ${status.toLowerCase()}.`,
                idempotencyKey: `TICKET_${ticket._id}_STATUS_${status}`
            });

            await BackgroundJob.create({
                type: 'SEND_EMAIL',
                idempotencyKey: `TICKET_RESOLVED_EMAIL_${ticket._id}_${Date.now()}`,
                payload: {
                    to: ticket.userId.email,
                    subject: `Update on Ticket ${ticket.ticketNumber}: ${status}`,
                    html: `
                        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
                            <h1 style="color: #0f172a; margin-top: 0; font-size: 24px;">Ticket Status Update</h1>
                            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                                Hi ${ticket.userId.name},<br/><br/>
                                Your support ticket (<strong>${ticket.ticketNumber}</strong>) has been updated to <strong>${status}</strong>.
                            </p>
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/account/support/${ticket.ticketNumber}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 600; border-radius: 8px;">View Ticket</a>
                            </div>
                        </div>
                    `,
                    eventType: 'SUPPORT_TICKET_STATUS_UPDATE'
                }
            });
        }

        res.json({ success: true, data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error updating status' }});
    }
};

// @desc    Update ticket priority
// @route   PATCH /api/v1/admin/support/tickets/:ticketNumber/priority
export const updateTicketPriority = async (req, res) => {
    try {
        const { priority } = req.body;
        const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
        
        if (!validPriorities.includes(priority)) {
            return res.status(400).json({ success: false, error: { message: 'Invalid priority' }});
        }

        const ticket = await SupportTicket.findOne({ ticketNumber: req.params.ticketNumber });
        if (!ticket) {
            return res.status(404).json({ success: false, error: { message: 'Ticket not found' }});
        }

        const oldPriority = ticket.priority;
        ticket.priority = priority;
        ticket.lastActivityAt = new Date();
        await ticket.save();

        await recordAdminAction({
            adminUserId: req.user._id,
            action: 'SUPPORT_TICKET_PRIORITY_CHANGED',
            resourceType: 'SupportTicket',
            resourceId: ticket._id,
            previousState: { priority: oldPriority },
            newState: { priority: ticket.priority }
        });

        res.json({ success: true, data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error updating priority' }});
    }
};

// @desc    Assign ticket to admin
// @route   PATCH /api/v1/admin/support/tickets/:ticketNumber/assignment
export const assignTicket = async (req, res) => {
    try {
        const { assignedAdminId } = req.body; // Can be null to unassign

        const ticket = await SupportTicket.findOne({ ticketNumber: req.params.ticketNumber });
        if (!ticket) {
            return res.status(404).json({ success: false, error: { message: 'Ticket not found' }});
        }

        if (assignedAdminId) {
            const admin = await User.findOne({ _id: assignedAdminId, role: 'admin' });
            if (!admin) {
                return res.status(400).json({ success: false, error: { message: 'Invalid admin user' }});
            }
        }

        const oldAssignee = ticket.assignedAdminId;
        ticket.assignedAdminId = assignedAdminId || null;
        ticket.lastActivityAt = new Date();
        await ticket.save();

        await recordAdminAction({
            adminUserId: req.user._id,
            action: 'SUPPORT_TICKET_ASSIGNED',
            resourceType: 'SupportTicket',
            resourceId: ticket._id,
            previousState: { assignedAdminId: oldAssignee },
            newState: { assignedAdminId: ticket.assignedAdminId }
        });

        const updatedTicket = await SupportTicket.findById(ticket._id).populate('assignedAdminId', 'name');
        res.json({ success: true, data: updatedTicket });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error assigning ticket' }});
    }
};

// @desc    Add message to ticket (Reply or Internal Note)
// @route   POST /api/v1/admin/support/tickets/:ticketNumber/messages
export const addMessage = async (req, res) => {
    try {
        const { message, isInternal = false } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, error: { message: 'Message cannot be empty' }});
        }

        const ticket = await SupportTicket.findOne({ ticketNumber: req.params.ticketNumber }).populate('userId', 'email name');
        if (!ticket) {
            return res.status(404).json({ success: false, error: { message: 'Ticket not found' }});
        }

        const newMessage = await SupportMessage.create({
            ticketId: ticket._id,
            senderType: 'ADMIN',
            senderId: req.user._id,
            message: message.trim(),
            isInternal
        });

        // Automatically update ticket timestamp
        // If it's a public reply, we might auto-transition to WAITING_CUSTOMER
        ticket.lastActivityAt = new Date();
        if (!isInternal && (ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS')) {
            ticket.status = 'WAITING_CUSTOMER';
        }
        await ticket.save();

        await recordAdminAction({
            adminUserId: req.user._id,
            action: isInternal ? 'SUPPORT_INTERNAL_NOTE_ADDED' : 'SUPPORT_ADMIN_REPLY_ADDED',
            resourceType: 'SupportTicket',
            resourceId: ticket._id
        });

        if (!isInternal) {
            await createCustomerNotification({
                userId: ticket.userId._id,
                type: 'TICKET_REPLY',
                title: 'Support Replied',
                message: `Support has replied to your ticket ${ticket.ticketNumber}.`,
                idempotencyKey: `TICKET_REPLY_${newMessage._id}`
            });

            await BackgroundJob.create({
                type: 'SEND_EMAIL',
                idempotencyKey: `TICKET_REPLY_EMAIL_${newMessage._id}`,
                payload: {
                    to: ticket.userId.email,
                    subject: `Re: Ticket ${ticket.ticketNumber} - ${ticket.subject}`,
                    html: `
                        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
                            <h1 style="color: #0f172a; margin-top: 0; font-size: 24px;">Support Reply Received</h1>
                            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                                Hi ${ticket.userId.name},<br/><br/>
                                Our support team has replied to your ticket (<strong>${ticket.ticketNumber}</strong>).
                            </p>
                            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; font-style: italic; color: #334155; margin-bottom: 24px;">
                                "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"
                            </div>
                            <div style="text-align: center;">
                                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/account/support/${ticket.ticketNumber}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 600; border-radius: 8px;">View Full Reply</a>
                            </div>
                        </div>
                    `,
                    eventType: 'SUPPORT_TICKET_REPLY'
                }
            });
        }

        const populatedMessage = await SupportMessage.findById(newMessage._id).populate('senderId', 'name role');
        res.status(201).json({ success: true, data: populatedMessage });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error adding message' }});
    }
};
