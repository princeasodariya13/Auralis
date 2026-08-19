import multer from 'multer';
import path from 'path';

// Define storage: use a temporary local directory
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Will create uploads folder if missing in some setups, better to ensure it exists or use os.tmpdir()
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Since the uploads folder might not exist, let's just use memory storage or require fs to create it.
// Actually, os.tmpdir() is safer.
import os from 'os';
const safeStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, os.tmpdir());
    },
    filename: function(req, file, cb) {
        cb(null, `auralis-upload-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image file.'), false);
    }
};

export const upload = multer({ 
    storage: safeStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter
});
