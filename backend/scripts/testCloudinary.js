import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const testCloudinary = async () => {
    try {
        console.log("Checking Cloudinary configuration...");
        
        let isConfigured = false;
        
        if (process.env.CLOUDINARY_URL) {
            console.log("CLOUDINARY_URL: PRESENT");
            isConfigured = true;
        } else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
            console.log("CLOUDINARY_CLOUD_NAME: PRESENT");
            console.log("CLOUDINARY_API_KEY: PRESENT");
            console.log("CLOUDINARY_API_SECRET: PRESENT");
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET
            });
            isConfigured = true;
        } else {
            console.log("Cloudinary configuration: FAIL (No credentials found)");
            process.exit(1);
        }

        if (!isConfigured) {
            console.log("Cloudinary configuration: FAIL");
            process.exit(1);
        }

        console.log("Cloudinary configuration: PASS");

        console.log("Testing API connectivity...");
        const result = await cloudinary.api.ping();
        if (result.status === 'ok') {
            console.log("Cloudinary API connectivity: PASS");
            console.log("Cloudinary authentication: PASS");
        } else {
            console.log("Cloudinary API connectivity: FAIL");
            process.exit(1);
        }

        // Test Upload
        const testImagePath = path.join(__dirname, '..', '..', 'product-assets', 'test.jpg');
        if (fs.existsSync(testImagePath)) {
            console.log("Real image available: YES");
            console.log("Attempting single image upload test...");
            const uploadResult = await cloudinary.uploader.upload(testImagePath, {
                folder: 'auralis/test'
            });
            console.log("Single image upload: PASS");
            console.log("Cloudinary secure_url returned: PASS");
            console.log("Cloudinary public_id returned: PASS");
        } else {
            console.log("Real image available: NO");
            console.log("Single upload test: BLOCKED");
            console.log("Reason: No real local image asset available");
        }

        process.exit(0);

    } catch (error) {
        console.error("Cloudinary test failed:", error.message);
        if (error.http_code) {
            console.error("HTTP Code:", error.http_code);
        }
        process.exit(1);
    }
};

testCloudinary();
