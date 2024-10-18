// src/app/utils/env.ts

import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    JWT_SECRET: z.string().min(1),
    LIT_PRIVATE_KEY: z.string().min(1),
    LIT_CAPACITY_CREDIT_TOKEN_ID: z.string().min(1),
    CRON_SECRET: z.string().min(1),
  },
  /*
   * Environment variables available on the client (and server).
   *
   * 💡 You'll get type errors if these are not prefixed with NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_RPC_URL: z.string().min(1),
    NEXT_PUBLIC_IRYS_NODE_URL: z.string().min(1),
    NEXT_PUBLIC_ENABLE_PRIVATE_FILE_UPLOAD: z.boolean().default(false),
    NEXT_PUBLIC_APP_URL: z.string().min(1),
  },
  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * we need to manually destructure them to make sure all are included in bundle.
   *
   * 💡 You'll get type errors if not all variables from `server` & `client` are included here.
   */
  runtimeEnv: {
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXT_PUBLIC_IRYS_NODE_URL: process.env.NEXT_PUBLIC_IRYS_NODE_URL,
    LIT_PRIVATE_KEY: process.env.LIT_PRIVATE_KEY,
    LIT_CAPACITY_CREDIT_TOKEN_ID: process.env.LIT_CAPACITY_CREDIT_TOKEN_ID,
    NEXT_PUBLIC_ENABLE_PRIVATE_FILE_UPLOAD:
      process.env.NEXT_PUBLIC_ENABLE_PRIVATE_FILE_UPLOAD === 'true',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    CRON_SECRET: process.env.CRON_SECRET,
  },
});
