import { z } from 'zod';

// Una variable vacía en el .env (`FOO=`) llega como "" y rompe los .min(1):
// la tratamos como ausente para que .optional() aplique.
const optionalString = () =>
  z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().min(1).optional(),
  );

const envSchema = z
  .object({
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
    COOKIE_DOMAIN: optionalString(),

    // Google OAuth es opcional: sin estas variables las rutas /auth/google responden 503.
    GOOGLE_CLIENT_ID: optionalString(),
    GOOGLE_CLIENT_SECRET: optionalString(),
    GOOGLE_CALLBACK_URL: z.string().url().optional(),

    // WireGuard. En 'dev' el backend genera llaves y arma el .conf pero NO toca
    // la interfaz wg0 (sirve para probar en local sin root). En 'cli' ejecuta
    // `wg` sobre wg0: requiere la interfaz levantada y permisos (sudoers/CAP_NET_ADMIN).
    WG_MODE: z.enum(['dev', 'cli']).default('dev'),
    WG_INTERFACE: z.string().default('wg0'),
    // Clave pública del servidor WireGuard. Obligatoria en 'cli'; en 'dev' se
    // puede omitir (el .conf sale con un placeholder y se registra una advertencia).
    WG_SERVER_PUBLIC_KEY: optionalString(),
    // Endpoint alcanzable por el cliente: IP pública:puerto en prod, IP local en dev.
    WG_SERVER_ENDPOINT: z.string().default('127.0.0.1:51820'),
    // Pool de IPs de los peers (10.10.0.0/24); .1 es el servidor.
    WG_PEER_SUBNET_BASE: z.string().default('10.10.0'),
    WG_PEER_IP_START: z.coerce.number().int().min(2).max(254).default(2),
    // Lo que el cliente enruta por el túnel: las subredes de los labs.
    WG_CLIENT_ALLOWED_IPS: z.string().default('10.20.0.0/16'),
    // DNS opcional en el .conf (vacío = el cliente conserva su DNS).
    WG_CLIENT_DNS: z.string().optional(),
    // Si NestJS no corre como root, prefija los comandos wg con sudo (modo 'cli').
    WG_USE_SUDO: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
  })
  .superRefine((env, ctx) => {
    // En modo 'cli' el .conf debe llevar la clave pública real del servidor.
    if (env.WG_MODE === 'cli' && !env.WG_SERVER_PUBLIC_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['WG_SERVER_PUBLIC_KEY'],
        message: 'es obligatoria cuando WG_MODE=cli',
      });
    }
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
