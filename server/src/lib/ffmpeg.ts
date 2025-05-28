import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs/promises';

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  codec: string;
}

export interface OverlayConfig {
  path: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
}

export interface CompositionConfig {
  sessionId: string;
  videoPath: string;
  backgroundPath: string;
  overlays: OverlayConfig[];
  clipStart: number;
  clipEnd: number;
  outputWidth: number;
  outputHeight: number;
}

export const getVideoMetadata = (videoPath: string): Promise<VideoMetadata> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err: Error, metadata: any) => {
      if (err) {
        console.error('❌ FFprobe error:', err);
        reject(err);
        return;
      }

      try {
        const videoStream = metadata.streams.find((stream: any) => stream.codec_type === 'video');
        
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        const duration = parseFloat(metadata.format.duration || '0');
        const width = videoStream.width || 0;
        const height = videoStream.height || 0;
        
        let fps = 30; 
        if (videoStream.r_frame_rate) {
          const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
          fps = den ? num / den : 30;
        }

        const bitrate = parseInt(metadata.format.bit_rate || '0');
        const codec = videoStream.codec_name || 'unknown';

        resolve({
          duration,
          width,
          height,
          fps,
          bitrate,
          codec
        });
      } catch (error) {
        console.error('❌ Metadata parsing error:', error);
        reject(error);
      }
    });
  });
};

export const composeVerticalVideo = (config: CompositionConfig): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const outputPath = path.join('outputs', `final-${config.sessionId}.mp4`);
      
      console.log('🎬 Starting video composition...');
      console.log('📐 Output dimensions:', `${config.outputWidth}x${config.outputHeight}`);
      console.log('✂️ Clip duration:', `${config.clipStart}s - ${config.clipEnd}s`);
      
      const videoMetadata = await getVideoMetadata(config.videoPath);
      const aspectRatio = videoMetadata.width / videoMetadata.height;
      let scaledWidth = config.outputWidth;
      let scaledHeight = Math.round(scaledWidth / aspectRatio);
      
      if (scaledHeight > config.outputHeight * 0.7) { 
        scaledHeight = Math.round(config.outputHeight * 0.7);
        scaledWidth = Math.round(scaledHeight * aspectRatio);
      }
      
      const videoX = Math.round((config.outputWidth - scaledWidth) / 2);
      const videoY = Math.round((config.outputHeight - scaledHeight) / 2);
      
      console.log('📹 Video placement:', `${scaledWidth}x${scaledHeight} at (${videoX}, ${videoY})`);

      let command = ffmpeg();
      
      command = command
        .input(config.backgroundPath)
        .input(config.videoPath);    

      config.overlays.forEach((overlay) => {
        command = command.input(overlay.path);
      });

      let filterComplex = [];

      filterComplex.push(`[0:v]scale=${config.outputWidth}:${config.outputHeight}[bg]`);

      filterComplex.push(
        `[1:v]trim=start=${config.clipStart}:end=${config.clipEnd},setpts=PTS-STARTPTS,scale=${scaledWidth}:${scaledHeight}[video]`
      );
      
      filterComplex.push(`[bg][video]overlay=${videoX}:${videoY}[v1]`);

      let currentLabel = 'v1';
      config.overlays.forEach((overlay, index) => {
        const inputIndex = index + 2; 
        const outputLabel = index === config.overlays.length - 1 ? 'final' : `v${index + 2}`;
        const opacity = overlay.opacity || 1.0;
        
        filterComplex.push(
          `[${inputIndex}:v]scale=${overlay.width}:${overlay.height}[overlay${index}]`
        );
        
        if (opacity < 1.0) {
          filterComplex.push(
            `[overlay${index}]format=rgba,colorchannelmixer=aa=${opacity}[overlay${index}_alpha]`
          );
          filterComplex.push(
            `[${currentLabel}][overlay${index}_alpha]overlay=${overlay.x}:${overlay.y}[${outputLabel}]`
          );
        } else {
          filterComplex.push(
            `[${currentLabel}][overlay${index}]overlay=${overlay.x}:${overlay.y}[${outputLabel}]`
          );
        }
        
        currentLabel = outputLabel;
      });

      command = command
        .complexFilter(filterComplex)
        .map('[final]')
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-preset fast',
          '-crf 23',
          '-profile:v high',
          '-level 4.0',
          '-pix_fmt yuv420p',
          '-movflags +faststart',
          `-r ${Math.min(videoMetadata.fps, 30)}` 
        ])
        .output(outputPath);

      command.on('start', (commandLine: string) => {
        console.log('🚀 FFmpeg command:', commandLine);
      });

      command.on('progress', (progress: any) => {
        if (progress.percent) {
          console.log(`⏳ Processing: ${Math.round(progress.percent)}%`);
        }
      });

      command.on('end', () => {
        console.log('✅ Video composition completed:', outputPath);
        resolve(outputPath);
      });

      command.on('error', (error: Error, stdout: string | null, stderr: string | null) => {
        console.error('❌ FFmpeg error:', error.message);
        if (stderr) console.error('📄 Stderr:', stderr);
        reject(error);
      });
    
      command.run();

    } catch (error) {
      console.error('❌ Composition setup failed:', error);
      reject(error);
    }
  });
};

export const getVideoDuration = async (videoPath: string): Promise<number> => {
  const metadata = await getVideoMetadata(videoPath);
  return metadata.duration;
};

export const validateVideoFormat = (videoPath: string): Promise<boolean> => {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(videoPath, (err: Error, metadata: any) => {
      if (err) {
        resolve(false);
        return;
      }
      
      const videoStream = metadata.streams.find((stream: any) => stream.codec_type === 'video');
      const supportedCodecs = ['h264', 'h265', 'vp8', 'vp9', 'av1'];
      
      resolve(
        videoStream !== undefined &&
        supportedCodecs.includes(videoStream.codec_name || '')
      );
    });
  });
};

export const downresTo320p = (inputPath: string, outputDir: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      await fs.mkdir(outputDir, { recursive: true });
      const originalName = path.basename(inputPath);
      const outputPath = path.join(outputDir, `downres-${originalName}`);

      ffmpeg(inputPath)
        .videoFilters('scale=-2:320')
        .videoCodec('libx264')
        .outputOptions([
          '-preset veryfast',
          '-crf 23',
          '-movflags +faststart'
        ])
        .on('start', cmd => {
          console.log('🔧 Down-res command:', cmd);
        })
        .on('error', err => {
          console.error('❌ Down-res failed:', err);
          reject(err);
        })
        .on('end', () => {
          console.log('✅ Down-res complete:', outputPath);
          resolve(outputPath);
        })
        .save(outputPath);
    } catch (err) {
      reject(err);
    }
  });
};