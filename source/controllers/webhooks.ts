import {Request, Response} from "express";
import {MethodWebhookObject} from "../models/webhook";

import {Method, Environments, IAccount} from "method-node";
import * as db from "../database/index.js";
import * as dbHelpers from "../database/helpers";
import {sendNotificationByExternalId} from "../utilities/onesignal";
import {fetchDaysInAdvanceByEntityId} from "../controllers/auth0functions";

const method = new Method({
	apiKey: process.env.METHOD_API_KEY || "",
	env: Environments.production,
});

async function createPayment(id: string) {
	console.log(`Payment with id: ${id} has created`);
}

async function updatePayment(id: string) {
	console.log(`Payment with id: ${id} has updated`);
}

async function createEntity(id: string) {
	console.log(`Created entity with id: ${id}`);
	//create quiltt profile... add quiltt id to metadata
}

async function updateEntity(id: string) {
	console.log(`Updated entity with id: ${id}`);
}

async function createAccount(id: string) {
	console.log(`Created account with id: ${id}`);
}

/**
 * Sends a notification to the user if needed.
 * @param {IAccount} account - The account information.
 * @returns {Promise<void>}
 */
async function handleNotification(account: IAccount) {
	if (await doesNeedNotify(account)) {
		console.log(`Account ${account.id} Needs notification`);
		try {
			await sendNotificationToUser(account);
			await updateHasSentNotificationStatus(account);
			console.log(`Notification for Account ${account.id} sent`);
			// Update table to reflect notification sent
		} catch (error) {
			console.error("Notification failed to send:", error);
			throw new Error("Failed to send notification");
		}
	} else {
		console.log(`No notification needed for account ${account.id}`);
	}
}

/**
 * Updates the account information.
 * @param {string} id - The account ID.
 * @returns {Promise<void>}
 * @throws Will throw an error if the account update fails or if the notification fails to send.
 */
async function updateAccount(id: string) {
	try {
		console.log(`Updating account with id: ${id}`);
		const account = await method.accounts.get(id);

		if (
			account.type == "liability" &&
			account.liability?.type == "credit_card"
		) {
			await updateAccountInfo(account);
			await updateLiabilityInfo(account);
			await updateCreditCardInfo(account);
			await updateAccountStatementHistory(account);

			// Handle notifications
			await handleNotification(account);

			console.log("Updated account info in DB");
		}
	} catch (error) {
		console.error("Failed to update account:", error);
	}
}

async function updateAccountInfo(account: IAccount) {
	const sqlData = dbHelpers.generateAccountSQL(account);
	return await db.query(sqlData);
}

async function updateLiabilityInfo(account: IAccount) {
	const sqlData = dbHelpers.generateLiabilitySQL(account);
	return await db.query(sqlData);
}

async function updateCreditCardInfo(account: IAccount) {
	const sqlData = dbHelpers.generateCreditCardSQL(account);
	return await db.query(sqlData);
}

async function updateAccountStatementHistory(account: IAccount) {
	const sqlData = dbHelpers.generateStatementSQL(account);
	return await db.query(sqlData);
}

async function doesNeedNotify(account: IAccount): Promise<boolean> {
	const sqlData = dbHelpers.generatePaymentNotifiedSQL(account);
	const result = await db.query(sqlData);
	if (result.rows.length === 0) {
		console.log("No result found");
		return false;
	}
	return !result.rows[0].payment_notified;
}

async function updateHasSentNotificationStatus(account: IAccount) {
	const sqlData = dbHelpers.updateHasSentNotificationStatus(account);
	return await db.query(sqlData);
}

/**
 * Sends a notification to the user about their upcoming credit card payment.
 * @param {IAccount} account - The account information.
 * @returns {Promise<void>}
 * @throws Will throw an error if the account is not a credit card or if the notification fails to send.
 */
export async function sendNotificationToUser(account: IAccount) {
	const creditCard = account?.liability?.credit_card;

	if (!creditCard) {
		console.log(
			`No credit card information available for account ${account.id}`
		);
		return;
	}

	const cardName =
		typeof creditCard.name === "string" ? creditCard.name : undefined;
	const nextPaymentDueDate =
		typeof creditCard.next_payment_due_date === "string"
			? new Date(creditCard.next_payment_due_date)
			: undefined;

	if (!cardName) {
		console.log(`Account ${account.id} does not have a valid card name.`);
		return;
	}

	if (!nextPaymentDueDate) {
		console.log(`No statement available yet for account ${account.id}`);
		return;
	}

	const currentDate = new Date();
	const differenceInMilliseconds =
		nextPaymentDueDate.getTime() - currentDate.getTime();
	const daysUntilDueDate = Math.ceil(
		differenceInMilliseconds / (1000 * 60 * 60 * 24)
	);

	if (daysUntilDueDate <= 0) {
		console.log(
			"The payment due date is in the past or today. No notification will be sent."
		);
		return;
	}

	let daysInAdvance = await fetchDaysInAdvanceByEntityId(account.holder_id);
	if (daysInAdvance === null) {
		console.warn(
			"Failed to fetch days in advance for the user. Defaulting to 3 days."
		); // Using console.warn for minor issues
		daysInAdvance = 3;
	}

	const deliveryDate = new Date(nextPaymentDueDate);
	deliveryDate.setDate(deliveryDate.getDate() - daysInAdvance - 1); // Subtracting 1 more day for the initial day before the due date

	const externalId = "ent_ip9e3nE4DLfHi"; // account.holder_id;
	const dayWord = daysUntilDueDate === 1 ? "day" : "days";
	const message = `${cardName} payment due in ${daysInAdvance} ${dayWord}`;
	const heading = "Upcoming Payment Reminder";

	console.log("Sending notification to user");
	return sendNotificationByExternalId(
		externalId,
		heading,
		message,
		deliveryDate.toISOString().split("T")[0]
	);
}

async function createAccountVerification(id: string) {
	console.log(`Created account verification with id: ${id}`);
}

async function updateAccountVerification(id: string) {
	console.log(`Updated account verification with id: ${id}`);
}

async function createConnection(id: string) {
	console.log(`Created connection with id: ${id}`);
}

async function updateConnection(id: string) {
	console.log(`Updated connection with id: ${id}`);
}

async function createPaymentReversal(id: string) {
	console.log(`Created payment reversal with id: ${id}`);
}

async function updatePaymentReversal(id: string) {
	console.log(`Updated payment reversal with id: ${id}`);
}

/**
 * Maps operation types to their respective handler functions.
 * @type {Object.<string, function(string): Promise<void>>}
 */
const operationHandlers: {[key: string]: (id: string) => Promise<void>} = {
	"payment.create": createPayment,
	"payment.update": updatePayment,
	"entity.create": createEntity,
	"entity.update": updateEntity,
	"account.create": createAccount,
	"account.update": updateAccount,
	"account_verification.create": createAccountVerification,
	"account_verification.update": updateAccountVerification,
	"connection.create": createConnection,
	"connection.update": updateConnection,
	"payment_reversal.create": createPaymentReversal,
	"payment_reversal.update": updatePaymentReversal,
};

/**
 * Processes a given webhook object and calls the appropriate handler based on its type.
 * @param {WebhookObject} webhookObject - The webhook object to process.
 * @returns {Promise<void>}
 * @throws Will throw an error if no handler is found for the given operation.
 */
async function processWebhookObject(webhookObject: MethodWebhookObject) {
	const handler = operationHandlers[webhookObject.type];
	if (handler) {
		await handler(webhookObject.id);
	} else {
		throw new Error(`No handler found for operation: ${webhookObject.op}`);
	}
}

/**
 * Express middleware to handle incoming webhooks.
 * @param {Request} request - The Express request object.
 * @param {Response} response - The Express response object.
 * @returns {Response} - Returns a response with a status of 200 if successful, or 500 if an error occurs.
 */
export const webhookHandler = async (request: Request, response: Response) => {
	console.log("webhook received" + JSON.stringify(request.body));
	try {
		const webhook: MethodWebhookObject = {
			id: request.body.id,
			type: request.body.type,
			op: request.body.op,
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
