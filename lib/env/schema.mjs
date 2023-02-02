// @ts-check
import { z } from "zod"

/**
 * Specify your server-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
export const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]),
  GOOGLE_CLOUD_PROJECT_ID: z.string(),
  GOOGLE_CLOUD_PROJECT_NUMBER: z.string().transform((s) => parseInt(s, 10)),
  GOOGLE_CLOUD_CLIENT_EMAIL: z.string().email(),
  GOOGLE_CLOUD_PRIVATE_KEY: z.string(),
  GOOGLE_CLOUD_STORAGE_OUTPUT_PREFIX: z.string(),
  GOOGLE_DOCUMENT_AI_LOCATION: z.string(),
  GOOGLE_DOCUMENT_AI_PROCESSOR_ID: z.string(),
})

/**
 * You can't destruct `process.env` as a regular object in the Next.js
 * middleware, so you have to do it manually here.
 * @type {{ [k in keyof z.input<typeof serverSchema>]: string | undefined }}
 */
export const serverEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  GOOGLE_CLOUD_PROJECT_NUMBER: process.env.GOOGLE_CLOUD_PROJECT_NUMBER,
  GOOGLE_CLOUD_CLIENT_EMAIL: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
  GOOGLE_CLOUD_PRIVATE_KEY: process.env.GOOGLE_CLOUD_PRIVATE_KEY,
  GOOGLE_CLOUD_STORAGE_OUTPUT_PREFIX:
    process.env.GOOGLE_CLOUD_STORAGE_OUTPUT_PREFIX,
  GOOGLE_DOCUMENT_AI_LOCATION: process.env.GOOGLE_DOCUMENT_AI_LOCATION,
  GOOGLE_DOCUMENT_AI_PROCESSOR_ID: process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID,
}

/**
 * Specify your client-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 * To expose them to the client, prefix them with `NEXT_PUBLIC_`.
 */
export const clientSchema = z.object({
  // NEXT_PUBLIC_CLIENTVAR: z.string(),
})

/**
 * You can't destruct `process.env` as a regular object, so you have to do
 * it manually here. This is because Next.js evaluates this at build time,
 * and only used environment variables are included in the build.
 * @type {{ [k in keyof z.input<typeof clientSchema>]: string | undefined }}
 */
export const clientEnv = {
  // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
}
