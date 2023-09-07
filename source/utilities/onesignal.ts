import * as dotenv from "dotenv";

import {
	OneSignalAppClient,
	NotificationByDeviceBuilder,
} from "onesignal-api-client-core";

dotenv.config();

const client = new OneSignalAppClient(
	process.env.ONESIGNAL_APP_ID || "4676c484-01e0-41b1-9a9e-ba58c97c4918",
	process.env.ONESIGNAL_API_KEY || ""
);

export async function sendNotificationByExternalId(
	externalId: string,
	message: string
) {
	try {
		// Log that the function is starting
		console.log(
			`Attempting to send notification to externalId: ${externalId} with message: ${message}`
		);

		const notification = new NotificationByDeviceBuilder()
			.setIncludeExternalUserIds([externalId])
			.notification()
			.setContents({en: message})
			.build();

		const result = await client.createNotification(notification);

		// Log success
		console.log("Notification sent successfully. Result:", result);
	} catch (error) {
		// Log error
		console.error(
			`Failed to send notification to externalId: ${externalId}. Error:`,
			error
		);
	}
}
