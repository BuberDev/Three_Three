import { useAppStore } from '@/stores/app-store';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Resolves the effective color scheme: an explicit user override
 * (themePreference) takes priority, otherwise falls back to the OS setting.
 */
export function useColorScheme(): 'light' | 'dark' {
  const systemColorScheme = useRNColorScheme();
  const themePreference = useAppStore((state) => state.themePreference);

  if (themePreference === 'light' || themePreference === 'dark') {
    return themePreference;
  }

  return systemColorScheme === 'dark' ? 'dark' : 'light';
}
