// utils/multerConfig.js
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const storage = multer.memoryStorage();

const compressAndSaveImage = async (buffer, destination, filename) => {
  try {
    const outputPath = path.join(destination, filename);

    // Ensure the destination directory exists
    fs.mkdirSync(destination, { recursive: true });

    // Compress and save the image
    await sharp(buffer)
      .resize({ width: 800 }) // Resize the image to a width of 800px
      .jpeg({ quality: 90 }) // Set JPEG quality to 90%
      .toFile(outputPath);

    return outputPath;
  } catch (err) {
    throw new Error("Failed to compress and save image");
  }
};

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Check if the file is an image
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("File is not an image"), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

const handleUpload = (req, res, next) => {
  const uploadSingle = upload.single("image");

  uploadSingle(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      return res.status(400).json({ errors: [{ msg: err.message }] });
    } else if (err) {
      // An unknown error occurred when uploading
      return res.status(400).json({ errors: [{ msg: err.message }] });
    }

    // If no file was uploaded
    if (!req.file) {
      return res.status(400).json({ errors: [{ msg: "Image is required" }] });
    }

    // Determine the upload path based on the URL
    let destination;
    if (req.originalUrl.includes("/api/doctors")) {
      destination = "uploads/doctors/";
    } else if (req.originalUrl.includes("/api/blogs")) {
      destination = "uploads/blogs/";
    } else {
      return res.status(400).json({ errors: [{ msg: "Invalid upload path" }] });
    }

    const filename = `${Date.now()}-${req.file.originalname}`;

    try {
      const outputPath = await compressAndSaveImage(req.file.buffer, destination, filename);
      req.file.path = outputPath;
      next();
    } catch (error) {
      return res.status(500).json({ errors: [{ msg: error.message }] });
    }
  });
};

module.exports = handleUpload;
