import {Request, Response} from "express";
import {MethodWebhookObject} from "../models/webhook";

import {IAccount, IAccountLiability} from "method-node";
import * as db from "../database/index.js";
import * as dbHelpers from "../database/helpers";
import {sendNotificationByExternalId} from "../utilities/onesignal";
import {fetchDaysInAdvanceByEntityId} from "../controllers/auth0functions";
import {
	CreditCard_Name_bad_format,
	CreditCard_Name_missing,
	CreditCard_No_Due_Date,
	CreditCard_invalid_payment_date,
	No_CreditCard_found,
} from "../utilities/errors/demierrors";
import logger from "../wrappers/winstonLogging";
import {method} from "../wrappers/methodWrapper";

async function createPayment(id: string) {
	logger.log("info", `Payment with id: ${id} has created`);
}

async function updatePayment(id: string) {
	logger.log("info", `Payment with id: ${id} has updated`);
}

async function createEntity(id: string) {
	logger.log("info", `Created entity with id: ${id}`);
}

async function updateEntity(id: string) {
	logger.log("info", `Updated entity with id: ${id}`);
}

async function createAccount(id: string) {
	logger.log("info", `Created account with id: ${id}`);
}

/**
 * Sends a notification to the user if needed.
 * @param {IAccount} account - The account information.
 * @returns {Promise<void>}
 */
async function handleNotification(account: IAccount) {
	if (await doesNeedNotify(account)) {
		logger.log("info", `Account ${account.id} Needs notification`);
		try {
			await sendNotificationToUser(account);
			await updateHasSentNotificationStatus(account);
			logger.log("info", `Notification for Account ${account.id} sent`);
		} catch (error) {
			logger.log(
				"error",
				`Failed to send notification for account ${account.id}`
			);
			throw new Error("Failed to send notification");
		}
	} else {
		logger.log("info", `No notification needed for account ${account.id}`);
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
		logger.log("info", `Updating account with id: ${id}`);
		const account: IAccount = await method.accounts.get(id);

		//migrate the account type checking to a switch statement.
		//then breakout into outher functions for each type. ie updateCreditCard, updateMortgage, etc.

		const accountType = account.type;
		const liability: IAccountLiability | null = account.liability;

		switch (accountType) {
		case "ach":
			//await updateAchAccount(account);
			//create ach sql tables
			break;		
		case "liability":
			//process Liability
			//need full suite of liability tables in db
			//await updateLiabilityAccount(account);
			switch (liability?.type) {
			case "credit_card":
				await updateAccountInfo(account);
				await updateLiabilityInfo(account);
				await updateCreditCardInfo(account);
				await updateAccountStatementHistory(account);
	
				// Handle notifications
				await handleNotification(account);
	
				logger.log("info", `Updated account ${id} in DB`);
				break;
			case "mortgage":
				//await updateMortgageAccount(account);
				//create mortgage sql tables
				break;
			default:
				logger.log("error", `Account type ${accountType} broke switch statement`);
				break;
			}
			break;
		case "clearing":
			//we dont really do anything with clearing accounts
			//this should log somewhere probably
			break;
		default:
			logger.log("error", `Account type ${accountType} broke switch statement`);
			break;
		}
	} catch (error) {
		logger.log("error", `Failed to update account with id: ${id}`);
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
		logger.log("info", "No result found");
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
 * @throws Will throw an error if the account does not have credit card information or if the notification fails to send.
 */
export async function sendNotificationToUser(account: IAccount): Promise<void> {
	// Check if credit card information is available
	if (!account.liability?.credit_card) {
		throw new No_CreditCard_found(
			`No credit card information available for account ${account.id}`
		);
	}

	// Destructure necessary properties from the credit card information
	const {name: cardName, next_payment_due_date: nextPaymentDueDateStr} =
		account.liability.credit_card;

	// Check if card name is present and is a string
	if (!cardName) {
		throw new CreditCard_Name_missing(
			`Card name is missing for account ${account.id}`
		);
	}
	if (typeof cardName !== "string") {
		throw new CreditCard_Name_bad_format(
			`Card name must be a string for account ${account.id}`
		);
	}

	// Check if next payment due date is present and is a string
	if (!nextPaymentDueDateStr) {
		throw new CreditCard_No_Due_Date(
			`Next payment due date is missing for account ${account.id}`
		);
	}
	if (typeof nextPaymentDueDateStr !== "string") {
		throw new CreditCard_invalid_payment_date(
			`Next payment due date must be a string for account ${account.id}`
		);
	}

	// Convert the next payment due date string to a Date object and check if it's valid
	const nextPaymentDueDate = new Date(nextPaymentDueDateStr);
	if (isNaN(nextPaymentDueDate.getTime())) {
		throw new CreditCard_invalid_payment_date(
			`Invalid next payment due date for account ${account.id}`
		);
	}

	// Calculate the number of days until the due date
	const daysUntilDueDate = calculateDaysUntilDueDate(nextPaymentDueDate);

	// Check if the due date is not in the past
	if (daysUntilDueDate <= 0) {
		logger.log(
			"info",
			"The payment due date is in the past or today. No notification will be sent."
		);
		return;
	}

	// Fetch the number of days in advance to send notification
	const daysInAdvance = await fetchDaysInAdvance(account.holder_id);

	// Calculate the delivery date for the notification
	const deliveryDate = calculateDeliveryDate(nextPaymentDueDate, daysInAdvance);

	// Log the intent to send notification and call the function to send it
	logger.log("info", "Sending notification to user");
	await sendNotification(
		account.holder_id,
		cardName,
		daysUntilDueDate,
		deliveryDate
	);
}

/**
 * Calculates the number of days until the payment due date.
 * @param {Date} nextPaymentDueDate - The next payment due date.
 * @returns {number} The number of days until the payment is due.
 */
function calculateDaysUntilDueDate(nextPaymentDueDate: Date): number {
	const currentDate = new Date();
	return Math.ceil(
		(nextPaymentDueDate.getTime() - currentDate.getTime()) /
			(1000 * 60 * 60 * 24)
	);
}

/**
 * Fetches the number of days in advance the user prefers to be notified.
 * @param {string} holderId - The ID of the account holder.
 * @returns {Promise<number>} The number of days in advance to notify.
 */
async function fetchDaysInAdvance(holderId: string): Promise<number> {
	const daysInAdvance = await fetchDaysInAdvanceByEntityId(holderId);
	return daysInAdvance !== null ? Number(daysInAdvance) : 3; // Defaulting to 3 days if fetch fails.
}

/**
 * Calculates the delivery date for the notification, based on the due date and days in advance.
 * @param {Date} nextPaymentDueDate - The payment due date.
 * @param {number} daysInAdvance - The number of days in advance to notify.
 * @returns {Date} The calculated delivery date.
 */
function calculateDeliveryDate(
	nextPaymentDueDate: Date,
	daysInAdvance: number
): Date {
	const deliveryDate = new Date(nextPaymentDueDate);
	deliveryDate.setDate(deliveryDate.getDate() - daysInAdvance);
	return deliveryDate;
}

/**
 * Sends the notification to the user with the payment reminder.
 * @param {string} holderId - The ID of the account holder.
 * @param {string} cardName - The name of the credit card.
 * @param {number} daysUntilDueDate - The number of days until the payment is due.
 * @param {Date} deliveryDate - The date when the notification should be sent.
 * @returns {Promise<void>}
 */
async function sendNotification(
	holderId: string,
	cardName: string,
	daysUntilDueDate: number,
	deliveryDate: Date
): Promise<void> {
	const dayWord = daysUntilDueDate === 1 ? "day" : "days";
	const message = `${cardName} payment due in ${daysUntilDueDate} ${dayWord}`;
	const heading = "Upcoming Payment Reminder";
	logger.log(
		"info",
		`i think this date is breaking sendNotification ${deliveryDate}`
	);
	await sendNotificationByExternalId(
		holderId,
		heading,
		message,
		deliveryDate.toISOString().split("T")[0]
	);
}

async function createAccountVerification(id: string) {
	logger.log("info", `Created account verification with id: ${id}`);
}

async function updateAccountVerification(id: string) {
	logger.log("info", `Updated account verification with id: ${id}`);
}

async function createConnection(id: string) {
	logger.log("info", `Created connection with id: ${id}`);
}

async function updateConnection(id: string) {
	logger.log("info", `Updated connection with id: ${id}`);
}

async function createPaymentReversal(id: string) {
	logger.log("info", `Created payment reversal with id: ${id}`);
}

async function updatePaymentReversal(id: string) {
	logger.log("info", `Updated payment reversal with id: ${id}`);
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
	logger.log("info", `webhook received${JSON.stringify(request.body)}`);
	try {
		const webhook: MethodWebhookObject = {
			id: request.body.id,
			type: request.body.type,
			op: request.body.op,
		};

		await processWebhookObject(webhook);
	} catch (error) {
		logger.log("error", `Webhook Error: ${error}`);
		return response.status(500).json({
			message: "Error processing webhook",
			error: error,
		});
	}
	return response.status(200).json({
		message: "webhook received",
	});
};
