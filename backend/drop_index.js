import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const dropIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI);
        console.log('Connected to DB');
        
        const db = mongoose.connection.db;
        const shipmentsCollection = db.collection('shipments');
        
        try {
            await shipmentsCollection.dropIndex('orderId_1');
            console.log('Successfully dropped orderId_1 index');
        } catch (e) {
            console.log('Index orderId_1 might not exist or already dropped:', e.message);
        }
        
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

dropIndex();
