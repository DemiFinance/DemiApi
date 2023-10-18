import {Request, Response} from "express";
import {Method, Environments, TAccountSubTypes} from "method-node";
import {QuilttEvent, QuilttWebhookObject} from "../../models/quilttmodels";
import {
	fetchAccountInfo,
	generateTokenById,
	getAccountNumbers,
} from "../quiltt";
import {
	holderFromAccountId,
	transactionsByAccountId,
} from "../../utilities/graphqlClient";
import {getEntityIdByQuilttAccount} from "../auth0functions";

const method = new Method({
	apiKey: process.env.METHOD_API_KEY || "",
	env: Environments.production,
});

/**
 * Fetches transactions for the specified account ID.
 *
 * @param {string} accountId - The ID of the account to fetch transactions for.
 * @returns {Promise<any>} The transactions data.
 */
async function fetchTransactions(sessionToken: string, accountId: string) {
	const transactionsResponse = await transactionsByAccountId(
		sessionToken,
		accountId
	);
	return transactionsResponse.data;
}

/**
 * Fetches holder information for the specified account ID, and retrieves the entity ID associated with the Quiltt account ID.
 *
 * @param {string} accountId - The ID of the account to fetch information for.
 * @returns {Promise<string>} The entity ID associated with the Quiltt account ID.
 */
async function fetchHolderInfo(
	sessionToken: string,
	accountId: string
): Promise<string> {
	try {
		const accountResponse = await holderFromAccountId(sessionToken, accountId);

		const quilttAccountId = accountResponse.data; // Assuming accountResponse.data is the Quiltt account ID
		const entityId = await getEntityIdByQuilttAccount(quilttAccountId);
		return entityId;
	} catch (error) {
		console.error("Error fetching holder info:", error);
		throw error; // Re-throw the error to be handled by the calling function
	}
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

const ACCOUNT_TYPES = {
	CHECKING: "CHECKING",
	SAVINGS: "SAVINGS",
};

/**
 * Creates an account based on the specified event data, and performs additional operations such as
 * fetching account info, fetching transactions, creating an account in the method service, and creating
 * an account verification object.
 *
 * @param {QuilttEvent} event - The event data containing the account ID and other relevant information.
 */
async function createAccount(event: QuilttEvent) {
	const {id: accountId} = event.record;
	try {
		const fetchedAccount = await fetchAccountInfo(accountId);
		const accountInfo = fetchedAccount.body;
		const sessionToken = await generateTokenById(fetchedAccount.profileId);
		const accountType = getNormalizedAccountType(fetchedAccount.type);

		const [accountData, transactionsObject, holderInfo] = await Promise.all([
			getAccountNumbers(accountId),
			fetchTransactions(sessionToken, accountId),
			fetchHolderInfo(sessionToken, accountId),
		]);

		const {number: accountNumber, routing: routingNumber} =
			accountData.accountNumbers;

		const account = await createAccountInMethod(
			accountNumber,
			routingNumber,
			accountType,
			holderInfo
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

	console.log(`Created connection with id: ${accountId}`);
}

function getNormalizedAccountType(type: string): string {
	return type === ACCOUNT_TYPES.CHECKING || type === ACCOUNT_TYPES.SAVINGS
		? type.toLowerCase()
		: type;
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
