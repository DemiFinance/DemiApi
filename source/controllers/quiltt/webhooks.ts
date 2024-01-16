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
import tracer from "../../wrappers/datadogTracer";
import logger from "../../wrappers/winstonLogging";
import {
	Auth0_Search_User_Error,
	Not_ACH_Account,
} from "../../utilities/errors/demierrors";
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
	const span = tracer.startSpan("fetchTransactions"); // Start a new span

	try {
		const transactionsResponse = await transactionsByAccountId(
			sessionToken,
			accountId
		);
		logger.log("info", "Found some transactions...");
		span.finish(); // Finish the span successfully

		//

		return parseTransactions(transactionsResponse);
	} catch (error) {
		logger.log("error", `Failed to fetch or parse transactions: ${error}`);
		span.setTag("error", true); // Mark the span as errored
		span.finish(); // Finish the span before throwing the error
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
 * Parses the transactions from the given JSON object, extracting the "source" object from each transaction
 * in the `json.account.transactions` array and excluding the __typename field.
 *
 * @param {TransactionJSON} json - The JSON object containing the transaction data.
 * @returns {MxTransaction[]} An array of parsed transactions without the __typename field.
 *
 * @example
 * // ...
 */
function parseMxTransactions(json: TransactionJSON): MxTransaction[] {
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
 * Parses the transactions from the given JSON object, extracting the "source" object from each transaction
 * in the `json.account.transactions` array and excluding the __typename field.
 *
 * @param {TransactionJSON} json - The JSON object containing the transaction data.
 * @returns {MxTransaction[]} An array of parsed transactions without the __typename field.
 *
 * @example
 * // ...
 */
function parsePlaidTransactions(json: TransactionJSON): MxTransaction[] {
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
	const span = tracer.startSpan("fetchTransactions");
	try {
		const accountResponse = await holderFromAccountId(quilttUserId, accountId);
		logger.log("info", "Account Response:" + accountResponse);
		const quilttUuid = accountResponse; // Assuming accountResponse.data is the Quiltt account ID
		const entityId = await getEntityIdByQuilttAccount(quilttUuid);

		if (entityId === undefined) {
			throw new Error("Entity ID is undefined");
		}
		span.finish();
		return entityId;
	} catch (error) {
		logger.log("error", "Error fetching holder info:" + error);
		span.setTag("error", true); // Mark the span as errored
		span.finish();
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

	logger.log(
		"info",
		`Creating account in Method... routing number: ${routingNumber} account number: ${accountNumber} account type ${normalizedAccountType} holder id:${holderId}`
	);

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
	const span = tracer.startSpan("create.account");
	const {id: accountId} = event.record;
	try {
		const fetchedAccount = await fetchAccountInfo(accountId);
		const accountType = getNormalizedAccountType(fetchedAccount.type);
		const accountInfo = fetchedAccount.body;
		const quilttUserId = fetchedAccount.profileId;
		const sessionToken = await generateTokenById(fetchedAccount.profileId);

		//Setup retry... We basically just need to wait for quiltt to finish syncing
		const maxRetries = 5;
		const initialDelay = 60000; // 1min
		const accountData = await retryAsync(
			() => getAccountNumbers(accountId),
			maxRetries,
			initialDelay,
			`crateAccount_getAccountNumbers(${accountId})`
		);

		const transactionsObject = await fetchTransactions(sessionToken, accountId);

		logger.log("info", `Account Data ${JSON.stringify(accountData)}`);

		const holderInfo = await fetchHolderInfo(quilttUserId, accountId);

		const {number: accountNumber, routing: routingNumber} =
			accountData.accountNumbers;

		logger.log(
			"info",
			`Account info pre convert ${accountNumber} routing number ${routingNumber}`
		);

		// Convert accountNumber and routingNumber to strings
		const accountNumberStr = String(accountNumber);
		const routingNumberStr = String(routingNumber);

		logger.log(
			"info",
			`Account info post convert ${accountNumberStr} routing number ${routingNumberStr}`
		);

		const account = await createAccountInMethod(
			accountNumberStr,
			routingNumberStr,
			accountType,
			holderInfo
		);
		logger.log("info", "Account Output:" + JSON.stringify(account));

		createAccountVerification(account.id, accountInfo, transactionsObject);
		span.finish();
	} catch (error) {
		if (error instanceof Not_ACH_Account) {
			// Handle the custom error
			logger.log("warn", "Not a checking account we good");
		} else {
			logger.log("error", "Error creating new account:" + error);
		}
	}
	logger.log("info", `Created connection with id: ${accountId}`);
}

function getNormalizedAccountType(type: string): string {
	if (type === ACCOUNT_TYPES.CHECKING || type === ACCOUNT_TYPES.SAVINGS) {
		return type.toLowerCase();
	} else {
		throw new Not_ACH_Account(`Invalid account type: ${type}`);
	}
}

async function unimplementedFunc(event: QuilttEvent) {
	if (event) {
		return;
	}
	//console.log(`Created connection with id: ${event.id}`);
}

async function quilttVerifiedAccount(event: QuilttEvent) {
	logger.log("info", "Quiltt Verified Account:" + JSON.stringify(event));
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
			initialDelay,
			`CreateQuilttProfile_getAuth0IdByQuilttId(${quilttId})`
		);

		logger.log("info", "Auth0 user:" + auth0User);

		// Ensure the event has a profile with a uuid.
		if (!event.profile || !event.profile.uuid) {
			throw new Error("Event profile missing or UUID missing.");
		}
		const uuid = event.profile.uuid;

		// Attempt to add the UUID to the Auth0 user metadata.
		addUUIDToMetadata(auth0User, uuid);
	} catch (error) {
		if (error instanceof Auth0_Search_User_Error) {
			logger.log("error", "Error in createQuilttProfile_WebhookEvent:" + error);
			throw error; // Re-throw the error to allow further handling up the stack.
		}
	}
}

/**
 * Retries an async function with exponential backoff and tracing.
 *
 * @param {() => Promise<T>} asyncFn - The async function to retry.
 * @param {number} maxRetries - The maximum number of retries.
 * @param {number} delay - The initial delay between retries, in milliseconds.
 * @param {string} functionName - The name of the function being retried for tracing.
 * @returns {Promise<T>} - The result of the async function.
 */
async function retryAsync<T>(
	asyncFn: () => Promise<T>,
	maxRetries: number,
	delay: number,
	functionName: string // Added parameter for the function name
): Promise<T> {
	let lastError: any;

	// Start a new span for the retry operation
	const span = tracer.startSpan(`retryAsync.${functionName}`);

	for (let i = 0; i < maxRetries; i++) {
		try {
			// Tag the span with the current retry attempt
			span.setTag("retry.attempt", i + 1);
			span.setTag("retry.max", maxRetries);

			return await asyncFn();
		} catch (error) {
			lastError = error;
			logger.log(
				"error",
				`Retry ${i + 1}/${maxRetries} for ${functionName} failed:`,
				error
			);
			span.setTag("error", true);
			span.log({
				event: "error",
				message: (error as Error).message,
				stack: (error as Error).stack,
				"retry.attempt": i + 1,
			});

			if (i < maxRetries - 1) {
				// Calculate the delay with exponential backoff
				const backoffDelay = Math.min(delay * 2 ** i, 16000);
				span.log({
					event: "retry.delay",
					message: `Waiting ${backoffDelay}ms before next retry`,
					"retry.attempt": i + 1,
					delay: backoffDelay,
				});
				await new Promise((resolve) => setTimeout(resolve, backoffDelay));
			} else {
				span.finish(); // Finish the span before throwing the last error
				throw lastError;
			}
		}
	}
	span.finish(); // Finish the span if maxRetries reached without throwing an error
	throw new Error("Reached unreachable code in retryAsync"); // This should never actually happen
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
	"account.verified": quilttVerifiedAccount, //lets implement this?
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
	logger.log("info", "Quiltt webhook received" + JSON.stringify(request.body));
	//	console.log("Quiltt webhook received" + JSON.stringify(request.body));
	const span = tracer.startSpan("quilttWebhookHandler");
	try {
		const webhook: QuilttWebhookObject = {
			environment: request.body.environment,
			eventTypes: request.body.eventTypes,
			events: request.body.events,
		};

		await processQuilttWebhookObject(webhook);
		span.finish();
	} catch (error) {
		logger.log("error", "Quiltt Webhook Error:" + error);
		//console.log("Quiltt Webhook Error:", error);
		return response.status(500).json({
			message: "Error processing webhook",
			error: error,
		});
	}
	return response.status(200).json({
		message: "webhook received",
	});
};
