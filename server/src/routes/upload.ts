import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { getVideoMetadata, downresTo320p } from '../lib/ffmpeg';
import { validateFileType, createDirectories } from '../lib/helper';

interface UploadResponse {
  success: boolean;
  data?: {
    sessionId: string;
    video: {
      path: string;
      metadata: {
        duration: number;
        width: number;
        height: number;
        fps: number;
        bitrate: number;
        codec: string;
      };
      downresPath: string;
    };
    background: {
      path: string;
      metadata: {
        width: number;
        height: number;
        format: string;
        size: number;
      };
    };
    overlays: Array<{ path: string; metadata: { width: number; height: number; format: string; size: number; index: number } }>;
  };
}

const router = Router();

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      await createDirectories();
      cb(null, 'uploads/');
    } catch (err) {
      cb(err as Error, '');
    }
  },
  filename: (_req, file, cb) => {
    cb(null, file.originalname); 
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const { valid, message } = validateFileType(file);
    valid ? cb(null, true) : cb(new Error(message));
  },
  limits: { fileSize: 100 * 1024 * 1024, files: 4 }
});

const fields = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'background', maxCount: 1 },
  { name: 'overlays', maxCount: 2 }
]);

router.post('/', fields, async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Record<string, Express.Multer.File[]>;
    const sessionId = uuidv4();
    const uploadDir = path.join('uploads', sessionId);

    await fs.mkdir(uploadDir, { recursive: true });

    const videoFile = files.video?.[0];
    const bgFile = files.background?.[0];
    const overlayFiles = files.overlays || [];

    if (!videoFile) {
      res.status(400).json({ success: false, error: 'Video is required.' });
      return;
    }
    if (!bgFile) {
      res.status(400).json({ success: false, error: 'Background is required.' });
      return;
    }
    if (overlayFiles.length > 2) {
      res.status(400).json({ success: false, error: 'Max 2 overlays allowed.' });
      return;
    }

    const move = async (file: Express.Multer.File, prefix: string) => {
      const dest = path.join(uploadDir, `${prefix}-${file.originalname}`);
      await fs.rename(file.path, dest);
      return dest;
    };

    const videoPath = await move(videoFile, 'video');
    const bgPath = await move(bgFile, 'bg');
    const overlayPaths = await Promise.all(
      overlayFiles.map((file, index) => move(file, `overlay${index + 1}`))
    );

    const vidMeta = await getVideoMetadata(videoPath);
    if (vidMeta.width <= vidMeta.height) {
      res.status(400).json({ success: false, error: 'Video must be horizontal.' });
      return;
    }

    const bgMeta = await getVideoMetadata(bgPath);
    if (bgMeta.height <= bgMeta.width) {
      res.status(400).json({
        success: false,
        error: `Background must be vertical. current size ${bgMeta.height}x${bgMeta.width}`
      });
      return;
    }

    const overlaysData = await Promise.all(
      overlayPaths.map(async (p, i) => {
        const m = await getVideoMetadata(p);
        return {
          path: p,
          metadata: {
            width: m.width,
            height: m.height,
            format: '',
            size: (await fs.stat(p)).size,
            index: i
          }
        };
      })
    );

    const downresPath = await downresTo320p(videoPath, uploadDir);

    res.json({
      success: true,
      data: {
        sessionId,
        video: {
          path: videoPath,
          metadata: vidMeta,
          downresPath
        },
        background: {
          path: bgPath,
          metadata: {
            width: bgMeta.width,
            height: bgMeta.height,
            format: '',
            size: (await fs.stat(bgPath)).size
          }
        },
        overlays: overlaysData
      }
    } as UploadResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
