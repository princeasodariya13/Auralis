import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../src/models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/auralis');
    const res = await Product.deleteMany({ id: { $gte: 100 } });
    console.log('Deleted:', res.deletedCount);
    process.exit(0);
};

run();
