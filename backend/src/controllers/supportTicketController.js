import SupportTicket from '../models/SupportTicket.js';
import SupportMessage from '../models/SupportMessage.js';
import Order from '../models/Order.js';
import ReturnRequest from '../models/ReturnRequest.js';
import BackgroundJob from '../models/BackgroundJob.js';
import crypto from 'crypto';

// Helper to generate unique ticket number
const generateTicketNumber = async () => {
    let ticketNumber;
    let exists = true;
    while (exists) {
        ticketNumber = `AUR-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        exists = await SupportTicket.exists({ ticketNumber });
    }
    return ticketNumber;
};

// @desc    Create new support ticket
// @route   POST /api/v1/support/tickets
export const createTicket = async (req, res) => {
    try {
        const { subject, category, message, orderNumber, returnRequestId } = req.body;

        if (!subject || !category || !message) {
            return res.status(400).json({ success: false, error: { message: 'Subject, category, and message are required' }});
        }

        // Validate order if provided
        if (orderNumber) {
            const order = await Order.findOne({ orderNumber, userId: req.user._id });
            if (!order) {
                return res.status(403).json({ success: false, error: { message: 'Order not found or access denied' }});
            }
        }

        // Validate return request if provided
        if (returnRequestId) {
            const returnReq = await ReturnRequest.findOne({ _id: returnRequestId, userId: req.user._id });
            if (!returnReq) {
                return res.status(403).json({ success: false, error: { message: 'Return request not found or access denied' }});
            }
        }

        const ticketNumber = await generateTicketNumber();

        const ticket = await SupportTicket.create({
            ticketNumber,
            userId: req.user._id,
            subject,
            category,
            orderNumber: orderNumber || undefined,
            returnRequestId: returnRequestId || undefined
        });

        await SupportMessage.create({
            ticketId: ticket._id,
            senderType: 'CUSTOMER',
            senderId: req.user._id,
            message,
            isInternal: false
        });

        // Enqueue confirmation email
        await BackgroundJob.create({
            type: 'SEND_EMAIL',
            idempotencyKey: `TICKET_CREATED_${ticket._id}`,
            payload: {
                to: req.user.email,
                subject: `Support Ticket Received: ${ticketNumber}`,
                html: `
                    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <h1 style="color: #0f172a; margin-top: 0; font-size: 24px;">We've received your request</h1>
                        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                            Hi ${req.user.name},<br/><br/>
                            We have received your support ticket (<strong>${ticketNumber}</strong>). Our team will review your request and get back to you as soon as possible.
                        </p>
                        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                            <strong>Subject:</strong> ${subject}<br/>
                            <strong>Category:</strong> ${category}
                        </p>
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/account/support/${ticketNumber}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 600; border-radius: 8px;">View Ticket</a>
                        </div>
                    </div>
                `,
                eventType: 'SUPPORT_TICKET_CREATED'
            }
        });

        res.status(201).json({ success: true, data: ticket });
    } catch (error) {
        console.error('Create Ticket Error:', error.message);
        res.status(500).json({ success: false, error: { message: 'Server error creating ticket' }});
    }
};

// @desc    Get user's support tickets
// @route   GET /api/v1/support/tickets
export const getTickets = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const tickets = await SupportTicket.find({ userId: req.user._id })
            .sort({ lastActivityAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await SupportTicket.countDocuments({ userId: req.user._id });

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

// @desc    Get single ticket details with messages
// @route   GET /api/v1/support/tickets/:ticketNumber
export const getTicketDetails = async (req, res) => {
    try {
        const ticket = await SupportTicket.findOne({
            ticketNumber: req.params.ticketNumber,
            userId: req.user._id
        }).populate('assignedAdminId', 'name');

        if (!ticket) {
            return res.status(404).json({ success: false, error: { message: 'Ticket not found' }});
        }

        // Fetch messages, explicitly excluding internal notes
        const messages = await SupportMessage.find({
            ticketId: ticket._id,
            isInternal: false
        })
        .sort({ createdAt: 1 })
        .populate('senderId', 'name');

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

// @desc    Customer reply to a ticket
// @route   POST /api/v1/support/tickets/:ticketNumber/messages
export const replyToTicket = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, error: { message: 'Message cannot be empty' }});
        }

        const ticket = await SupportTicket.findOne({
            ticketNumber: req.params.ticketNumber,
            userId: req.user._id
        });

        if (!ticket) {
            return res.status(404).json({ success: false, error: { message: 'Ticket not found' }});
        }

        if (ticket.status === 'CLOSED') {
            return res.status(400).json({ success: false, error: { message: 'Cannot reply to a closed ticket' }});
        }

        const newMessage = await SupportMessage.create({
            ticketId: ticket._id,
            senderType: 'CUSTOMER',
            senderId: req.user._id,
            message: message.trim(),
            isInternal: false
        });

        // Automatically update ticket status and timestamp
        // If it was WAITING_CUSTOMER or RESOLVED, move back to IN_PROGRESS
        if (['WAITING_CUSTOMER', 'RESOLVED'].includes(ticket.status)) {
            ticket.status = 'IN_PROGRESS';
        }
        ticket.lastActivityAt = new Date();
        await ticket.save();

        const populatedMessage = await SupportMessage.findById(newMessage._id).populate('senderId', 'name');

        res.status(201).json({ success: true, data: populatedMessage });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error replying to ticket' }});
    }
};
