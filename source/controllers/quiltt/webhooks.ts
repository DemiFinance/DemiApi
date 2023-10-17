import {Request, Response} from "express";
import {Method, Environments, TAccountSubTypes} from "method-node";
import {QuilttEvent, QuilttWebhookObject} from "../../models/quilttmodels";
import {getAccountNumbers} from "../quiltt";
import client from "../../utilities/graphqlClient";
import {
	AccountsSchema,
	TransactionsSchema,
} from "../../utilities/graphqlSchema";

const method = new Method({
	apiKey: process.env.METHOD_API_KEY || "",
	env: Environments.production,
});

/**
 * Fetches account information for the specified account ID.
 *
 * @param {string} accountId - The ID of the account to fetch information for.
 * @returns {Promise<any>} The account information.
 */
async function fetchAccountInfo(accountId: string) {
	const accountResponse = await client.query({
		query: AccountsSchema,
		variables: {accountId},
	});
	return accountResponse.data;
}

/**
 * Fetches transactions for the specified account ID.
 *
 * @param {string} accountId - The ID of the account to fetch transactions for.
 * @returns {Promise<any>} The transactions data.
 */
async function fetchTransactions(accountId: string) {
	const transactionsResponse = await client.query({
		query: TransactionsSchema,
		variables: {accountId},
	});
	return transactionsResponse.data;
}

/**
 * Normalizes the account type to lowercase and ensures it's one of the allowed types.
 *
 * @param {string} accountType - The type of the account (e.g., "CHECKING" or "SAVINGS").
 * @returns {TAccountSubTypes} The normalized account type.
 */
function normalizeAccountType(accountType: string): TAccountSubTypes {
	const lowerCaseType = accountType.toLowerCase();
	if (lowerCaseType === "checking" || lowerCaseType === "savings") {
		return lowerCaseType as TAccountSubTypes;
	}
	throw new Error(`Invalid account type: ${accountType}`);
}

/**
 * Creates an account in the method service.
 *
 * @param {string} accountNumber - The account number.
 * @param {string} routingNumber - The routing number.
 * @param {string} accountType - The type of the account (e.g., "CHECKING" or "SAVINGS").
 * @param {string} holderId - The ID of the account holder.
 * @returns {Promise<any>} The created account data.
 */
async function createAccountInMethod(
	accountNumber: string,
	routingNumber: string,
	accountType: string,
	holderId: string
) {
	const normalizedAccountType = normalizeAccountType(accountType);

	const account = await method.accounts.create({
		holder_id: holderId,
		ach: {
			routing: routingNumber,
			number: accountNumber,
			type: normalizedAccountType,
		},
	});

	return account;
}

/**
 * Creates a verification object for the specified account ID, account object, and transactions object.
 *
 * @param {string} accountId - The ID of the account.
 * @param {any} accountObject - The account object containing account information.
 * @param {any} transactionsObject - The transactions object containing transactions data.
 * @returns {Promise<any>} The created verification data.
 */
async function createAccountVerification(
	accountId: string,
	accountObject: any,
	transactionsObject: any
) {
	const verification = await method.accounts(accountId).verification.create({
		type: "mx",
		mx: {
			account: accountObject,
			transactions: transactionsObject,
		},
	});
	return verification;
}

/**
 * Creates an account based on the specified event data, and performs additional operations such as
 * fetching account info, fetching transactions, creating an account in the method service, and creating
 * an account verification object.
 *
 * @param {QuilttEvent} event - The event data containing the account ID and other relevant information.
 */
async function createAccount(event: QuilttEvent) {
	const accountId = event.record.id;
	const accountData = await getAccountNumbers(accountId);

	const accountNumber = accountData.accountNumbers.number;
	const routingNumber = accountData.accountNumbers.routing;

	const accountInfo = await fetchAccountInfo(accountId);
	const accountType = accountInfo.account.sources[0].type;
	const normalizedAccountType =
		accountType === "CHECKING" || accountType === "SAVINGS"
			? accountType.toLowerCase()
			: accountType;

	const transactionsObject = await fetchTransactions(accountId);

	try {
		const holderId = "request.body.id"; // Replace with the actual holder id retrieval logic
		const account = await createAccountInMethod(
			accountNumber,
			routingNumber,
			normalizedAccountType,
			holderId
		);
		const verification = await createAccountVerification(
			account.id,
			accountInfo,
			transactionsObject
		);

		console.log("Verification Output:", verification);
	} catch (error) {
		console.error("Error creating new account:", error);
	}

	console.log(
		`Created connection with id: ${event.record.id} ${accountNumber} ${routingNumber}`
	);
}

async function unimplementedFunc(event: QuilttEvent) {
	console.log(`Created connection with id: ${event}`);
}

/**
 * Maps operation types to their respective handler functions.
 * @type {Object.<string, function(string): Promise<void>>}
 */
const quilttOperationHandlers: {
	[key: string]: (event: QuilttEvent) => Promise<void>;
} = {
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
async function processQuilttWebhookObject(webhookObject: QuilttWebhookObject) {
	for (const event of webhookObject.events) {
		const handler = quilttOperationHandlers[event.type];
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
	console.log("Quiltt webhook received" + JSON.stringify(request.body));
	try {
		const webhook: QuilttWebhookObject = {
			environment: request.body.environment,
			eventTypes: request.body.eventTypes,
			events: request.body.events,
		};

		await processQuilttWebhookObject(webhook);
	} catch (error) {
		console.log("Quiltt Webhook Error:", error);
		return response.status(500).json({
			message: "Error processing webhook",
			error: error,
		});
	}
	return response.status(200).json({
		message: "webhook received",
	});
};
