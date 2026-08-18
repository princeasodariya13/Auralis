import nodemailer from 'nodemailer';
import NotificationLog from '../models/NotificationLog.js';

// Transporter abstraction
let transporter = null;

export const getTransporter = () => {
    if (!transporter) {
        if (process.env.EMAIL_PROVIDER === 'smtp') {
            transporter = nodemailer.createTransport({
                host: process.env.EMAIL_SMTP_HOST,
                port: process.env.EMAIL_SMTP_PORT,
                secure: process.env.EMAIL_SMTP_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_SMTP_USER,
                    pass: process.env.EMAIL_SMTP_PASS
                }
            });
        } else {
            // Development fallback / Console Mock Transport
            transporter = {
                sendMail: async (mailOptions) => {
                    console.log('\n==================================================');
                    console.log(`[MOCK EMAIL SERVICE] Email Sent to: ${mailOptions.to}`);
                    console.log(`Subject: ${mailOptions.subject}`);
                    console.log('--- HTML CONTENT ---');
                    console.log(mailOptions.html.substring(0, 500) + '... [TRUNCATED]');
                    console.log('==================================================\n');
                    return { messageId: `mock-${Date.now()}` };
                }
            };
        }
    }
    return transporter;
};

// Internal wrapper to enqueue an email job
export const sendTransactionalEmail = async ({ to, subject, html, eventKey, eventType }) => {
    try {
        // Enqueue the job for reliable delivery
        // If eventKey is missing, we generate a unique one to ensure it's still treated as a job
        const idempotencyKey = eventKey || `EMAIL_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const BackgroundJob = (await import('../models/BackgroundJob.js')).default;
        
        await BackgroundJob.updateOne(
            { idempotencyKey },
            { 
                $setOnInsert: {
                    type: 'SEND_EMAIL',
                    status: 'pending',
                    idempotencyKey,
                    payload: { to, subject, html, eventKey, eventType }
                }
            },
            { upsert: true }
        );

        return true;
    } catch (error) {
        console.error(`[Email Service] Failed to enqueue email job to ${to}: ${error.message}`);
        // We do NOT throw here so we don't break the main transaction flow
        return false;
    }
};
