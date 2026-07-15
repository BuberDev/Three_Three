/**
 * Google Authentication Service
 * Wraps @react-native-google-signin/google-signin
 */

import { GoogleSignin, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

const GOOGLE_CLIENT_IDS = {
    ios: process.env.GOOGLE_CLIENT_ID_IOS,
    android: process.env.GOOGLE_CLIENT_ID_ANDROID,
    web: process.env.GOOGLE_CLIENT_ID_WEB,
};

export interface GoogleAuthConfig {
    clientId: string;
    redirectUri?: string;
    scopes?: string[];
}

export interface GoogleAuthResponse {
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    user: {
        id: string;
        email: string;
        name: string;
        picture?: string;
        emailVerified: boolean;
    };
}

export class GoogleAuthService {
    private static instance: GoogleAuthService;
    private config: GoogleAuthConfig;
    private configured = false;

    private constructor() {
        let clientId: string | undefined;
        if (Platform.OS === 'ios') {
            clientId = GOOGLE_CLIENT_IDS.ios;
        } else if (Platform.OS === 'android') {
            clientId = GOOGLE_CLIENT_IDS.android;
        } else {
            clientId = GOOGLE_CLIENT_IDS.web;
        }

        if (!clientId || clientId.includes('your-') || !clientId.includes('.apps.googleusercontent.com')) {
            console.error('❌ Google OAuth not configured properly');
            console.error('📋 To set up Google OAuth:');
            console.error('1. Go to Google Cloud Console (https://console.cloud.google.com/)');
            console.error('2. Create OAuth 2.0 credentials for your app');
            console.error('3. Replace placeholder values in .env with real client IDs');
            console.error('4. See GOOGLE_OAUTH_SETUP.md for detailed instructions');

            throw new Error('Google Client ID not configured. Please set up OAuth credentials in .env');
        }

        this.config = {
            clientId,
            scopes: ['openid', 'profile', 'email'],
        };
    }

    public static getInstance(): GoogleAuthService {
        if (!GoogleAuthService.instance) {
            GoogleAuthService.instance = new GoogleAuthService();
        }
        return GoogleAuthService.instance;
    }

    private ensureConfigured(): void {
        if (this.configured) return;

        GoogleSignin.configure({
            iosClientId: GOOGLE_CLIENT_IDS.ios,
            webClientId: GOOGLE_CLIENT_IDS.web,
            scopes: this.config.scopes,
            offlineAccess: true,
        });
        this.configured = true;
    }

    /**
     * Validate if Google OAuth is properly configured
     */
    public validateConfiguration(): boolean {
        try {
            return !!(this.config.clientId &&
                !this.config.clientId.includes('your-') &&
                this.config.clientId.includes('.apps.googleusercontent.com'));
        } catch (error) {
            console.error('Error validating Google OAuth configuration:', error);
            return false;
        }
    }

    /**
     * Initiate Google sign-in flow
     */
    public async signIn(): Promise<GoogleAuthResponse> {
        try {
            this.ensureConfigured();

            if (Platform.OS === 'android') {
                await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            }

            const response = await GoogleSignin.signIn();

            if (!isSuccessResponse(response)) {
                throw new Error('Google authentication cancelled or failed');
            }

            const tokens = await GoogleSignin.getTokens();

            return {
                accessToken: tokens.accessToken,
                idToken: tokens.idToken ?? response.data.idToken ?? undefined,
                user: {
                    id: response.data.user.id,
                    email: response.data.user.email,
                    name: response.data.user.name ?? response.data.user.email,
                    picture: response.data.user.photo ?? undefined,
                    emailVerified: true,
                },
            };
        } catch (error: any) {
            if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
                throw new Error('Google authentication cancelled');
            }
            console.error('Google sign-in failed:', error);
            throw new Error(error instanceof Error ? error.message : 'Google authentication failed');
        }
    }

    /**
     * Refresh the current Google session's access token
     */
    public async refreshAccessToken(_refreshToken: string): Promise<string> {
        try {
            this.ensureConfigured();
            const tokens = await GoogleSignin.getTokens();
            return tokens.accessToken;
        } catch (error) {
            console.error('Token refresh failed:', error);
            throw new Error('Failed to refresh access token');
        }
    }

    /**
     * Sign out of the current Google session
     */
    public async signOut(_accessToken?: string): Promise<void> {
        try {
            this.ensureConfigured();
            await GoogleSignin.signOut();
        } catch (error) {
            console.error('Sign out failed:', error);
            // Don't throw - sign out should be successful even if revoke fails
        }
    }
}

export default GoogleAuthService;
