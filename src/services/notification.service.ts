import * as admin from 'firebase-admin';
import path from 'path';

// Initialize Firebase Admin
// Note: In production, use process.env.GOOGLE_APPLICATION_CREDENTIALS or 
// mount the json file securely.
const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

let isInitialized = false;

try {
    // Check if Service Account exists (User needs to provide this)
    // For now we wrap in try-catch to allow server start without it
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath)
    });
    isInitialized = true;
    console.log('[Notification] Firebase Admin Initialized');
} catch (error) {
    console.warn('[Notification] Firebase Admin NOT initialized. Missing service account?');
}

export class NotificationService {

    /**
     * Sends a Rich Notification to the 'all_users' topic.
     */
    static async sendNewPropertyNotification(property: {
        title: string,
        location: string,
        imageUrl: string,
        id: string
    }) {
        if (!isInitialized) {
            console.warn('[Notification] Skipping notification (Firebase not init)');
            return;
        }

        const message: admin.messaging.Message = {
            topic: 'all_users', // Subject to change if we have segments
            notification: {
                title: 'New Property Alert! 🏠',
                body: `${property.title} in ${property.location} is now live!`,
                imageUrl: property.imageUrl, // iOS/Android support
            },
            data: {
                type: 'property_alert',
                propertyId: property.id,
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
            },
            android: {
                notification: {
                    channelId: 'property_alerts',
                    priority: 'high',
                    defaultSound: true,
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        'mutable-content': 1 // Required for image on iOS
                    }
                },
                fcmOptions: {
                    imageUrl: property.imageUrl
                }
            }
        };

        try {
            const response = await admin.messaging().send(message);
            console.log('[Notification] Sent successfully:', response);
        } catch (error) {
            console.error('[Notification] Failed to send:', error);
        }
    }
}
