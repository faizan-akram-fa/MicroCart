import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID') || 'dummy-google-client-id',
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET') || 'dummy-google-client-secret',
      callbackURL: configService.get('GOOGLE_CALLBACK_URL') || 'http://localhost:4000/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    const user = {
      id,
      email: emails?.[0]?.value,
      firstName: name?.givenName || 'Google',
      lastName: name?.familyName || 'User',
      picture: photos?.[0]?.value || null,
    };

    if (!user.email) {
      return done(new Error('No email found in Google profile'), null);
    }

    done(null, user);
  }
}
