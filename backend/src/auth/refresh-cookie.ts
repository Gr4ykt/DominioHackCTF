import type { CookieOptions, Request, Response } from 'express';

export const REFRESH_COOKIE = 'dhctf_refresh';

export interface RefreshCookieConfig {
  secure: boolean;
  domain?: string;
}

// httpOnly: inaccesible desde JavaScript. SameSite=Lax: el navegador no la
// envía en peticiones POST iniciadas desde otros sitios (mitiga CSRF).
function baseOptions(config: RefreshCookieConfig): CookieOptions {
  return {
    httpOnly: true,
    secure: config.secure,
    sameSite: 'lax',
    path: '/',
    domain: config.domain,
  };
}

export function setRefreshCookie(
  res: Response,
  token: string,
  expires: Date,
  config: RefreshCookieConfig,
): void {
  res.cookie(REFRESH_COOKIE, token, { ...baseOptions(config), expires });
}

export function clearRefreshCookie(
  res: Response,
  config: RefreshCookieConfig,
): void {
  res.clearCookie(REFRESH_COOKIE, baseOptions(config));
}

export function readRefreshCookie(req: Request): string | undefined {
  const value: unknown = req.cookies?.[REFRESH_COOKIE];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
