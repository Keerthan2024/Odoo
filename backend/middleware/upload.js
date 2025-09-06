const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads/products directory');
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const userId = req.user ? req.user.id : 'user';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${userId}_${timestamp}${ext}`;
    cb(null, uniqueName);
  }
});

// File filter with better validation
const fileFilter = (req, file, cb) => {
  console.log('🔍 Checking file:', file.originalname, 'Type:', file.mimetype);
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    console.log('✅ File type accepted');
    cb(null, true);
  } else {
    console.log('❌ File type rejected:', file.mimetype);
    cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WebP images are allowed.`), false);
  }
};

// FIXED: Configure multer with higher limits to prevent LIMIT_PART_COUNT error
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Maximum 1 file per request
    fields: 20, // ADDED: Maximum number of non-file fields
    fieldNameSize: 100, // ADDED: Maximum field name size
    fieldSize: 1 * 1024 * 1024, // ADDED: Maximum field value size (1MB)
    parts: 25 // ADDED: Maximum number of parts (fields + files)
  },
  fileFilter: fileFilter
});

// Enhanced middleware with comprehensive error handling
const handleImageUpload = (req, res, next) => {
  console.log('📤 Processing file upload...');
  
  const uploadSingle = upload.single('image');
  
  uploadSingle(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.log('❌ Multer Error:', err.code, err.message);
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.',
          details: `File size limit: 5MB`
        });
      }
      if (err.code === 'LIMIT_PART_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many form fields. Reduce the number of fields in your request.',
          details: `Maximum allowed parts: 25`
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Upload only one image per request.',
          details: `Maximum files: 1`
        });
      }
      if (err.code === 'LIMIT_FIELD_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many form fields.',
          details: `Maximum fields: 20`
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Unexpected field name. Use "image" as the field name for file upload.',
          details: `Expected field: "image", received: "${err.field}"`
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message,
        code: err.code
      });
    } else if (err) {
      console.log('❌ Custom Error:', err.message);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // Log successful upload
    if (req.file) {
      console.log('✅ File uploaded successfully:', req.file.filename);
      console.log('📁 File path:', req.file.path);
      console.log('📊 File size:', req.file.size, 'bytes');
      console.log('🏷️ File type:', req.file.mimetype);
    } else {
      console.log('⚠️ No file uploaded (this is ok for optional file uploads)');
    }
    
    next();
  });
};

// Optional: Create a middleware for handling form-data without file upload
const handleFormDataOnly = (req, res, next) => {
  console.log('📝 Processing form data without file upload...');
  
  // Use multer to parse form-data even without files
  const parseFormData = upload.none();
  
  parseFormData(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.log('❌ Form Data Error:', err.code, err.message);
      return res.status(400).json({
        success: false,
        message: 'Form data processing error: ' + err.message
      });
    } else if (err) {
      console.log('❌ Custom Error:', err.message);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    console.log('✅ Form data processed successfully');
    next();
  });
};

module.exports = {
  handleImageUpload,
  handleFormDataOnly,
  uploadsDir,
  // Export the raw upload instance for advanced usage
  upload
};
