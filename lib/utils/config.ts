/**
 * Configuration utils for API endpoints
 * Handles different environments and network configurations
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Get the appropriate API URL based on the environment and device type
 */
export function getApiUrl(): string {
    // Use environment variable if available
    const envUrl = process.env.EXPO_PUBLIC_API_URL;

    if (envUrl && envUrl !== 'http://localhost:3000') {
        return envUrl;
    }

    // In development, try to detect the correct URL
    if (__DEV__) {
        // For Expo Development builds and simulators
        const { debuggerHost } = Constants.manifest2?.extra?.expoClient || Constants.manifest?.debuggerHost || {};

        if (debuggerHost && !debuggerHost.includes('localhost')) {
            const host = debuggerHost.split(':')[0];
            return `http://${host}:3000`;
        }

        // Try to use the manifest URL host
        const manifestUrl = Constants.manifest2?.extra?.expoClient?.hostUri || Constants.manifest?.hostUri;
        if (manifestUrl) {
            const host = manifestUrl.split(':')[0];
            if (host && !host.includes('localhost') && !host.includes('exp://')) {
                return `http://${host}:3000`;
            }
        }
    }

    // Default development URL - will work on simulator but not on physical device
    return envUrl || 'http://localhost:3000';
}

/**
 * Check if we're running in a development environment
 */
export function isDevelopment(): boolean {
    return __DEV__ && Constants.appOwnership === 'expo';
}

/**
 * Get platform-specific configuration
 */
export function getPlatformConfig() {
    return {
        isIOS: Platform.OS === 'ios',
        isAndroid: Platform.OS === 'android',
        isWeb: Platform.OS === 'web',
        isExpoGo: Constants.appOwnership === 'expo',
        isDev: __DEV__,
        apiUrl: getApiUrl(),
    };
}