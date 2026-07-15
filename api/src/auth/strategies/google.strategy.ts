import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthProvider } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    private readonly logger = new Logger(GoogleStrategy.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
    ) {
        super({
            clientID: configService.get<string>('app.google.clientId') || 'google-oauth-not-configured',
            clientSecret: configService.get<string>('app.google.clientSecret') || 'google-oauth-not-configured',
            callbackURL: configService.get<string>('app.google.callbackUrl'),
            scope: ['email', 'profile'],
        });

        if (!configService.get<string>('app.google.clientId') || !configService.get<string>('app.google.clientSecret')) {
            this.logger.warn('Google OAuth is not configured. /auth/google will be unavailable until GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.');
        }
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        try {
            const { id, name, emails } = profile;
            const email = emails[0]?.value;

            if (!email) {
                return done(new Error('No email found in Google profile'), null);
            }

            // Check if user exists
            let user = await this.usersService.findByEmailAndProvider(email, AuthProvider.GOOGLE);

            if (!user) {
                // Create new user
                user = await this.usersService.create({
                    email,
                    firstName: name.givenName,
                    lastName: name.familyName,
                    authProvider: AuthProvider.GOOGLE,
                    externalId: id,
                });
            } else {
                // Update existing user
                await this.usersService.update(user.id, {
                    firstName: name.givenName,
                    lastName: name.familyName,
                    externalId: id,
                });
            }

            return done(null, user);
        } catch (error) {
            console.error('Google OAuth validation error:', error);
            return done(error, null);
        }
    }
}
