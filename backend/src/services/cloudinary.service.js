import { v2 as cloudinary } from 'cloudinary';

// Configuration
// We expect CLOUDINARY_URL (e.g. cloudinary://API_KEY:API_SECRET@CLOUD_NAME) 
// OR the individual CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in the environment.
// The Cloudinary SDK automatically picks up CLOUDINARY_URL if it exists.
// We only manually configure it if the individual variables are provided.
// However, we only configure it if they are present, to not crash if they aren't initialized yet.
const configureCloudinary = () => {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
    }
};

/**
 * Uploads an image file to Cloudinary.
 * @param {string} filePath - The local path to the file.
 * @param {string} folder - The folder in Cloudinary (e.g., 'auralis/products').
 * @returns {Promise<Object>} An object containing public_id, url (secure_url), width, height.
 */
export const uploadImage = async (filePath, folder = 'auralis/products', options = {}) => {
    configureCloudinary();
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            use_filename: true,
            unique_filename: false, // Changed to false to prevent random suffixes
            overwrite: true,
            ...options
        });

        return {
            publicId: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
    }
};

/**
 * Deletes an image from Cloudinary by its public_id.
 * @param {string} publicId - The Cloudinary public_id of the image to delete.
 */
export const deleteImage = async (publicId) => {
    configureCloudinary();
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error(`Failed to delete image from Cloudinary: ${error.message}`);
    }
};

export default {
    uploadImage,
    deleteImage
};
