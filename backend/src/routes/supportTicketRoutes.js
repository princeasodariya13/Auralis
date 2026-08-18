import express from 'express';
import { 
    createTicket, 
    getTickets, 
    getTicketDetails, 
    replyToTicket 
} from '../controllers/supportTicketController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Customer only routes

router.route('/')
    .post(createTicket)
    .get(getTickets);

router.route('/:ticketNumber')
    .get(getTicketDetails);

router.route('/:ticketNumber/messages')
    .post(replyToTicket);

export default router;
