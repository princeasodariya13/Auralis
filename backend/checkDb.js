import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
        const db = mongoose.connection;
        const products = await db.collection('products').find({}).limit(1).toArray();
        console.log(JSON.stringify(products, null, 2));
    } catch(err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}
run();
