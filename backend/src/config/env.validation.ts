import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().startsWith('postgresql://'),
  MONGO_URI: z.string().startsWith('mongodb'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  // URL del frontend a la que se redirige tras el login con Google.
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  JWT_SECRET: z.string().min(32, 'debe tener al menos 32 caracteres'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  // Dominio de la cookie del refresh token. En producción debe abarcar al
  // frontend y a la API (p. ej. ".dominiohackctf.com"); en dev se omite.
  COOKIE_DOMAIN: z.string().min(1).optional(),

  // Google OAuth es opcional: sin estas variables las rutas /auth/google responden 503.
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Variables de entorno inválidas:\n${issues}`);
  }
  return result.data;
}
