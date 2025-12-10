/**
 * Google Authentication Service
 * Enterprise-grade OAuth implementation for production use
 */

import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';

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
        // Initialize discovery
        this.initializeDiscovery();

        // Get client ID from app config
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

        if (!clientId) {
            throw new Error('Google Client ID not configured. Please set up OAuth credentials in app.json');
        }

        this.config = {
            clientId,
            scopes: ['openid', 'profile', 'email'],
        };
    }

    private async initializeDiscovery(): Promise<void> {
        try {
            this.discovery = await AuthSession.useAutoDiscovery('https://accounts.google.com');
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
                : Constants.expoConfig?.scheme || 'three-three';

            const redirectUri = AuthSession.makeRedirectUri({
                scheme,
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

    /**
     * Validate if Google authentication is properly configured
     */
    public validateConfiguration(): boolean {
        return !!(this.config.clientId && this.discovery);
    }
}

export default GoogleAuthService;