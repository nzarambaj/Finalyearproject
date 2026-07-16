const multer = require("multer");

// Files are held in memory and streamed to Cloudinary;
// nothing is written to the local disk.
module.exports = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024
    }
});
