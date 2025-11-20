import multer from 'multer';
import { GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';
import crypto from 'crypto';

// Configure multer for memory storage
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedMimeTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Audio
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm',
      // Video
      'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov',
      // Documents
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // Archives
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

// Get GridFS bucket
export const getGridFSBucket = () => {
  if (!mongoose.connection.readyState) {
    throw new Error('Database not connected');
  }
  return new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
};

// Upload file to GridFS
export const uploadToGridFS = (file, metadata = {}) => {
  return new Promise((resolve, reject) => {
    const bucket = getGridFSBucket();
    const filename = `${Date.now()}-${crypto.randomUUID()}-${file.originalname}`;
    
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
        ...metadata
      }
    });

    uploadStream.end(file.buffer);

    uploadStream.on('finish', () => {
      resolve({
        fileId: uploadStream.id,
        filename,
        size: file.size,
        mimeType: file.mimetype,
        originalName: file.originalname
      });
    });

    uploadStream.on('error', (error) => {
      reject(error);
    });
  });
};

// Delete file from GridFS
export const deleteFromGridFS = (fileId) => {
  return new Promise((resolve, reject) => {
    const bucket = getGridFSBucket();
    
    bucket.delete(new mongoose.Types.ObjectId(fileId), (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

// Get file stream from GridFS
export const getFileStream = (fileId) => {
  const bucket = getGridFSBucket();
  return bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
};

// Get file info from GridFS
export const getFileInfo = async (fileId) => {
  const bucket = getGridFSBucket();
  
  return new Promise((resolve, reject) => {
    bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).next((err, file) => {
      if (err) {
        reject(err);
      } else if (!file) {
        reject(new Error('File not found'));
      } else {
        resolve(file);
      }
    });
  });
};

// Determine message type based on MIME type
export const getMessageTypeFromMimeType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  return 'file';
};