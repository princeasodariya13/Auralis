import dns from 'dns';
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch(e) {}
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auralis', {
            dbName: process.env.MONGODB_DB_NAME || 'auralis_audio'
        });
        const db = mongoose.connection.db;
        
        const carts = await db.collection('carts').find({}).toArray();
        console.log(`Found ${carts.length} carts.`);
        if (carts.length > 0) {
            console.log('Sample Cart Items:', JSON.stringify(carts[0].items, null, 2));
        }

        const p1 = await db.collection('products').findOne({ id: 1 });
        console.log('Product id=1:', p1 ? p1.name + ' (Active: ' + p1.isActive + ')' : 'Not Found');

        const p2 = await db.collection('products').findOne({ id: "1" });
        console.log('Product id="1":', p2 ? p2.name + ' (Active: ' + p2.isActive + ')' : 'Not Found');
        
    } catch(err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}
run();
