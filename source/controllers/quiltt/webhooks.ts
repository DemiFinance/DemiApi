import {Request, Response} from "express";
import {Method, Environments, TAccountSubTypes} from "method-node";
import {QuilttEvent, QuilttWebhookObject} from "../../models/quilttmodels";
import {
	addUUIDToMetadata,
	fetchAccountInfo,
	getAccountNumbers,
} from "../quiltt";
import {
	AccountDetailsByAccountId_Plaid,
	MxholderFromAccountId,
	TransactionsByAccountId_Plaid,
	getAccountType,
} from "../../utilities/graphqlClient";
import {
	getAuth0IdByQuilttId,
	getEntityIdByQuilttAccount,
	getEntityIdByUserId,
} from "../auth0functions";
import {MxTransaction} from "../../models/mx/mxtransaction";
import {generateTokenByQuilttId} from "../../utilities/quilttUtil";
import tracer from "../../wrappers/datadogTracer";
import logger from "../../wrappers/winstonLogging";
import {PlaidTransaction} from "../../models/quiltt/plaid";
import {
	Auth0_Search_User_Error,
	Not_ACH_Account,
} from "../../utilities/errors/demierrors";
import {quilttProfile} from "../../models/quiltt/quilttProfile";
import {sendNotificationByExternalId, sendNotificationByExternalIdNow} from "../../utilities/onesignal";
import {createPlaidVerification} from "../method/accounts/verification/plaid";
const method = new Method({
	apiKey: process.env.METHOD_API_KEY || "",
	env: Environments.production,
});

/**
 * Fetches transactions from two different GraphQL queries.
 * Tries both queries even if one fails, concatenating results from both.
 *
 * @param {string} sessionToken - The session token for authentication.
 * @param {string} accountId - The account ID for which transactions are fetched.
 * @returns {Promise<Array>} An array of transaction objects.
 */
export async function fetchTransactions(
	sessionToken: string,
	accountId: string
) {
	const span = tracer.startSpan("fetchTransactions");
	let transactions: MxTransaction[] | PlaidTransaction[] = [];

	//TODO: some selection logic here... were only running plaid atm

	// // Check if its an MX Account
	// try {
	// 	const mxResponse = await client.query({
	// 		query: MxTransactionsByAccountId,
	// 		variables: {accountId},
	// 	});

	// 	transactions = parseTransactions(mxResponse.data) as MxTransaction[];
	// } catch (error) {
	// 	logger.log("error", `Error in MXTransactions query: ${error}`);
	// }

	// Or is it Plaid?
	try {
		transactions = await TransactionsByAccountId_Plaid(accountId, sessionToken);
	} catch (error) {
		logger.log("error", `Error in second query: ${error}`);
	}

	// Finalizing the span and logging the result
	if (transactions.length === 0) {
		logger.log("warn", "No transactions fetched from either query.");
		span.setTag("error", true);
	} else {
		logger.log(
			"info",
			`${transactions.length} transactions fetched successfully.`
		);
	}
	span.finish();

	return transactions;
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
	const span = tracer.startSpan("fetch holder info");
	try {
		const accountResponse = await MxholderFromAccountId(
			quilttUserId,
			accountId
		);
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
export function normalizeAccountType(accountType: string): TAccountSubTypes {
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function createAccount(event: QuilttEvent) {
	const span = tracer.startSpan("create.account");
	const {id: accountId} = event.record;
	try {
		const fetchedAccount = await fetchAccountInfo(accountId);
		const accountType = getNormalizedAccountType(fetchedAccount.type);
		const accountInfo = fetchedAccount.body;
		const quilttUserId = fetchedAccount.profileId;
		const sessionToken = await generateTokenByQuilttId(
			fetchedAccount.profileId
		);

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

		const account = await createAccountInMethod(
			accountData.accountNumberStr,
			accountData.routingNumberStr,
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
}

async function quilttVerifiedAccount(event: QuilttEvent) {
	const span = tracer.startSpan("account.verified");
	try {
		const account = event.record;
		const accountId = account.id;
		const profile = event.profile as quilttProfile;
		const profileMetadata = profile.metadata;
		//TODO: Fix this because it doesnt get assigne anything at the moment
		let entityId: string;

		if (accountId == "" || !accountId) {
			logger.log("error", "No account id found in event");
			return;
		}

		logger.log(
			"info",
			`Account ID: ${accountId} but from reccord ${event.record.id}`
		);

		if (!profileMetadata) {
			return;
		} else {
			entityId = (await getEntityIdByUserId(profileMetadata.userId)) ?? "";
		}

		const quiltId = profile.id;
		if (!quiltId) {
			logger.log("error", "No profile id found in event");
			return;
		}
		const sessionToken = await generateTokenByQuilttId(quiltId);

		const accountType = getNormalizedAccountType(
			await getAccountType(sessionToken, account.id)
		);

		if (accountType !== "checking" && accountType !== "savings") {
			logger.log(
				"error",
				"Probably not a checking or savings account." +
					accountType +
					"account id:" +
					event.record.id
			);
			return;
		}

		//get account numbers
		const {accountNumberStr, routingNumberStr} =
			await getAccountNumbers(accountId);

		const methodAccount = await createAccountInMethod(
			accountNumberStr,
			routingNumberStr,
			accountType,
			entityId
		);

		const transactionsObject = await TransactionsByAccountId_Plaid(
			profile.id,
			accountId
		);
		const accountObject = await AccountDetailsByAccountId_Plaid(
			profile.id,
			accountId
		);

		logger.log("info", "Account Output:" + JSON.stringify(methodAccount));

		const verification = await createPlaidVerification(
			methodAccount.id,
			accountObject,
			transactionsObject
		);
		if (verification.status === "verified") {
			//send notification to user
			sendNotificationByExternalIdNow(
				entityId,
				"Bank Account Verified",
				"You can now make payments!"
			);
			logger.log(
				"info",
				"Account Verification Success:" + JSON.stringify(verification)
			);
		} else {
			logger.log(
				"error",
				"Account Verification Failed:" + JSON.stringify(verification)
			);
		}

		span.finish();
	} catch (error) {
		if (error instanceof Not_ACH_Account) {
			// Handle the custom error
			logger.log("warn", "Not a checking account we good");
		} else {
			logger.log("error", "Error creating new account: " + error);
		}
	}
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
	"account.created": unimplementedFunc,
	"account.updated": unimplementedFunc,
	"account.verified": quilttVerifiedAccount,
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
