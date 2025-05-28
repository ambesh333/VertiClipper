import fs from 'fs/promises';
import path from 'path';


export const validateFileType = (file: Express.Multer.File): { valid: boolean; message: string } => {
  const { fieldname, mimetype, originalname } = file;
  
  switch (fieldname) {
    case 'video':
      const videoTypes = [
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo', 
        'video/webm',
        'video/x-ms-wmv',
        'video/3gpp'
      ];
      
      if (!videoTypes.includes(mimetype)) {
        return {
          valid: false,
          message: `Invalid video format: ${mimetype}. Supported formats: MP4, MOV, AVI, WebM, WMV, 3GP`
        };
      }
      break;
      
    case 'background':
    case 'overlays':
      const imageTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/bmp',
        'image/tiff'
      ];
      
      if (!imageTypes.includes(mimetype)) {
        return {
          valid: false,
          message: `Invalid image format: ${mimetype}. Supported formats: JPEG, PNG, WebP, BMP, TIFF`
        };
      }
      break;
      
    default:
      return {
        valid: false,
        message: `Unknown field: ${fieldname}`
      };
  }
  
  const ext = path.extname(originalname).toLowerCase();
  const allowedVideoExts = ['.mp4', '.mov', '.avi', '.webm', '.wmv', '.3gp'];
  const allowedImageExts = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'];
  
  if (fieldname === 'video' && !allowedVideoExts.includes(ext)) {
    return {
      valid: false,
      message: `Invalid video file extension: ${ext}`
    };
  }
  
  if ((fieldname === 'background' || fieldname === 'overlays') && !allowedImageExts.includes(ext)) {
    return {
      valid: false,
      message: `Invalid image file extension: ${ext}`
    };
  }
  
  return { valid: true, message: 'Valid file' };
};


export const createDirectories = async (): Promise<void> => {
  const dirs = ['uploads', 'outputs'];
  
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  }
};


export const cleanupOldFiles = async (): Promise<void> => {
  const dirs = ['uploads', 'outputs'];
  const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); 
  
  for (const dir of dirs) {
    try {
      const files = await fs.readdir(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          await fs.unlink(filePath);
          console.log(`🗑️ Cleaned up old file: ${filePath}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error cleaning up ${dir}:`, error);
    }
  }
};


export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^\w\s.-]/g, '') 
    .replace(/\s+/g, '_')     
    .substring(0, 100);    
};

export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const getFileSize = async (filePath: string): Promise<number> => {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
};

export const createErrorResponse = (message: string, statusCode: number = 400) => {
  return {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };
};

export const createSuccessResponse = (data: any, message?: string) => {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
};