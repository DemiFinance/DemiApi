import {Request, Response} from "express";

// import {Method, Environments} from "method-node";
// import * as db from "../../database/index.js";
// import * as dbHelpers from "../../database/helpers";
// import {sendNotificationByExternalId} from "../../utilities/onesignal";
// import {fetchDaysInAdvanceByEntityId} from "../../controllers/auth0functions";
import {QuilttWebhookObject} from "../../models/quilttmodels";

// const method = new Method({
// 	apiKey: process.env.METHOD_API_KEY || "",
// 	env: Environments.production,
// });

async function createAccount(event: any) {
	console.log(`Created connection with id: ${event}`);
}
async function unimplementedFunc(event: any) {
	console.log(`Created connection with id: ${event}`);
}

/**
 * Maps operation types to their respective handler functions.
 * @type {Object.<string, function(string): Promise<void>>}
 */
const operationHandlers: {[key: string]: (event: any) => Promise<void>} = {
	"profile.created": unimplementedFunc,
	"profile.updated": unimplementedFunc,
	"profile.deleted": unimplementedFunc,
	"connection.created": unimplementedFunc,
	"connection.updated": unimplementedFunc,
	"connection.synced.successful": unimplementedFunc,
	"connection.synced.successful.historical": unimplementedFunc,
	"connection.synced.errored.repairable": unimplementedFunc,
	"connection.synced.errored.service": unimplementedFunc,
	"connection.synced.errored.provider": unimplementedFunc,
	"connection.synced.errored.institution": unimplementedFunc,
	"connection.disconnected": unimplementedFunc,
	"account.created": createAccount,
	"account.updated": unimplementedFunc,
	"account.verified": unimplementedFunc,
};

/**
 * Processes a given webhook object and calls the appropriate handler based on its type.
 * @param {QuilttWebhookObject} webhookObject - The webhook object to process.
 * @returns {Promise<void>}
 * @throws Will throw an error if no handler is found for a given operation.
 */
async function processWebhookObject(webhookObject: QuilttWebhookObject) {
	for (const event of webhookObject.events) {
		const handler = operationHandlers[event.type];
		if (handler) {
			await handler(event);
		} else {
			throw new Error(`No handler found for operation: ${event.type}`);
		}
	}
}

/**
 * Express middleware to handle incoming webhooks.
 * @param {Request} request - The Express request object.
 * @param {Response} response - The Express response object.
 * @returns {Response} - Returns a response with a status of 200 if successful, or 500 if an error occurs.
 */
export const quilttWebhookHandler = async (
	request: Request,
	response: Response
) => {
	console.log("webhook received" + JSON.stringify(request.body));
	try {
		const webhook: QuilttWebhookObject = {
			environment: request.body.environment,
			eventTypes: request.body.eventTypes,
			events: request.body.events,
		};

		await processWebhookObject(webhook);
	} catch (error) {
		console.log("Webhook Error:", error);
		return response.status(500).json({
			message: "Error processing webhook",
			error: error,
		});
	}
	return response.status(200).json({
		message: "webhook received",
	});
};
