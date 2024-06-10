import {Request, Response} from "express";
import {Method, Environments, TAccountSubTypes} from "method-node";
import {
	Balance,
	QuilttEvent,
	QuilttWebhookObject,
} from "../../models/quilttmodels";
import {addUUIDToMetadata, getAccountNumbers} from "../quiltt";
import {axiosGqlClient} from "../../utilities/graphqlClient";
import {getAuth0IdByQuilttId, getEntityIdByUserId} from "../auth0functions";
import {generateTokenByQuilttId} from "../../utilities/quilttUtil";
import tracer from "../../wrappers/datadogTracer";
import logger from "../../wrappers/winstonLogging";
import {
	AccountDataGQLResponse,
	TransactionDataGQLResponse,
	extractTransactions,
	extractBalances,
	AccountTypeGQLResponse,
} from "../../models/quiltt/plaid";
import {
	Auth0_Search_User_Error,
	Not_ACH_Account,
} from "../../utilities/errors/demierrors";
import {quilttProfile} from "../../models/quiltt/quilttProfile";
import {sendNotificationByExternalIdNow} from "../../utilities/onesignal";
import {createPlaidVerification} from "../method/accounts/verification/plaid";
import {DemiAchAccount} from "../../models/demi/achAccount";

import * as db from "../../database/index";
import * as dbHelpers from "../../database/helpers";
import {
	GetAccountType,
	PlaidAccountBalancesForMethodVerification,
	PlaidAccountTransactionsForMethodVerification,
} from "../../utilities/graphqlSchema";

const method = new Method({
	apiKey: process.env.METHOD_API_KEY || "",
	env: Environments.production,
});

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
const ACCOUNT_TYPES = {
	CHECKING: "CHECKING",
	SAVINGS: "SAVINGS",
};

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
	holderId: string,
	quilltAccountId: string
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
		metadata: {
			quilttAccountId: quilltAccountId,
		},
	});

	return account;
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

async function insertAchToDatabase(account: DemiAchAccount) {
	const span = tracer.startSpan("insertAchToDatabase");
	try {
		const sqlData = dbHelpers.insertAchAccount(account);
		logger.log("debug", `Inserting ACH Account: ${JSON.stringify(account)}`);
		const result = await db.query(sqlData);
		span.setTag("db.query.result", result);
		return result;
	} catch (error) {
		span.setTag("error", error);
		throw error;
	} finally {
		span.finish();
	}
}

async function accountVerified(event: QuilttEvent) {
	const span = tracer.startSpan("account.verified");
	try {
		const account = event.record;
		const accountId = account.id;
		const quilttProfile = event.profile as quilttProfile;
		const quiltUserId = quilttProfile.id;

		const profileMetadata = quilttProfile.metadata;
		let methodEntityId: string;

		if (!profileMetadata) {
			return;
		} else {
			methodEntityId =
				(await getEntityIdByUserId(profileMetadata.userId)) ?? "";
		}

		if (accountId === "" || !accountId) {
			logger.log("error", "No account id found in event");
			return;
		}

		const sessionToken = await generateTokenByQuilttId(quiltUserId);

		// const accountType = getNormalizedAccountType(
		// 	await getAccountType(sessionToken, accountId)
		// );

		const RawAccountType = await axiosGqlClient<AccountTypeGQLResponse>(
			sessionToken,
			GetAccountType,
			{accountId}
		);

		const accountType = getNormalizedAccountType(
			RawAccountType.data.account.type
		);

		if (accountType !== "checking" && accountType !== "savings") {
			logger.log(
				"error",
				`Probably not a checking or savings account: ${accountType}. Account ID: ${accountId}`
			);
			return;
		}
		const {accountNumberStr, routingNumberStr} =
			await getAccountNumbers(accountId);

		const newAcctInMethod = await createAccountInMethod(
			accountNumberStr,
			routingNumberStr,
			accountType,
			methodEntityId,
			accountId
		);

		const accountBalancesObjectbyaxios =
			await axiosGqlClient<AccountDataGQLResponse>(
				sessionToken,
				PlaidAccountBalancesForMethodVerification,
				{accountId}
			);

		const balances = extractBalances(accountBalancesObjectbyaxios.data);

		const accountTransactionsObjectbyaxios =
			await axiosGqlClient<TransactionDataGQLResponse>(
				sessionToken,
				PlaidAccountTransactionsForMethodVerification,
				{accountId}
			);

		const transactions = extractTransactions(
			accountTransactionsObjectbyaxios.data
		);

		const verification = await createPlaidVerification(
			newAcctInMethod.id,
			balances,
			transactions
		);

		const newAch: DemiAchAccount = {
			method_accountID: newAcctInMethod.id,
			quiltt_accountId: accountId,
			quiltt_userId: quiltUserId,
			method_entityId: methodEntityId,
			account_type: accountType,
			account_name: accountBalancesObjectbyaxios.data.account.name,
			balance_available: balances ? balances.available ?? 0 : 0,
			balance_current: balances ? balances.current ?? 0 : 0,
			iso_currency_code: balances ? balances.isoCurrencyCode ?? "" : "",
			created_at: new Date(),
		};

		logger.log("info", `New ACH Account: ${JSON.stringify(newAch)}`);

		const dbresult = await insertAchToDatabase(newAch);

		logger.log("info", `database result: ${JSON.stringify(dbresult)}`);

		if (verification.status === "verified") {
			sendNotificationByExternalIdNow(
				methodEntityId,
				"Bank Account Verified",
				"You can now make payments!"
			);
			logger.log(
				"info",
				`Account Verification Success: ${JSON.stringify(verification)}`
			);
		} else {
			logger.log(
				"error",
				`Account Verification Failed: ${JSON.stringify(verification)}`
			);
		}
	} catch (error) {
		logger.log("error", "Error in accountVerified: " + error);
	} finally {
		span.finish();
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

async function balanceCreated(event: QuilttEvent) {

	const span = tracer.startSpan("balance.created");
	try {
		
		const balance = event.record as Balance;
		const balanceId = balance.id;
		const accountId = balance.accountId;


		logger.log(
			"info",
			"Balance Updated for account: " + JSON.stringify(accountId)
		);

		span.addTags({
			"balance.id": balanceId,
			"balance.accountId": accountId,
		});

		const updatedBalanceObject: DemiAchAccount = {
			quiltt_accountId: accountId,
			balance_available: balance.available,
			balance_current: balance.current,
		};

		await db.query(dbHelpers.updateAchBalance(updatedBalanceObject));

	} catch (error) {
		logger.log("error", "Error in balanceCreated:" + error);
	}
	finally {
		span.finish();
	
	}
}

/**
 * Maps operation types to their respective handler functions.
 * @type {Object.<string, function(string): Promise<void>>}
 */
export const quilttOperationHandlers: {
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
	"account.verified": accountVerified,
	"account.reconnected": unimplementedFunc,
	"account.deleted": unimplementedFunc,
	"balance.created": balanceCreated,
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
