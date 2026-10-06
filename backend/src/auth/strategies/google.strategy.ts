import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import type { Env } from '../../config/env.validation.js';
import type { GoogleProfile } from '../types/auth-user.js';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService<Env, true>) {
    // Sin credenciales se registra con valores vacíos; GoogleAuthGuard corta
    // antes de que la estrategia llegue a usarse.
    super({
      clientID: config.get('GOOGLE_CLIENT_ID', { infer: true }) ?? 'disabled',
      clientSecret:
        config.get('GOOGLE_CLIENT_SECRET', { infer: true }) ?? 'disabled',
      callbackURL:
        config.get('GOOGLE_CALLBACK_URL', { infer: true }) ??
        'http://localhost/disabled',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): GoogleProfile {
    const email = profile.emails?.[0];
    return {
      googleId: profile.id,
      email: email?.value ?? '',
      emailVerified: email?.verified === true,
      displayName: profile.displayName ?? '',
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };
  }
}
