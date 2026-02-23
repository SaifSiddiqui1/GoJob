const multer = require('multer');

// Store in memory buffer (we upload directly to Cloudinary)
const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const pdfFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and image files are allowed!'), false);
    }
};

const anyFilter = (req, file, cb) => cb(null, true);

exports.uploadImage = multer({
    storage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

exports.uploadResume = multer({
    storage,
    fileFilter: pdfFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

exports.uploadFile = multer({
    storage,
    fileFilter: anyFilter,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});
