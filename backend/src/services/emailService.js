import nodemailer from 'nodemailer';
import NotificationLog from '../models/NotificationLog.js';

// Transporter abstraction
let transporter = null;

const getTransporter = () => {
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

// Internal wrapper to send and log
export const sendTransactionalEmail = async ({ to, subject, html, eventKey, eventType }) => {
    try {
        // Idempotency check
        if (eventKey) {
            const existingLog = await NotificationLog.findOne({ eventKey, status: 'sent' });
            if (existingLog) {
                console.log(`[Email Service] Idempotency catch: Event ${eventKey} already sent. Skipping.`);
                return true; // Already processed successfully
            }
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"Auralis Audio" <no-reply@auralis.com>',
            to,
            subject,
            html
        };

        const t = getTransporter();
        await t.sendMail(mailOptions);

        if (eventKey) {
            await NotificationLog.findOneAndUpdate(
                { eventKey },
                { eventType, recipientEmail: to, status: 'sent', errorDetails: null },
                { upsert: true, new: true }
            );
        }

        return true;
    } catch (error) {
        console.error(`[Email Service] Failed to send email to ${to}: ${error.message}`);
        
        if (eventKey) {
            await NotificationLog.findOneAndUpdate(
                { eventKey },
                { eventType, recipientEmail: to, status: 'failed', errorDetails: error.message },
                { upsert: true, new: true }
            );
        }
        
        // We do NOT throw here so we don't break the main transaction flow
        return false;
    }
};
