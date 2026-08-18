import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayInstance = null;

export const getRazorpayInstance = () => {
    if (!razorpayInstance) {
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }
    return razorpayInstance;
};

export const createRazorpayOrder = async (amount, currency = 'INR', receipt) => {
    const rzp = getRazorpayInstance();
    const options = {
        amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
        currency,
        receipt,
    };
    
    try {
        const order = await rzp.orders.create(options);
        return order;
    } catch (error) {
        console.error('Razorpay Create Order Error:', error);
        throw new Error('Failed to create Razorpay order');
    }
};

export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    return generatedSignature === signature;
};

export const verifyWebhookSignature = (reqBody, signature) => {
    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(reqBody)
        .digest('hex');
        
    return generatedSignature === signature;
};
