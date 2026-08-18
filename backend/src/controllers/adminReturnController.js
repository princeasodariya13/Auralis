import ReturnRequest from '../models/ReturnRequest.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import InventoryLog from '../models/InventoryLog.js';
import { createRazorpayRefund } from '../services/razorpay.service.js';
import { createCustomerNotification } from '../services/customerNotificationService.js';
import { recordAdminAction } from '../services/adminAuditService.js';
import { reversePointsForReturn } from '../services/loyaltyService.js';
import mongoose from 'mongoose';

const VALID_TRANSITIONS = {
    'requested': ['approved', 'rejected'],
    'approved': ['received'],
    'received': ['refund_pending', 'refunded'],
    'refund_pending': ['refunded'],
    'rejected': [],
    'refunded': [],
    'cancelled': []
};

// @desc    Get all return requests
// @route   GET /api/v1/admin/returns
// @access  Private/Admin
export const getAdminReturns = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const query = {};
        if (req.query.status && req.query.status !== 'All') {
            query.status = req.query.status;
        }

        const total = await ReturnRequest.countDocuments(query);
        const returns = await ReturnRequest.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name email');

        res.json({
            success: true,
            data: {
                returns,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error retrieving returns' } });
    }
};

// @desc    Get return request details
// @route   GET /api/v1/admin/returns/:id
// @access  Private/Admin
export const getAdminReturnDetails = async (req, res) => {
    try {
        const returnReq = await ReturnRequest.findById(req.params.id)
            .populate('userId', 'name email');
            
        if (!returnReq) {
            return res.status(404).json({ success: false, error: { message: 'Return request not found' } });
        }
        
        const order = await Order.findById(returnReq.orderId);
        
        res.json({ 
            success: true, 
            data: {
                returnRequest: returnReq,
                orderSnapshot: order // Helpful for admin to see original context
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error retrieving return details' } });
    }
};

// @desc    Update return request status
// @route   PATCH /api/v1/admin/returns/:id/status
// @access  Private/Admin
export const updateReturnStatus = async (req, res) => {
    try {
        const { status, adminNote, restockItems } = req.body;
        
        if (!status) {
            return res.status(400).json({ success: false, error: { message: 'Status is required' } });
        }

        const returnReq = await ReturnRequest.findById(req.params.id);
        if (!returnReq) {
            return res.status(404).json({ success: false, error: { message: 'Return request not found' } });
        }

        const allowedTransitions = VALID_TRANSITIONS[returnReq.status];
        if (!allowedTransitions || !allowedTransitions.includes(status)) {
            return res.status(409).json({ success: false, error: { message: `Invalid transition from ${returnReq.status} to ${status}` } });
        }

        if (adminNote) {
            returnReq.adminNote = adminNote;
        }

        const now = new Date();
        const order = await Order.findById(returnReq.orderId);

        // State machine actions
        if (status === 'approved') {
            returnReq.approvedAt = now;
            createCustomerNotification({
                userId: returnReq.userId,
                type: 'ORDER_PROCESSING', // Generic type for now
                title: 'Return Request Approved',
                message: `Your return request for order #${returnReq.orderNumber} has been approved. Please ship the items back.`,
                orderNumber: returnReq.orderNumber,
                idempotencyKey: `RETURN_APP_${returnReq._id}`
            }).catch(console.error);
            
        } else if (status === 'rejected') {
            returnReq.rejectedAt = now;
            createCustomerNotification({
                userId: returnReq.userId,
                type: 'ORDER_CANCELLED', 
                title: 'Return Request Rejected',
                message: `Your return request for order #${returnReq.orderNumber} was rejected. Reason: ${adminNote || 'Does not meet policy'}`,
                orderNumber: returnReq.orderNumber,
                idempotencyKey: `RETURN_REJ_${returnReq._id}`
            }).catch(console.error);
            
        } else if (status === 'received') {
            returnReq.receivedAt = now;
            
            // Optional: Restock items to inventory safely
            if (restockItems) {
                const session = await mongoose.startSession();
                session.startTransaction();
                try {
                    for (const ri of returnReq.items) {
                        const product = await Product.findOne({ id: ri.productId }).session(session);
                        if (product) {
                            const oldStock = product.stockQuantity;
                            product.stockQuantity += ri.quantity;
                            await product.save({ session });
                            
                            await InventoryLog.create([{
                                productId: product._id,
                                sku: product.sku,
                                type: 'restock',
                                quantity: ri.quantity,
                                previousStock: oldStock,
                                newStock: product.stockQuantity,
                                reason: `Return request ${returnReq._id} received`,
                                reference: returnReq.orderNumber,
                                performedBy: req.user._id
                            }], { session });
                        }
                    }
                    await session.commitTransaction();
                    session.endSession();
                } catch (err) {
                    await session.abortTransaction();
                    session.endSession();
                    console.error('Failed to restock inventory:', err);
                    return res.status(500).json({ success: false, error: { message: 'Failed to restock inventory during receiving' } });
                }
            }

            createCustomerNotification({
                userId: returnReq.userId,
                type: 'ORDER_DELIVERED', 
                title: 'Return Items Received',
                message: `We have received your returned items for order #${returnReq.orderNumber}. We will process your refund shortly.`,
                orderNumber: returnReq.orderNumber,
                idempotencyKey: `RETURN_REC_${returnReq._id}`
            }).catch(console.error);

        } else if (status === 'refunded') {
            // Initiate Razorpay Refund
            if (!order) {
                return res.status(404).json({ success: false, error: { message: 'Original order not found' } });
            }

            if (!order.razorpayPaymentId) {
                return res.status(400).json({ success: false, error: { message: 'No Razorpay payment ID found on order' } });
            }

            try {
                // Ensure idempotency - don't refund if already refunded
                if (returnReq.refundReference) {
                    throw new Error('Refund has already been processed (reference exists)');
                }
                
                // Atomic lock to prevent concurrent refund attempts (Race condition fix)
                const atomicLock = await ReturnRequest.updateOne(
                    { _id: returnReq._id, status: 'refund_pending', refundReference: { $exists: false } },
                    { $set: { status: 'processing_refund' } }
                );
                
                if (atomicLock.modifiedCount === 0) {
                    return res.status(409).json({ success: false, error: { message: 'Refund is already processing or has been processed.' } });
                }

                let refundResult;
                try {
                    refundResult = await createRazorpayRefund(
                        order.razorpayPaymentId,
                        returnReq.refundAmount,
                        `RET_${returnReq._id}`
                    );
                } catch (gatewayErr) {
                    // Revert lock on gateway failure
                    await ReturnRequest.updateOne({ _id: returnReq._id }, { $set: { status: 'refund_pending' } });
                    
                    await recordAdminAction({
                        adminUserId: req.user._id,
                        action: 'RETURN_REFUND_FAILED',
                        resourceType: 'ReturnRequest',
                        resourceId: returnReq._id,
                        success: false,
                        failureReason: gatewayErr.message,
                        metadata: { orderNumber: returnReq.orderNumber, amount: returnReq.refundAmount }
                    });
                    
                    throw gatewayErr;
                }

                returnReq.refundReference = refundResult.id;
                returnReq.refundedAt = now;
                returnReq.status = 'refunded';
                
                // Update Order payment status safely
                order.paymentStatus = 'partially_refunded'; // Or refunded if full amount
                
                // Calculate total refunded across all returns/cancellations
                const existingRefundsTotal = order.refunds ? order.refunds.reduce((acc, curr) => acc + curr.amount, 0) : 0;
                
                if (!order.refunds) order.refunds = [];
                order.refunds.push({
                    refundId: refundResult.id,
                    amount: returnReq.refundAmount,
                    reason: `Return Request ${returnReq._id}`
                });

                if (existingRefundsTotal + returnReq.refundAmount >= order.total) {
                    order.paymentStatus = 'refunded';
                }
                await order.save();
                
                // Reverse loyalty points safely outside transaction but before response
                await reversePointsForReturn(order, returnReq, returnReq.refundAmount);

                createCustomerNotification({
                    userId: returnReq.userId,
                    type: 'PAYMENT_SUCCESS', // Green check mark
                    title: 'Refund Processed',
                    message: `A refund of $${returnReq.refundAmount} for order #${returnReq.orderNumber} has been processed. It may take a few days to reflect in your account.`,
                    orderNumber: returnReq.orderNumber,
                    idempotencyKey: `RETURN_REF_${returnReq._id}`
                }).catch(console.error);

                // We send the response here early because we manually set status
                await returnReq.save();
                
                await recordAdminAction({
                    adminUserId: req.user._id,
                    action: 'RETURN_REFUNDED',
                    resourceType: 'ReturnRequest',
                    resourceId: returnReq._id,
                    previousState: { status: 'refund_pending' },
                    newState: { status: 'refunded' },
                    metadata: { orderNumber: returnReq.orderNumber, amount: returnReq.refundAmount, refundReference: refundResult.id }
                });
                
                return res.json({ success: true, data: returnReq });

            } catch (err) {
                console.error('Refund Execution Error:', err);
                return res.status(500).json({ success: false, error: { message: 'Gateway error processing refund' } });
            }
        }

        const previousStatus = returnReq.status;
        returnReq.status = status;
        await returnReq.save();

        await recordAdminAction({
            adminUserId: req.user._id,
            action: 'RETURN_STATE_CHANGED',
            resourceType: 'ReturnRequest',
            resourceId: returnReq._id,
            previousState: { status: previousStatus },
            newState: { status: status },
            metadata: {
                orderNumber: returnReq.orderNumber,
                adminNote: adminNote || null
            }
        });

        res.json({ success: true, data: returnReq });

    } catch (error) {
        console.error(`Update Return Status Error: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error updating return status' } });
    }
};
