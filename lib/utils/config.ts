/**
 * Configuration utils for API endpoints
 * Handles different environments and network configurations
 */

import { Platform } from 'react-native';

/**
 * Get the appropriate API URL based on the environment and device type
 */
export function getApiUrl(): string {
    if (!__DEV__) {
        return 'https://api.threethree.pl';
    }

    const configuredUrl = process.env.API_URL;
    return (configuredUrl || 'http://localhost:3000').replace(/\/+$/, '');
}

/**
 * Check if we're running in a development environment
 */
export function isDevelopment(): boolean {
    return __DEV__;
}

/**
 * Get platform-specific configuration
 */
export function getPlatformConfig() {
    return {
        isIOS: Platform.OS === 'ios',
        isAndroid: Platform.OS === 'android',
        isWeb: Platform.OS === 'web',
        isDev: __DEV__,
        apiUrl: getApiUrl(),
    };
}
