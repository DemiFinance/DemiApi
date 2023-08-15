import OneSignal from "@onesignal/node-onesignal";
import {ConfigurationParameters} from "@onesignal/node-onesignal/dist/configuration";

const configParams: ConfigurationParameters = {
	authMethods: {
		// Fill in the properties for AuthMethodsConfiguration
	},
	appKey: process.env.ONESIGNAL_API_KEY || "",
	userKey: "your-user-key",
};

const configuration = OneSignal.createConfiguration(configParams);

const client = new OneSignal.DefaultApi(configuration);

// Function to send a notification
export const sendNotification = (
	message: string,
	segments: string[] = ["All"]
) => {
	const notification = new OneSignal.Notification();

	notification.contents = {
		en: "This is english",
	};

	notification.delivery_time_of_day = "9:00AM";

	notification.external_id = ""; //get externalid based on who owns the notification trigger

	return client.createNotification(notification);
};

// You can export more functions here if needed
