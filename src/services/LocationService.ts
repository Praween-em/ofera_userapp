import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface LocationData {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

class LocationServiceClass {
    private lastKnownLocation: LocationData | null = null;

    /**
     * Request location permission from the user
     */
    async requestLocationPermission(): Promise<boolean> {
        if (Platform.OS === 'ios') {
            // iOS permissions are handled via Info.plist
            return true;
        }

        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Location Permission',
                    message: 'We need your location to show nearby service providers',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                },
            );

            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn('Location permission error:', err);
            return false;
        }
    }

    /**
     * Get current location
     */
    async getCurrentLocation(): Promise<LocationData | null> {
        const hasPermission = await this.requestLocationPermission();
        if (!hasPermission) {
            console.log('Location permission denied');
            return this.lastKnownLocation;
        }

        return new Promise((resolve) => {
            Geolocation.getCurrentPosition(
                (position) => {
                    const location: LocationData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                    };
                    this.lastKnownLocation = location;
                    resolve(location);
                },
                (error) => {
                    console.error('Location error:', error);
                    resolve(this.lastKnownLocation);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 10000,
                },
            );
        });
    }

    /**
     * Get last known location (cached)
     */
    getLastKnownLocation(): LocationData | null {
        return this.lastKnownLocation;
    }

    /**
     * Clear cached location
     */
    clearCache(): void {
        this.lastKnownLocation = null;
    }
}

export const LocationService = new LocationServiceClass();
