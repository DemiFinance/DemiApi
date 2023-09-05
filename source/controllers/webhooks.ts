import {Request, Response} from "express";
import {WebhookObject} from "../models/webhook";

import {Method, Environments} from "method-node";
import * as db from "../database/index.js";
import * as dbHelpers from "../database/helpers";
import OneSignalUtil from "../wrappers/onesignalWrapper";

const method = new Method({
	apiKey: process.env.METHOD_API_KEY || "",
	env: Environments.production,
});

async function createPayment(id: string) {
	console.log(`Payment with id: ${id} has created`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to create payment');
}

async function updatePayment(id: string) {
	console.log(`Payment with id: ${id} has updated`);
	// Add your logic here
	// If something goes wrong, throw an error

	//check who owns the payment

	//check if owner opts in to notifications

	//begin notification process
	//if shit hits the fan
	// throw new Error('Failed to update payment');
}

async function createEntity(id: string) {
	console.log(`Created entity with id: ${id}`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to create entity');
}

async function updateEntity(id: string) {
	console.log(`Updated entity with id: ${id}`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to update entity');
}

async function createAccount(id: string) {
	console.log(`Created account with id: ${id}`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to create account');
}

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

			// Check if we need a notification
			if (await doesNeedNotify(account)) {
				await sendNotificationToUser(account);
			}

			console.log("Updated account info in DB");
		}
	} catch (error) {
		console.error("Failed to update account:", error);
		throw new Error("Failed to update account");
	}
}

async function updateAccountInfo(account: any) {
	const sqlData = dbHelpers.generateAccountSQL(account);
	return await db.query(sqlData);
}

async function updateLiabilityInfo(account: any) {
	const sqlData = dbHelpers.generateLiabilitySQL(account);
	return await db.query(sqlData);
}

async function updateCreditCardInfo(account: any) {
	const sqlData = dbHelpers.generateCreditCardSQL(account);
	return await db.query(sqlData);
}

async function updateAccountStatementHistory(account: any) {
	const sqlData = dbHelpers.generateStatementSQL(account);
	return await db.query(sqlData);
}

async function doesNeedNotify(account: any): Promise<boolean> {
	const sqlData = dbHelpers.generatePaymentNotifiedSQL(account);
	const result = await db.query(sqlData);
	// If there's no result, you can decide how you want to handle it. Here, we'll return false.
	if (result.rows.length === 0) {
		return false;
	}

	// Assuming you want to notify when payment_notified is false.
	return !result.rows[0].payment_notified;
}

async function sendNotificationToUser(account: any) {
	const externalId = "ent_ip9e3nE4DLfHi";
	const message = "You have a payment due soon!";
	const heading = "testing notification delivery";

	await OneSignalUtil.sendNotificationByExternalId(
		externalId,
		message,
		heading
	);

	const sqlData = dbHelpers.generatePaymentNotifiedSQL(account);
	return await db.query(sqlData);
}

async function createAccountVerification(id: string) {
	console.log(`Created account verification with id: ${id}`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to create account verification');
}

async function updateAccountVerification(id: string) {
	console.log(`Updated account verification with id: ${id}`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to update account verification');
}

async function createConnection(id: string) {
	console.log(`Created connection with id: ${id}`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to create connection');
}

async function updateConnection(id: string) {
	console.log(`Updated connection with id: ${id}`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to update connection');
}

async function createPaymentReversal(id: string) {
	console.log(`Created payment reversal with id: ${id}`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to create payment reversal');
}

async function updatePaymentReversal(id: string) {
	console.log(`Updated payment reversal with id: ${id}`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to update payment reversal');
}

// Map operations to functions
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

async function processWebhookObject(webhookObject: WebhookObject) {
	const handler = operationHandlers[webhookObject.type];
	if (handler) {
		await handler(webhookObject.id);
	} else {
		throw new Error(`No handler found for operation: ${webhookObject.op}`);
	}
}

export const webhookHandler = async (request: Request, response: Response) => {
	console.log("webhook received" + JSON.stringify(request.body));
	try {
		const webhook: WebhookObject = {
			id: request.body.id,
			type: request.body.type,
			op: request.body.op,
		};

		await processWebhookObject(webhook);
	} catch (error) {
		console.log("error in webhook" + error);
		return response.status(500).json({
			message: "Error processing webhook",
			error: error,
		});
	}
	return response.status(200).json({
		message: "webhook received",
	});
};
