/**
 * Google Authentication Service
 * Enterprise-grade OAuth implementation for production use
 */

import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Complete the auth session for web browser
WebBrowser.maybeCompleteAuthSession();

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
    private discovery: AuthSession.DiscoveryDocument | null = null;

    private constructor() {
        // Get client ID from app config
        const extra = Constants.expoConfig?.extra;
        const platform = Constants.platform;
        const appOwnership = Constants.appOwnership;

        let clientId: string | undefined;
        if (appOwnership === 'expo') {
            clientId = extra?.googleClientId?.web;  // Używaj Web Client ID dla Expo Go
        } else if (platform?.ios) {
            clientId = extra?.googleClientId?.ios;
        } else if (platform?.android) {
            clientId = extra?.googleClientId?.android;
        } else {
            clientId = extra?.googleClientId?.web;
        }

        // Check for placeholder values and provide helpful error message
        if (!clientId || clientId.includes('your-') || clientId.includes('.apps.googleusercontent.com') === false) {
            console.error('❌ Google OAuth not configured properly');
            console.error('📋 To set up Google OAuth:');
            console.error('1. Go to Google Cloud Console (https://console.cloud.google.com/)');
            console.error('2. Create OAuth 2.0 credentials for your app');
            console.error('3. Replace placeholder values in app.json with real client IDs');
            console.error('4. See GOOGLE_OAUTH_SETUP.md for detailed instructions');

            throw new Error('Google Client ID not configured. Please set up OAuth credentials in app.json');
        }

        this.config = {
            clientId,
            scopes: ['openid', 'profile', 'email'],
        };
    }

    private async initializeDiscovery(): Promise<void> {
        try {
            // Use the static discovery document instead of the hook
            this.discovery = {
                authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
                tokenEndpoint: 'https://www.googleapis.com/oauth2/v4/token',
                revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
                userInfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
            };
        } catch (error) {
            console.error('Failed to initialize Google discovery:', error);
            throw new Error('Failed to initialize Google OAuth discovery');
        }
    }

    public static getInstance(): GoogleAuthService {
        if (!GoogleAuthService.instance) {
            GoogleAuthService.instance = new GoogleAuthService();
        }
        return GoogleAuthService.instance;
    }

    /**
     * Validate if Google OAuth is properly configured
     */
    public validateConfiguration(): boolean {
        try {
            const extra = Constants.expoConfig?.extra;
            const platform = Constants.platform;

            let clientId: string;
            if (platform?.ios) {
                clientId = extra?.googleClientId?.ios;
            } else if (platform?.android) {
                clientId = extra?.googleClientId?.android;
            } else {
                clientId = extra?.googleClientId?.web;
            }

            // Check if clientId exists and is not a placeholder
            return !!(clientId &&
                !clientId.includes('your-') &&
                clientId.includes('.apps.googleusercontent.com'));
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
            // Ensure discovery is loaded
            if (!this.discovery) {
                await this.initializeDiscovery();
            }

            if (!this.discovery) {
                throw new Error('Failed to load Google OAuth discovery document');
            }

            const scheme = Array.isArray(Constants.expoConfig?.scheme)
                ? Constants.expoConfig.scheme[0]
                : Constants.expoConfig?.scheme || 'threethree';

            const appOwnership = Constants.appOwnership;
            const isExpoGo = appOwnership === 'expo';

            const isNativeRuntime = Platform.OS === 'ios' || Platform.OS === 'android';
            let nativeRedirect: string | undefined;
            if (!isExpoGo && isNativeRuntime && this.config.clientId?.includes('.apps.googleusercontent.com')) {
                const clientPrefix = this.config.clientId.split('.apps.googleusercontent.com')[0];
                nativeRedirect = `com.googleusercontent.apps.${clientPrefix}:/oauthredirect`;
            }

            const shouldUseProxy = isExpoGo;

            // ZAWSZE użyj proxy w Expo Go
            const redirectUri = isExpoGo
                ? `https://auth.expo.io/@buber/three_three`  // Bezpośrednio proxy URL
                : AuthSession.makeRedirectUri({
                    scheme,
                    useProxy: false,
                    native: nativeRedirect,
                });

            console.log('🔍 OAuth Debug Info:', {
                clientId: this.config.clientId,
                redirectUri,
                scheme,
                appOwnership,
                isExpoGo,
                nativeRedirect,
            });

            const request = new AuthSession.AuthRequest({
                clientId: this.config.clientId,
                scopes: this.config.scopes,
                redirectUri,
                responseType: AuthSession.ResponseType.Code,
                extraParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            });

            const result = await request.promptAsync(this.discovery);

            if (result.type !== 'success') {
                throw new Error('Google authentication cancelled or failed');
            }

            // Exchange authorization code for tokens
            if (!this.discovery) {
                throw new Error('Google OAuth discovery document not available');
            }

            const tokenResponse = await AuthSession.exchangeCodeAsync(
                {
                    clientId: this.config.clientId,
                    code: result.params.code,
                    redirectUri,
                    extraParams: {
                        code_verifier: request.codeVerifier || '',
                    },
                },
                this.discovery
            );

            // Get user profile information
            const userInfo = await this.getUserProfile(tokenResponse.accessToken);

            return {
                accessToken: tokenResponse.accessToken,
                refreshToken: tokenResponse.refreshToken,
                idToken: tokenResponse.idToken,
                user: userInfo,
            };
        } catch (error) {
            console.error('Google sign-in failed:', error);
            throw new Error(error instanceof Error ? error.message : 'Google authentication failed');
        }
    }

    /**
     * Get user profile from Google API
     */
    private async getUserProfile(accessToken: string): Promise<GoogleAuthResponse['user']> {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }

            const userInfo = await response.json();

            return {
                id: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
                emailVerified: userInfo.verified_email,
            };
        } catch (error) {
            console.error('Failed to get user profile:', error);
            throw error;
        }
    }

    /**
     * Refresh access token using refresh token
     */
    public async refreshAccessToken(refreshToken: string): Promise<string> {
        try {
            if (!this.discovery) {
                await this.initializeDiscovery();
            }

            if (!this.discovery) {
                throw new Error('Google OAuth discovery document not available');
            }

            const tokenResponse = await AuthSession.refreshAsync(
                {
                    clientId: this.config.clientId,
                    refreshToken,
                },
                this.discovery
            );

            return tokenResponse.accessToken;
        } catch (error) {
            console.error('Token refresh failed:', error);
            throw new Error('Failed to refresh access token');
        }
    }

    /**
     * Revoke tokens and sign out
     */
    public async signOut(accessToken: string): Promise<void> {
        try {
            if (!this.discovery) {
                await this.initializeDiscovery();
            }

            if (!this.discovery) {
                console.warn('Google OAuth discovery document not available for sign out');
                return;
            }

            await AuthSession.revokeAsync(
                {
                    clientId: this.config.clientId,
                    token: accessToken,
                },
                this.discovery
            );
        } catch (error) {
            console.error('Sign out failed:', error);
            // Don't throw - sign out should be successful even if revoke fails
        }
    }
}

export default GoogleAuthService;