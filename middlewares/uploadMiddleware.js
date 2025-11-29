// middlewares/uploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// uploads folder ensure
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname); // .jpg / .png / .pdf
        const base =
            file.fieldname +
            "-" +
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9);
        cb(null, base + ext);
    },
});

// simple filter – sab allow kar rahe hain
const fileFilter = (req, file, cb) => {
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
});

module.exports = upload;
