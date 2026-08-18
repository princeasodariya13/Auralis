import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import Product from './models/Product.js';
// We use a relative path trick or import from the frontend directly
// Assuming frontend is at ../../src/data/mockData.js, but since ES modules don't support JSON simply, and we are running in backend, 
// we'll copy the data array here or import it if Node supports the path.
// Let's import it directly since it's a JS file with exports.
import { products } from '../../src/data/mockData.js';

dotenv.config();

const seedData = async () => {
    try {
        await connectDB();
        
        console.log('Seeding products...');
        let addedCount = 0;

        for (const prod of products) {
            // Upsert so we don't duplicate on multiple runs
            const result = await Product.updateOne(
                { id: prod.id },
                { $set: prod },
                { upsert: true }
            );
            
            if (result.upsertedCount > 0 || result.modifiedCount > 0) {
                addedCount++;
            }
        }

        console.log(`Seeding complete. ${addedCount} products synced to database.`);
        process.exit();
    } catch (error) {
        console.error(`Error during seeding: ${error.message}`);
        process.exit(1);
    }
};

seedData();
