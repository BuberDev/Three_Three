import { useAppStore } from '@/stores/app-store';
import * as Location from 'expo-location';

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
    private watchPositionSubscription: Location.LocationSubscription | null = null;
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

            // Sprawdź obecne uprawnienia
            const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

            if (existingStatus === 'granted') {
                return true;
            }

            // Poproś o uprawnienia
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                console.log('📍 Location permission denied');
                return false;
            }

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
        try {
            if (!this.isLocationTrackingEnabled()) {
                console.log('📍 Location tracking disabled');
                return null;
            }

            const hasPermission = await this.requestLocationPermissions();
            if (!hasPermission) {
                return null;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 1000,
                distanceInterval: 10,
            });

            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
                altitude: location.coords.altitude,
                altitudeAccuracy: location.coords.altitudeAccuracy,
                heading: location.coords.heading,
                speed: location.coords.speed,
                timestamp: location.timestamp,
            };
        } catch (error) {
            console.error('❌ Error getting current location:', error);
            return null;
        }
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

            this.watchPositionSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 30000, // Update every 30 seconds
                    distanceInterval: 50, // Update every 50 meters
                },
                (location) => {
                    const locationData: LocationData = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        accuracy: location.coords.accuracy,
                        altitude: location.coords.altitude,
                        altitudeAccuracy: location.coords.altitudeAccuracy,
                        heading: location.coords.heading,
                        speed: location.coords.speed,
                        timestamp: location.timestamp,
                    };

                    // You could store this in app store or send to backend
                    console.log('📍 Location update:', locationData);
                }
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
            if (this.watchPositionSubscription) {
                this.watchPositionSubscription.remove();
                this.watchPositionSubscription = null;
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
     */
    async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
        try {
            if (!this.isLocationTrackingEnabled()) {
                return null;
            }

            const results = await Location.reverseGeocodeAsync({
                latitude,
                longitude
            });

            if (results.length > 0) {
                const result = results[0];
                return [result.city, result.region, result.country]
                    .filter(Boolean)
                    .join(', ');
            }

            return null;
        } catch (error) {
            console.error('❌ Error reverse geocoding:', error);
            return null;
        }
    }
}

export const locationService = LocationService.getInstance();