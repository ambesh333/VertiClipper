import { z } from 'zod';


export const composeSchema = z.object({
    sessionid: z.string(),
    clip: z.object({
      start: z.number().min(0),
      end: z.number().min(0),
    }),
    overlays: z
      .array(
        z.object({
          x: z.number().int().min(0),
          y: z.number().int().min(0),
          width: z.number().int().min(1),
          height: z.number().int().min(1),
          opacity: z.number().min(0).max(100).optional().default(1),
        })
      )
      .max(2)
      .optional()
      .default([]),
  });
  

export type composeSchemaType = z.infer<typeof composeSchema>;