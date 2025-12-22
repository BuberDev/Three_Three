import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Enhanced color scheme hook that properly handles device vs simulator differences
 * and provides consistent behavior across platforms
 */
export function useColorScheme() {
    const systemColorScheme = useRNColorScheme();
    const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Set initial color scheme with fallback
        const initialScheme = systemColorScheme === 'dark' ? 'dark' : 'light';
        setColorScheme(initialScheme);
        setIsInitialized(true);

        console.log('🎨 Color scheme initialized:', {
            system: systemColorScheme,
            resolved: initialScheme,
            platform: require('react-native').Platform.OS
        });
    }, [systemColorScheme]);

    useEffect(() => {
        if (systemColorScheme) {
            const resolvedScheme = systemColorScheme === 'dark' ? 'dark' : 'light';
            setColorScheme(resolvedScheme);

            console.log('🎨 Color scheme changed:', {
                from: colorScheme,
                to: resolvedScheme,
                system: systemColorScheme
            });
        }
    }, [systemColorScheme]);

    // Always return a valid color scheme, never null/undefined
    return isInitialized ? colorScheme : 'light';
}
