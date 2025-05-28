import { z } from 'zod';

export const uploadSchema = z.object({
  clipStart: z.coerce.number().min(0).default(0),
  clipEnd: z.coerce.number().min(0),
  outputWidth: z.coerce.number().min(480).max(1920).default(1080),
  outputHeight: z.coerce.number().min(640).max(3840).default(1920)
});

export type UploadSchemaType = z.infer<typeof uploadSchema>;


