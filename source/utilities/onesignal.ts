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
	heading: string,
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
			.setHeadings({en: heading})
			.setContents({en: message})
			.build();

		const result = await client.createNotification(notification);

		// Ensure there are no errors in the result.
		if (result.errors && result.errors.length > 0) {
			throw new Error(
				`Notification sending failed with errors: ${result.errors.join(", ")}`
			);
		}

		// Log success
		console.log("Notification sent successfully. Result:", result);
		//this needs to trigger the thing that does the stuff to not renotify a user
	} catch (error) {
		// Log error
		console.error(
			`Failed to send notification to externalId: ${externalId}. Error:`,
			error
		);

		// Propagate the error so it can be caught and handled in calling functions
		throw new Error(
			`Failed to send notification to externalId: ${externalId}. Reason: ${error}`
		);
	}
}
