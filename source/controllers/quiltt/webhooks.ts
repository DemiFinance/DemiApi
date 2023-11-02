import {Request, Response} from "express";
import {Method, Environments, TAccountSubTypes} from "method-node";
import {QuilttEvent, QuilttWebhookObject} from "../../models/quilttmodels";
import {
	addUUIDToMetadata,
	fetchAccountInfo,
	getAccountNumbers,
} from "../quiltt";
import {
	holderFromAccountId,
	transactionsByAccountId,
} from "../../utilities/graphqlClient";
import {
	getAuth0IdByQuilttId,
	getEntityIdByQuilttAccount,
} from "../auth0functions";
import {MxTransaction, TransactionJSON} from "../../models/mx/mxtransaction";
import {generateTokenById} from "../../utilities/quilttUtil";
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
export async function fetchTransactions(
	sessionToken: string,
	accountId: string
) {
	try {
		const transactionsResponse = await transactionsByAccountId(
			sessionToken,
			accountId
		);
		return parseTransactions(transactionsResponse);
		//return transactionsResponse;
	} catch (error) {
		console.error("Failed to fetch or parse transactions:", error);
		throw error;
	}
}

/**
 * Parses the transactions from the given JSON object, extracting the "source" object from each transaction
 * in the `json.account.transactions` array and excluding the __typename field.
 *
 * @param {TransactionJSON} json - The JSON object containing the transaction data.
 * @returns {MxTransaction[]} An array of parsed transactions without the __typename field.
 *
 * @example
 * // ...
 */
function parseTransactions(json: TransactionJSON): MxTransaction[] {
	if (!json || !json.account || !json.account.transactions) {
		throw new Error("Invalid JSON structure");
	}

	const transactionsArray = json.account.transactions.map((transaction) => {
		const {__typename, ...source} = transaction.source; // Exclude __typename using destructuring
		__typename; // Use __typename to prevent TypeScript from throwing an error
		return source;
	});

	return transactionsArray;
}

/**
 * Fetches holder information for the specified account ID, and retrieves the entity ID associated with the Quiltt account ID.
 * @param {string} quilttUserId - The ID of the Quiltt user.
 * @param {string} accountId - The ID of the account to fetch information for.
 * @returns {Promise<string>} The entity ID associated with the Quiltt account ID.
 */
export async function fetchHolderInfo(
	quilttUserId: string,
	accountId: string
): Promise<string> {
	try {
		const accountResponse = await holderFromAccountId(quilttUserId, accountId);
		console.log("Account Response:", accountResponse);
		const quilttUuid = accountResponse; // Assuming accountResponse.data is the Quiltt account ID
		const entityId = await getEntityIdByQuilttAccount(quilttUuid);
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
		const quilttUserId = fetchedAccount.profileId;
		const sessionToken = await generateTokenById(fetchedAccount.profileId);
		const accountType = getNormalizedAccountType(fetchedAccount.type);

		const [accountData, transactionsObject] = await Promise.all([
			getAccountNumbers(accountId),
			fetchTransactions(sessionToken, accountId),
		]);

		const holderInfo = await fetchHolderInfo(quilttUserId, accountId);

		const {number: accountNumber, routing: routingNumber} =
			accountData.accountNumbers;

		const account = await createAccountInMethod(
			accountNumber,
			routingNumber,
			accountType,
			holderInfo
		);
		console.log("Account Output:", account);

		createAccountVerification(account.id, accountInfo, transactionsObject);
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
	if (event) {
		return;
	}
	//console.log(`Created connection with id: ${event.id}`);
}

/**
 * Handles the creation of a Quiltt profile via a webhook event.
 *
 * @param {QuilttEvent} event - The Quiltt event object.
 * @throws Will throw an error if any of the asynchronous operations fail.
 */
async function createQuilttProfile_WebhookEvent(
	event: QuilttEvent
): Promise<void> {
	try {
		const quilttId = event.record.id;

		// Define the retry parameters.
		const maxRetries = 5;
		const initialDelay = 1000; // 1 second

		// Fetch the Auth0 user ID associated with the Quiltt ID, with retry logic.
		const auth0User = await retryAsync(
			() => getAuth0IdByQuilttId(quilttId),
			maxRetries,
			initialDelay
		);

		// Ensure the event has a profile with a uuid.
		if (!event.profile || !event.profile.uuid) {
			throw new Error("Event profile missing or UUID missing.");
		}
		const uuid = event.profile.uuid;

		// Attempt to add the UUID to the Auth0 user metadata.
		addUUIDToMetadata(auth0User, uuid);
	} catch (error) {
		console.error("Error in createQuilttProfile_WebhookEvent:", error);
		throw error; // Re-throw the error to allow further handling up the stack.
	}
}

function assertNever(value: string): never {
	throw new Error(`Unexpected value: ${value}`);
}

/**
 * Retries an async function with exponential backoff.
 *
 * @param {() => Promise<T>} asyncFn - The async function to retry.
 * @param {number} maxRetries - The maximum number of retries.
 * @param {number} delay - The initial delay between retries, in milliseconds.
 * @returns {Promise<T>} - The result of the async function.
 */
async function retryAsync<T>(
	asyncFn: () => Promise<T>,
	maxRetries: number,
	delay: number
): Promise<T> {
	for (let i = 0; i < maxRetries; i++) {
		try {
			return await asyncFn();
		} catch (error) {
			console.error(`Retry ${i + 1}/${maxRetries} failed:`, error);
			if (i < maxRetries - 1) {
				await new Promise((resolve) =>
					setTimeout(resolve, Math.min(delay * 2 ** i, 16000))
				);
			} else {
				throw error;
			}
		}
	}
	assertNever("Reached unreachable code in retryAsync");
}

/**
 * Maps operation types to their respective handler functions.
 * @type {Object.<string, function(string): Promise<void>>}
 */
const quilttOperationHandlers: {
	[key: string]: (event: QuilttEvent) => Promise<void>;
} = {
	"profile.created": createQuilttProfile_WebhookEvent,
	"profile.updated": unimplementedFunc,
	"profile.deleted": unimplementedFunc,
	"connection.created": unimplementedFunc,
	"connection.updated": unimplementedFunc,
	"connection.deleted": unimplementedFunc,
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
	"account.deleted": unimplementedFunc,
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
