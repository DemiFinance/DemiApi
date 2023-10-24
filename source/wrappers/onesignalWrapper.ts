import * as OneSignal from "@onesignal/node-onesignal";
import dotenv from "dotenv";

dotenv.config();

const USER_KEY = process.env.ONESIGNAL_USER_KEY || "";
const APP_KEY = process.env.ONESIGNAL_APP_KEY || "";

class OneSignalUtil {
	private static client: OneSignal.DefaultApi;
	private static appId: string;

	static initialize() {
		const configuration = OneSignal.createConfiguration({
			userKey: USER_KEY,
			appKey: APP_KEY,
		});
		OneSignalUtil.client = new OneSignal.DefaultApi(configuration);
		OneSignalUtil.appId = APP_KEY; // Assuming the APP_KEY serves as the appId.
	}

	/**
	 * Sends a notification to a user by external ID.
	 * @param externalId The external ID of the user.
	 * @param message The message to send.
	 * @param heading The heading for the notification. Default is the same as message.
	 * @param name Optional name for the notification.
	 */
	static async sendNotificationByExternalId(
		externalId: string,
		message: string,
		heading: string = message,
		name?: string
	): Promise<void> {
		const notification = new OneSignal.Notification();
		notification.app_id = OneSignalUtil.appId;
		notification.contents = {en: message};
		notification.headings = {en: heading};
		notification.include_external_user_ids = [externalId];
		if (name) {
			notification.name = name;
		}

		try {
			const response =
				await OneSignalUtil.client.createNotification(notification);
			console.log("Notification sent", response);
		} catch (e) {
			console.error("Error sending notification", e);
		}
	}

	/**
	 * Sends a notification to a user by external ID, scheduled for a later date and time.
	 * @param externalId The external ID of the user.
	 * @param message The message to send.
	 * @param deliverAt The date and time to deliver the notification (ISO string format).
	 * @param heading The heading for the notification. Default is the same as message.
	 * @param name Optional name for the notification.
	 */
	static async sendScheduledNotification(
		externalId: string,
		message: string,
		deliverAt: string,
		heading: string = message,
		name?: string
	): Promise<void> {
		const notification = new OneSignal.Notification();
		notification.app_id = OneSignalUtil.appId;
		notification.contents = {en: message};
		notification.headings = {en: heading};
		notification.include_external_user_ids = [externalId];
		notification.send_after = new Date(deliverAt).toISOString();
		if (name) {
			notification.name = name;
		}

		try {
			const response =
				await OneSignalUtil.client.createNotification(notification);
			console.log("Scheduled notification sent", response);
		} catch (e) {
			console.error("Error sending scheduled notification", e);
		}
	}
}

// Initialize the client upon importing the module.

try {
	OneSignalUtil.initialize();
} catch (error) {
	console.error("Error initializing OneSignalUtil:", error);
}

export default OneSignalUtil;
