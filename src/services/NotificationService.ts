import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NotificationService {
    async requestUserPermission() {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log('Notification permission granted');
            } else {
                console.log('Notification permission denied');
            }
        }

        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            console.log('Authorization status:', authStatus);
            await this.getToken();
        }
    }

    async getToken() {
        try {
            const fcmToken = await messaging().getToken();
            if (fcmToken) {
                console.log('FCM Token:', fcmToken);
                await this.saveTokenToBackend(fcmToken);
            }
        } catch (error) {
            console.log('Error getting FCM token:', error);
        }
    }

    async saveTokenToBackend(fcmToken: string) {
        try {
            const savedToken = await AsyncStorage.getItem('fcmToken');
            if (savedToken === fcmToken) return;

            // Only register if user is logged in
            const token = await AsyncStorage.getItem('token');
            if (token) {
                await api.post('/notifications/register-token', {
                    fcmToken,
                    platform: Platform.OS,
                });
                await AsyncStorage.setItem('fcmToken', fcmToken);
                console.log('Token registered with backend');
            }
        } catch (error) {
            console.log('Error saving token to backend:', error);
        }
    }

    async setupNotificationListeners() {
        // Foreground
        messaging().onMessage(async remoteMessage => {
            console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
            Alert.alert(
                remoteMessage.notification?.title || 'New Notification',
                remoteMessage.notification?.body || ''
            );
        });

        // Background
        messaging().onNotificationOpenedApp(remoteMessage => {
            console.log(
                'Notification caused app to open from background state:',
                remoteMessage.notification
            );
        });

        // Quit state
        messaging()
            .getInitialNotification()
            .then(remoteMessage => {
                if (remoteMessage) {
                    console.log(
                        'Notification caused app to open from quit state:',
                        remoteMessage.notification
                    );
                }
            });

        // Token refresh
        messaging().onTokenRefresh(token => {
            console.log('FCM Token refreshed:', token);
            this.saveTokenToBackend(token);
        });
    }
}

export default new NotificationService();
