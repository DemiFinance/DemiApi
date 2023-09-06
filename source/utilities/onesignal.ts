import * as dotenv from "dotenv";
dotenv.config();
const sdk = require("api")("@onesignal/v11.0#4bvilly88qam");
interface NotificationPayload {
	app_id: string;
	included_segments?: string[];
	include_external_user_ids?: string[];
	external_id?: string;
	contents: {
		[key: string]: string;
	};
	name?: string;
	delayed_option?: string;
	delivery_time_of_day?: string;
	throttle_rate_per_minute?: number;
	custom_data?: string;
}

interface DelayedNotificationPayload extends NotificationPayload {
	send_after: string;
}

class OneSignalUtility {
	private static get APP_ID(): string {
		return process.env.ONESIGNAL_DEMI_APP_KEY || "";
	}

	private static get authorization(): string {
		return `Basic ${process.env.ONESIGNAL_API_KEY}`;
	}

	public static async sendNotificationToUser(
		message: string,
		externalUserId: string
	): Promise<void> {
		const payload: NotificationPayload = {
			app_id: this.APP_ID,
			include_external_user_ids: [externalUserId],
			contents: {
				en: message,
			},
		};
		await this.sendNotification(payload);
	}

	private static async sendNotification(
		payload: NotificationPayload
	): Promise<void> {
		try {
			const response = await sdk.createNotification(payload, {
				authorization: this.authorization,
			});
			console.log("Notification sent successfully:", response.data);
		} catch (error) {
			console.error("Error sending notification:", error);
		}
	}

	public static async sendDelayedNotification(
		payload: DelayedNotificationPayload
	): Promise<void> {
		try {
			const response = await sdk.createNotification(payload, {
				authorization: this.authorization,
			});
			console.log(
				"Delayed notification scheduled successfully:",
				response.data
			);
		} catch (error) {
			console.error("Error scheduling delayed notification:", error);
		}
	}
}

export default OneSignalUtility;

// Example Usage:
// OneSignalUtility.sendNotificationToUser('Hello, World!', 'EXTERNAL_USER_ID');
