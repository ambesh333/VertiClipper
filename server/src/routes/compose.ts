import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { composeVerticalVideo, getVideoDuration } from '../lib/ffmpeg';
import { composeSchema } from '../validators/composeSchema';

const router = Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  console.log("body",req.body)
  const startTime = Date.now();

  try {
    const parseResult = composeSchema.safeParse(req.body);
    if (!parseResult.success) {
      (res.status(400).json({
        success: false,
        error: `Validation error: ${parseResult.error.errors[0].message}`,
      }) as unknown as void);
      return;
    }

    const { sessionid, clip, overlays } = parseResult.data;
    const sessionDir = path.join('uploads', sessionid);

    try {
      await fs.access(sessionDir);
    } catch {
      (res.status(404).json({
        success: false,
        error: 'Session folder not found. Please upload files first.',
      }) as unknown as void);
      return;
    }

    const files = await fs.readdir(sessionDir);
    const fullPaths = files.map(f => path.join(sessionDir, f));

    const videoFile = fullPaths.find(f => path.basename(f).includes('video-'));
    const backgroundFile = fullPaths.find(f => path.basename(f).includes('bg-'));

    if (!videoFile) {
      (res.status(400).json({ success: false, error: 'No video file with "video-" suffix found in session.' }) as unknown as void);
      return;
    }

    if (!backgroundFile) {
      (res.status(400).json({ success: false, error: 'No background file with "bg-" suffix found in session.' }) as unknown as void);
      return;
    }

    const videoDuration = await getVideoDuration(videoFile);

    if (clip.start >= clip.end) {
      (res.status(400).json({
        success: false,
        error: 'Clip start time must be less than end time.',
      }) as unknown as void);
      return;
    }

    if (clip.end > videoDuration) {
      (res.status(400).json({
        success: false,
        error: `Clip end time (${clip.end}s) exceeds video duration (${videoDuration.toFixed(1)}s).`,
      }) as unknown as void);
      return;
    }

    if (clip.end - clip.start > 60) {
      (res.status(400).json({
        success: false,
        error: 'Maximum clip duration is 60 seconds.',
      }) as unknown as void);
      return;
    }

    const overlayFiles = fullPaths.filter(f =>
      ['overlay1-', 'overlay2-'].some(prefix =>
        path.basename(f).startsWith(prefix)
      )
    );

    const overlayConfigs = overlays.map((overlay, index) => {
      const prefix = `overlay${index + 1}-`;
      const matchingFile = overlayFiles.find(f =>
        path.basename(f).startsWith(prefix)
      );
      if (!matchingFile) {
        throw new Error(`Overlay #${index + 1} file not found in session folder`);
      }
      return { ...overlay, path: matchingFile };
    });

    const compositionConfig = {
      sessionId: sessionid,
      videoPath: videoFile,
      backgroundPath: backgroundFile, 
      clipStart: clip.start,
      clipEnd: clip.end,
      outputWidth: 1080,
      outputHeight: 1920,
      overlays: overlayConfigs
    };

    const outputPath = await composeVerticalVideo(compositionConfig);
    const processingTime = Date.now() - startTime;
    const stats = await fs.stat(outputPath);

    (res.json({
      success: true,
      data: {
        videoUrl: `/outputs/${path.basename(outputPath)}`,
        duration: clip.end - clip.start,
        fileSize: stats.size,
        processingTime,
      },
    }) as unknown as void);
    return;

  } catch (err) {
    console.error('❌ Composition error:', err);
    (res.status(500).json({
      success: false,
      error: 'Internal server error during composition.',
    }) as unknown as void);
    return;
  }
});

export default router;
