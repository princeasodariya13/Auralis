import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from the backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const promoteToAdmin = async () => {
    try {
        const email = process.argv[2];
        
        if (!email) {
            console.error('❌ Please provide an email address.');
            console.error('Usage: node promoteAdmin.js <user-email>');
            process.exit(1);
        }

        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.error(`❌ User not found with email: ${email}`);
            process.exit(1);
        }

        if (user.role === 'admin') {
            console.log(`⚠️  User ${user.email} is already an admin.`);
            process.exit(0);
        }

        // Promote to admin
        user.role = 'admin';
        await user.save();

        console.log(`✅ Successfully promoted ${user.email} to Admin.`);
        process.exit(0);
    } catch (error) {
        console.error(`❌ Error promoting admin: ${error.message}`);
        process.exit(1);
    }
};

promoteToAdmin();
