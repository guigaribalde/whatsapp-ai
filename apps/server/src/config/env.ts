import { z } from 'zod'

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string(),
  FIREWORKS_API_KEY: z.string(),
  GEMINI_API_KEY: z.string(),
  OPENAI_API_KEY: z.string(),
  ANTHROPIC_API_KEY: z.string(),
  LOCAL_SESSION: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

export const env = envSchema.parse(process.env)
