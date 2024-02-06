import * as dotenv from "dotenv";

import {
	OneSignalAppClient,
	NotificationByDeviceBuilder,
} from "onesignal-api-client-core";
import logger from "../wrappers/winstonLogging";
import tracer from "../wrappers/datadogTracer";

dotenv.config();

const client = new OneSignalAppClient(
	process.env.ONESIGNAL_APP_ID || "4676c484-01e0-41b1-9a9e-ba58c97c4918",
	process.env.ONESIGNAL_API_KEY || ""
);

/**
 * Sends a notification to a user identified by an external ID.
 *
 * @async
 * @function sendNotificationByExternalId
 * @param {string} externalId - The external ID of the user to whom the notification should be sent.
 * @param {string} heading - The heading of the notification.
 * @param {string} message - The main content/message of the notification.
 * @param {string} deliveryDateString - The date on which the notification should be delivered, in "YYYY-MM-DD" format. The notification will be sent at midnight in the local time zone on this date.
 * @throws {Error} Throws an error if there's a failure in sending the notification or if the result contains errors.
 * @returns {Promise<void>} A promise that resolves when the notification is sent successfully.
 */
export async function sendNotificationByExternalId(
	externalId: string,
	heading: string,
	message: string,
	deliveryDateString: string
) {
	// Start a new Datadog span for sending notification
	const span = tracer.startSpan("sendNotificationByExternalId");
	span.setTag("notification.externalId", externalId);

	try {
		logger.log(
			"info",
			`Attempting to send notification to externalId: ${externalId} with message: ${message}`
		);

		const deliveryDate = new Date(deliveryDateString);

		const notification = new NotificationByDeviceBuilder()
			.setIncludeExternalUserIds([externalId])
			.notification()
			.setHeadings({en: heading})
			.setContents({en: message})
			.setDelivery({
				send_after: deliveryDate.toISOString(),
			})
			.build();

		const result = await client.createNotification(notification);

		if (result.errors && result.errors.length > 0) {
			throw new Error(
				`Notification sending failed with errors: ${result.errors.join(", ")}`
			);
		}

		logger.log("info", `Notification sent successfully. Result: ${result}`);
		// ... trigger the thing that does the stuff to not renotify a user
		span.finish(); // Finish the span on successful execution
	} catch (error) {
		logger.log(
			"error",
			`Failed to send notification to externalId: ${externalId}. Error: ${error}`
		);
		span.setTag("error", true);
		span.log({
			event: "error",
			"error.kind": (error as Error).constructor.name,
			message: (error as Error).message,
			stack: (error as Error).stack,
		});
		span.finish(); // Finish the span with error information
	}
}

/**
 * Sends a notification to a user identified by an external ID.
 *
 * @async
 * @function sendNotificationByExternalId
 * @param {string} externalId - The external ID of the user to whom the notification should be sent.
 * @param {string} heading - The heading of the notification.
 * @param {string} message - The main content/message of the notification.
 * @param {string} deliveryDateString - The date on which the notification should be delivered, in "YYYY-MM-DD" format. The notification will be sent at midnight in the local time zone on this date.
 * @throws {Error} Throws an error if there's a failure in sending the notification or if the result contains errors.
 * @returns {Promise<void>} A promise that resolves when the notification is sent successfully.
 */
export async function sendNotificationByExternalIdNow(
	externalId: string,
	heading: string,
	message: string
) {
	// Start a new Datadog span for sending notification
	const span = tracer.startSpan("sendNotificationByExternalId");
	span.setTag("notification.externalId", externalId);

	try {
		logger.log(
			"info",
			`Attempting to send notification to externalId: ${externalId} with message: ${message}`
		);

		const notification = new NotificationByDeviceBuilder()
			.setIncludeExternalUserIds([externalId])
			.notification()
			.setHeadings({en: heading})
			.setContents({en: message})
			.build();

		const result = await client.createNotification(notification);

		if (result.errors && result.errors.length > 0) {
			throw new Error(
				`Notification sending failed with errors: ${result.errors.join(", ")}`
			);
		}

		logger.log("info", `Notification sent successfully. Result: ${result}`);
		// ... trigger the thing that does the stuff to not renotify a user
		span.finish(); // Finish the span on successful execution
	} catch (error) {
		logger.log(
			"error",
			`Failed to send notification to externalId: ${externalId}. Error: ${error}`
		);
		span.setTag("error", true);
		span.log({
			event: "error",
			"error.kind": (error as Error).constructor.name,
			message: (error as Error).message,
			stack: (error as Error).stack,
		});
		span.finish(); // Finish the span with error information
	}
}