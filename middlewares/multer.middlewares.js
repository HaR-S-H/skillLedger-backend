import multer from "multer";

// Store file in memory buffer (RAM) for Pinata
const storage = multer.memoryStorage();

 const upload = multer({ 
  storage,
  fileFilter: function (req, file, cb) {
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
 });

export default upload;

