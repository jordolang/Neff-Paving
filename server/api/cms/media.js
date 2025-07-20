const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'neff_paving_admin',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Ensure uploads directory exists
const ensureUploadDir = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const folder = req.body.folder || 'uploads';
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', folder);
    await ensureUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExtension)
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();
    cb(null, `${baseName}-${uniqueSuffix}${fileExtension}`);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files at once
  }
});

// GET /api/cms/media - List media files
router.get('/media', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const folder = req.query.folder || null;
    const mimeType = req.query.mime_type || null;
    const search = req.query.search || null;
    const offset = (page - 1) * limit;

    // Build query with optional filters
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    
    if (folder) {
      whereClause += ' AND folder = $' + (queryParams.length + 1);
      queryParams.push(folder);
    }
    
    if (mimeType) {
      whereClause += ' AND mime_type LIKE $' + (queryParams.length + 1);
      queryParams.push(`${mimeType}%`);
    }
    
    if (search) {
      whereClause += ' AND (original_name ILIKE $' + (queryParams.length + 1) + 
                     ' OR alt_text ILIKE $' + (queryParams.length + 1) + 
                     ' OR description ILIKE $' + (queryParams.length + 1) + ')';
      queryParams.push(`%${search}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM media_files ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalFiles = parseInt(countResult.rows[0].count);

    // Get files with pagination
    const filesQuery = `
      SELECT 
        id, filename, original_name, file_path, file_size, 
        mime_type, alt_text, description, folder, uploaded_at
      FROM media_files 
      ${whereClause}
      ORDER BY uploaded_at DESC 
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    queryParams.push(limit, offset);
    const filesResult = await pool.query(filesQuery, queryParams);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalFiles / limit);

    // Generate file URLs
    const filesWithUrls = filesResult.rows.map(file => ({
      ...file,
      url: `/uploads/${file.folder}/${file.filename}`,
      size_formatted: formatFileSize(file.file_size)
    }));

    res.json({
      files: filesWithUrls,
      pagination: {
        currentPage: page,
        totalPages,
        totalFiles,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching media files:', error);
    res.status(500).json({ error: 'Failed to fetch media files', details: error.message });
  }
});

// POST /api/cms/media/upload - Upload files with multer
router.post('/media/upload', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const folder = req.body.folder || 'uploads';
    const uploadedFiles = [];

    // Process each uploaded file
    for (const file of req.files) {
      const filePath = `/uploads/${folder}/${file.filename}`;
      
      // Insert file metadata into database
      const query = `
        INSERT INTO media_files (
          filename, original_name, file_path, file_size, 
          mime_type, alt_text, description, folder
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        ) RETURNING *
      `;
      
      const result = await pool.query(query, [
        file.filename,
        file.originalname,
        filePath,
        file.size,
        file.mimetype,
        req.body.alt_text || '',
        req.body.description || '',
        folder
      ]);

      uploadedFiles.push({
        ...result.rows[0],
        url: filePath,
        size_formatted: formatFileSize(file.size)
      });
    }

    res.status(201).json({
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    
    // Clean up uploaded files if database insertion failed
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      }
    }
    
    res.status(500).json({ error: 'Failed to upload files', details: error.message });
  }
});

// DELETE /api/cms/media/:id - Delete media
router.delete('/media/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get file info before deletion
    const fileQuery = 'SELECT * FROM media_files WHERE id = $1';
    const fileResult = await pool.query(fileQuery, [id]);
    
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Media file not found' });
    }

    const file = fileResult.rows[0];
    
    // Delete from database
    await pool.query('DELETE FROM media_files WHERE id = $1', [id]);
    
    // Delete physical file
    try {
      const physicalPath = path.join(process.cwd(), 'public', file.file_path);
      await fs.unlink(physicalPath);
    } catch (fsError) {
      console.warn('Warning: Could not delete physical file:', fsError.message);
      // Continue execution - database record is already deleted
    }

    res.json({
      message: 'Media file deleted successfully',
      deletedFile: file
    });
  } catch (error) {
    console.error('Error deleting media file:', error);
    res.status(500).json({ error: 'Failed to delete media file', details: error.message });
  }
});

// PUT /api/cms/media/:id - Update media metadata
router.put('/media/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { alt_text, description, folder } = req.body;

    // Check if file exists
    const existingFile = await pool.query('SELECT * FROM media_files WHERE id = $1', [id]);
    if (existingFile.rows.length === 0) {
      return res.status(404).json({ error: 'Media file not found' });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCounter = 1;

    if (alt_text !== undefined) {
      updateFields.push(`alt_text = $${paramCounter++}`);
      updateValues.push(alt_text);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCounter++}`);
      updateValues.push(description);
    }
    if (folder !== undefined) {
      updateFields.push(`folder = $${paramCounter++}`);
      updateValues.push(folder);
      
      // Update file_path to reflect new folder
      const currentFile = existingFile.rows[0];
      const newFilePath = `/uploads/${folder}/${currentFile.filename}`;
      updateFields.push(`file_path = $${paramCounter++}`);
      updateValues.push(newFilePath);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const query = `
      UPDATE media_files 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `;
    
    updateValues.push(id);
    const result = await pool.query(query, updateValues);

    // If folder was changed, move the physical file
    if (folder && folder !== existingFile.rows[0].folder) {
      try {
        const oldPath = path.join(process.cwd(), 'public', existingFile.rows[0].file_path);
        const newFolderPath = path.join(process.cwd(), 'public', 'uploads', folder);
        const newPath = path.join(newFolderPath, existingFile.rows[0].filename);
        
        await ensureUploadDir(newFolderPath);
        await fs.rename(oldPath, newPath);
      } catch (fsError) {
        console.warn('Warning: Could not move physical file:', fsError.message);
      }
    }

    const updatedFile = {
      ...result.rows[0],
      url: result.rows[0].file_path,
      size_formatted: formatFileSize(result.rows[0].file_size)
    };

    res.json({
      message: 'Media metadata updated successfully',
      file: updatedFile
    });
  } catch (error) {
    console.error('Error updating media metadata:', error);
    res.status(500).json({ error: 'Failed to update media metadata', details: error.message });
  }
});

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 10 files at once.' });
    }
  }
  
  if (error.message.includes('File type') && error.message.includes('not allowed')) {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
});

module.exports = router;
