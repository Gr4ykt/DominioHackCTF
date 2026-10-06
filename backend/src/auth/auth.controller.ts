import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { Env } from '../config/env.validation.js';
import { AuthService, AuthSession, PublicUser } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { GoogleAuthGuard } from './guards/google-auth.guard.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import {
  clearRefreshCookie,
  readRefreshCookie,
  RefreshCookieConfig,
  setRefreshCookie,
} from './refresh-cookie.js';
import type { AuthUser, GoogleRequest } from './types/auth-user.js';

interface AuthResponse {
  access_token: string;
  user: PublicUser;
}

@Controller('auth')
export class AuthController {
  private readonly cookieConfig: RefreshCookieConfig;

  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {
    this.cookieConfig = {
      secure: config.get('NODE_ENV', { infer: true }) === 'production',
      domain: config.get('COOKIE_DOMAIN', { infer: true }),
    };
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return this.respond(res, await this.authService.register(dto));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return this.respond(res, await this.authService.login(dto));
  }

  // El refresh token llega y vuelve solo por cookie httpOnly.
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const token = readRefreshCookie(req);
    if (!token) throw new UnauthorizedException('Sesión no iniciada');
    try {
      return this.respond(res, await this.authService.refresh(token));
    } catch (error) {
      clearRefreshCookie(res, this.cookieConfig);
      throw error;
    }
  }

  // Sin guard JWT: debe poder cerrarse la sesión aunque el access token haya expirado.
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const token = readRefreshCookie(req);
    if (token) await this.authService.logout(token);
    clearRefreshCookie(res, this.cookieConfig);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user.id);
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleLogin() {
    // Passport redirige a Google; este método no ejecuta lógica.
  }

  // Deja la cookie de sesión y vuelve al frontend sin tokens en la URL;
  // el frontend obtiene su access token con POST /auth/refresh.
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req: GoogleRequest, @Res() res: Response) {
    const callbackUrl = `${this.config.get('FRONTEND_URL', { infer: true })}/oauth/callback`;
    try {
      const session = await this.authService.loginWithGoogle(req.user);
      this.respond(res, session);
      res.redirect(callbackUrl);
    } catch {
      res.redirect(`${callbackUrl}?error=google_auth_failed`);
    }
  }

  private respond(res: Response, session: AuthSession): AuthResponse {
    setRefreshCookie(
      res,
      session.refreshToken,
      session.refreshExpiresAt,
      this.cookieConfig,
    );
    return { access_token: session.accessToken, user: session.user };
  }
}
