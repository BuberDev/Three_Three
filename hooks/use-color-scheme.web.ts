import { useAppStore } from '@/stores/app-store';
import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const systemColorScheme = useRNColorScheme();
  const themePreference = useAppStore((state) => state.themePreference);

  if (!hasHydrated) {
    return 'light';
  }

  if (themePreference === 'light' || themePreference === 'dark') {
    return themePreference;
  }

  return systemColorScheme === 'dark' ? 'dark' : 'light';
}
