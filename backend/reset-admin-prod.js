import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const resetProdAdmin = async () => {
    try {
        console.log('Connecting to production database...');
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: process.env.MONGODB_DB_NAME || 'auralis_audio'
        });
        console.log('Connected to Atlas!');

        const User = mongoose.model('User', new mongoose.Schema({email: String, passwordHash: String, role: String}, {strict: false}), 'users');
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);
        
        const result = await User.updateOne(
            { email: 'admin@auralis.com' }, 
            { 
                $set: { 
                    passwordHash: passwordHash,
                    role: 'admin',
                    name: 'Admin User',
                    createdAt: new Date(),
                    updatedAt: new Date()
                } 
            },
            { upsert: true }
        );
        
        console.log('✅ Password for admin@auralis.com successfully reset (or account created) with password: admin123');
        process.exit(0);
    } catch (err) {
        console.error('Failed to reset password:', err.message);
        process.exit(1);
    }
};

resetProdAdmin();
