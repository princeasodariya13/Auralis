import express from 'express';
import { 
    getTickets,
    getTicketDetails,
    updateTicketStatus,
    updateTicketPriority,
    assignTicket,
    addMessage
} from '../controllers/adminSupportController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, admin); // Admin only routes

router.route('/')
    .get(getTickets);

router.route('/:ticketNumber')
    .get(getTicketDetails);

router.route('/:ticketNumber/status')
    .patch(updateTicketStatus);

router.route('/:ticketNumber/priority')
    .patch(updateTicketPriority);

router.route('/:ticketNumber/assignment')
    .patch(assignTicket);

router.route('/:ticketNumber/messages')
    .post(addMessage);

export default router;
