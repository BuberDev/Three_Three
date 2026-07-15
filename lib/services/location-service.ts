import { useAppStore } from '@/stores/app-store';
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';

export interface LocationData {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    altitudeAccuracy?: number;
    heading?: number;
    speed?: number;
    timestamp: number;
}

export class LocationService {
    private static instance: LocationService;
    private watchId: number | null = null;
    private isWatching = false;

    static getInstance(): LocationService {
        if (!LocationService.instance) {
            LocationService.instance = new LocationService();
        }
        return LocationService.instance;
    }

    /**
     * Sprawdza czy śledzenie lokalizacji jest włączone w ustawieniach
     */
    private isLocationTrackingEnabled(): boolean {
        const userSettings = useAppStore.getState().userSettings;
        return userSettings?.locationTrackingEnabled ?? false;
    }

    /**
     * Żądanie uprawnień do lokalizacji
     */
    async requestLocationPermissions(): Promise<boolean> {
        try {
            // Sprawdź czy śledzenie jest włączone
            if (!this.isLocationTrackingEnabled()) {
                console.log('📍 Location tracking is disabled in settings');
                return false;
            }

            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    console.log('📍 Location permission denied');
                    return false;
                }
                return true;
            }

            // iOS prompts automatically on first Geolocation call.
            return true;
        } catch (error) {
            console.error('❌ Error requesting location permissions:', error);
            return false;
        }
    }

    /**
     * Pobierz aktualną lokalizację
     */
    async getCurrentLocation(): Promise<LocationData | null> {
        if (!this.isLocationTrackingEnabled()) {
            console.log('📍 Location tracking disabled');
            return null;
        }

        const hasPermission = await this.requestLocationPermissions();
        if (!hasPermission) {
            return null;
        }

        return new Promise((resolve) => {
            Geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude ?? undefined,
                        altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
                        heading: position.coords.heading ?? undefined,
                        speed: position.coords.speed ?? undefined,
                        timestamp: position.timestamp,
                    });
                },
                (error) => {
                    console.error('❌ Error getting current location:', error);
                    resolve(null);
                },
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
            );
        });
    }

    /**
     * Rozpocznij śledzenie lokalizacji w tle
     */
    async startLocationTracking(): Promise<boolean> {
        try {
            if (!this.isLocationTrackingEnabled()) {
                console.log('📍 Location tracking disabled in settings');
                return false;
            }

            if (this.isWatching) {
                console.log('📍 Location tracking already active');
                return true;
            }

            const hasPermission = await this.requestLocationPermissions();
            if (!hasPermission) {
                return false;
            }

            this.watchId = Geolocation.watchPosition(
                (position) => {
                    const locationData: LocationData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude ?? undefined,
                        altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
                        heading: position.coords.heading ?? undefined,
                        speed: position.coords.speed ?? undefined,
                        timestamp: position.timestamp,
                    };

                    // You could store this in app store or send to backend
                    console.log('📍 Location update:', locationData);
                },
                (error) => {
                    console.error('❌ Error watching location:', error);
                },
                { enableHighAccuracy: false, distanceFilter: 50, interval: 30000 }
            );

            this.isWatching = true;
            console.log('📍 Location tracking started');
            return true;
        } catch (error) {
            console.error('❌ Error starting location tracking:', error);
            return false;
        }
    }

    /**
     * Zatrzymaj śledzenie lokalizacji
     */
    async stopLocationTracking(): Promise<void> {
        try {
            if (this.watchId !== null) {
                Geolocation.clearWatch(this.watchId);
                this.watchId = null;
            }
            this.isWatching = false;
            console.log('📍 Location tracking stopped');
        } catch (error) {
            console.error('❌ Error stopping location tracking:', error);
        }
    }

    /**
     * Sprawdź czy śledzenie jest aktywne
     */
    isLocationTrackingActive(): boolean {
        return this.isWatching && this.isLocationTrackingEnabled();
    }

    /**
     * Pobierz nazwę miasta/obszaru na podstawie współrzędnych
     *
     * Note: reverse geocoding has no bare-RN equivalent bundled with the
     * geolocation library (it required a separate maps/geocoding provider
     * even before this migration). No caller uses this today.
     */
    async reverseGeocode(_latitude: number, _longitude: number): Promise<string | null> {
        return null;
    }
}

export const locationService = LocationService.getInstance();
